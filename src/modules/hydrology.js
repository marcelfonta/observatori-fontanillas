import { CONFIG } from '../core/config.js';
import { getLocale, t } from '../core/i18n.js';

let started=false;
let hydrologyMap;
let markers=[];

const number=(value,digits=1)=>Number.isFinite(value)?new Intl.NumberFormat(getLocale(),{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value):'—';
const time=value=>value?new Intl.DateTimeFormat(getLocale(),{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}).format(new Date(value)):'—';

function trend(series) {
  if(!Array.isArray(series)||series.length<2)return {label:t('Sense prou historial'),kind:'steady'};
  const first=series[0]?.value;const last=series.at(-1)?.value;
  if(!Number.isFinite(first)||!Number.isFinite(last))return {label:t('Sense prou historial'),kind:'steady'};
  const tolerance=Math.max(Math.abs(first)*.02,.05);
  if(last-first>tolerance)return {label:t('En augment'),kind:'up'};
  if(first-last>tolerance)return {label:t('En descens'),kind:'down'};
  return {label:t('Estable'),kind:'steady'};
}

function sparkline(series) {
  const values=(series||[]).map(item=>item.value).filter(Number.isFinite);
  if(values.length<2)return `<span class="hydrology-empty">${t('Historial temporalment no disponible')}</span>`;
  const min=Math.min(...values);const max=Math.max(...values);const spread=max-min||1;
  const points=values.map((value,index)=>`${(index/(values.length-1)*100).toFixed(2)},${(34-((value-min)/spread)*30).toFixed(2)}`).join(' ');
  return `<svg viewBox="0 0 100 38" role="img" aria-label="${t('Evolució de les darreres dues hores')}"><polyline points="${points}" vector-effect="non-scaling-stroke" /></svg>`;
}

function selectStation(station,payload) {
  if(!station)return;
  document.querySelectorAll('[data-hydrology-station]').forEach(button=>button.classList.toggle('is-active',button.dataset.hydrologyStation===station.id));
  const flowTrend=trend(station.flow.series);const levelTrend=trend(station.level.series);
  const detail=document.getElementById('hydrology-detail');
  if(detail)detail.innerHTML=`<header><div><p class="eyebrow">${station.detail}</p><h3>${station.name}</h3></div><time>${time(station.observedAt)}</time></header><div class="hydrology-readings"><article><span>${t('Cabal actual')}</span><strong>${number(station.flow.current)} <small>m³/s</small></strong><em class="is-${flowTrend.kind}">${flowTrend.label}</em>${sparkline(station.flow.series)}</article><article><span>${t('Nivell del riu')}</span><strong>${number(station.level.current)} <small>cm</small></strong><em class="is-${levelTrend.kind}">${levelTrend.label}</em>${sparkline(station.level.series)}</article></div><p class="hydrology-caveat">${t(payload.caveat)}</p>`;
  markers.forEach(item=>item.marker.setStyle({radius:item.id===station.id?10:7,weight:item.id===station.id?4:2,fillOpacity:item.id===station.id ? .95 : .72}));
  hydrologyMap?.panTo([station.latitude,station.longitude]);
}

function render(payload) {
  const stations=Array.isArray(payload?.stations)?payload.stations:[];
  if(!stations.length)throw new Error('Sense estacions ACA');
  const list=document.getElementById('hydrology-stations');
  if(list)list.innerHTML=stations.map((station,index)=>`<button type="button" class="${index===0?'is-active':''}" data-hydrology-station="${station.id}"><span>${station.name}</span><small>${station.detail}</small><b>${number(station.flow.current)} m³/s</b></button>`).join('');
  if(window.L&&!hydrologyMap){
    hydrologyMap=window.L.map('hydrology-map',{scrollWheelZoom:false}).setView([41.70,2.49],10);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(hydrologyMap);
    markers=stations.map(station=>({id:station.id,marker:window.L.circleMarker([station.latitude,station.longitude],{radius:7,color:'#8fe0ad',fillColor:'#286d55',fillOpacity:.72,weight:2}).addTo(hydrologyMap).bindTooltip(`${station.name} · ${number(station.flow.current)} m³/s`).on('click',()=>selectStation(station,payload))}));
  }
  list?.querySelectorAll('[data-hydrology-station]').forEach(button=>button.addEventListener('click',()=>selectStation(stations.find(item=>item.id===button.dataset.hydrologyStation),payload)));
  selectStation(stations[0],payload);
  requestAnimationFrame(()=>hydrologyMap?.invalidateSize());
}

export async function initHydrology() {
  if(started){requestAnimationFrame(()=>hydrologyMap?.invalidateSize());return;}
  started=true;
  const status=document.getElementById('hydrology-status');
  try {
    const response=await fetch(`${CONFIG.apiUrl}/aca-hydrology`,{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`ACA ${response.status}`);
    render(await response.json());
    if(status)status.textContent=t('ACA · dades en temps real');
  } catch(error) {
    console.warn('Dades hidrològiques no disponibles.',error);
    started=false;
    if(status)status.textContent=t('Temporalment no disponible');
    const detail=document.getElementById('hydrology-detail');
    if(detail)detail.innerHTML=`<p class="hydrology-error">${t('Ara mateix no podem carregar les lectures. Pots consultar-les directament al visor oficial de l’ACA.')}</p>`;
  }
}
