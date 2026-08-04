import { CONFIG } from '../js/config.js';
import { setText } from '../js/utils.js';

let map;
let radarLayer;
let frames = [];
let frameIndex = 0;
let playback;
let attempts = 0;
let interactiveStarted = false;

function formatFrameTime(epoch) {
  return new Intl.DateTimeFormat(CONFIG.locale, { hour:'2-digit', minute:'2-digit' }).format(new Date(epoch * 1000));
}

function stopPlayback() {
  if (playback) window.clearInterval(playback);
  playback = null;
  const button = document.getElementById('radar-play');
  if (button) button.textContent = '▶';
}

function showFrame(index) {
  if (!map || !frames.length) return;
  frameIndex = Math.max(0, Math.min(frames.length - 1, Number(index) || 0));
  const frame = frames[frameIndex];
  if (radarLayer) map.removeLayer(radarLayer);
  radarLayer = window.L.tileLayer(`${frame.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
    tileSize:256,
    opacity:.72,
    maxNativeZoom:7,
    maxZoom:11,
    pane:'overlayPane',
    attribution:'Radar © <a href="https://www.rainviewer.com/" target="_blank">RainViewer</a>'
  }).addTo(map);
  const slider = document.getElementById('radar-slider');
  if (slider) slider.value = String(frameIndex);
  setText('radar-time', formatFrameTime(frame.time));
}

function togglePlayback() {
  if (playback) { stopPlayback(); return; }
  const button = document.getElementById('radar-play');
  if (button) button.textContent = 'Ⅱ';
  playback = window.setInterval(() => showFrame((frameIndex + 1) % frames.length), 700);
}

function buildMap() {
  const target = document.getElementById('radar-map');
  if (!target || map) return;
  map = window.L.map(target, { zoomControl:true, scrollWheelZoom:false }).setView([CONFIG.station.latitude, CONFIG.station.longitude], 7);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:18,
    attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
  }).addTo(map);
  window.L.circleMarker([CONFIG.station.latitude, CONFIG.station.longitude], { radius:6, color:'#f3f7f3', weight:2, fillColor:'#89d6a3', fillOpacity:1 }).addTo(map).bindTooltip('Observatori Fontanillas · Sant Celoni');
}

async function loadFrames() {
  const response = await fetch('https://api.rainviewer.com/public/weather-maps.json', { cache:'no-store' });
  if (!response.ok) throw new Error(`Radar ${response.status}`);
  const payload = await response.json();
  frames = (payload?.radar?.past || []).map(frame => ({ ...frame, host:payload.host }));
  if (!frames.length) throw new Error('No hi ha fotogrames disponibles');
  const slider = document.getElementById('radar-slider');
  if (slider) { slider.max = String(frames.length - 1); slider.value = String(frames.length - 1); }
  showFrame(frames.length - 1);
  setText('radar-status', `${frames.length} imatges · 2 h`);
  document.getElementById('radar-loader')?.classList.add('is-hidden');
}

function startInteractiveRadar() {
  if (interactiveStarted) {
    window.setTimeout(()=>map?.invalidateSize(),80);
    return;
  }
  if (!window.L) {
    attempts += 1;
    if (attempts < 8) window.setTimeout(startInteractiveRadar, 400);
    else { setText('radar-status', 'Mapa no disponible'); setText('radar-loader', 'No s’ha pogut iniciar el mapa interactiu.'); }
    return;
  }
  interactiveStarted = true;
  buildMap();
  document.getElementById('radar-slider')?.addEventListener('input', event => { stopPlayback(); showFrame(event.target.value); }, { once:false });
  document.getElementById('radar-play')?.addEventListener('click', togglePlayback, { once:false });
  loadFrames().catch(error => {
    console.warn('Radar temporalment no disponible.', error);
    setText('radar-status', 'Temporalment no disponible');
    setText('radar-loader', 'Ara mateix no es poden carregar les imatges. Consulta el radar oficial de Meteocat.');
  });
}

export function initRadar() {
  document.querySelectorAll('[data-radar-mode]').forEach(button=>button.addEventListener('click',()=>{
    const mode=button.dataset.radarMode;
    document.querySelectorAll('[data-radar-mode]').forEach(item=>item.classList.toggle('is-active',item===button));
    document.querySelectorAll('[data-radar-panel]').forEach(panel=>panel.classList.toggle('is-active',panel.dataset.radarPanel===mode));
    if(mode==='interactive')startInteractiveRadar();
    else { stopPlayback(); setText('radar-status','Meteocat oficial'); }
  }));
}
