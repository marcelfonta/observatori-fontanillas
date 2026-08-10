import { CONFIG } from '../core/config.js';
import { setText } from '../core/dom.js';

let map;
let radarLayer;
let frames = [];
let frameIndex = 0;
let playback;
let attempts = 0;
let interactiveStarted = false;
let leafletPromise;
let refreshTimer;

function ensureLeaflet() {
  if(window.L)return Promise.resolve();
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.getElementById('leaflet-styles')){
      const styles=document.createElement('link');
      styles.id='leaflet-styles'; styles.rel='stylesheet'; styles.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; styles.crossOrigin='';
      document.head.appendChild(styles);
    }
    const existing=document.getElementById('leaflet-script');
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const script=document.createElement('script');
    script.id='leaflet-script'; script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.crossOrigin=''; script.async=true;
    script.addEventListener('load',resolve,{once:true}); script.addEventListener('error',reject,{once:true});
    document.head.appendChild(script);
  });
  return leafletPromise;
}

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
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),12000);
  let response;
  try {
    response=await fetch('https://api.rainviewer.com/public/weather-maps.json', { cache:'no-store',signal:controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
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
  const buttons=[...document.querySelectorAll('[data-radar-mode]')];
  const activate=button=>{
    const mode=button.dataset.radarMode;
    buttons.forEach(item=>{const selected=item===button;item.classList.toggle('is-active',selected);item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;});
    document.querySelectorAll('[data-radar-panel]').forEach(panel=>{const selected=panel.dataset.radarPanel===mode;panel.classList.toggle('is-active',selected);panel.hidden=!selected;if(selected)panel.querySelectorAll('iframe[data-src]').forEach(frame=>{if(!frame.getAttribute('src'))frame.src=frame.dataset.src;});});
    if(mode==='interactive')ensureLeaflet().then(startInteractiveRadar).catch(()=>{setText('radar-status','Mapa no disponible');setText('radar-loader','No s’ha pogut iniciar el mapa interactiu.');});
    else {
      stopPlayback();
      setText('radar-status', mode==='lightning' ? 'Radar + llamps · Meteocat' : 'Meteocat oficial');
    }
  };
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>activate(button));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();const target=buttons[(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length];activate(target);target.focus();
    });
  });
  ensureLeaflet().then(startInteractiveRadar).catch(()=>{setText('radar-status','Mapa no disponible');setText('radar-loader','No s’ha pogut iniciar el mapa interactiu.');});
  if(!refreshTimer)refreshTimer=window.setInterval(()=>{
    if(document.hidden||!interactiveStarted)return;
    loadFrames().catch(error=>console.warn('No s’ha pogut actualitzar el radar.',error));
  },5*60*1000);
}
