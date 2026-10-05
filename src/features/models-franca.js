import { CONFIG } from '../core/config.js';

const $=selector=>document.querySelector(selector);
const state={model:'arome',layer:'precipitation',products:[]};
const LABELS={precipitation:'precipitació',temperature:'temperatura',wind:'vent',clouds:'nuvolositat'};
const CATALUNYA_BOUNDS=[[40.4,0],[43.6,4.5]];
const DISPLAY_BOUNDS=[[40.9,.1],[43,3.4]];
let leafletPromise;
let map;
let weatherOverlay;
let requestSequence=0;

function api(path){return `${CONFIG.apiUrl}${path}`;}
function product(id){return state.products.find(item=>item.id===id);}
function mapUrl(){const params=new URLSearchParams({model:state.model,layer:state.layer,width:'1500',height:'850',fresh:String(Math.floor(Date.now()/600000))});return api(`/meteofrance/map?${params}`);}
function ensureLeaflet(){
  if(window.L)return Promise.resolve();
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.getElementById('leaflet-styles')){const styles=document.createElement('link');styles.id='leaflet-styles';styles.rel='stylesheet';styles.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';styles.crossOrigin='';document.head.append(styles);}
    const existing=document.getElementById('leaflet-script');
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const script=document.createElement('script');script.id='leaflet-script';script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='';script.async=true;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.head.append(script);
  });
  return leafletPromise;
}
async function ensureMap(){
  await ensureLeaflet();
  if(map)return map;
  map=window.L.map('model-map',{zoomControl:true,scrollWheelZoom:false,minZoom:6,maxZoom:12,attributionControl:true});
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap · capa oficial de Météo-France'}).addTo(map);
  const icon=window.L.divIcon({className:'',html:'<span class="fonta-place-marker" aria-hidden="true"></span>',iconSize:[16,16],iconAnchor:[8,8]});
  window.L.marker([41.6906,2.489],{icon,keyboard:false}).addTo(map).bindTooltip('Sant Celoni · Meteo Fontanillas',{direction:'top'});
  map.fitBounds(DISPLAY_BOUNDS,{padding:[12,12]});
  setTimeout(()=>map.invalidateSize(),60);
  return map;
}
function statusLabel(item){if(item.available)return 'Catàleg oficial disponible';if(!item.configured)return 'Pendent d’activar al servidor';return 'Resposta temporalment no disponible';}
function card(item){
  const mode=item.visualizable?'Mapa oficial directe':`${item.members} escenaris probabilístics`;
  const details=[item.horizon,mode,item.steps?`${item.steps} passos temporals`:null,item.coverages?`${item.coverages} cobertures`:null].filter(Boolean);
  return `<article class="product-card"><div class="card-top"><div><p class="eyebrow">${item.protocol.toUpperCase()} · ${item.visualizable?'visual':'numèric'}</p><h3>${item.shortLabel}</h3></div><span class="status ${item.available?'ok':item.configured?'wait':''}" title="${statusLabel(item)}"></span></div><p class="product-purpose">${item.purpose}</p><div class="product-meta">${details.map(value=>`<span>${value}</span>`).join('')}</div><p class="product-note">${statusLabel(item)}</p></article>`;
}
function renderCatalog(){
  $('#product-grid').innerHTML=state.products.map(card).join('');
  const ready=state.products.filter(item=>item.available).length;
  $('#global-state').textContent=`${ready} de ${state.products.length} productes disponibles`;
  $('#global-dot').style.background=ready===state.products.length?'var(--green)':ready?'var(--amber)':'var(--red)';
}
function syncControls(){
  document.querySelectorAll('[data-model]').forEach(button=>{const item=product(button.dataset.model);button.disabled=Boolean(item&&!item.available);button.title=item&&!item.available?statusLabel(item):'';button.classList.toggle('active',button.dataset.model===state.model&&!button.disabled);});
  const selected=product(state.model);
  document.querySelectorAll('[data-layer]').forEach(button=>{const enabled=selected?.layers?.includes(button.dataset.layer);button.disabled=!enabled;button.classList.toggle('active',button.dataset.layer===state.layer&&enabled);});
  if(selected&&!selected.layers.includes(state.layer))state.layer=selected.layers[0]||'precipitation';
  document.querySelectorAll('[data-layer]').forEach(button=>button.classList.toggle('active',button.dataset.layer===state.layer&&!button.disabled));
  $('#viewer-title').textContent=`${selected?.shortLabel||state.model} · ${LABELS[state.layer]||state.layer}`;
  $('#viewer-subtitle').textContent=selected?.purpose||'Producte oficial de Météo-France.';
  $('#map-caption').textContent=`${selected?.label||state.model} · Catalunya`;
}
async function loadMap(){
  syncControls();
  const selected=product(state.model);const mapElement=$('#model-map');const message=$('#map-message');const sequence=++requestSequence;
  mapElement.classList.remove('loaded');message.hidden=false;message.classList.remove('error');message.innerHTML='<span class="spinner"></span><strong>Preparant el mapa oficial…</strong>';
  if(selected&&!selected.available){message.classList.add('error');message.innerHTML='<strong>Aquest producte no respon ara mateix. Tria un dels models disponibles.</strong>';return;}
  try{
    const leafletMap=await ensureMap();
    if(sequence!==requestSequence)return;
    mapElement.classList.add('loaded');
    if(weatherOverlay){leafletMap.removeLayer(weatherOverlay);weatherOverlay=null;}
    const overlay=window.L.imageOverlay(mapUrl(),CATALUNYA_BOUNDS,{opacity:.7,interactive:false,crossOrigin:true});
    await new Promise((resolve,reject)=>{overlay.once('load',resolve);overlay.once('error',reject);overlay.addTo(leafletMap);});
    if(sequence!==requestSequence){leafletMap.removeLayer(overlay);return;}
    weatherOverlay=overlay;message.hidden=true;leafletMap.invalidateSize();
  }catch(error){
    console.warn('Mapa Météo-France no disponible.',error);
    if(sequence!==requestSequence)return;
    message.hidden=false;message.classList.add('error');message.innerHTML='<strong>Aquest mapa no està disponible ara mateix. Pots provar un altre producte o tornar-ho a intentar.</strong>';
  }
}
async function init(){
  try{
    const response=await fetch(api('/meteofrance/models'),{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`API ${response.status}`);
    const data=await response.json();state.products=data.products||[];
    $('#checked-at').textContent=`Comprovat ${new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.checkedAt))}`;
    renderCatalog();
    const initial=product(state.model);if(initial&&!initial.available){const fallback=state.products.find(item=>item.visualizable&&item.available);if(fallback)state.model=fallback.id;}
    loadMap();
  }catch{
    $('#product-grid').innerHTML='<article class="product-card"><h3>Connexió temporalment no disponible</h3><p class="product-purpose">La previsió principal continua funcionant. Torna a provar aquest laboratori més tard.</p></article>';
    $('#global-state').textContent='Laboratori temporalment no disponible';$('#global-dot').style.background='var(--red)';loadMap();
  }
}
$('#model-controls').addEventListener('click',event=>{const button=event.target.closest('[data-model]');if(!button)return;state.model=button.dataset.model;loadMap();});
$('#layer-controls').addEventListener('click',event=>{const button=event.target.closest('[data-layer]');if(!button||button.disabled)return;state.layer=button.dataset.layer;loadMap();});
$('#map-refresh').addEventListener('click',loadMap);
init();
