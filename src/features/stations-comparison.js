import { CONFIG } from '../core/config.js';

const state = { period: 'now', metric: 'temperature', payload: null, charts: [] };
const COLORS = ['#89d6a3','#e6c56c','#79c5d8','#ee8e73','#b59be8','#5fc4a6','#e48fb8','#a6c875'];
const METRICS = {
  temperature:{ label:'Temperatura', key:'temperature', suffix:'°C', digits:1, value:s=>s.temperature },
  humidity:{ label:'Humitat', key:'humidity', suffix:'%', digits:0, value:s=>s.humidity },
  pressure:{ label:'Pressió', key:'pressure', suffix:'hPa', digits:1, value:s=>s.pressure },
  wind:{ label:'Ratxa de vent', key:'windGust', suffix:'km/h', digits:1, value:s=>s.windGust ?? s.windSpeed },
  rain:{ label:'Pluja acumulada', key:'rainTotal', suffix:'mm', digits:1, value:s=>s.rainToday }
};
let comparisonMap;
let comparisonMapLayer;
let leafletPromise;

function fmt(value, digits = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('ca-ES', { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
}
function updatedLabel(value) {
  if (!value) return 'Sense hora';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('ca-ES', { hour:'2-digit', minute:'2-digit' }).format(d);
}
function direction(deg) {
  if (!Number.isFinite(Number(deg))) return '—';
  const names = ['N','NE','E','SE','S','SO','O','NO'];
  return names[Math.round(Number(deg) / 45) % 8];
}
function stationReference(stations) {
  return stations.find(s => s.id === 'fontanillas' && s.status === 'online') || stations.find(s => s.status === 'online');
}
function deltaText(value, base, unit='°C') {
  if (!Number.isFinite(Number(value)) || !Number.isFinite(Number(base))) return '—';
  const delta = Number(value) - Number(base);
  if (Math.abs(delta) < 0.05) return `≈ Fontanillas`;
  return `${delta > 0 ? '+' : ''}${fmt(delta,1)} ${unit}`;
}

function periodSummary(station) {
  if (state.period === 'now' || !station.history?.length) return station;
  const history = station.history;
  const avg = key => {
    const vals = history.map(x => Number(x[key])).filter(Number.isFinite);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
  };
  const max = key => {
    const vals = history.map(x => Number(x[key])).filter(Number.isFinite);
    return vals.length ? Math.max(...vals) : null;
  };
  const rainVals = history.map(x => Number(x.rainTotal)).filter(Number.isFinite);
  return {
    ...station,
    temperature: avg('temperature'),
    humidity: avg('humidity'),
    pressure: avg('pressure'),
    windSpeed: avg('windSpeed'),
    windGust: max('windGust'),
    rainToday: rainVals.length ? Math.max(...rainVals) - Math.min(...rainVals) : station.rainToday,
  };
}

function renderCards(payload) {
  const grid = document.getElementById('station-grid');
  const stations = payload.stations || [];
  const ref = stationReference(stations);
  if (!grid) return;
  grid.innerHTML = stations.map(st => {
    const s = periodSummary(st);
    const offline = st.status !== 'online';
    return `<article class="station-card panel ${offline ? 'is-offline' : ''}">
      <header>
        <div><span class="station-source">${st.source || 'Font externa'}</span><h3>${st.name}</h3><small>${st.municipality || ''}${Number.isFinite(Number(st.distanceKm))&&Number(st.distanceKm)>.1?` · ${fmt(st.distanceKm)} km de Fontanillas`:''}</small></div>
        <span class="station-status ${offline ? 'is-offline' : ''}"><i></i>${offline ? 'Sense dades' : updatedLabel(st.updated)}</span>
      </header>
      ${offline ? `<div class="station-unavailable"><strong>Dades no disponibles</strong><span>La resta de la comparativa continua activa.</span></div>` : `
      <div class="station-temp"><strong>${fmt(s.temperature)}<small>°C</small></strong><span>${st.id === 'fontanillas' ? 'Referència' : deltaText(s.temperature, periodSummary(ref || {}).temperature)}</span></div>
      <div class="station-metrics">
        <span><small>Humitat</small><b>${fmt(s.humidity,0)}%</b></span>
        <span><small>Vent</small><b>${fmt(s.windSpeed)} km/h</b></span>
        <span><small>Ratxa</small><b>${fmt(s.windGust)} km/h</b></span>
        <span><small>Pluja</small><b>${fmt(s.rainToday)} mm</b></span>
        <span><small>Pressió</small><b>${fmt(s.pressure)} hPa</b></span>
        <span><small>Direcció</small><b>${direction(st.windDirection)}</b></span>
      </div>`}
    </article>`;
  }).join('');
}

function ensureLeaflet() {
  if (window.L) return Promise.resolve();
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve,reject) => {
    if (!document.getElementById('comparison-leaflet-styles')) {
      const styles=document.createElement('link');styles.id='comparison-leaflet-styles';styles.rel='stylesheet';styles.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';styles.crossOrigin='';document.head.append(styles);
    }
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='';script.async=true;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.head.append(script);
  });
  return leafletPromise;
}

