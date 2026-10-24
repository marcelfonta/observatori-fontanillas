import { CONFIG } from '../core/config.js';
import { finiteNumber } from '../core/numeric.js';
import { stationUvReading, currentEnvironment, environmentalTimestamp, isFresh } from '../core/environment-freshness.js';
import { parseXacPollen, buildXacReference, rankXacTaxa } from '../core/xac-pollen.js';

const AIR_API='https://air-quality-api.open-meteo.com/v1/air-quality';
const OFFICIAL_AIR_URL='https://www.gencat.cat/territori/quaire/json/estat.json';
const OFFICIAL_AIR_STATION='ES1275A';
const OFFICIAL_AIR_MAX_AGE=3*60*60_000;
const OFFICIAL_AIR_NAMES={NO2:'no2',O3:'o3',PM10:'pm10','PM2.5':'pm25',SO2:'so2',H2S:'h2s'};
const OFFICIAL_AIR_QUALITY={bona:['Bona','is-good'],raonablement_bona:['Raonablement bona','is-fair'],regular:['Regular','is-moderate'],desfavorable:['Desfavorable','is-poor'],molt_desfavorable:['Molt desfavorable','is-very-poor'],extremadament_desfavorable:['Extremadament desfavorable','is-extreme']};
const OFFICIAL_AIR_ORDER=Object.keys(OFFICIAL_AIR_QUALITY);
let loaded=false;
let stationUv=null;
let modelUv=null;
let modelCurrent={};
let stationCurrent=null;
let modelPayload={};
let officialAir=null;
let refreshInFlight=null;
let lastAttempt=0;
let xacReference=null;
let xacLoadedAt=0;
let firmsLoaded=false;
let firmsMap;
let firmsMarkers;
let firmsLeafletPromise;
let earthquakesLoaded=false;
let earthquakesMap;
let earthquakesMarkers;
let earthquakesPeriod='day';

