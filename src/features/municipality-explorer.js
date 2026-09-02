import { fetchLocalityForecast, fetchMetNorwayForecast, fetchNearbyStations, fetchNearbyWebcams, searchMunicipalities } from '../services/weather-api.js';
import { getLanguage, getLocale } from '../core/i18n.js';

const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const number=(value,digits=0)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?new Intl.NumberFormat(getLocale(),{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(Number(value)):'—';
const date=value=>new Intl.DateTimeFormat(getLocale(),{weekday:'short',day:'numeric',month:'short'}).format(new Date(`${value}T12:00:00`));
const time=value=>{const local=String(value||'').match(/[T ](\d{2}:\d{2})/);if(local)return local[1];const parsed=new Date(value);return value&&!Number.isNaN(parsed.getTime())?new Intl.DateTimeFormat(getLocale(),{hour:'2-digit',minute:'2-digit'}).format(parsed):'—';};
const weatherLabel=code=>({0:'Cel serè',1:'Poc ennuvolat',2:'Núvols i clarianes',3:'Cobert',45:'Boira',48:'Boira gebradora',51:'Plugim feble',53:'Plugim',55:'Plugim intens',61:'Pluja feble',63:'Pluja',65:'Pluja intensa',71:'Neu feble',73:'Neu',75:'Neu intensa',80:'Ruixats febles',81:'Ruixats',82:'Ruixats intensos',95:'Tempesta',96:'Tempesta amb calamarsa',99:'Tempesta forta amb calamarsa'})[Number(code)]||'Temps variable';
const metLabel=value=>{const code=String(value||'').replace(/_(day|night|polartwilight)$/,'');if(code.includes('thunder'))return 'Tempesta';if(code.includes('snow')||code.includes('sleet'))return 'Neu o aiguaneu';if(code.includes('rain')||code.includes('drizzle'))return 'Pluja';if(code.includes('fog'))return 'Boira';if(code.includes('cloudy'))return code.includes('partly')?'Núvols i clarianes':'Cobert';if(code.includes('clearsky'))return 'Cel serè';if(code.includes('fair'))return 'Poc ennuvolat';return 'Temps variable';};
const weatherKind=code=>{const value=Number(code);if(value===0)return'clear';if(value<=2)return'partly';if(value===3)return'cloudy';if(value===45||value===48)return'fog';if((value>=51&&value<=65)||(value>=80&&value<=82))return'rain';if(value>=71&&value<=77)return'snow';if(value>=95)return'storm';return'partly';};
const metKind=value=>{const code=String(value||'');if(code.includes('thunder'))return'storm';if(code.includes('snow')||code.includes('sleet'))return'snow';if(code.includes('rain')||code.includes('drizzle'))return'rain';if(code.includes('fog'))return'fog';if(code.includes('cloudy'))return code.includes('partly')?'partly':'cloudy';if(code.includes('clearsky'))return'clear';return'partly';};
function weatherIcon(kind,label){
  const cloud='<path class="weather-cloud" d="M18 45h30a10 10 0 0 0 1-20 15 15 0 0 0-28-2 11 11 0 0 0-3 22Z"/>';
  const sun='<circle class="weather-sun" cx="25" cy="24" r="10"/><path class="weather-rays" d="M25 7v6M25 35v6M8 24h6M36 24h6M13 12l4 4M33 32l4 4M37 12l-4 4M17 32l-4 4"/>';
  const art={clear:sun,partly:`${sun}${cloud}`,cloudy:cloud,fog:`${cloud}<path class="weather-detail" d="M14 51h36M20 57h28"/>`,rain:`${cloud}<path class="weather-rain" d="m22 51-3 6m14-6-3 6m14-6-3 6"/>`,snow:`${cloud}<path class="weather-detail" d="M22 52v7m-3-3h6m13-4v7m-3-3h6"/>`,storm:`${cloud}<path class="weather-storm" d="M34 47h-8l5 5h-5l4 7 10-10h-6Z"/>`};
  return `<svg class="municipality-weather-icon municipality-weather-icon--${kind}" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(label)}">${art[kind]||art.partly}</svg>`;
}

const form=$('#municipality-search-form');
const input=$('#municipality-query');
const suggestions=$('#municipality-suggestions');
const status=$('#municipality-search-status');
const result=$('#municipality-result');
const favoritesHost=$('#municipality-favorites');
const favoritesList=$('#municipality-favorites-list');
const FAVORITES_KEY='fontanillas-municipality-favorites-v1';
let candidates=[];
let timer=null;

function placeLabel(place){return [place.name,place.admin2||place.admin1,place.country].filter(Boolean).join(' · ');}
function validPlace(place){return Boolean(place&&String(place.name||'').trim())&&Number.isFinite(Number(place.latitude))&&Number.isFinite(Number(place.longitude));}
function savedFavorites(){try{const items=JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]');return Array.isArray(items)?items.filter(validPlace).slice(0,6):[];}catch{return [];}}
function favoriteKey(place){return `${String(place.name).toLocaleLowerCase('ca-ES')}|${Number(place.latitude).toFixed(3)}|${Number(place.longitude).toFixed(3)}`;}
function renderFavorites(){const items=savedFavorites();if(!favoritesHost||!favoritesList)return;favoritesHost.hidden=!items.length;favoritesList.replaceChildren(...items.map((place,index)=>{const button=document.createElement('button');button.type='button';button.dataset.favoriteIndex=String(index);button.textContent=placeLabel(place);return button;}));}
function toggleFavorite(place){if(!validPlace(place))return false;const key=favoriteKey(place);const items=savedFavorites();const index=items.findIndex(item=>favoriteKey(item)===key);if(index>=0)items.splice(index,1);else items.unshift({name:String(place.name).trim(),admin1:String(place.admin1||''),admin2:String(place.admin2||''),country:String(place.country||''),latitude:Number(place.latitude),longitude:Number(place.longitude)});try{localStorage.setItem(FAVORITES_KEY,JSON.stringify(items.slice(0,6)));}catch{}renderFavorites();return index<0;}

function renderSuggestions(items){
  candidates=items.slice(0,8);
  suggestions.hidden=!candidates.length;
  suggestions.innerHTML=candidates.map((item,index)=>`<button type="button" role="option" data-place-index="${index}"><b>${escapeHtml(item.name)}</b><small>${escapeHtml([item.admin2||item.admin1,item.country].filter(Boolean).join(' · '))}</small></button>`).join('');
}

async function suggest(){
  const query=input.value.trim();
  if(query.length<2){renderSuggestions([]);status.textContent='Escriu com a mínim dues lletres.';return;}
  status.textContent='Buscant municipis…';
  try{
    const items=await searchMunicipalities(query,getLanguage());
    renderSuggestions(items);
    status.textContent=items.length?'Selecciona el municipi correcte.':'No hem trobat cap coincidència.';
  }catch(error){renderSuggestions([]);status.textContent='No s’ha pogut completar la cerca. Torna-ho a provar.';}
}

function renderForecast(location,weather,selectedLocation=location){
  const current=weather.current||{};const daily=weather.daily||{};
  const isFavorite=savedFavorites().some(place=>favoriteKey(place)===favoriteKey(selectedLocation));
  const days=(daily.time||[]).slice(0,7).map((day,index)=>{const label=weatherLabel(daily.weather_code?.[index]);return `<article><time datetime="${escapeHtml(day)}">${escapeHtml(date(day))}</time>${weatherIcon(weatherKind(daily.weather_code?.[index]),label)}<strong>${escapeHtml(label)}</strong><span><b>${number(daily.temperature_2m_max?.[index])}°</b><small>${number(daily.temperature_2m_min?.[index])}°</small></span><em>${number(daily.precipitation_probability_max?.[index])}% pluja</em></article>`;}).join('');
  const currentLabel=weatherLabel(current.weather_code);
  return `<section class="municipality-summary panel"><header><div><p class="eyebrow">Previsió del model · coordenades del municipi</p><h2>${escapeHtml(location.name)}</h2><p>${escapeHtml([location.admin2||location.admin1,location.country].filter(Boolean).join(' · '))}</p></div><div class="municipality-summary__actions"><button type="button" class="municipality-favorite-toggle" data-favorite-toggle aria-pressed="${isFavorite}">${isFavorite?'★ Desat':'☆ Desar municipi'}</button><span class="tag">No és una estació</span></div></header><div class="municipality-now"><div><small>Temperatura estimada ara</small><div class="municipality-now-reading">${weatherIcon(weatherKind(current.weather_code),currentLabel)}<strong>${number(current.temperature_2m,1)} °C</strong></div><span>${escapeHtml(currentLabel)}</span></div><dl><div><dt>Sensació</dt><dd>${number(current.apparent_temperature,1)} °C</dd></div><div><dt>Humitat</dt><dd>${number(current.relative_humidity_2m)}%</dd></div><div><dt>Vent</dt><dd>${number(current.wind_speed_10m,1)} km/h</dd></div><div><dt>Pluja</dt><dd>${number(current.precipitation,1)} mm</dd></div></dl></div><div class="municipality-days">${days}</div><p class="municipality-source">Font: Open-Meteo. Valors calculats pel model per a les coordenades seleccionades; no són mesures d’una estació.</p></section>`;
}

function updateMunicipalitySeo(location){
  const place=String(location?.name||'').trim();
  if(!place)return;
  const title=`El temps a ${place} · previsió i observacions | Meteo Fontanillas`;
  const description=`Previsió del temps a ${place}: temperatures, pluja, vent i observacions d’estacions properes, amb fonts separades.`;
  document.title=title;
  document.querySelector('meta[name="description"]')?.setAttribute('content',description);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content',title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content',description);
  const canonical=new URL('./municipis.html',window.location.href);
  canonical.searchParams.set('municipi',place);
  canonical.searchParams.set('lat',String(location.latitude));
  canonical.searchParams.set('lon',String(location.longitude));
  canonical.searchParams.set('lang',getLanguage());
  document.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical.href);
  let data=document.getElementById('municipality-jsonld');
  if(!data){data=document.createElement('script');data.type='application/ld+json';data.id='municipality-jsonld';document.head.append(data);}
  data.textContent=JSON.stringify({ '@context':'https://schema.org','@type':'Place',name:place,geo:{'@type':'GeoCoordinates',latitude:Number(location.latitude),longitude:Number(location.longitude)},description });
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
  const metDays=(payload?.days||[]).slice(0,5).map(day=>{const label=metLabel(day.symbolCode);return `<li><time datetime="${escapeHtml(day.date)}">${escapeHtml(date(day.date))}</time>${weatherIcon(metKind(day.symbolCode),label)}<strong>${escapeHtml(label)}</strong><span>${number(day.max)}° / ${number(day.min)}°</span><small>${number(day.precipitation,1)} mm</small></li>`;}).join('');
  const metContent=met?`<div class="municipality-met-now"><span><small>Ara</small><strong>${number(met.temperature,1)} °C</strong></span><span><small>Vent</small><strong>${number(met.windSpeedKmh,1)} km/h</strong></span><span><small>Humitat</small><strong>${number(met.humidity)}%</strong></span></div><ul class="municipality-met-days">${metDays}</ul>`:'<p class="municipality-source-unavailable">Aquesta segona previsió no està disponible temporalment.</p>';
  return `<section class="municipality-comparisons panel"><div class="section-heading"><div><p class="eyebrow">Tres fonts contrastades</p><h2>Altres mirades sobre la previsió</h2><p>Canvia de pestanya sense barrejar els valors de cada font.</p></div><span class="tag">Fonts separades</span></div><div class="municipality-source-tabs" data-source-tabs><div class="municipality-source-tablist" role="tablist" aria-label="Fonts meteorològiques globals"><button type="button" role="tab" aria-selected="true" aria-controls="source-panel-yr" id="source-tab-yr" data-forecast-tab="yr">Yr · MET</button><button type="button" role="tab" aria-selected="false" aria-controls="source-panel-meteoblue" id="source-tab-meteoblue" data-forecast-tab="meteoblue" tabindex="-1">Meteoblue</button><button type="button" role="tab" aria-selected="false" aria-controls="source-panel-eltiempo" id="source-tab-eltiempo" data-forecast-tab="eltiempo" tabindex="-1">eltiempo.es</button></div><div class="municipality-source-panel" role="tabpanel" id="source-panel-yr" aria-labelledby="source-tab-yr" data-source-panel="yr"><article class="municipality-met-card"><header><div><b>MET Norway / Yr</b><small>Previsió integrada per a les mateixes coordenades</small></div><span>Model independent</span></header>${metContent}<p class="municipality-source">Font: MET Norway. Yr utilitza aquestes dades meteorològiques; poden diferir d’Open-Meteo.</p></article></div><div class="municipality-source-panel" role="tabpanel" id="source-panel-meteoblue" aria-labelledby="source-tab-meteoblue" data-source-panel="meteoblue" hidden><article class="municipality-external-card"><p class="eyebrow">Consulta externa</p><h3>Meteoblue · ${escapeHtml(location.name)}</h3><p>Obre la previsió pròpia de Meteoblue per a aquesta localitat. No en copiem ni barregem les dades.</p><a href="${meteoblue}" target="_blank" rel="noopener noreferrer">Obrir Meteoblue ↗</a></article></div><div class="municipality-source-panel" role="tabpanel" id="source-panel-eltiempo" aria-labelledby="source-tab-eltiempo" data-source-panel="eltiempo" hidden><article class="municipality-external-card"><p class="eyebrow">Consulta externa</p><h3>eltiempo.es</h3><p>Font complementària especialment útil per a localitats d’Espanya. Busca-hi ${escapeHtml(location.name)}.</p><a href="https://www.eltiempo.es/" target="_blank" rel="noopener noreferrer">Obrir eltiempo.es ↗</a></article></div></div></section>`;
}

function safeHttpsUrl(value,fallback='https://www.windy.com/webcams'){
  try{const url=new URL(String(value||''));return url.protocol==='https:'?url.href:fallback;}catch{return fallback;}
}

function renderWebcams(payload,location){
  const providerUrl=safeHttpsUrl(payload?.provider?.url);
  if(!payload?.configured)return `<section class="municipality-webcams panel"><div class="section-heading"><div><p class="eyebrow">Mirada visual del lloc</p><h2>Webcams properes a ${escapeHtml(location.name)}</h2><p>La cerca mundial de webcams s’activarà quan el proveïdor quedi configurat al servei.</p></div></div><a class="municipality-webcams__provider" href="${providerUrl}" target="_blank" rel="noopener noreferrer">Cercar a Windy Webcams ↗</a></section>`;
  const webcams=Array.isArray(payload?.webcams)?payload.webcams:[];
  if(payload?.unavailable)return `<section class="municipality-webcams panel"><div class="section-heading"><div><p class="eyebrow">Mirada visual del lloc</p><h2>Webcams temporalment no disponibles</h2><p>No hem pogut completar la cerca ara mateix. La previsió i les observacions reals continuen disponibles.</p></div></div><a class="municipality-webcams__provider" href="${providerUrl}" target="_blank" rel="noopener noreferrer">Cercar a Windy Webcams ↗</a></section>`;
  if(!webcams.length)return `<section class="municipality-webcams panel"><div class="section-heading"><div><p class="eyebrow">Mirada visual del lloc</p><h2>Cap webcam propera disponible</h2><p>No hem trobat cap càmera dins del radi de ${number(payload?.radiusKm||50)} km. La disponibilitat depèn de la cobertura de cada territori.</p></div></div><a class="municipality-webcams__provider" href="${providerUrl}" target="_blank" rel="noopener noreferrer">Ampliar la cerca a Windy Webcams ↗</a></section>`;
  const cards=webcams.map(webcam=>{const title=escapeHtml(webcam.title||'Webcam propera');const image=safeHttpsUrl(webcam.preview,'');const detail=safeHttpsUrl(webcam.url,providerUrl);return `<article class="municipality-webcam-card">${image?`<img src="${image}" alt="Vista recent de ${title}" loading="lazy" decoding="async">`:'<div class="municipality-webcam-card__empty" aria-hidden="true">◉</div>'}<div><h3>${title}</h3><p>${escapeHtml([webcam.location,Number.isFinite(Number(webcam.distanceKm))?`${number(webcam.distanceKm,1)} km`:null].filter(Boolean).join(' · '))}</p><a href="${detail}" target="_blank" rel="noopener noreferrer">Obrir webcam ↗</a></div></article>`;}).join('');
  return `<section class="municipality-webcams panel"><div class="section-heading"><div><p class="eyebrow">Mirada visual del lloc</p><h2>Webcams properes a ${escapeHtml(location.name)}</h2><p>Imatges recents del proveïdor. No s’inicia cap vídeo automàticament.</p></div><span class="tag">Radi: ${number(payload?.radiusKm||50)} km</span></div><div class="municipality-webcam-grid">${cards}</div><p class="municipality-source">Webcams proporcionades per Windy Webcams. Les imatges són temporals i es consulten de nou en cada cerca.</p></section>`;
}

async function selectPlace(location,{updateUrl=true}={}){
  updateMunicipalitySeo(location);
  input.value=location.name;suggestions.hidden=true;result.hidden=false;result.innerHTML='<div class="panel municipality-loading"><strong>Preparant la consulta…</strong><span>Separem les previsions de les observacions reals.</span></div>';
  status.textContent=`Consultant ${placeLabel(location)}…`;
  if(updateUrl){const url=new URL(window.location.href);url.search='';url.searchParams.set('municipi',location.name);url.searchParams.set('lat',location.latitude);url.searchParams.set('lon',location.longitude);url.searchParams.set('lang',getLanguage());history.replaceState({},'',url);}
  try{
    const [forecast,stations,met,webcams]=await Promise.allSettled([fetchLocalityForecast(location),fetchNearbyStations('now',location),fetchMetNorwayForecast(location),fetchNearbyWebcams(location)]);
    if(forecast.status==='rejected')throw forecast.reason;
    const webcamPayload=webcams.status==='fulfilled'?webcams.value:{configured:true,unavailable:true,provider:{url:'https://www.windy.com/webcams'}};
    result.innerHTML=renderForecast(forecast.value.location,forecast.value.weather,location)+renderComparisons(location,met.status==='fulfilled'?met.value:null)+renderWebcams(webcamPayload,location)+(stations.status==='fulfilled'?renderStations(stations.value,location):renderStations({stations:[]},location));
    status.textContent=`Resultats actualitzats per a ${placeLabel(location)}.`;
  }catch(error){result.innerHTML='<div class="panel municipality-loading is-error"><strong>No hem pogut carregar aquest lloc.</strong><span>Comprova la connexió o prova una altra localitat.</span></div>';status.textContent='Consulta no disponible temporalment.';}
}

input?.addEventListener('input',()=>{clearTimeout(timer);renderSuggestions([]);timer=setTimeout(suggest,300);});
input?.addEventListener('keydown',event=>{if(event.key==='Escape')renderSuggestions([]);});
form?.addEventListener('submit',async event=>{event.preventDefault();if(candidates[0])selectPlace(candidates[0]);else await suggest();});
suggestions?.addEventListener('click',event=>{const button=event.target.closest('[data-place-index]');if(button)selectPlace(candidates[Number(button.dataset.placeIndex)]);});
result?.addEventListener('click',event=>{const favorite=event.target.closest('[data-favorite-toggle]');if(favorite){const url=new URL(window.location.href);const added=toggleFavorite({name:url.searchParams.get('municipi')||input.value,latitude:Number(url.searchParams.get('lat')),longitude:Number(url.searchParams.get('lon'))});favorite.setAttribute('aria-pressed',String(added));favorite.textContent=added?'★ Desat':'☆ Desar municipi';return;}const tab=event.target.closest('[data-forecast-tab]');if(!tab)return;const tabs=tab.closest('[data-source-tabs]');tabs.querySelectorAll('[data-forecast-tab]').forEach(button=>{const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});tabs.querySelectorAll('[data-source-panel]').forEach(panel=>{panel.hidden=panel.dataset.sourcePanel!==tab.dataset.forecastTab;});});
result?.addEventListener('keydown',event=>{const tab=event.target.closest('[data-forecast-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;const buttons=[...tab.closest('[role="tablist"]').querySelectorAll('[data-forecast-tab]')];let index=buttons.indexOf(tab);if(event.key==='Home')index=0;else if(event.key==='End')index=buttons.length-1;else index=(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;event.preventDefault();buttons[index].focus();buttons[index].click();});
document.addEventListener('click',event=>{if(!event.target.closest('.municipality-search'))suggestions.hidden=true;});
document.addEventListener('observatori:language-change',()=>{
  const params=new URLSearchParams(window.location.search);
  if(params.get('municipi')){params.set('lang',getLanguage());history.replaceState({},'',`${window.location.pathname}?${params.toString()}`);updateMunicipalitySeo({name:params.get('municipi'),latitude:Number(params.get('lat')),longitude:Number(params.get('lon'))});}
});
favoritesList?.addEventListener('click',event=>{const place=savedFavorites()[Number(event.target.closest('[data-favorite-index]')?.dataset.favoriteIndex)];if(place)selectPlace(place);});
renderFavorites();

const params=new URLSearchParams(location.search);const rawLat=params.get('lat');const rawLon=params.get('lon');const lat=Number(rawLat);const lon=Number(rawLon);
if(params.get('municipi')&&rawLat!==null&&rawLon!==null&&Number.isFinite(lat)&&Number.isFinite(lon))selectPlace({name:params.get('municipi'),latitude:lat,longitude:lon},{updateUrl:false});
