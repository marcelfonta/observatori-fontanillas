import { localForecastHour, readingAt, summarize } from './consensus.js';

const API = 'https://fonta-meteo.marcelfonta.workers.dev';
const STATION = [41.6906, 2.489];
const PLACES = {
  fontanillas: { name: 'Sant Celoni · Observatori', point: STATION },
  montseny: { name: 'Massís del Montseny', point: [41.776, 2.433] },
  tordera: { name: 'Vall de la Tordera', point: [41.696, 2.598] },
  granollers: { name: 'Granollers', point: [41.608, 2.288] },
  girona: { name: 'Girona', point: [41.979, 2.821] }
};
const MODELS = [
  { name: 'Best Match', path: '/v1/forecast', horizon: 7, reference: true },
  { name: 'ECMWF IFS', path: '/v1/ecmwf', horizon: 7, family: 'ecmwf' },
  { name: 'GFS', path: '/v1/gfs', horizon: 7, family: 'gfs' },
  { name: 'ICON', path: '/v1/dwd-icon', horizon: 7, family: 'icon' },
  { name: 'AROME HD', path: '/v1/meteofrance', model: 'meteofrance_arome_france_hd', horizon: 2, family: 'meteofrance', priority: 2 },
  { name: 'ARPEGE Europa', path: '/v1/meteofrance', model: 'meteofrance_arpege_europe', horizon: 4, family: 'meteofrance', priority: 1 },
  { name: 'GEM global', path: '/v1/gem', horizon: 7, family: 'gem' },
  { name: 'UKMO global', path: '/v1/forecast', model: 'ukmo_seamless', horizon: 7, family: 'ukmo' }
];
const MODEL_VARIABLES = {
  temperature: { label: 'Temperatura', unit: '°C', digits: 1 },
  rain: { label: 'Pluja', unit: 'mm', digits: 1 },
  wind: { label: 'Vent', unit: 'km/h', digits: 0 },
  clouds: { label: 'Núvols', unit: '%', digits: 0 }
};
const AROME_LAYERS = [
  ['precipitation', 'Precipitació'], ['temperature', 'Temperatura'],
  ['wind', 'Vent'], ['clouds', 'Núvols']
];
const $ = selector => document.querySelector(selector);
const state = { mode: 'radar', modelMap: 'consensus', layer: 'precipitation', frames: [], index: 0, place: 'fontanillas', point: STATION, mapLayer: null, stationMarker: null, queryMarker: null, markers: [], timer: null, request: 0, forecastRequest: 0, catalog: null, modelVariable: 'temperature', forecastCache: new Map() };
const format = (value, digits = 1) => Number.isFinite(Number(value)) ? new Intl.NumberFormat('ca-ES', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number(value)) : '—';
const dateLabel = (value, options = {}) => {
  const localHour = typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value);
  const date = localHour ? new Date(`${value}:00Z`) : new Date(value);
  if (localHour) {
    return new Intl.DateTimeFormat('ca-ES', { timeZone: 'UTC', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...options }).format(date);
  }
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', ...options }).format(date) : '—';
};
const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