function put(id,value){
  const node=document.getElementById(id);
  if(!node)return;
  node.textContent=value;
  node.classList.remove('is-placeholder');
  node.removeAttribute('aria-busy');
}
function number(value,digits=1){const n=finiteValue(value);return n!==null?new Intl.NumberFormat(CONFIG.locale,{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n):'—';}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));}
function finiteValue(value){const n=finiteNumber(value);return n!==null&&n>=0?n:null;}
export function parseOfficialAir(payload,now=Date.now()){
  const station=payload?.features?.find(feature=>feature?.id===OFFICIAL_AIR_STATION&&feature?.properties?.localitat==='Sant Celoni')?.properties;
  const match=station?.dataActualitzacio?.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if(!match)return null;
  const time=environmentalTimestamp(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}`);
  if(!isFresh(time,now,OFFICIAL_AIR_MAX_AGE))return null;
  const readings={};
  for(const item of station.contaminants||[]){
    const key=OFFICIAL_AIR_NAMES[item.abbr];if(!key)continue;
    const row=item.dadesHoraries?.findLast(entry=>entry.hora===match[4]);
    const value=typeof row?.valor==='string'?finiteValue(row.valor.replace(',','.')):finiteValue(row?.valor);
    const quality=OFFICIAL_AIR_QUALITY[row?.qualitat];
    if(value!==null&&value<=1000&&quality)readings[key]={value,label:quality[0],className:quality[1],rank:OFFICIAL_AIR_ORDER.indexOf(row.qualitat)};
  }
  const worst=Object.values(readings).reduce((result,reading)=>reading.rank>result.rank?reading:result,{rank:-1});
  return {time,updated:station.dataActualitzacio,readings,quality:worst.rank>=0?worst:null};
}
function renderOfficialAir(){
  const current=isFresh(officialAir?.time,Date.now(),OFFICIAL_AIR_MAX_AGE)?officialAir:null;
  const status=document.getElementById('environment-official-status');
  if(status)status.textContent=current?`Estació de Sant Celoni · ${current.updated}`:'Mesures oficials temporalment no disponibles';
  put('environment-aqi',current?.quality?.label||'—');
  put('environment-aqi-label',current?.quality?'ICQA · pitjor categoria mesurada':'Sense dades recents');
  put('environment-aqi-copy',current?.quality?'Categoria de l’estació segons el contaminant amb la qualitat de l’aire més desfavorable.':'No mostrem estimacions en lloc de mesures de l’estació.');
  put('environment-health-title',current?.quality?'Consulta la font oficial':'Mesura local no disponible');
  put('environment-health-copy',current?.quality?'Dades provisionals. Consulta els avisos i les recomanacions oficials, especialment si tens símptomes.':'Torna-ho a consultar més tard o obre el visor oficial.');
  put('environment-status-copy',current?'Mesures oficials de l’aire disponibles':'Mesures oficials temporalment no disponibles');
  put('environment-updated',current?`Estació de Sant Celoni: ${current.updated} · hora local`:'Hora de l’estació no disponible');
  for(const key of Object.values(OFFICIAL_AIR_NAMES)){
    const reading=current?.readings[key];
    put(`environment-${key}`,reading?number(reading.value,key==='h2s'?1:0):'—');
    const level=document.getElementById(`environment-${key}-level`);
    if(level){level.textContent=reading?.label||'Sense dada recent';level.className=`environment-level ${reading?.className||''}`.trim();}
    const meter=document.getElementById(`environment-${key}-meter`);
    if(meter){meter.hidden=!reading;meter.style.width=reading?`${(reading.rank+1)/OFFICIAL_AIR_ORDER.length*100}%`:'0%';meter.className=reading?.className||'';}
  }
}
async function loadOfficialAir(){
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(OFFICIAL_AIR_URL,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`XVPCA ${response.status}`);
    officialAir=parseOfficialAir(await response.json());
  }catch(error){officialAir=null;console.warn('Estació XVPCA de Sant Celoni temporalment no disponible.',error);}
  finally{window.clearTimeout(timeout);renderOfficialAir();}
}
// Offset-less provider times are already in Europe/Madrid, not the viewer's zone.
// Never manufacture an update time when the provider omits it.
function environmentTime(value){
  if(typeof value!=='string')return null;
  const raw=value.trim();
  const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/);
  if(!m)return null;
  const [,year,month,day,hour,minute,second='00',offset]=m;
  const date=new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,19)!==`${year}-${month}-${day}T${hour}:${minute}:${second}`)return null;
  if(offset&&!Number.isFinite(Date.parse(raw)))return null;
  return {value:raw,label:offset?new Intl.DateTimeFormat(CONFIG.locale,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(raw)):`${day}/${month}/${year} · ${hour}:${minute}`};
}
function renderUv(){
  const useStation=stationUv!==null;
  put('environment-uv',number(useStation?stationUv:modelUv));
  put('environment-uv-source',useStation?'Sensor Fontanillas':modelUv!==null?'Estimació CAMS':'No disponible');
  const time=useStation?stationUvReading(stationCurrent).time:modelUv!==null?environmentalTimestamp(modelCurrent.time):NaN;
  put('environment-uv-time',Number.isFinite(time)?new Intl.DateTimeFormat(CONFIG.locale,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(time)):'—');
}
function notifyEnvironment(current=modelCurrent){
  document.dispatchEvent(new CustomEvent('observatori:environment-updated',{detail:{
    european_aqi:finiteValue(current.european_aqi),pm10:finiteValue(current.pm10),pm25:finiteValue(current.pm2_5),
    no2:finiteValue(current.nitrogen_dioxide),o3:finiteValue(current.ozone),uv:stationUv??modelUv,
    uvSource:stationUv!==null?'Sensor Fontanillas':modelUv!==null?'Estimació CAMS':'No disponible',pollenMain:xacPollenName()||pollenName(current),time:environmentTime(current.time)?.value??null
  }}));
}
export function updateEnvironmentStation(current){
  stationCurrent=current;
  stationUv=stationUvReading(current).value;
  if(loaded)render(modelPayload);else renderUv();
}
function pollenName(current){
  const entries=[['Gramínies','grass',current.grass_pollen],['Olivera','olive',current.olive_pollen],['Bedoll','birch',current.birch_pollen],['Artemisa','mugwort',current.mugwort_pollen],['Ambrosia','ragweed',current.ragweed_pollen]].filter(([, ,v])=>finiteValue(v)!==null);
  if(!entries.length)return 'No disponible';
  const [name,key,value]=entries.sort((a,b)=>pollenReading(b[1],b[2]).rank-pollenReading(a[1],a[2]).rank||Number(b[2])-Number(a[2]))[0];
  return `${name} · ${pollenReading(key,value).label}`;
}
function xacPollenName(){const highest=xacReference?.highest;return highest?`${highest.name} · ${highest.levelLabel} · ${highest.stationName}`:null;}

const xacLevelClass=level=>level>=4?'is-extreme':level===3?'is-poor':level===2?'is-moderate':level===1?'is-good':'is-none';
const xacTrendSymbol=trend=>({A:'↑','D':'↓','=':'→','!':'!'})[trend]||'—';
const xacDate=value=>validXacDate(value)?new Intl.DateTimeFormat(CONFIG.locale,{day:'numeric',month:'short',timeZone:'Europe/Madrid'}).format(new Date(`${value}T12:00:00Z`)):'—';
const validXacDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
function appendXacTaxon(container,taxon){
  const item=document.createElement('div');item.className='xac-taxon';
  const title=document.createElement('span');title.textContent=taxon.name;
  const value=document.createElement('strong');value.textContent=taxon.levelLabel??'No disponible';
  const trend=document.createElement('em');trend.className=`environment-level ${xacLevelClass(taxon.level)}`;trend.textContent=`${xacTrendSymbol(taxon.trend)} ${taxon.trendLabel??'Sense tendència'}`;
  const type=document.createElement('small');type.textContent=taxon.group==='spores'?'Espora de fong':'Pol·len';
  item.append(title,value,trend,type);container.append(item);
}
function renderXacStation(role,station){
  const card=document.querySelector(`[data-xac-station="${role}"]`);if(!card)return;
  card.hidden=!station;if(!station)return;
  const name=card.querySelector('[data-xac-name]'),meta=card.querySelector('[data-xac-period]'),grid=card.querySelector('[data-xac-taxa]'),body=card.querySelector('tbody');
  if(name)name.textContent=station.stationName;
  if(meta)meta.textContent=`${xacDate(station.start)} – ${xacDate(station.end)} · ${station.status==='in-period'?'vigent':'fora del període actual'}`;
  grid?.replaceChildren();body?.replaceChildren();
  const featured=rankXacTaxa(station,{limit:6});
  if(!featured.length){const empty=document.createElement('p');empty.className='xac-empty';empty.textContent='Cap nivell positiu disponible en aquest butlletí.';grid?.append(empty);}
  else featured.forEach(taxon=>appendXacTaxon(grid,taxon));
  for(const taxon of [...station.pollens,...station.spores]){
    const row=document.createElement('tr');
    for(const value of [taxon.name,taxon.group==='spores'?'Espora':'Pol·len',taxon.levelLabel??'—',`${xacTrendSymbol(taxon.trend)} ${taxon.trendLabel??'—'}`]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
    body?.append(row);
  }
}
function renderXacReference(reference){
  xacReference=reference;
  const status=document.getElementById('xac-status'),period=document.getElementById('xac-period');
  if(status){status.textContent=reference.status==='current'?'Butlletí setmanal vigent':reference.status==='partial'?'Referència principal vigent · complement pendent':'Butlletí fora del període actual';status.className=`tag ${reference.status==='stale'?'is-warning':''}`.trim();}
  if(period)period.textContent=`Del ${xacDate(reference.primary.start)} al ${xacDate(reference.primary.end)} · actualització XAC`;
  renderXacStation('primary',reference.primary);renderXacStation('complement',reference.complement);
  const highest=reference.highest;
  put('xac-summary-title',highest?`${highest.name}: nivell ${highest.levelLabel.toLowerCase()}`:'Sense nivells positius disponibles');
  put('xac-summary-copy',highest?`${highest.stationName} · ${highest.group==='spores'?'espora de fong':'pol·len'} · tendència ${highest.trendLabel.toLowerCase()}. No és una mesura feta a Sant Celoni.`:'El butlletí no aporta ara cap nivell positiu interpretable; consulta igualment la font si tens símptomes.');
  put('environment-pollen-main',xacPollenName()||'Sense nivell destacat');
  notifyEnvironment(modelCurrent);
}
function renderXacUnavailable(){
  xacReference=null;
  const status=document.getElementById('xac-status');if(status){status.textContent='XAC temporalment no disponible';status.className='tag is-warning';}
  put('xac-summary-title','No s’ha pogut carregar el butlletí XAC');
  put('xac-summary-copy','No substituïm les dades absents per una estimació. Pots consultar la font oficial directament.');
  document.querySelectorAll('[data-xac-station]').forEach(card=>{card.hidden=true;});
  put('environment-pollen-main','No disponible');
}
async function fetchXacStation(station,targetDate){
  const response=await fetch(`${CONFIG.apiUrl}/pollen-xac?station=${encodeURIComponent(station)}`,{cache:'no-store'});
  if(!response.ok)throw new Error(`XAC ${station}: ${response.status}`);
  return parseXacPollen(await response.text(),{station,targetDate});
}
async function loadXacReference(){
  if(xacLoadedAt&&Date.now()-xacLoadedAt<6*60*60_000)return;
  xacLoadedAt=Date.now();
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  const targetDate=`${parts.year}-${parts.month}-${parts.day}`;
  try{
    const primary=await fetchXacStation('bellaterra',targetDate);
    let complement=null;
    try{complement=await fetchXacStation('girona',targetDate);}
    catch(error){console.warn('Complement XAC Girona no disponible; provant Manresa.',error);try{complement=await fetchXacStation('manresa',targetDate);}catch(fallbackError){console.warn('Complement XAC alternatiu no disponible.',fallbackError);}}
    renderXacReference(buildXacReference(primary,complement));
  }catch(error){xacLoadedAt=0;console.warn('Referència XAC temporalment no disponible.',error);renderXacUnavailable();}
}

const POLLEN_LIMITS={
  grass:[1,10,50,150],
  birch:[1,10,80,200],
  olive:[1,10,100,200],
  mugwort:[1,10,50,100],
  ragweed:[1,10,50,100]
};
function pollenReading(species,value){
  const n=finiteValue(value);const limits=POLLEN_LIMITS[species]||[1,10,50,100];
  if(n===null)return {label:'No disponible',className:'',rank:-1,position:null};
  if(n<limits[0])return {label:'Nul o residual',className:'is-none',rank:0,position:Math.min(8,n/limits[0]*8)};
  if(n<limits[1])return {label:'Baix',className:'is-good',rank:1,position:8+(n-limits[0])/(limits[1]-limits[0])*22};
  if(n<limits[2])return {label:'Moderat',className:'is-moderate',rank:2,position:30+(n-limits[1])/(limits[2]-limits[1])*30};
  if(n<limits[3])return {label:'Alt',className:'is-poor',rank:3,position:60+(n-limits[2])/(limits[3]-limits[2])*25};
  return {label:'Molt alt',className:'is-extreme',rank:4,position:100};
}
function renderPollen(prefix,key,value){
  const reading=pollenReading(key,value);const level=document.getElementById(`pollen-${prefix}-level`);const meter=document.getElementById(`pollen-${prefix}-meter`);
  if(level){level.textContent=reading.label;level.className=`environment-level ${reading.className}`.trim();}
  if(meter){meter.hidden=reading.position===null;meter.style.width=reading.position===null?'0%':`${Math.max(0,Math.min(100,reading.position))}%`;}
  return reading;
}
function renderPollenSummary(current){
  const species=[['Gramínies','grass',current.grass_pollen],['Olivera','olive',current.olive_pollen],['Bedoll','birch',current.birch_pollen],['Artemisa','mugwort',current.mugwort_pollen],['Ambrosia','ragweed',current.ragweed_pollen]];
  const available=species.map(([name,key,value])=>({name,...pollenReading(key,value)})).filter(item=>item.rank>=0).sort((a,b)=>b.rank-a.rank);
  if(!available.length){put('pollen-summary-title','Sense lectura disponible');put('pollen-summary-copy','Consulta la Xarxa Aerobiològica de Catalunya si tens símptomes o necessites una mesura de referència.');return;}
  const highest=available[0];
  const copy=highest.rank<=1?'L’exposició estimada és baixa. La sensibilitat individual pot variar.':highest.rank===2?'Hi ha una exposició moderada estimada. Si ets sensible, segueix els símptomes i la teva pauta habitual.':'L’exposició estimada és elevada. Si tens al·lèrgia, limita l’exposició i contrasta la dada amb la Xarxa Aerobiològica de Catalunya.';
  put('pollen-summary-title',`${highest.name}: nivell ${highest.label.toLowerCase()}`);put('pollen-summary-copy',copy);
}
function render(payload){
  modelPayload=payload;
  const current=currentEnvironment(payload?.current||{});
  stationUv=stationUvReading(stationCurrent).value;
  modelCurrent=current;
  modelUv=finiteValue(current.uv_index);renderUv();put('environment-pollen-main',xacPollenName()||'Carregant referència XAC');
  [['pollen-grass','grass_pollen'],['pollen-olive','olive_pollen'],['pollen-birch','birch_pollen'],['pollen-mugwort','mugwort_pollen'],['pollen-ragweed','ragweed_pollen']].forEach(([id,key])=>put(id,number(current[key])));
  [['grass','grass',current.grass_pollen],['olive','olive',current.olive_pollen],['birch','birch',current.birch_pollen],['mugwort','mugwort',current.mugwort_pollen],['ragweed','ragweed',current.ragweed_pollen]].forEach(args=>renderPollen(...args));
  renderPollenSummary(current);
  renderOfficialAir();
  notifyEnvironment(current);
}

function initEnvironmentViewers(){
  const buttons=[...document.querySelectorAll('[data-environment-viewer]')];
  const panels=[...document.querySelectorAll('[data-environment-panel]')];
  if(!buttons.length)return;
  const compactViewer=window.matchMedia('(max-width: 700px)');
  const activate=name=>{
    buttons.forEach(button=>{const active=button.dataset.environmentViewer===name;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});
    panels.forEach(panel=>{const active=panel.dataset.environmentPanel===name;panel.hidden=!active;if(active){const asset=panel.querySelector('[data-src]');const skipEmbeddedViewer=['jellyfish','marine'].includes(name)&&compactViewer.matches&&asset?.tagName==='IFRAME';if(asset&&!skipEmbeddedViewer&&!asset.getAttribute('src')){const suffix=asset.tagName==='IMG'?`?v=${new Date().toISOString().slice(0,13)}`:'';asset.src=`${asset.dataset.src}${suffix}`;}}});
    if(name==='firms'&&!firmsLoaded)void loadFirmsDetections();
    if(name==='earthquakes'&&!earthquakesLoaded)void loadEarthquakes(earthquakesPeriod);
  };
  buttons.forEach((button,index)=>{
    button.addEventListener('click',()=>activate(button.dataset.environmentViewer));
    button.addEventListener('keydown',event=>{
      let target=index;
      if(event.key==='ArrowRight'||event.key==='ArrowDown')target=(index+1)%buttons.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp')target=(index-1+buttons.length)%buttons.length;
      else if(event.key==='Home')target=0;
      else if(event.key==='End')target=buttons.length-1;
      else return;
      event.preventDefault();activate(buttons[target].dataset.environmentViewer);buttons[target].focus();
    });
  });
  activate(buttons[0].dataset.environmentViewer);
}

function ensureFirmsLeaflet(){
  if(window.L)return Promise.resolve();
  if(firmsLeafletPromise)return firmsLeafletPromise;
  firmsLeafletPromise=new Promise((resolve,reject)=>{
    if(!document.getElementById('leaflet-styles')){const styles=document.createElement('link');styles.id='leaflet-styles';styles.rel='stylesheet';styles.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';styles.crossOrigin='';document.head.append(styles);}
    const existing=document.getElementById('leaflet-script');
    if(existing){if(window.L){resolve();return;}existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}
    const script=document.createElement('script');script.id='leaflet-script';script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.crossOrigin='';script.async=true;script.addEventListener('load',resolve,{once:true});script.addEventListener('error',reject,{once:true});document.head.append(script);
  });
  return firmsLeafletPromise;
}

function firmsDate(value){return new Intl.DateTimeFormat('ca-ES',{timeZone:'Europe/Madrid',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
function firmsMarkerColor(item){return Date.now()-new Date(item.detectedAt).getTime()<=24*60*60_000?'#ff765f':'#efb56c';}

async function renderFirmsMap(payload){
  await ensureFirmsLeaflet();
  const target=document.getElementById('environment-firms-map');if(!target)return;
  const center=[Number(payload.center?.latitude)||CONFIG.station.latitude,Number(payload.center?.longitude)||CONFIG.station.longitude];
  if(!firmsMap){
    firmsMap=window.L.map(target,{zoomControl:true,scrollWheelZoom:false,minZoom:4,maxZoom:15}).setView(center,7);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap · NASA FIRMS VIIRS'}).addTo(firmsMap);
    window.L.circleMarker(center,{radius:6,color:'#fff',weight:2,fillColor:'#89d6a3',fillOpacity:1}).addTo(firmsMap).bindTooltip('Sant Celoni · Estació Fontanillas');
  }
  if(firmsMarkers)firmsMarkers.clearLayers();else firmsMarkers=window.L.layerGroup().addTo(firmsMap);
  for(const item of payload.detections||[]){
    const latitude=Number(item.latitude);const longitude=Number(item.longitude);if(!Number.isFinite(latitude)||!Number.isFinite(longitude))continue;
    const detail=[`${escapeHtml(firmsDate(item.detectedAt))}`,`${escapeHtml(item.satellite||'VIIRS')} · ${escapeHtml(item.instrument||'VIIRS')}`,`${number(item.distanceKm,1)} km de Fontanillas`,Number.isFinite(Number(item.fireRadiativePower))?`${number(item.fireRadiativePower,1)} MW radiatius`:null].filter(Boolean);
    window.L.circleMarker([latitude,longitude],{radius:7,color:'#fff2df',weight:1.5,fillColor:firmsMarkerColor(item),fillOpacity:.88}).bindTooltip(`${number(item.distanceKm,1)} km · ${firmsDate(item.detectedAt)}`).bindPopup(`<strong>Anomalia tèrmica observada</strong><br>${detail.join('<br>')}<br><small>No confirma per si sola un incendi.</small>`).addTo(firmsMarkers);
  }
  const radius=Math.max(25,Number(payload.radiusKm)||120);const bounds=window.L.latLng(center).toBounds(radius*2000);firmsMap.fitBounds(bounds,{padding:[18,18],maxZoom:8});
  requestAnimationFrame(()=>firmsMap.invalidateSize({pan:false}));
}

async function loadFirmsDetections(){
  firmsLoaded=true;const target=document.getElementById('environment-firms-results');if(!target)return;
  target.innerHTML='<p>Consultant les deteccions satel·litàries de les últimes 48 hores…</p>';
  try{
    const params=new URLSearchParams({lat:String(CONFIG.station.latitude),lon:String(CONFIG.station.longitude),radius:'120'});
    const response=await fetch(`${CONFIG.apiUrl}/fires-nearby?${params}`,{cache:'no-store'});if(!response.ok)throw new Error(`FIRMS ${response.status}`);
    const payload=await response.json();
    if(!payload.configured){target.innerHTML='<p><strong>Integració preparada.</strong> Falta activar la clau gratuïta de NASA FIRMS al servidor. Mentrestant pots obrir el mapa oficial.</p>';return;}
    await renderFirmsMap(payload);
    if(!payload.detections?.length){target.innerHTML=`<header><strong>Cap anomalia tèrmica detectada</strong><small>Últimes 48 hores · radi de ${number(payload.radiusKm,0)} km</small></header><p>Això no descarta un incendi recent, petit o ocult pels núvols. El Pla Alfa continua sent la referència oficial de risc.</p>`;return;}
    target.innerHTML=`<header><strong>${payload.detections.length} deteccions satel·litàries al mapa</strong><small>Últimes 48 hores · radi de ${number(payload.radiusKm,0)} km</small></header><div class="environment-firms__list">${payload.detections.slice(0,8).map(item=>`<article><b>${number(item.distanceKm,1)} km</b><span>${escapeHtml(firmsDate(item.detectedAt))}</span><small>${escapeHtml(item.satellite||'VIIRS')} · confiança ${escapeHtml(item.confidence||'no indicada')}${Number.isFinite(Number(item.fireRadiativePower))?` · ${number(item.fireRadiativePower,1)} MW`:''}</small></article>`).join('')}</div>`;
  }catch(error){firmsLoaded=false;target.innerHTML='<p><strong>Deteccions temporalment no disponibles.</strong> El Pla Alfa continua accessible i és la referència oficial de risc.</p>';console.warn('NASA FIRMS no disponible.',error);}
}

const EARTHQUAKE_FEEDS={
  day:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  week:'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
};
const ICGC_EARTHQUAKE_FEED='https://sismocat.icgc.cat/sisweb3/sisweb_api_external.php?consulta=2init';
function earthquakeDate(value){return new Intl.DateTimeFormat('ca-ES',{timeZone:'Europe/Madrid',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
function earthquakeColor(magnitude){return magnitude>=4.5?'#ff765f':magnitude>=2.5?'#efb56c':'#89d6a3';}
function earthquakeRadius(magnitude){return Math.max(4,Math.min(18,4+Math.max(0,magnitude)*2));}
function preferredMagnitude(origin){const values=Array.isArray(origin?.magnitud)?origin.magnitud:[origin?.magnitud];return values.find(item=>item?.['@attributes']?.pref==='1')||values.find(Boolean);}
function normalizeIcgcEarthquakes(payload,period){
  const limit=Date.now()-(period==='day'?24:7*24)*60*60_000;
  return (payload?.esdeveniment||[]).flatMap(event=>{
    const eventData=event?.['@attributes']||{};const origin=event?.origen?.['@attributes']||{};const magnitude=preferredMagnitude(event?.origen)?.['@attributes']||{};
    const time=Number(origin.torigen||eventData.treferencia)*1000;const latitude=Number(origin.latitud);const longitude=Number(origin.longitud);const depth=Number(origin.profunditat);const mag=Number(magnitude.mag);
    if(origin.area==='T'||time<limit||![latitude,longitude,mag].every(Number.isFinite))return [];
    const code=String(eventData.codi||'');
    return [{type:'Feature',id:`icgc-${code}`,geometry:{type:'Point',coordinates:[longitude,latitude,Number.isFinite(depth)?depth:0]},properties:{mag,place:origin.regio||origin.regioFE||'Localització no indicada',time,url:code?`https://sismocat.icgc.cat/sisweb3/sisweb_details.php?codi=${encodeURIComponent(code)}&lang=ca`:'',source:'ICGC'}}];
  });
}
function mergeEarthquakeCatalogues(usgs,icgc){
  const features=[...(usgs?.features||[])];
  for(const candidate of icgc){
    const [lon,lat]=candidate.geometry.coordinates;const time=Number(candidate.properties.time);
    const duplicate=features.some(item=>{const [itemLon,itemLat]=item.geometry?.coordinates||[];return Math.abs(Number(item.properties?.time)-time)<180_000&&Math.abs(Number(itemLat)-lat)<.15&&Math.abs(Number(itemLon)-lon)<.15;});
    if(!duplicate)features.push(candidate);
  }
  return {type:'FeatureCollection',features};
}
function setEarthquakeView(view){
  if(!earthquakesMap)return;
  if(view==='world')earthquakesMap.setView([20,0],2);
  else earthquakesMap.setView([41.69,2.49],6);
}
async function renderEarthquakes(payload){
  await ensureFirmsLeaflet();
  const target=document.getElementById('environment-earthquakes-map');if(!target)return;
  if(!earthquakesMap){
    earthquakesMap=window.L.map(target,{zoomControl:true,scrollWheelZoom:false,minZoom:2,maxZoom:15,worldCopyJump:true}).setView([41.69,2.49],6);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap · Dades sísmiques USGS + ICGC'}).addTo(earthquakesMap);
    window.L.circleMarker([CONFIG.station.latitude,CONFIG.station.longitude],{radius:6,color:'#fff',weight:2,fillColor:'#55a7ff',fillOpacity:1}).addTo(earthquakesMap).bindTooltip('Sant Celoni · Estació Fontanillas');
  }
  if(earthquakesMarkers)earthquakesMarkers.clearLayers();else earthquakesMarkers=window.L.layerGroup().addTo(earthquakesMap);
  for(const feature of payload.features||[]){
    const [longitude,latitude,depth]=feature.geometry?.coordinates||[];const magnitude=Number(feature.properties?.mag);
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!Number.isFinite(magnitude))continue;
    const place=escapeHtml(feature.properties?.place||'Localització no indicada');const time=earthquakeDate(feature.properties?.time);const source=feature.properties?.source==='ICGC'?'ICGC':'USGS';const rawDetailUrl=String(feature.properties?.url||'');const detailUrl=rawDetailUrl.startsWith('https://earthquake.usgs.gov/')||rawDetailUrl.startsWith('https://sismocat.icgc.cat/')?rawDetailUrl:'';
    const popup=`<strong>Magnitud ${number(magnitude,1)}</strong><br>${place}<br>${escapeHtml(time)} · profunditat ${number(depth,1)} km<br>Font: ${source}${detailUrl?`<br><a href="${escapeHtml(detailUrl)}" target="_blank" rel="noreferrer">Fitxa ${source} ↗</a>`:''}`;
    window.L.circleMarker([latitude,longitude],{radius:earthquakeRadius(magnitude),color:source==='ICGC'?'#86c9ff':'#fff5e9',weight:source==='ICGC'?2:1,fillColor:earthquakeColor(magnitude),fillOpacity:.82}).bindTooltip(`M${number(magnitude,1)} · ${place} · ${source}`).bindPopup(popup).addTo(earthquakesMarkers);
  }
  requestAnimationFrame(()=>earthquakesMap.invalidateSize({pan:false}));
}
async function loadEarthquakes(period='day'){
  earthquakesLoaded=true;earthquakesPeriod=period;const target=document.getElementById('environment-earthquakes-results');if(!target)return;
  document.querySelectorAll('[data-earthquake-period]').forEach(button=>button.classList.toggle('is-active',button.dataset.earthquakePeriod===period));
  target.innerHTML='<p>Consultant el catàleg sísmic mundial de l’USGS…</p>';
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
    const [usgsResult,icgcResult]=await Promise.allSettled([fetch(EARTHQUAKE_FEEDS[period],{cache:'no-store',signal:controller.signal}),fetch(ICGC_EARTHQUAKE_FEED,{cache:'no-store',signal:controller.signal})]);
    if(usgsResult.status!=='fulfilled'||!usgsResult.value.ok)throw new Error(`USGS ${usgsResult.status==='fulfilled'?usgsResult.value.status:'no disponible'}`);
    const usgs=await usgsResult.value.json();const icgcAvailable=icgcResult.status==='fulfilled'&&icgcResult.value.ok;let icgc=[];
    if(icgcAvailable)icgc=normalizeIcgcEarthquakes(await icgcResult.value.json(),period);
    const payload=mergeEarthquakeCatalogues(usgs,icgc);await renderEarthquakes(payload);
    const features=payload.features||[];const strongest=features.reduce((best,item)=>Number(item.properties?.mag)>Number(best?.properties?.mag??-Infinity)?item:best,null);
    target.innerHTML=`<header><strong>${features.length} terratrèmols al mapa</strong><small>${period==='day'?'Últimes 24 hores':'Últims 7 dies'} · totes les magnituds · USGS + ${icgcAvailable?`ICGC · ${icgc.length} registres addicionals`:'ICGC temporalment no disponible'}</small></header>${strongest?`<p>El més intens del període: <b>M${number(strongest.properties?.mag,1)}</b> · ${escapeHtml(strongest.properties?.place||'localització no indicada')} · ${escapeHtml(earthquakeDate(strongest.properties?.time))}.</p>`:'<p>No hi ha esdeveniments al catàleg per al període seleccionat.</p>'}<small>Les dades són preliminars i poden ser revisades pels organismes d’origen.</small>`;
  }catch(error){earthquakesLoaded=false;target.innerHTML='<p><strong>Catàleg mundial temporalment no disponible.</strong> Pots obrir directament els mapes oficials de l’USGS o l’ICGC.</p>';console.warn('Catàleg sísmic USGS no disponible.',error);}
  finally{window.clearTimeout(timeout);}
}
function initEarthquakeControls(){
  document.querySelectorAll('[data-earthquake-period]').forEach(button=>button.addEventListener('click',()=>void loadEarthquakes(button.dataset.earthquakePeriod)));
  document.querySelectorAll('[data-earthquake-view]').forEach(button=>button.addEventListener('click',()=>setEarthquakeView(button.dataset.earthquakeView)));
}

