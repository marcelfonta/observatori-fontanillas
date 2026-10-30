import { CONFIG } from '../core/config.js';
import { setText } from '../core/dom.js';
import { fetchAromeLocalGrid } from '../services/weather-api.js';

const layerNames={rain:'precipitació',temp:'temperatura a 2 metres',wind:'vent a 10 metres',clouds:'nuvolositat',pressure:'pressió atmosfèrica'};
const officialLayers={rain:'precipitation',temp:'temperature',wind:'wind',clouds:'clouds'};
const modelNames={ecmwf:'ECMWF',gfs:'GFS',iconEu:'ICON-EU',harmonie:'HARMONIE-AROME · AEMET',arome:'AROME · Catalunya',aromeHd:'AROME HD · Baix Montseny'};
const HARMONIE_URL='https://www.aemet.es/ca/eltiempo/prediccion/modelosnumericos/harmonie_arome?opc2=pybal&opc3=pr';
const CATALUNYA_BOUNDS=[[40.4,0],[43.6,4.5]];
const CATALUNYA_DISPLAY_BOUNDS=[[40.9,.1],[43,3.4]];
const scales={
  rain:{key:'precipitation',unit:'mm/h',stops:[[0,'#264b45'],[.2,'#4f9fb8'],[1,'#58c879'],[3,'#e2ca57'],[8,'#ef795f'],[20,'#c84bb5']]},
  temp:{key:'temperature_2m',unit:'°C',stops:[[-5,'#6b7fe5'],[5,'#5ab8d4'],[12,'#70c79a'],[20,'#e4cb62'],[28,'#ec8a58'],[36,'#cc5264']]},
  wind:{key:'wind_speed_10m',unit:'km/h',stops:[[0,'#31544c'],[10,'#59aa8a'],[25,'#e1c45a'],[45,'#ed8058'],[70,'#c84b78']]},
  clouds:{key:'cloud_cover',unit:'%',stops:[[0,'#213b39'],[20,'#50716f'],[50,'#8ea4a2'],[80,'#c8d3d1'],[100,'#f0f4f3']]}
};

let model='ecmwf';
let layer='rain';
let loadTimer;
let aromeMap;
let aromeOfficialOverlay;
let aromeCells=[];
let aromeGrid;
let aromeOfficialTimes=[];
let aromeIndex=0;
let playback;
let leafletPromise;
let officialCatalogPromise;
let mapRequest=0;

