import { fetchLocalityForecast, fetchMetNorwayForecast, fetchNearbyStations, searchMunicipalities } from '../services/weather-api.js';

const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const number=(value,digits=0)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?new Intl.NumberFormat('ca-ES',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(Number(value)):'—';
const date=value=>new Intl.DateTimeFormat('ca-ES',{weekday:'short',day:'numeric',month:'short'}).format(new Date(`${value}T12:00:00`));
const time=value=>{const local=String(value||'').match(/[T ](\d{2}:\d{2})/);if(local)return local[1];const parsed=new Date(value);return value&&!Number.isNaN(parsed.getTime())?new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(parsed):'—';};
const weatherLabel=code=>({0:'Cel serè',1:'Poc ennuvolat',2:'Núvols i clarianes',3:'Cobert',45:'Boira',48:'Boira gebradora',51:'Plugim feble',53:'Plugim',55:'Plugim intens',61:'Pluja feble',63:'Pluja',65:'Pluja intensa',71:'Neu feble',73:'Neu',75:'Neu intensa',80:'Ruixats febles',81:'Ruixats',82:'Ruixats intensos',95:'Tempesta',96:'Tempesta amb calamarsa',99:'Tempesta forta amb calamarsa'})[Number(code)]||'Temps variable';
const metLabel=value=>{const code=String(value||'').replace(/_(day|night|polartwilight)$/,'');if(code.includes('thunder'))return 'Tempesta';if(code.includes('snow')||code.includes('sleet'))return 'Neu o aiguaneu';if(code.includes('rain')||code.includes('drizzle'))return 'Pluja';if(code.includes('fog'))return 'Boira';if(code.includes('cloudy'))return code.includes('partly')?'Núvols i clarianes':'Cobert';if(code.includes('clearsky'))return 'Cel serè';if(code.includes('fair'))return 'Poc ennuvolat';return 'Temps variable';};

const form=$('#municipality-search-form');
const input=$('#municipality-query');
const suggestions=$('#municipality-suggestions');
const status=$('#municipality-search-status');
const result=$('#municipality-result');
let candidates=[];
let timer=null;

function placeLabel(place){return [place.name,place.admin2||place.admin1,place.country].filter(Boolean).join(' · ');}

function renderSuggestions(items){
  candidates=items;
  suggestions.hidden=!items.length;
  suggestions.innerHTML=items.map((item,index)=>`<button type="button" role="option" data-place-index="${index}"><b>${escapeHtml(item.name)}</b><small>${escapeHtml([item.admin2||item.admin1,item.country].filter(Boolean).join(' · '))}</small></button>`).join('');
}

async function suggest(){
  const query=input.value.trim();
  if(query.length<2){renderSuggestions([]);status.textContent='Escriu com a mínim dues lletres.';return;}
  status.textContent='Buscant municipis…';
  try{
    const items=await searchMunicipalities(query);
    renderSuggestions(items);
    status.textContent=items.length?'Selecciona el municipi correcte.':'No hem trobat cap coincidència.';
  }catch(error){renderSuggestions([]);status.textContent='No s’ha pogut completar la cerca. Torna-ho a provar.';}
}

function renderForecast(location,weather){
  const current=weather.current||{};const daily=weather.daily||{};
  const days=(daily.time||[]).slice(0,7).map((day,index)=>`<article><time datetime="${escapeHtml(day)}">${escapeHtml(date(day))}</time><strong>${escapeHtml(weatherLabel(daily.weather_code?.[index]))}</strong><span><b>${number(daily.temperature_2m_max?.[index])}°</b><small>${number(daily.temperature_2m_min?.[index])}°</small></span><em>${number(daily.precipitation_probability_max?.[index])}% pluja</em></article>`).join('');
  return `<section class="municipality-summary panel"><header><div><p class="eyebrow">Previsió del model · coordenades del municipi</p><h2>${escapeHtml(location.name)}</h2><p>${escapeHtml([location.admin2||location.admin1,location.country].filter(Boolean).join(' · '))}</p></div><span class="tag">No és una estació</span></header><div class="municipality-now"><div><small>Temperatura estimada ara</small><strong>${number(current.temperature_2m,1)} °C</strong><span>${escapeHtml(weatherLabel(current.weather_code))}</span></div><dl><div><dt>Sensació</dt><dd>${number(current.apparent_temperature,1)} °C</dd></div><div><dt>Humitat</dt><dd>${number(current.relative_humidity_2m)}%</dd></div><div><dt>Vent</dt><dd>${number(current.wind_speed_10m,1)} km/h</dd></div><div><dt>Pluja</dt><dd>${number(current.precipitation,1)} mm</dd></div></dl></div><div class="municipality-days">${days}</div><p class="municipality-source">Font: Open-Meteo. Valors calculats pel model per a les coordenades seleccionades; no són mesures d’una estació.</p></section>`;
}

function renderStations(payload,location){
  const stations=payload?.stations||[];
  const radius=Number(payload?.searchRadiusKm)||200;
  if(!stations.length)return `<section class="municipality-stations panel"><p class="eyebrow">Observacions reals properes</p><h2>Cap estació disponible fins a ${number(radius)} km</h2><p>La previsió continua sent consultable. No substituïm una observació absent per una dada estimada.</p></section>`;
  const cards=stations.map(station=>`<article class="municipality-station ${station.status==='online'?'':'is-offline'}"><header><div><b>${escapeHtml(station.name)}</b><small>${escapeHtml(station.municipality||'Estació propera')}</small></div><span>${number(station.distanceKm,1)} km</span></header>${station.status==='online'?`<strong>${number(station.temperature,1)} °C</strong><dl><div><dt>Humitat</dt><dd>${number(station.humidity)}%</dd></div><div><dt>Vent</dt><dd>${number(station.windSpeed,1)} km/h</dd></div><div><dt>Pluja avui</dt><dd>${number(station.rainToday,1)} mm</dd></div></dl><p>Lectura: ${escapeHtml(time(station.updated))}</p>`:'<p>Dades temporalment no disponibles.</p>'}<footer>${escapeHtml(station.source||'Weather Underground')}</footer></article>`).join('');
  return `<section class="municipality-stations panel"><div class="section-heading"><div><p class="eyebrow">Mesures d’estacions</p><h2>Observacions reals a prop de ${escapeHtml(location.name)}</h2><p>La distància és respecte del centre del lloc seleccionat. La cerca comença a 20 km i només amplia el radi si no hi ha cobertura més propera.</p></div><span class="tag">Radi: ${number(radius)} km</span></div><div class="municipality-station-grid">${cards}</div></section>`;
}

function renderComparisons(location,payload){
  const query=encodeURIComponent(placeLabel(location));
  const meteoblue=`https://www.meteoblue.com/en/weather/search/index?query=${query}`;
  const met=payload?.current;
  const metDays=(payload?.days||[]).slice(0,5).map(day=>`<li><time datetime="${escapeHtml(day.date)}">${escapeHtml(date(day.date))}</time><strong>${escapeHtml(metLabel(day.symbolCode))}</strong><span>${number(day.max)}° / ${number(day.min)}°</span><small>${number(day.precipitation,1)} mm</small></li>`).join('');
  const metContent=met?`<div class="municipality-met-now"><span><small>Ara</small><strong>${number(met.temperature,1)} °C</strong></span><span><small>Vent</small><strong>${number(met.windSpeedKmh,1)} km/h</strong></span><span><small>Humitat</small><strong>${number(met.humidity)}%</strong></span></div><ul class="municipality-met-days">${metDays}</ul>`:'<p class="municipality-source-unavailable">Aquesta segona previsió no està disponible temporalment.</p>';
  return `<section class="municipality-comparisons panel"><div class="section-heading"><div><p class="eyebrow">Contrasta la previsió</p><h2>Una segona mirada independent</h2><p>Els resultats es mantenen separats perquè puguis detectar coincidències i diferències.</p></div><span class="tag">Sense barrejar dades</span></div><article class="municipality-met-card"><header><div><b>MET Norway / Yr</b><small>Previsió integrada per a les mateixes coordenades</small></div><span>Model independent</span></header>${metContent}<p class="municipality-source">Font: MET Norway. Yr utilitza aquestes dades meteorològiques; poden diferir d’Open-Meteo.</p></article><div class="municipality-external-grid"><a href="${meteoblue}" target="_blank" rel="noopener noreferrer"><b>Meteoblue</b><span>Consultar ${escapeHtml(location.name)} al seu web</span><small>Font externa ↗</small></a><a href="https://www.eltiempo.es/" target="_blank" rel="noopener noreferrer"><b>eltiempo.es</b><span>Consulta complementària, especialment útil a Espanya</span><small>Font externa ↗</small></a></div></section>`;
}

async function selectPlace(location,{updateUrl=true}={}){
  input.value=location.name;suggestions.hidden=true;result.hidden=false;result.innerHTML='<div class="panel municipality-loading"><strong>Preparant la consulta…</strong><span>Separem les previsions de les observacions reals.</span></div>';
  status.textContent=`Consultant ${placeLabel(location)}…`;
  if(updateUrl){const url=new URL(window.location.href);url.search='';url.searchParams.set('municipi',location.name);url.searchParams.set('lat',location.latitude);url.searchParams.set('lon',location.longitude);history.replaceState({},'',url);}
  try{
    const [forecast,stations,met]=await Promise.allSettled([fetchLocalityForecast(location),fetchNearbyStations('now',location),fetchMetNorwayForecast(location)]);
    if(forecast.status==='rejected')throw forecast.reason;
    result.innerHTML=renderForecast(forecast.value.location,forecast.value.weather)+renderComparisons(location,met.status==='fulfilled'?met.value:null)+(stations.status==='fulfilled'?renderStations(stations.value,location):renderStations({stations:[]},location));
    status.textContent=`Resultats actualitzats per a ${placeLabel(location)}.`;
  }catch(error){result.innerHTML='<div class="panel municipality-loading is-error"><strong>No hem pogut carregar aquest lloc.</strong><span>Comprova la connexió o prova una altra localitat.</span></div>';status.textContent='Consulta no disponible temporalment.';}
}

input?.addEventListener('input',()=>{clearTimeout(timer);renderSuggestions([]);timer=setTimeout(suggest,300);});
input?.addEventListener('keydown',event=>{if(event.key==='Escape')renderSuggestions([]);});
form?.addEventListener('submit',async event=>{event.preventDefault();if(candidates[0])selectPlace(candidates[0]);else await suggest();});
suggestions?.addEventListener('click',event=>{const button=event.target.closest('[data-place-index]');if(button)selectPlace(candidates[Number(button.dataset.placeIndex)]);});
document.addEventListener('click',event=>{if(!event.target.closest('.municipality-search'))suggestions.hidden=true;});

const params=new URLSearchParams(location.search);const rawLat=params.get('lat');const rawLon=params.get('lon');const lat=Number(rawLat);const lon=Number(rawLon);
if(params.get('municipi')&&rawLat!==null&&rawLon!==null&&Number.isFinite(lat)&&Number.isFinite(lon))selectPlace({name:params.get('municipi'),latitude:lat,longitude:lon},{updateUrl:false});
