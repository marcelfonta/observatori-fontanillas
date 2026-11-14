import { hourlyComparison, localForecastHour, readingAt, retrospectiveErrors, summarize } from './consensus.js';

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
const state = { mode: 'radar', modelMap: 'consensus', layer: 'precipitation', frames: [], index: 0, place: 'fontanillas', point: STATION, mapLayer: null, stationMarker: null, queryMarker: null, markers: [], timer: null, request: 0, forecastRequest: 0, territoryRequest: 0, catalog: null, modelVariable: 'temperature', forecastCache: new Map(), comparison: [] };
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
  source({ heading: 'Precipitació observada al radar', explanation: `Radar observat: ${dateLabel(item.time)}. La capa representa precipitació estimada pel radar; no és una previsió ni un avís oficial. La previsió de la pròxima hora es consulta per separat als models.`, link: 'https://www.rainviewer.com/api.html', key: 'Observació radar', updated: dateLabel(item.time) });
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
  if (state.modelMap === 'territory') {
    if (state.mapLayer) map.removeLayer(state.mapLayer);
    state.mapLayer = null;
    source({ heading: 'Coincidència al territori', explanation: `Cinc punts concrets per al ${dateLabel(item?.time || selectedTime())}. Cada etiqueta mostra la mediana i l'interval dels models disponibles. No s'interpola cap superfície ni es calcula la probabilitat d'encert.`, link: 'https://open-meteo.com/en/docs', key: 'Prediccions en cinc punts · no observació', updated: dateLabel(item?.time || selectedTime()) });
    message('Comparant els models en cinc punts…'); timeline(); territory(); return;
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
  stop(); state.mode = mode; state.request++; state.territoryRequest++; clearMapLayer();
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
async function modelData(model, latitude, longitude, multiple = false) {
  const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), hourly: 'temperature_2m,precipitation,wind_speed_10m,cloud_cover', timezone: 'Europe/Madrid', forecast_days: String(model.horizon) });
  if (model.model) params.set('models', model.model);
  const key = `${model.name}:${latitude},${longitude}`;
  let cached = state.forecastCache.get(key);
  if (!cached || Date.now() - cached.at > 5 * 60000) {
    cached = { at: Date.now(), promise: json(`https://api.open-meteo.com${model.path}?${params}`, 17000) };
    state.forecastCache.set(key, cached);
    if (state.forecastCache.size > 120) state.forecastCache.delete(state.forecastCache.keys().next().value);
  }
  try {
    const data = await cached.promise;
    return multiple && !Array.isArray(data) ? [data] : data;
  } catch { state.forecastCache.delete(key); return null; }
}
async function territory() {
  const request = ++state.territoryRequest;
  const places = Object.values(PLACES);
  const latitude = places.map(place => place.point[0].toFixed(4)).join(',');
  const longitude = places.map(place => place.point[1].toFixed(4)).join(',');
  const datasets = await Promise.all(MODELS.map(model => modelData(model, latitude, longitude, true)));
  if (request !== state.territoryRequest || state.mode !== 'models' || state.modelMap !== 'territory') return;
  for (const marker of state.markers) map.removeLayer(marker);
  state.markers = [];
  const variable = MODEL_VARIABLES[state.modelVariable];
  places.forEach((place, index) => {
    const readings = datasets.map((set, modelIndex) => readingAt(set?.[index], MODELS[modelIndex], localForecastHour(selectedTime()))).filter(Boolean);
    const summary = summarize(readings, state.modelVariable);
    const value = summary.count ? `${format(summary.median, variable.digits)} ${variable.unit}` : '—';
    const icon = L.divIcon({ className: 'territory-icon', html: `<span>${escapeHtml(place.name.split(' · ')[0])}<strong>${escapeHtml(value)}</strong></span>`, iconSize: [128, 48], iconAnchor: [64, 24] });
    const detail = summary.count ? `${summary.count} famílies · interval ${format(summary.min, variable.digits)}–${format(summary.max, variable.digits)} ${variable.unit}` : 'Sense prou dades per a aquesta hora';
    const marker = L.marker(place.point, { icon }).addTo(map).bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${escapeHtml(variable.label)}: ${escapeHtml(value)}<br>${escapeHtml(detail)}<br>Predicció · ${escapeHtml(dateLabel(selectedTime()))}`);
    marker.on('click', () => setPoint(place.point, place.name));
    state.markers.push(marker);
  });
  message('', false);
}
function renderEvolution() {
  const host = $('#evolution-chart');
  const legend = $('#evolution-legend');
  host.replaceChildren(); legend.replaceChildren();
  if (state.mode !== 'models' || !state.comparison.length) { host.textContent = 'Tria «Models» per veure l’evolució dels pròxims instants.'; return; }
  const variable = MODEL_VARIABLES[state.modelVariable];
  const rows = state.comparison;
  const available = rows.flatMap(row => row.summary.count ? [row.summary.min, row.summary.max] : []);
  if (!available.length) { host.textContent = 'No hi ha prou dades per dibuixar l’evolució.'; return; }
  const low = Math.min(...available), high = Math.max(...available);
  const pad = Math.max((high - low) * .12, state.modelVariable === 'temperature' ? .5 : 1);
  const y = value => 220 - (value - low + pad) / (high - low + 2 * pad) * 180;
  const x = index => 48 + index * 824 / Math.max(1, rows.length - 1);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 920 260'); svg.setAttribute('aria-hidden', 'true');
  const add = (tag, attrs, content = '') => { const node = document.createElementNS(svg.namespaceURI, tag); Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value))); if (content) node.textContent = content; svg.append(node); return node; };
  for (let i = 0; i < 4; i++) { const value = low - pad + i * (high - low + 2 * pad) / 3; add('line', { x1: 48, x2: 872, y1: y(value), y2: y(value), stroke: '#547c67', 'stroke-width': .7 }); add('text', { x: 2, y: y(value) + 4, fill: '#b9d5c4', 'font-size': 12 }, format(value, variable.digits)); }
  const valid = rows.map((row, index) => ({ ...row, index })).filter(row => row.summary.count);
  if (valid.length) {
    const upper = valid.map(row => `${x(row.index)},${y(row.summary.max)}`).join(' ');
    const lower = [...valid].reverse().map(row => `${x(row.index)},${y(row.summary.min)}`).join(' ');
    add('polygon', { points: `${upper} ${lower}`, fill: '#68ba8b', opacity: .2 });
    add('polyline', { points: valid.map(row => `${x(row.index)},${y(row.summary.median)}`).join(' '), fill: 'none', stroke: '#a2eab5', 'stroke-width': 3 });
  }
  const focused = $('#model-focus').value;
  if (focused) {
    const model = MODELS.find(item => item.name === focused);
    const points = rows.map((row, index) => ({ index, value: row.readings.find(reading => reading.model === model)?.[state.modelVariable] })).filter(item => Number.isFinite(item.value));
    add('polyline', { points: points.map(item => `${x(item.index)},${y(item.value)}`).join(' '), fill: 'none', stroke: '#f0bd64', 'stroke-width': 2 });
  }
  const chosen = rows.findIndex(row => row.time === localForecastHour(selectedTime()));
  if (chosen >= 0) add('line', { x1: x(chosen), x2: x(chosen), y1: 25, y2: 220, stroke: '#fff3b4', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
  [0, Math.floor((rows.length - 1) / 2), rows.length - 1].forEach(index => add('text', { x: x(index), y: 249, fill: '#b9d5c4', 'font-size': 12, 'text-anchor': 'middle' }, dateLabel(rows[index].time, { hour: '2-digit', minute: '2-digit' })));
  host.append(svg);
  host.setAttribute('aria-label', `Evolució de ${variable.label.toLowerCase()}: mediana i interval de les famílies de models durant 24 hores. ${focused ? `Model destacat: ${focused}.` : ''}`);
  legend.textContent = `Franja: interval · línia verda: mediana${focused ? ` · línia groga: ${focused}` : ''} · ${variable.unit}. És una dispersió de models, no una probabilitat.`;
}
async function forecasts() {
  const request = ++state.forecastRequest;
  const [latitude, longitude] = state.point;
  const target = selectedTime();
  const targetIso = localForecastHour(target);
  $('#model-list').innerHTML = '<p class="muted">Consultant els models per a aquest punt…</p>';
  $('#model-hour').textContent = dateLabel(targetIso);
  const datasets = await Promise.all(MODELS.map(model => modelData(model, latitude.toFixed(4), longitude.toFixed(4))));
  const results = datasets.map((data, index) => readingAt(data, MODELS[index], targetIso));
  if (request !== state.forecastRequest) return;
  if (state.mode === 'models') {
    const first = Math.ceil(Date.now() / 3600000) * 3600000;
    const hours = Array.from({ length: 25 }, (_, index) => localForecastHour(first + index * 3600000));
    state.comparison = hourlyComparison(datasets, MODELS, hours, state.modelVariable);
  } else state.comparison = [];
  renderEvolution();
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
$('#model-map-select').addEventListener('change', event => { stop(); state.territoryRequest++; clearMapLayer(); state.modelMap = event.target.value; $('#layer-field').hidden = state.modelMap !== 'arome'; showModels(); });
$('#model-variable').addEventListener('change', event => { state.modelVariable = event.target.value; if (state.mode === 'models' && state.modelMap === 'territory') territory(); forecasts(); });
$('#model-focus').addEventListener('change', () => forecasts());
$('#place-select').addEventListener('change', event => { const place = PLACES[event.target.value]; if (!place) return; map.flyTo(place.point, 9); setPoint(place.point, place.name); });
map.on('click', event => { const point = [event.latlng.lat, event.latlng.lng]; setPoint(point, 'Punt triat al mapa'); });
$('#refresh').addEventListener('click', () => selectMode(state.mode));
$('#time-range').addEventListener('input', event => { stop(); state.index = Number(event.target.value); if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); });
$('#prev').addEventListener('click', () => { stop(); state.index--; if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); });
$('#next').addEventListener('click', () => { stop(); state.index++; if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); });
$('#play').addEventListener('click', () => { if (state.timer) { stop(); return; } if (state.frames.length < 2) return; $('#play').textContent = 'Ⅱ'; $('#play').setAttribute('aria-label', 'Atura l’evolució'); state.timer = setInterval(() => { state.index = (state.index + 1) % state.frames.length; if (state.mode === 'models') { redrawArome(); forecasts(); } else redrawRadar(); }, 1400); });
$('#verification-load').addEventListener('click', async () => {
  const button = $('#verification-load'), output = $('#verification-results');
  button.disabled = true; output.textContent = 'Consultant l’històric i la previsió publicada 24 hores abans…';
  try {
    const params = new URLSearchParams({ latitude: String(STATION[0]), longitude: String(STATION[1]), hourly: 'temperature_2m_previous_day1', past_days: '3', forecast_days: '1', timezone: 'UTC' });
    const [history, previous] = await Promise.all([json(`${API}/history?days=3&resolution=hourly`, 20000), json(`https://previous-runs-api.open-meteo.com/v1/forecast?${params}`, 20000)]);
    const observations = Array.isArray(history) ? history : (history.observations || history.rows || history.data || []);
    const cutoff = Date.now() / 1000 - 48 * 3600;
    const rows = observations.filter(row => Number(row.epoch) >= cutoff);
    const result = retrospectiveErrors(rows, [{ name: 'Open-Meteo · Best Match, 24 h abans', hourly: previous.hourly }])[0];
    if (!result || result.count < 6) { output.textContent = 'No hi ha prou hores comparables amb lectures reals. Torna-ho a provar més tard.'; return; }
    output.replaceChildren();
    const metric = document.createElement('strong'); metric.textContent = `${format(result.mae, 1)} °C`;
    const info = document.createElement('p'); info.textContent = `Error absolut mitjà de temperatura · ${result.count} hores comparables de les últimes 48. Pronòstic Best Match emès 24 hores abans de cada hora vàlida. No és una classificació de models.`;
    const links = document.createElement('p');
    links.innerHTML = '<a href="https://open-meteo.com/en/docs/previous-runs-api" target="_blank" rel="noopener noreferrer">Previsions arxivades · Open-Meteo ↗</a> · <a href="https://meteo.fontanillas.cat/estacio.html" target="_blank" rel="noopener noreferrer">Lectures · Estació Fontanillas ↗</a>';
    output.append(metric, info, links);
  } catch { output.textContent = 'No s’ha pogut completar la comparació. Les fonts poden estar temporalment no disponibles.'; }
  finally { button.disabled = false; }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
setInterval(() => { $('#clock').textContent = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date()); }, 30000);
$('#clock').textContent = new Intl.DateTimeFormat('ca-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date());
selectMode('radar'); station();