async function json(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

const map = L.map('map', { scrollWheelZoom: false, zoomControl: true, minZoom: 5, maxZoom: 13 }).setView(STATION, 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
const placeIcon = L.divIcon({ className: '', html: '<span class="station-marker" aria-hidden="true"></span>', iconSize: [14, 14], iconAnchor: [7, 7] });
state.stationMarker = L.marker(STATION, { icon: placeIcon }).addTo(map).bindTooltip('Sant Celoni · Observatori Fontanillas');
const queryIcon = L.divIcon({ className: '', html: '<span class="query-marker" aria-hidden="true"></span>', iconSize: [14, 14], iconAnchor: [7, 7] });
new ResizeObserver(() => map.invalidateSize({ pan: false })).observe($('#map'));

function message(text, show = true) { $('#map-message').textContent = text; $('#map-message').hidden = !show; }
function stop() { if (state.timer) clearInterval(state.timer); state.timer = null; $('#play').textContent = '▶'; $('#play').setAttribute('aria-label', 'Reprodueix l’evolució'); }
function clearMapLayer() {
  if (state.mapLayer) map.removeLayer(state.mapLayer);
  state.mapLayer = null;
  for (const marker of state.markers) map.removeLayer(marker);
  state.markers = [];
}
function buttons(items, selected) {
  $('#layer-buttons').replaceChildren(...items.map(([id, label]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.layer = id; button.textContent = label;
    button.setAttribute('aria-pressed', String(id === selected));
    return button;
  }));
}
function timeline() {
  const items = state.frames;
  state.index = Math.max(0, Math.min(state.index, items.length - 1));
  $('#time-range').max = String(Math.max(0, items.length - 1));
  $('#time-range').value = String(state.index);
  for (const id of ['time-range', 'play']) $(`#${id}`).disabled = items.length < 2;
  $('#prev').disabled = items.length < 2 || state.index === 0;
  $('#next').disabled = items.length < 2 || state.index === items.length - 1;
  $('#time-first').textContent = items.length ? dateLabel(items[0].time) : '—';
  $('#time-last').textContent = items.length ? dateLabel(items.at(-1).time) : '—';
  $('#time-caption').textContent = items.length ? dateLabel(items[state.index].time, { weekday: 'short' }) : 'Sense seqüència temporal';
}
function source({ heading, explanation, link, label, key, updated }) {
  $('#map-heading').textContent = heading;
  $('#map-explanation').textContent = explanation;
  $('#source-link').href = link;
  $('#map-key-text').textContent = key;
  $('#map-updated').textContent = updated;
}
function redrawRadar() {
  const item = state.frames[state.index];
  if (!item) return;
  if (state.mapLayer) map.removeLayer(state.mapLayer);
  state.mapLayer = L.tileLayer(`${item.host}${item.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: .82, maxNativeZoom: 7, maxZoom: 13, attribution: 'Radar © RainViewer' }).addTo(map);
  source({ heading: 'Precipitació al radar', explanation: `Radar observat: ${dateLabel(item.time)}. La capa representa precipitació estimada pel radar; no és un avís oficial ni una predicció.`, link: 'https://www.rainviewer.com/', key: 'Observació radar', updated: dateLabel(item.time) });
  message('', false); timeline();
}
async function radar() {
  const request = ++state.request;
  message('Carregant el radar…');
  try {
    const data = await json('https://api.rainviewer.com/public/weather-maps.json');
    if (request !== state.request) return;
    const host = data.host;
    const past = (data.radar?.past || []).map(frame => ({ ...frame, host, kind: 'observat', time: frame.time * 1000 }));
    state.frames = past;
    if (!state.frames.length) throw new Error('No hi ha fotogrames');
    state.index = Math.max(0, past.length - 1);
    redrawRadar();
  } catch {
    if (request !== state.request) return;
    state.frames = []; timeline(); message('El radar no respon. Consulta la font original o torna-ho a provar.');
    source({ heading: 'Radar no disponible', explanation: 'No hi ha dades de radar verificades en aquest moment.', link: 'https://www.rainviewer.com/', key: 'Sense dades', updated: 'Sense lectura' });
  }
}
function aromeUrl(time) {
  const width = matchMedia('(max-width: 700px)').matches ? 720 : 1500;
  const params = new URLSearchParams({ model: 'arome', layer: state.layer, width: String(width), height: String(Math.round(width * 0.57)) });
  if (time) params.set('time', time);
  return `${API}/meteofrance/map?${params}`;
}
function redrawArome() {
  const item = state.frames[state.index];
  if (state.modelMap === 'consensus') {
    if (state.mapLayer) map.removeLayer(state.mapLayer);
    state.mapLayer = null;
    source({ heading: 'Coincidència dels models al punt', explanation: `Comparació puntual per al ${dateLabel(item?.time || selectedTime())}. Tria un punt al mapa i consulta les barres de la dreta. No és una capa de consens territorial.`, link: 'https://open-meteo.com/en/docs', key: 'Prediccions al punt · no observació', updated: dateLabel(item?.time || selectedTime()) });
    message('', false); timeline(); return;
  }
  const time = item?.raw || '';
  const image = L.imageOverlay(aromeUrl(time), [[40.4, 0], [43.6, 4.5]], { opacity: .76, crossOrigin: true });
  image.on('load', () => { if (state.mode === 'models' && state.mapLayer === image) message('', false); });
  image.on('error', () => { if (state.mode === 'models' && state.mapLayer === image) message('El mapa AROME no respon per a aquesta hora. Prova un altre instant.'); });
  if (state.mapLayer) map.removeLayer(state.mapLayer);
  state.mapLayer = image.addTo(map);
  const layerLabel = AROME_LAYERS.find(([id]) => id === state.layer)?.[1] || 'Variable';
  source({ heading: `AROME · ${layerLabel.toLowerCase()}`, explanation: `Predicció de Météo-France${item ? ` vàlida per al ${dateLabel(item.time)}` : ' de l’edició activa'}. Els colors són un camp del model, no una mesura local.`, link: 'https://meteofrance.com/', key: 'Predicció de model', updated: item ? `Vàlid: ${dateLabel(item.time)}` : 'Edició activa' });
  message('Carregant el mapa AROME…'); timeline();
}
function consensusFrames() {
  const first = Math.ceil(Date.now() / 3600000) * 3600000;
  state.frames = Array.from({ length: 25 }, (_, index) => ({ time: first + index * 3600000 }));
  state.index = 0;
  redrawArome();
  forecasts();
}
function showModels() {
  if (state.modelMap === 'arome') arome();
  else { ++state.request; consensusFrames(); }
}
async function arome() {
  const request = ++state.request;
  message('Consultant el catàleg AROME…');
  try {
    const catalog = state.catalog || await json(`${API}/meteofrance/models`);
    if (request !== state.request) return;
    state.catalog = catalog;
    const product = (catalog.products || []).find(item => item.id === 'arome');
    if (!product?.available) throw new Error('AROME no disponible');
    state.frames = (product.times || []).map(raw => ({ raw, time: new Date(raw).getTime() })).filter(item => Number.isFinite(item.time));
    state.index = Math.max(0, state.frames.findIndex(item => item.time >= Date.now()));
    if (!state.frames.length) { state.frames = [{ raw: '', time: Date.now() }]; state.index = 0; }
    redrawArome();
    forecasts();
  } catch {
    if (request !== state.request) return;
    state.frames = []; timeline(); message('AROME no està disponible ara mateix. El radar i les altres fonts continuen accessibles.');
    source({ heading: 'AROME no disponible', explanation: 'El servidor oficial no ha retornat cap producte verificat.', link: 'https://meteofrance.com/', key: 'Sense dades', updated: 'Sense edició' });
    forecasts();
  }
}
function selectMode(mode) {
  stop(); state.mode = mode; state.request++; clearMapLayer();
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('#model-map-field').hidden = mode !== 'models';
  $('#next-rain-box').hidden = mode !== 'radar';
  $('#layer-field').hidden = mode !== 'models' || state.modelMap !== 'arome';
  if (mode === 'models') { buttons(AROME_LAYERS, state.layer); showModels(); }
  else { radar(); forecasts(); }
}
function selectedTime() {
  if (state.mode === 'models' && state.frames[state.index]?.time) return state.frames[state.index].time;
  return Date.now() + 3600000;
}
async function forecasts() {
  const request = ++state.forecastRequest;
  const [latitude, longitude] = state.point;
  const target = selectedTime();
  const targetIso = localForecastHour(target);
  $('#model-list').innerHTML = '<p class="muted">Consultant els models per a aquest punt…</p>';
  $('#model-hour').textContent = dateLabel(targetIso);
  const results = await Promise.all(MODELS.map(async model => {
    const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), hourly: 'temperature_2m,precipitation,wind_speed_10m,cloud_cover', timezone: 'Europe/Madrid', forecast_days: String(model.horizon) });
    if (model.model) params.set('models', model.model);
    const key = `${model.name}:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    let cached = state.forecastCache.get(key);
    if (!cached || Date.now() - cached.at > 5 * 60000) {
      const promise = json(`https://api.open-meteo.com${model.path}?${params}`, 17000);
      cached = { at: Date.now(), promise };
      state.forecastCache.set(key, cached);
      if (state.forecastCache.size > 120) state.forecastCache.delete(state.forecastCache.keys().next().value);
    }
    try { return readingAt(await cached.promise, model, targetIso); }
    catch { state.forecastCache.delete(key); return null; }
  }));
  if (request !== state.forecastRequest) return;
  const variable = MODEL_VARIABLES[state.modelVariable];
  const values = results.map(item => item?.[state.modelVariable]).filter(value => value !== null && value !== undefined);
  const maxValue = Math.max(...values, 0);
  $('#model-list').replaceChildren(...results.map((item, index) => {
    const row = document.createElement('div'); row.className = 'model-row';
    if ($('#model-focus').value === MODELS[index].name) row.classList.add('is-focused');
    const name = document.createElement('span'); name.textContent = MODELS[index].name;
    const value = document.createElement('strong');
    if (item) {
      value.textContent = item[state.modelVariable] === null ? '—' : `${format(item[state.modelVariable], variable.digits)} ${variable.unit}`;
      const detail = document.createElement('small'); detail.textContent = MODELS[index].reference ? 'Selecció automàtica · fora del consens' : (MODELS[index].family === 'meteofrance' ? 'Météo-France · una veu al consens' : 'Família de model');
      name.append(detail);
    } else {
      value.textContent = 'No disponible';
      const detail = document.createElement('small'); detail.textContent = 'Sense predicció per a aquesta hora'; name.append(detail);
    }
    const bar = document.createElement('span'); bar.className = 'model-bar';
    const fill = document.createElement('span'); fill.className = 'model-bar-fill';
    fill.style.width = item?.[state.modelVariable] !== null && item?.[state.modelVariable] !== undefined && maxValue > 0 ? `${Math.max(2, Math.min(100, 100 * item[state.modelVariable] / maxValue))}%` : '0%';
    bar.append(fill); row.append(name, value, bar); return row;
  }));
  const readings = results.filter(Boolean);
  for (const [key, id] of [['temperature', 'temp'], ['rain', 'rain'], ['wind', 'wind'], ['clouds', 'cloud']]) {
    const summary = summarize(readings, key);
    const variable = MODEL_VARIABLES[key];
    $(`#forecast-${id}`).textContent = summary.count ? `${format(summary.median, variable.digits)} ${variable.unit}` : '—';
  }
  const selected = summarize(readings, state.modelVariable);
  $('#consensus-count').textContent = `${selected.count} de ${new Set(MODELS.map(model => model.family).filter(Boolean)).size} famílies de models amb dades`;
  $('#consensus-value').textContent = selected.count ? `${format(selected.median, variable.digits)} ${variable.unit}` : 'Sense dades comparables';
  $('#consensus-range').textContent = selected.count ? `Interval dels models: ${format(selected.min, variable.digits)}–${format(selected.max, variable.digits)} ${variable.unit}` : 'Cap model disponible per a aquesta hora.';
  $('#consensus-rain').textContent = state.modelVariable === 'rain' && selected.count ? `${selected.wet} de ${selected.count} famílies preveuen ≥0,2 mm en aquesta hora.` : '';
  if (state.mode === 'radar') {
    const nextRain = summarize(readings, 'rain');
    $('#next-rain').textContent = nextRain.count ? `${format(nextRain.median)} mm` : 'Sense previsió disponible';
    $('#next-rain-detail').textContent = nextRain.count ? `${nextRain.wet} de ${nextRain.count} famílies preveuen ≥0,2 mm · ${dateLabel(targetIso)} · Open-Meteo` : 'Predicció, no radar observat.';
  }
}
async function station() {
  try {
    const data = await json(`${API}/widget-observation`);
    const temperature = finite(data.temperature);
    const observed = data.updatedUtc || (data.epoch ? Number(data.epoch) * 1000 : null);
    const age = observed ? Date.now() - new Date(observed).getTime() : Infinity;
    $('#station-temp').textContent = temperature === null ? '—' : `${format(temperature)} °C`;
    $('#station-time').textContent = age < 30 * 60000 && !data.stale ? `Observat ${dateLabel(observed)}` : `Darrera lectura ${dateLabel(observed)} · no recent`;
  } catch {
    $('#station-temp').textContent = '—'; $('#station-time').textContent = 'Estació temporalment no disponible';
  }
}
function setPoint(point, name) {
  state.point = point;
  const atStation = Math.abs(point[0] - STATION[0]) < .00001 && Math.abs(point[1] - STATION[1]) < .00001;
  if (atStation && state.queryMarker) { map.removeLayer(state.queryMarker); state.queryMarker = null; }
  if (!atStation) {
    if (!state.queryMarker) state.queryMarker = L.marker(point, { icon: queryIcon }).addTo(map).bindTooltip('Punt de consulta');
    else state.queryMarker.setLatLng(point);
  }
  $('#coordinates').textContent = `${format(point[0], 4)}° N · ${format(point[1], 4)}° E`;
  $('#location-name').textContent = name;
  const selected = Object.entries(PLACES).find(([, place]) => place.name === name)?.[0];
  if (selected) $('#place-select').value = selected;
  else $('#place-select').selectedIndex = -1;
  forecasts();
}