function windyUrl(){const query=new URLSearchParams({lat:'41.691',lon:'2.489',detailLat:'41.691',detailLon:'2.489',width:'1200',height:'560',zoom:'6',level:'surface',overlay:layer,product:model,menu:'true',message:'true',marker:'true',calendar:'now',pressure:'true',type:'map',location:'coordinates',detail:'',metricWind:'km/h',metricTemp:'°C',radarRange:'-1'});return `https://embed.windy.com/embed2.html?${query}`;}
function windyPublicUrl(){return `https://www.windy.com/?${model},${layer},41.691,2.489,9`;}
function markLoading(message='Carregant el visor temporal de Windy…'){const shell=document.getElementById('model-viewer-shell');const fallback=document.getElementById('model-viewer-fallback');shell?.classList.add('is-loading');shell?.classList.remove('is-ready','has-error');if(fallback)fallback.hidden=true;setText('model-viewer-state',message);clearTimeout(loadTimer);loadTimer=setTimeout(()=>{if(shell?.classList.contains('is-ready'))return;shell?.classList.remove('is-loading');shell?.classList.add('has-error');if(fallback)fallback.hidden=false;setText('model-viewer-state','El mapa no ha respost; utilitza la comparació numèrica.');},15000);}
function markReady(){const shell=document.getElementById('model-viewer-shell');const fallback=document.getElementById('model-viewer-fallback');clearTimeout(loadTimer);shell?.classList.remove('is-loading','has-error');shell?.classList.add('is-ready');if(fallback)fallback.hidden=true;}
function markError(message){const shell=document.getElementById('model-viewer-shell');const fallback=document.getElementById('model-viewer-fallback');clearTimeout(loadTimer);shell?.classList.remove('is-loading');shell?.classList.add('has-error');if(fallback)fallback.hidden=false;setText('model-viewer-state',message);}
function ensureLeaflet(){if(window.L)return Promise.resolve();if(leafletPromise)return leafletPromise;leafletPromise=new Promise((resolve,reject)=>{if(!document.getElementById('leaflet-styles')){const styles=document.createElement('link');styles.id='leaflet-styles';styles.rel='stylesheet';styles.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';styles.crossOrigin='';document.head.appendChild(styles);}const existing=document.getElementById('leaflet-script');if(existing){if(window.L){resolve();return;}existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}const script=document.createElement('script');script.id='leaflet-script';script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='';script.async=true;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.head.appendChild(script);});return leafletPromise;}
async function ensureAromeMap(){
  await ensureLeaflet();
  if(aromeMap)return aromeMap;
  aromeMap=window.L.map('arome-map',{zoomControl:true,scrollWheelZoom:false,minZoom:6,maxZoom:14}).fitBounds(CATALUNYA_DISPLAY_BOUNDS,{padding:[12,12]});
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap · AROME via Météo-France / Open-Meteo'}).addTo(aromeMap);
  window.L.circleMarker([41.6906,2.489],{radius:6,color:'#fff',weight:2,fillColor:'#89d6a3',fillOpacity:1}).addTo(aromeMap).bindTooltip('Sant Celoni · Estació Fontanillas');
  return aromeMap;
}
function colorFor(value,scale){let color=scale.stops[0][1];for(const [limit,next] of scale.stops)if(value>=limit)color=next;return color;}
function formatValue(value,scale){return Number.isFinite(Number(value))?`${Number(value).toFixed(scale.key==='precipitation'?1:0)} ${scale.unit}`:'—';}
function formatTime(value){return value?new Intl.DateTimeFormat('ca-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(value)):'Hora no disponible';}
function renderLocalLegend(scale){const target=document.getElementById('arome-legend');if(!target)return;target.innerHTML=`<span>${layerNames[layer]}</span>${scale.stops.map(([value,color])=>`<i style="--legend-color:${color}"><b>${value}</b></i>`).join('')}<em>${scale.unit}</em>`;}
function renderOfficialLegend(){const target=document.getElementById('arome-legend');if(target)target.innerHTML=`<span>${layerNames[layer]}</span><em>Capa oficial WMS</em>`;}
function syncAromeSlider(max,time,label){const slider=document.getElementById('arome-time');if(slider){slider.max=String(Math.max(0,max));slider.value=String(aromeIndex);slider.disabled=max<1;slider.setAttribute('aria-label',label);}setText('arome-time-label',formatTime(time));}
function clearLocalCells(){for(const cell of aromeCells)cell.remove();aromeCells=[];}
function clearOfficialOverlay(){if(aromeOfficialOverlay&&aromeMap)aromeMap.removeLayer(aromeOfficialOverlay);aromeOfficialOverlay=null;}

async function loadOfficialCatalog(){
  if(officialCatalogPromise)return officialCatalogPromise;
  officialCatalogPromise=fetch(`${CONFIG.apiUrl}/meteofrance/models`,{headers:{Accept:'application/json'},cache:'no-store'}).then(response=>{if(!response.ok)throw new Error(`Catàleg AROME ${response.status}`);return response.json();}).then(payload=>{const product=(payload.products||[]).find(item=>item.id==='arome');if(!product?.available||!product?.times?.length)throw new Error('AROME oficial no disponible');aromeOfficialTimes=product.times;return product;}).catch(error=>{officialCatalogPromise=null;throw error;});
  return officialCatalogPromise;
}
function nearestOfficialIndex(){const now=Date.now();const future=aromeOfficialTimes.findIndex(value=>new Date(value).getTime()>=now);return future<0?Math.max(0,aromeOfficialTimes.length-1):future;}
function officialMapUrl(){const params=new URLSearchParams({model:'arome',layer:officialLayers[layer]||'precipitation',width:'1500',height:'850',fresh:String(Math.floor(Date.now()/600000))});const time=aromeOfficialTimes[aromeIndex];if(time)params.set('time',time);return `${CONFIG.apiUrl}/meteofrance/map?${params}`;}
async function renderOfficialFrame(index){
  if(!aromeOfficialTimes.length)return;
  const request=++mapRequest;aromeIndex=Math.max(0,Math.min(aromeOfficialTimes.length-1,Number(index)||0));
  clearLocalCells();clearOfficialOverlay();renderOfficialLegend();syncAromeSlider(aromeOfficialTimes.length-1,aromeOfficialTimes[aromeIndex],'Hora de previsió AROME per a Catalunya');
  const overlay=window.L.imageOverlay(officialMapUrl(),CATALUNYA_BOUNDS,{opacity:.72,interactive:false,crossOrigin:true});
  await new Promise((resolve,reject)=>{overlay.once('load',resolve);overlay.once('error',reject);overlay.addTo(aromeMap);});
  if(request!==mapRequest){aromeMap.removeLayer(overlay);return;}
  aromeOfficialOverlay=overlay;markReady();setText('model-viewer-caption',`AROME Catalunya · ${layerNames[layer]}`);setText('model-viewer-state',`Mapa oficial continu de Catalunya · vàlid ${formatTime(aromeOfficialTimes[aromeIndex])}.`);
}
async function showAromeOfficial({reset=false}={}){
  const frame=document.getElementById('model-viewer-frame');const viewer=document.getElementById('arome-viewer');if(frame)frame.hidden=true;if(viewer)viewer.hidden=false;stopPlayback();markLoading('Carregant el mapa oficial AROME de Catalunya…');
  try{await ensureAromeMap();await loadOfficialCatalog();if(reset)aromeIndex=nearestOfficialIndex();aromeMap.fitBounds(CATALUNYA_DISPLAY_BOUNDS,{padding:[12,12]});setTimeout(()=>aromeMap.invalidateSize(),50);await renderOfficialFrame(aromeIndex);}catch(error){console.warn('Mapa oficial AROME no disponible.',error);markError('AROME Catalunya no ha respost; el detall HD i els models globals continuen disponibles.');}
}

function renderLocalFrame(index){
  if(!aromeGrid?.length)return;aromeIndex=Math.max(0,Math.min(47,Number(index)||0));const scale=scales[layer]||scales.rain;
  aromeCells.forEach((cell,position)=>{const point=aromeGrid[position];const value=point?.hourly?.[scale.key]?.[aromeIndex];cell.setStyle({fillColor:colorFor(Number(value)||0,scale)});cell.unbindTooltip();cell.bindTooltip(`<strong>${formatValue(value,scale)}</strong><br>${Number(point.latitude).toFixed(2)}, ${Number(point.longitude).toFixed(2)}`);});
  const instant=aromeGrid[0]?.hourly?.time?.[aromeIndex];syncAromeSlider(47,instant,'Hora de previsió AROME HD del Baix Montseny');renderLocalLegend(scale);setText('model-viewer-caption',`AROME HD · ${layerNames[layer]}`);setText('model-viewer-state',`${aromeGrid.length} punts AROME HD · detall local d’1,5 km · horitzó de 48 h.`);
}
async function showAromeLocal({reset=false}={}){
  const frame=document.getElementById('model-viewer-frame');const viewer=document.getElementById('arome-viewer');if(frame)frame.hidden=true;if(viewer)viewer.hidden=false;stopPlayback();markLoading('Carregant el detall AROME HD del Baix Montseny…');
  try{await ensureAromeMap();if(!aromeGrid)aromeGrid=await fetchAromeLocalGrid();clearOfficialOverlay();clearLocalCells();if(reset)aromeIndex=0;aromeMap.setView([41.69,2.49],9);aromeCells=aromeGrid.map(point=>window.L.rectangle([[Number(point.latitude)-.035,Number(point.longitude)-.05],[Number(point.latitude)+.035,Number(point.longitude)+.05]],{stroke:false,fillOpacity:.62,fillColor:'#31544c'}).addTo(aromeMap));setTimeout(()=>aromeMap.invalidateSize(),50);markReady();renderLocalFrame(aromeIndex);}catch(error){console.warn('Visor AROME HD no disponible.',error);markError('El detall AROME HD no ha respost; el mapa de Catalunya i els models globals continuen disponibles.');}
}

function stopPlayback(){if(playback)clearTimeout(playback);playback=null;const button=document.getElementById('arome-play');if(button){button.textContent='▶';button.setAttribute('aria-pressed','false');}}
function syncTimeControls(){
  const isArome=model==='arome'||model==='aromeHd';
  const timeline=document.getElementById('arome-timeline');
  if(timeline)timeline.hidden=!isArome;
  setText('model-viewer-time-hint',isArome?'Tria una hora amb el control o reprodueix l’evolució del model.':model==='harmonie'?'A AEMET, tria la variable i l’hora dins del visor oficial.':'A Windy, mou la barra d’hores situada dins del mapa per veure l’evolució.');
}
function togglePlayback(){
  if(playback){stopPlayback();return;}
  const button=document.getElementById('arome-play');if(button){button.textContent='Ⅱ';button.setAttribute('aria-pressed','true');}
  playback=setTimeout(async function advance(){if(!playback)return;const max=model==='arome'?aromeOfficialTimes.length:48;const next=(aromeIndex+1)%Math.max(1,max);try{if(model==='arome')await renderOfficialFrame(next);else renderLocalFrame(next);}catch(error){console.warn('No s’ha pogut avançar AROME.',error);stopPlayback();return;}if(playback)playback=setTimeout(advance,model==='arome'?1200:750);},150);
}
function syncWindySource(){const source=document.getElementById('model-viewer-source');if(!source)return;source.href=windyPublicUrl();source.textContent='Font: Windy · obrir complet ↗';}
function showWindy(){stopPlayback();mapRequest+=1;const frame=document.getElementById('model-viewer-frame');const viewer=document.getElementById('arome-viewer');if(viewer)viewer.hidden=true;if(frame){frame.hidden=false;frame.src=windyUrl();}syncWindySource();markLoading();setText('model-viewer-caption',`${modelNames[model]} · ${layerNames[layer]}`);}
function showHarmonie(){stopPlayback();mapRequest+=1;const frame=document.getElementById('model-viewer-frame');const viewer=document.getElementById('arome-viewer');if(viewer)viewer.hidden=true;if(frame){frame.hidden=false;frame.src=HARMONIE_URL;}markLoading('Carregant el visor oficial HARMONIE-AROME d’AEMET…');setText('model-viewer-caption','HARMONIE-AROME · Península i Balears · 0–48 h');setText('model-viewer-state','Visor oficial AEMET; selecciona la variable i l’hora dins del mapa.');}
function selectModel(button){
  model=button.dataset.viewerModel;document.querySelectorAll('[data-viewer-model]').forEach(item=>item.classList.toggle('is-active',item.dataset.viewerModel===model));
  const isArome=model==='arome'||model==='aromeHd';const isHarmonie=model==='harmonie';const pressure=document.getElementById('model-layer-pressure');
  document.querySelectorAll('[data-viewer-layer]').forEach(item=>{item.disabled=isHarmonie||(item===pressure&&isArome);item.title=isHarmonie?'Selecciona la variable dins del visor oficial AEMET.':item===pressure&&isArome?'AROME no ofereix aquesta capa en aquest visor':'';});
  syncTimeControls();
  const completeLink=document.getElementById('arome-complete-link');if(completeLink)completeLink.hidden=!isArome;
  const source=document.getElementById('model-viewer-source');if(source){source.href=model==='arome'?'https://portail-api.meteofrance.fr/web/fr/api/DonneesPubliquesPaquetAROME':model==='aromeHd'?'https://open-meteo.com/en/docs/meteofrance-api':isHarmonie?HARMONIE_URL:windyPublicUrl();source.textContent=model==='arome'?'Font: Météo-France · WMS ↗':model==='aromeHd'?'Dades: Open-Meteo · Météo-France ↗':isHarmonie?'Font oficial: AEMET ↗':'Font: Windy · obrir complet ↗';}
  setText('model-viewer-title',model==='arome'?'AROME oficial · Catalunya':model==='aromeHd'?'AROME HD · Baix Montseny':isHarmonie?'HARMONIE-AROME oficial · AEMET':'Mapa temporal interactiu');
  if(isArome&&layer==='pressure'){layer='rain';document.querySelectorAll('[data-viewer-layer]').forEach(item=>item.classList.toggle('is-active',item.dataset.viewerLayer===layer));}
  if(model==='arome')void showAromeOfficial({reset:true});else if(model==='aromeHd')void showAromeLocal({reset:true});else if(isHarmonie)showHarmonie();else showWindy();
}

export function initModelViewer(){
  syncTimeControls();
  const frame=document.getElementById('model-viewer-frame');
  frame?.addEventListener('load',()=>{if(model==='arome'||model==='aromeHd')return;markReady();setText('model-viewer-state',model==='harmonie'?'Visor oficial HARMONIE-AROME d’AEMET · resolució 2,5 km · horitzó màxim 48 h.':'Visor temporal de Windy centrat a Sant Celoni.');});
  if(frame&&!frame.getAttribute('src')&&frame.dataset.src){markLoading();frame.src=frame.dataset.src;}
  document.querySelectorAll('[data-viewer-model]').forEach(button=>button.addEventListener('click',()=>selectModel(button)));
  document.querySelectorAll('[data-viewer-layer]').forEach(button=>button.addEventListener('click',()=>{const isArome=model==='arome'||model==='aromeHd';if(isArome&&button.dataset.viewerLayer==='pressure')return;layer=button.dataset.viewerLayer;document.querySelectorAll('[data-viewer-layer]').forEach(item=>item.classList.toggle('is-active',item===button));if(model==='arome')void showAromeOfficial();else if(model==='aromeHd')renderLocalFrame(aromeIndex);else if(model==='harmonie')showHarmonie();else showWindy();}));
  document.getElementById('arome-time')?.addEventListener('input',event=>{stopPlayback();if(model==='arome')void renderOfficialFrame(event.target.value).catch(()=>markError('No s’ha pogut carregar aquest instant AROME.'));else renderLocalFrame(event.target.value);});
  document.getElementById('arome-play')?.addEventListener('click',togglePlayback);
}
