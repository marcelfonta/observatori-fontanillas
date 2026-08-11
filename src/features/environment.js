import { CONFIG } from '../core/config.js';

const AIR_API='https://air-quality-api.open-meteo.com/v1/air-quality';
let loaded=false;
let stationUv=null;
let modelUv=null;
let modelCurrent={};

function put(id,value){const node=document.getElementById(id);if(node)node.textContent=value;}
function number(value,digits=1){const n=Number(value);return Number.isFinite(n)?new Intl.NumberFormat(CONFIG.locale,{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(n):'—';}
function aqiReading(value){
  const n=Number(value);
  if(!Number.isFinite(n))return {label:'No disponible',copy:'No s’ha pogut calcular l’índex actual.',health:'Dades pendents',advice:'Torna-ho a consultar més tard.',position:0};
  if(n<=20)return {label:'Bona',copy:'La qualitat de l’aire estimada és favorable.',health:'Bona situació ambiental',advice:'Condicions adequades per a l’activitat habitual a l’exterior.',position:n/120*100};
  if(n<=40)return {label:'Raonablement bona',copy:'La qualitat de l’aire continua dins d’un rang generalment favorable.',health:'Activitat normal',advice:'La majoria de persones poden mantenir l’activitat habitual a l’exterior.',position:n/120*100};
  if(n<=60)return {label:'Moderada',copy:'Alguns contaminants presenten valors moderats.',health:'Atenció si ets sensible',advice:'Les persones sensibles poden reduir l’esforç intens i prolongat a l’exterior.',position:n/120*100};
  if(n<=80)return {label:'Dolenta',copy:'La qualitat de l’aire estimada pot afectar persones sensibles.',health:'Limita l’esforç intens',advice:'Redueix l’activitat física intensa a l’exterior, especialment si tens símptomes.',position:n/120*100};
  if(n<=100)return {label:'Molt dolenta',copy:'Els nivells estimats són desfavorables.',health:'Precaució general',advice:'Evita l’esforç prolongat a l’exterior i segueix les recomanacions oficials.',position:n/120*100};
  return {label:'Extremadament dolenta',copy:'L’índex europeu supera el llindar de 100.',health:'Evita l’esforç exterior',advice:'Prioritza espais interiors i consulta els avisos de salut pública.',position:100};
}
function componentReading(value){
  const n=Number(value);
  if(!Number.isFinite(n))return {label:'No disponible',className:'',position:0};
  if(n<=20)return {label:'Baix · bona',className:'is-good',position:n/120*100};
  if(n<=40)return {label:'Raonable',className:'is-fair',position:n/120*100};
  if(n<=60)return {label:'Moderat',className:'is-moderate',position:n/120*100};
  if(n<=80)return {label:'Alt · dolent',className:'is-poor',position:n/120*100};
  if(n<=100)return {label:'Molt alt',className:'is-very-poor',position:n/120*100};
  return {label:'Extrem',className:'is-extreme',position:100};
}
function renderComponent(prefix,value){
  const reading=componentReading(value);
  const label=document.getElementById(`environment-${prefix}-level`);
  const meter=document.getElementById(`environment-${prefix}-meter`);
  if(label){label.textContent=reading.label;label.className=`environment-level ${reading.className}`.trim();}
  if(meter)meter.style.width=`${Math.max(0,Math.min(100,reading.position))}%`;
}
function finiteValue(value){return value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;}
function renderUv(){
  const useStation=stationUv!==null;
  put('environment-uv',number(useStation?stationUv:modelUv));
  put('environment-uv-source',useStation?'Sensor Fontanillas':'Estimació CAMS');
}
function notifyEnvironment(current=modelCurrent){
  document.dispatchEvent(new CustomEvent('observatori:environment-updated',{detail:{
    european_aqi:finiteValue(current.european_aqi),pm10:finiteValue(current.pm10),pm25:finiteValue(current.pm2_5),
    no2:finiteValue(current.nitrogen_dioxide),o3:finiteValue(current.ozone),uv:stationUv??modelUv,
    uvSource:stationUv!==null?'Sensor Fontanillas':'Estimació CAMS',pollenMain:pollenName(current),time:current.time||new Date().toISOString()
  }}));
}
export function updateEnvironmentStation(current){
  stationUv=finiteValue(current?.uv);
  renderUv();
  if(loaded)notifyEnvironment(modelCurrent);
}
function pollenName(current){
  const entries=[['Gramínies','grass',current.grass_pollen],['Olivera','olive',current.olive_pollen],['Bedoll','birch',current.birch_pollen],['Artemisa','mugwort',current.mugwort_pollen],['Ambrosia','ragweed',current.ragweed_pollen]].filter(([, ,v])=>Number.isFinite(Number(v)));
  if(!entries.length)return 'No disponible';
  const [name,key,value]=entries.sort((a,b)=>pollenReading(b[1],b[2]).rank-pollenReading(a[1],a[2]).rank||Number(b[2])-Number(a[2]))[0];
  return `${name} · ${pollenReading(key,value).label}`;
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
  if(n===null)return {label:'No disponible',className:'',rank:-1,position:0};
  if(n<limits[0])return {label:'Nul o residual',className:'is-none',rank:0,position:Math.min(8,n/limits[0]*8)};
  if(n<limits[1])return {label:'Baix',className:'is-good',rank:1,position:8+(n-limits[0])/(limits[1]-limits[0])*22};
  if(n<limits[2])return {label:'Moderat',className:'is-moderate',rank:2,position:30+(n-limits[1])/(limits[2]-limits[1])*30};
  if(n<limits[3])return {label:'Alt',className:'is-poor',rank:3,position:60+(n-limits[2])/(limits[3]-limits[2])*25};
  return {label:'Molt alt',className:'is-extreme',rank:4,position:100};
}
function renderPollen(prefix,key,value){
  const reading=pollenReading(key,value);const level=document.getElementById(`pollen-${prefix}-level`);const meter=document.getElementById(`pollen-${prefix}-meter`);
  if(level){level.textContent=reading.label;level.className=`environment-level ${reading.className}`.trim();}
  if(meter)meter.style.width=`${Math.max(0,Math.min(100,reading.position))}%`;
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
  const current=payload?.current||{};
  modelCurrent=current;
  const reading=aqiReading(current.european_aqi);
  put('environment-aqi',number(current.european_aqi,0));put('environment-aqi-label',reading.label);put('environment-aqi-copy',reading.copy);
  put('environment-health-title',reading.health);put('environment-health-copy',reading.advice);
  modelUv=finiteValue(current.uv_index);renderUv();put('environment-pollen-main',pollenName(current));
  [['environment-pm10','pm10'],['environment-pm25','pm2_5'],['environment-no2','nitrogen_dioxide'],['environment-o3','ozone'],['environment-co','carbon_monoxide'],['environment-so2','sulphur_dioxide'],['pollen-grass','grass_pollen'],['pollen-olive','olive_pollen'],['pollen-birch','birch_pollen'],['pollen-mugwort','mugwort_pollen'],['pollen-ragweed','ragweed_pollen']].forEach(([id,key])=>put(id,number(current[key])));
  [['pm10','european_aqi_pm10'],['pm25','european_aqi_pm2_5'],['no2','european_aqi_nitrogen_dioxide'],['o3','european_aqi_ozone'],['so2','european_aqi_sulphur_dioxide']].forEach(([prefix,key])=>renderComponent(prefix,current[key]));
  [['grass','grass',current.grass_pollen],['olive','olive',current.olive_pollen],['birch','birch',current.birch_pollen],['mugwort','mugwort',current.mugwort_pollen],['ragweed','ragweed',current.ragweed_pollen]].forEach(args=>renderPollen(...args));
  renderPollenSummary(current);
  const marker=document.getElementById('environment-aqi-marker');if(marker)marker.style.left=`${Math.max(0,Math.min(100,reading.position))}%`;
  const time=current.time?new Date(current.time):new Date();
  put('environment-status-copy','Indicadors ambientals disponibles');
  put('environment-updated',`Actualitzat ${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(time)}`);
  notifyEnvironment(current);
}

function initEnvironmentViewers(){
  const buttons=[...document.querySelectorAll('[data-environment-viewer]')];
  const panels=[...document.querySelectorAll('[data-environment-panel]')];
  if(!buttons.length)return;
  const activate=name=>{
    buttons.forEach(button=>{const active=button.dataset.environmentViewer===name;button.classList.toggle('is-active',active);button.setAttribute('aria-selected',String(active));});
    panels.forEach(panel=>{const active=panel.dataset.environmentPanel===name;panel.hidden=!active;if(active){const asset=panel.querySelector('[data-src]');if(asset&&!asset.getAttribute('src')){const suffix=asset.tagName==='IMG'?`?v=${new Date().toISOString().slice(0,13)}`:'';asset.src=`${asset.dataset.src}${suffix}`;}}});
  };
  buttons.forEach(button=>button.addEventListener('click',()=>activate(button.dataset.environmentViewer)));
  activate(buttons[0].dataset.environmentViewer);
}

export async function initEnvironment(){
  if(loaded||!document.getElementById('medi-ambient'))return;
  loaded=true;
  initEnvironmentViewers();
  const params=new URLSearchParams({latitude:String(CONFIG.station.latitude),longitude:String(CONFIG.station.longitude),current:'european_aqi,european_aqi_pm10,european_aqi_pm2_5,european_aqi_nitrogen_dioxide,european_aqi_ozone,european_aqi_sulphur_dioxide,pm10,pm2_5,nitrogen_dioxide,ozone,carbon_monoxide,sulphur_dioxide,uv_index,grass_pollen,olive_pollen,birch_pollen,mugwort_pollen,ragweed_pollen',timezone:'Europe/Madrid',domains:'cams_europe'});
  const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(`${AIR_API}?${params}`,{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error(`Air API ${response.status}`);
    render(await response.json());
  }catch(error){
    console.warn('Indicadors ambientals temporalment no disponibles.',error);
    put('environment-status-copy','Indicadors automàtics temporalment no disponibles');
    put('environment-updated','Fonts oficials accessibles a sota');
    put('environment-health-title','Consulta les fonts oficials');
    put('environment-health-copy','Els visors d’incendi, sequera i costa continuen disponibles encara que falli l’estimació ambiental.');
  }finally{window.clearTimeout(timeout);}
}