export async function initEnvironment(){
  if(loaded||!document.getElementById('medi-ambient'))return;
  loaded=true;
  // An open/background tab must not keep treating an old observation as live.
  window.setInterval?.(()=>{
    render(modelPayload);
    renderOfficialAir();
    if(document.visibilityState!=='hidden'&&Date.now()-lastAttempt>=15*60_000)void refreshEnvironment();
  },60_000);
  initEnvironmentViewers();
  initEarthquakeControls();
  await refreshEnvironment();
}
function refreshEnvironment(){
  if(refreshInFlight)return refreshInFlight;
  lastAttempt=Date.now();
  const pending=Promise.allSettled([loadEnvironment(),loadOfficialAir(),loadXacReference()]).finally(()=>{if(refreshInFlight===pending)refreshInFlight=null;});
  refreshInFlight=pending;
  return pending;
}
async function loadEnvironment(){
  const params=new URLSearchParams({latitude:String(CONFIG.station.latitude),longitude:String(CONFIG.station.longitude),current:'european_aqi,european_aqi_pm10,european_aqi_pm2_5,european_aqi_nitrogen_dioxide,european_aqi_ozone,european_aqi_sulphur_dioxide,pm10,pm2_5,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide,uv_index,grass_pollen,olive_pollen,birch_pollen,mugwort_pollen,ragweed_pollen',timezone:'Europe/Madrid',domains:'cams_europe'});
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(`${AIR_API}?${params}`,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`Air API ${response.status}`);
    render(await response.json());
  }catch(error){
    console.warn('Indicadors ambientals temporalment no disponibles.',error);
    render({current:{}});
    put('environment-status-copy','Indicadors automàtics temporalment no disponibles');
    put('environment-updated','Fonts oficials accessibles a sota');
    put('environment-health-title','Consulta les fonts oficials');
    put('environment-health-copy','Els visors d’incendi, sequera i costa continuen disponibles encara que falli l’estimació ambiental.');
  }finally{window.clearTimeout(timeout);}
}
