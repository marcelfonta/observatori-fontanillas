import { CONFIG } from '../core/config.js';
import { getLocale, t } from '../core/i18n.js';

let started=false;
let hydrologyMap;
let markers=[];
let activeKind='river';
let requestId=0;
let leafletPromise;
const cache=new Map();
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=(value,digits=1)=>Number.isFinite(value)?new Intl.NumberFormat(getLocale(),{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value):'—';
const time=value=>value?new Intl.DateTimeFormat(getLocale(),{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}).format(new Date(value)):'—';

function ensureLeaflet(){
  if(window.L)return Promise.resolve();
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.getElementById('leaflet-styles')){
      const styles=document.createElement('link');styles.id='leaflet-styles';styles.rel='stylesheet';styles.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';styles.crossOrigin='';document.head.appendChild(styles);
    }
    const existing=document.getElementById('leaflet-script');
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const script=document.createElement('script');script.id='leaflet-script';script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='';script.async=true;
    script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.head.appendChild(script);
  }).catch(error=>{leafletPromise=null;throw error;});
  return leafletPromise;
}

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

function readings(station,kind) {
  const fields=kind==='river'
    ?[{label:t('Cabal actual'),data:station.flow},{label:t('Nivell del riu'),data:station.level}]
    :kind==='rain'
      ?[{label:t('Intensitat de pluja'),data:station.primary}]
      :[{label:t('Volum embassat'),data:station.primary},{label:t('Aigua emmagatzemada'),data:station.secondary}];
  return fields.map(({label,data})=>{
    const current=data?.current;
    const change=Number.isFinite(current)?trend(data?.series):{label:t('Lectura no recent'),kind:'steady'};
    const observed=data?.observedAt||data?.series?.at(-1)?.observedAt;
    return `<article><span>${esc(label)}</span><strong>${number(current)} <small>${esc(data?.unit)}</small></strong><em class="is-${change.kind}">${esc(change.label)}</em><time>${esc(t('Lectura'))}: ${time(observed)}</time>${Number.isFinite(current)?sparkline(data?.series):''}</article>`;
  }).join('');
}

function selectStation(station,payload) {
  if(!station)return;
  document.querySelectorAll('[data-hydrology-station]').forEach(button=>button.classList.toggle('is-active',button.dataset.hydrologyStation===station.id));
  const detail=document.getElementById('hydrology-detail');
  if(detail)detail.innerHTML=`<header><div><p class="eyebrow">${esc(station.detail)}</p><h3>${esc(station.name)}</h3></div><time>${time(station.observedAt)}</time></header><div class="hydrology-readings">${readings(station,payload.kind||'river')}</div><p class="hydrology-caveat">${esc(t(payload.caveat))}</p>`;
  markers.forEach(item=>item.marker.setStyle({radius:item.id===station.id?10:7,weight:item.id===station.id?4:2,fillOpacity:item.id===station.id ? .95 : .72}));
  hydrologyMap?.panTo([station.latitude,station.longitude]);
}

function render(payload) {
  const stations=Array.isArray(payload?.stations)?payload.stations:[];
  if(!stations.length)throw new Error('Sense estacions ACA');
  const kind=payload.kind||'river';
  const value=station=>kind==='river'?station.flow?.current:station.primary?.current;
  const unit=kind==='river'?'m³/s':kind==='rain'?'mm/h':'%';
  const list=document.getElementById('hydrology-stations');
  if(list)list.innerHTML=stations.map((station,index)=>`<button type="button" class="${index===0?'is-active':''}" data-hydrology-station="${esc(station.id)}"><span>${esc(station.name)}</span><small>${esc(station.detail)}</small><b>${number(value(station))} ${unit}</b></button>`).join('');
  if(window.L&&!hydrologyMap){
    hydrologyMap=window.L.map('hydrology-map',{scrollWheelZoom:false}).setView([41.70,2.49],10);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(hydrologyMap);
  }
  markers.forEach(item=>item.marker.remove());
  markers=stations.filter(station=>Number.isFinite(station.latitude)&&Number.isFinite(station.longitude)).map(station=>({id:station.id,marker:window.L.circleMarker([station.latitude,station.longitude],{radius:7,color:'#8fe0ad',fillColor:'#286d55',fillOpacity:.72,weight:2}).addTo(hydrologyMap).bindTooltip(`${esc(station.name)} · ${number(value(station))} ${unit}`).on('click',()=>selectStation(station,payload))}));
  list?.querySelectorAll('[data-hydrology-station]').forEach(button=>button.addEventListener('click',()=>selectStation(stations.find(item=>item.id===button.dataset.hydrologyStation),payload)));
  selectStation(stations[0],payload);
  if(kind==='reservoir')hydrologyMap?.fitBounds(markers.map(item=>item.marker.getLatLng()),{padding:[32,32],maxZoom:10});
  else hydrologyMap?.setView([41.70,2.54],kind==='rain'?10:11);
  requestAnimationFrame(()=>hydrologyMap?.invalidateSize());
}

async function loadKind(kind) {
  activeKind=kind;
  const currentRequest=++requestId;
  document.querySelectorAll('[data-hydrology-kind]').forEach(button=>{const active=button.dataset.hydrologyKind===kind;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
  const status=document.getElementById('hydrology-status');
  if(status)status.textContent=t('Carregant dades');
  const cached=cache.get(kind);
  try {
    let payload=cached&&Date.now()-cached.at<300_000?cached.payload:null;
    if(!payload){
      const response=await fetch(`${CONFIG.apiUrl}/aca-hydrology?kind=${kind}`,{headers:{Accept:'application/json'},cache:'no-store'});
      if(!response.ok)throw new Error(`ACA ${response.status}`);
      payload=await response.json();
      cache.set(kind,{at:Date.now(),payload});
    }
    if(currentRequest!==requestId)return;
    render(payload);
    if(status)status.textContent=t('ACA · dades en temps real');
  } catch(error) {
    if(currentRequest!==requestId)return;
    console.warn('Dades hidrològiques no disponibles.',error);
    if(status)status.textContent=t('Temporalment no disponible');
    const detail=document.getElementById('hydrology-detail');
    if(detail)detail.innerHTML=`<p class="hydrology-error">${t('Ara mateix no podem carregar les lectures. Pots consultar-les directament al visor oficial de l’ACA.')}</p>`;
  }
}

export async function initHydrology() {
  await ensureLeaflet();
  if(!started){
    started=true;
    document.querySelectorAll('[data-hydrology-kind]').forEach(button=>button.addEventListener('click',()=>loadKind(button.dataset.hydrologyKind)));
  }
  const cached=cache.get(activeKind);
  if(!cached||Date.now()-cached.at>=300_000)await loadKind(activeKind);
  requestAnimationFrame(()=>hydrologyMap?.invalidateSize());
}