function renderMapList(stations) {
  const list=document.getElementById('comparison-map-list');
  if(!list)return;
  list.innerHTML=stations.map((station,index)=>{
    const summary=periodSummary(station);
    const offline=station.status!=='online';
    const distance=Number.isFinite(Number(station.distanceKm))&&Number(station.distanceKm)>.1?` · ${fmt(station.distanceKm)} km`:'';
    return `<div class="comparison-map-item ${offline?'is-offline':''}"><i style="background:${offline?'#6f7d78':COLORS[index%COLORS.length]}"></i><span><b>${station.name}</b><small>${station.municipality||'Baix Montseny'}${distance}</small></span><strong>${offline?'—':`${fmt(summary.temperature)}°`}</strong></div>`;
  }).join('');
}

async function renderMap(payload) {
  const target=document.getElementById('comparison-map');
  const status=document.getElementById('comparison-map-status');
  const stations=payload.stations||[];
  renderMapList(stations);
  if(!target)return;
  try {
    await ensureLeaflet();
    if(!comparisonMap){
      comparisonMap=window.L.map(target,{zoomControl:true,scrollWheelZoom:false}).setView([41.695,2.47],11);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(comparisonMap);
      comparisonMapLayer=window.L.layerGroup().addTo(comparisonMap);
    }
    comparisonMapLayer.clearLayers();
    const online=stations.filter(station=>station.status==='online'&&Number.isFinite(Number(station.latitude))&&Number.isFinite(Number(station.longitude)));
    const directions=['top','right','bottom','left'];
    online.forEach((station,index)=>{
      const summary=periodSummary(station);
      const marker=window.L.circleMarker([station.latitude,station.longitude],{radius:station.id==='fontanillas'?11:8,color:'#f3f7f3',weight:2,fillColor:COLORS[index%COLORS.length],fillOpacity:.94}).addTo(comparisonMapLayer);
      marker.bindTooltip(station.name,{permanent:true,direction:directions[index%directions.length],offset:[0,-8],className:'comparison-map-tooltip'});
      marker.bindPopup(`<strong>${station.name}</strong><br>${fmt(summary.temperature)} °C · ${fmt(summary.humidity,0)}% HR<br>Ratxa ${fmt(summary.windGust)} km/h · Pluja ${fmt(summary.rainToday)} mm`);
    });
    window.setTimeout(()=>comparisonMap.invalidateSize(),80);
    if(status)status.textContent=`${online.length} estacions situades`;
  } catch(error) {
    console.warn('Mapa comparatiu no disponible.',error);
    if(status)status.textContent='Mapa temporalment no disponible';
    target.innerHTML='<div class="comparison-loading is-error"><strong>No s’ha pogut iniciar el mapa.</strong><span>Les targetes i les gràfiques continuen disponibles.</span></div>';
  }
}

function destroyCharts() { state.charts.forEach(c => c?.destroy?.()); state.charts = []; }

function historySeries(station, metric) {
  const values=(station.history||[]).map(item=>Number(item[metric.key]));
  if(metric!==METRICS.rain)return values.map(value=>Number.isFinite(value)?value:null);
  const valid=values.filter(Number.isFinite);
  const start=valid[0]??0;
  return values.map(value=>Number.isFinite(value)?Math.max(0,value-start):null);
}