$('#mode-buttons').addEventListener('click', event => { const button = event.target.closest('[data-mode]'); if (button) selectMode(button.dataset.mode); });
$('#layer-buttons').addEventListener('click', event => { const button = event.target.closest('[data-layer]'); if (!button) return; state.layer = button.dataset.layer; buttons(AROME_LAYERS, state.layer); stop(); redrawArome(); forecasts(); });
$('#model-map-select').addEventListener('change', event => { stop(); state.modelMap = event.target.value; $('#layer-field').hidden = state.modelMap !== 'arome'; showModels(); });
$('#model-variable').addEventListener('change', event => { state.modelVariable = event.target.value; forecasts(); });
$('#model-focus').addEventListener('change', () => forecasts());
$('#place-select').addEventListener('change', event => { const place = PLACES[event.target.value]; if (!place) return; map.flyTo(place.point, 9); setPoint(place.point, place.name); });
map.on('click', event => { const point = [event.latlng.lat, event.latlng.lng]; setPoint(point, 'Punt triat al mapa'); });
$('#refresh').addEventListener('click', () => selectMode(state.mode));
$('#time-range').addEventListener('input', event => { stop(); state.index = Number(event.target.value); if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); });
$('#prev').addEventListener('click', () => { stop(); state.index--; if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); });
$('#next').addEventListener('click', () => { stop(); state.index++; if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); });
$('#play').addEventListener('click', () => { if (state.timer) { stop(); return; } if (state.frames.length < 2) return; $('#play').textContent = 'Ⅱ'; $('#play').setAttribute('aria-label', 'Atura l’evolució'); state.timer = setInterval(() => { state.index = (state.index + 1) % state.frames.length; if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); }, 1400); });
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
setInterval(() => { $('#clock').textContent = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date()); }, 30000);
$('#clock').textContent = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date());
selectMode('radar'); station();
