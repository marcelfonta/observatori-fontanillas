import { CONFIG } from '../core/config.js';

const state = { period: 'now', payload: null, charts: [] };

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
        <div><span class="station-source">${st.source || 'Font externa'}</span><h3>${st.name}</h3><small>${st.municipality || ''}</small></div>
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

function destroyCharts() { state.charts.forEach(c => c?.destroy?.()); state.charts = []; }
function chart(canvasId, label, stations, valueFn, suffix) {
  const el = document.getElementById(canvasId);
  if (!el || !window.Chart) return;
  const usable = stations.filter(s => s.status === 'online');
  state.charts.push(new Chart(el, {
    type:'bar',
    data:{ labels:usable.map(s=>s.name), datasets:[{ label, data:usable.map(valueFn), borderWidth:1, borderRadius:8 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{ callbacks:{label:ctx=>`${fmt(ctx.raw)} ${suffix}`} } }, scales:{ x:{grid:{display:false}}, y:{beginAtZero:false} } }
  }));
}
function renderCharts(payload) {
  destroyCharts();
  const stations = (payload.stations || []).map(periodSummary);
  chart('compare-temp-chart','Temperatura',stations,s=>s.temperature,'°C');
  chart('compare-rain-chart','Pluja',stations,s=>s.rainToday,'mm');
  chart('compare-wind-chart','Vent',stations,s=>s.windGust ?? s.windSpeed,'km/h');
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
    renderCards(state.payload); renderCharts(state.payload); renderReading(state.payload); renderMeta(state.payload);
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
  load('now');
  setInterval(()=>load(state.period),5*60*1000);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