function renderCharts(payload) {
  destroyCharts();
  const canvas=document.getElementById('compare-variable-chart');
  const metric=METRICS[state.metric]||METRICS.temperature;
  const sourceStations=(payload.stations||[]).filter(station=>station.status==='online');
  const summaries=sourceStations.map(periodSummary);
  const historical=state.period!=='now'&&sourceStations.some(station=>station.history?.length);
  const copy=document.getElementById('comparison-chart-copy');
  const note=document.getElementById('comparison-variable-note');
  if(copy)copy.textContent=historical?`Evolució de ${metric.label.toLowerCase()} durant ${state.period==='today'?'el dia d’avui':'les últimes 24 hores'}.`:`Valors actuals de ${metric.label.toLowerCase()} entre les estacions actives.`;
  if(note)note.textContent=historical?'Cada línia correspon a una estació i manté les mateixes unitats.':'Selecciona Avui o 24 h per veure l’evolució històrica de totes les estacions.';
  if(!canvas||!window.Chart)return;
  let labels;
  let datasets;
  if(historical){
    const longest=[...sourceStations].sort((a,b)=>(b.history?.length||0)-(a.history?.length||0))[0]?.history||[];
    labels=longest.map(item=>updatedLabel(item.time));
    datasets=sourceStations.map((station,index)=>({label:station.name,data:historySeries(station,metric),borderColor:COLORS[index%COLORS.length],backgroundColor:`${COLORS[index%COLORS.length]}22`,borderWidth:2,pointRadius:0,pointHoverRadius:4,tension:.25,spanGaps:true}));
  }else{
    labels=summaries.map(station=>station.name);
    datasets=[{label:metric.label,data:summaries.map(metric.value),backgroundColor:summaries.map((_,index)=>`${COLORS[index%COLORS.length]}bb`),borderColor:summaries.map((_,index)=>COLORS[index%COLORS.length]),borderWidth:1,borderRadius:9}];
  }
  state.charts.push(new Chart(canvas,{type:historical?'line':'bar',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:historical,labels:{boxWidth:10,boxHeight:10}},tooltip:{callbacks:{label:context=>`${context.dataset.label}: ${fmt(context.raw,metric.digits)} ${metric.suffix}`}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:historical?9:8}},y:{beginAtZero:state.metric==='rain'}}}}));
}
function renderReading(payload) {
  const el = document.getElementById('comparison-reading');
  if (!el) return;
  const online = (payload.stations || []).filter(s=>s.status==='online').map(periodSummary);
  const ref = online.find(s=>s.id==='fontanillas');
  if (!ref || online.length < 2) { el.textContent = 'Esperant prou estacions actives per generar una lectura comparativa.'; return; }
  const others = online.filter(s=>s.id!=='fontanillas');
  const avgTemp = others.map(s=>Number(s.temperature)).filter(Number.isFinite).reduce((a,b)=>a+b,0) / Math.max(1, others.filter(s=>Number.isFinite(Number(s.temperature))).length);
  const warmest = [...online].filter(s=>Number.isFinite(Number(s.temperature))).sort((a,b)=>b.temperature-a.temperature)[0];
  const wettest = [...online].filter(s=>Number.isFinite(Number(s.rainToday))).sort((a,b)=>b.rainToday-a.rainToday)[0];
  const diff = Number(ref.temperature) - avgTemp;
  const tempPhrase = Math.abs(diff) < .2 ? 'molt semblant a la mitjana de les estacions properes' : `${Math.abs(diff).toFixed(1).replace('.',',')} °C ${diff < 0 ? 'més fresca' : 'més càlida'} que la mitjana propera`;
  el.textContent = `Fontanillas està ${tempPhrase}. ${warmest ? `${warmest.name} registra ara la temperatura més alta.` : ''} ${wettest && wettest.rainToday > 0 ? `${wettest.name} presenta l’acumulació de pluja més elevada del grup.` : 'No destaca cap acumulació de pluja significativa entre les estacions disponibles.'}`;
}
function renderMeta(payload) {
  const status=document.getElementById('comparison-status');
  const source=document.getElementById('comparison-source-note');
  if(status) status.textContent=`${(payload.stations||[]).filter(s=>s.status==='online').length}/${(payload.stations||[]).length} estacions actives`;
  if(source) source.textContent=payload.sourcePolicy?.note || 'Fonts normalitzades pel Worker de l’Observatori.';
}
async function load(period='now') {
  state.period=period;
  document.querySelectorAll('[data-compare-period]').forEach(b=>b.classList.toggle('is-active',b.dataset.comparePeriod===period));
  const loading=document.getElementById('station-grid');
  if(loading) loading.innerHTML='<div class="comparison-loading panel">Actualitzant les estacions properes…</div>';
  try {
    const r=await fetch(`${CONFIG.apiUrl}/stations?period=${encodeURIComponent(period)}`,{cache:'no-store',headers:{Accept:'application/json'}});
    if(!r.ok) throw new Error(`API ${r.status}`);
    state.payload=await r.json();
    renderCards(state.payload); renderCharts(state.payload); renderReading(state.payload); renderMeta(state.payload); renderMap(state.payload);
  } catch(error) {
    console.error('Comparativa no disponible',error);
    if(loading) loading.innerHTML='<div class="comparison-loading panel is-error"><strong>No s’han pogut carregar les estacions properes.</strong><span>Torna-ho a provar d’aquí uns instants.</span></div>';
    const status=document.getElementById('comparison-status'); if(status) status.textContent='Sense connexió';
  }
}

function updateClock(){ const el=document.getElementById('header-time'); if(el) el.textContent=new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date()); }
function init() {
  updateClock(); setInterval(updateClock,1000);
  document.querySelectorAll('[data-compare-period]').forEach(btn=>btn.addEventListener('click',()=>load(btn.dataset.comparePeriod)));
  document.querySelectorAll('[data-compare-metric]').forEach(btn=>btn.addEventListener('click',()=>{state.metric=btn.dataset.compareMetric;document.querySelectorAll('[data-compare-metric]').forEach(item=>item.classList.toggle('is-active',item===btn));if(state.payload)renderCharts(state.payload);}));
  load('now');
  setInterval(()=>load(state.period),5*60*1000);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
