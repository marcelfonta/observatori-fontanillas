import { format, setText } from '../js/utils.js';

const codes = {
  0:['☀','Cel serè'],1:['🌤','Poc ennuvolat'],2:['⛅','Intervals'],3:['☁','Cobert'],
  45:['≋','Boira'],48:['≋','Boira gebradora'],51:['☂','Plugim'],53:['☂','Plugim'],55:['☂','Plugim intens'],
  56:['☂','Plugim glaçat'],57:['☂','Plugim glaçat'],61:['🌧','Pluja feble'],63:['🌧','Pluja'],65:['🌧','Pluja intensa'],
  66:['🌧','Pluja glaçada'],67:['🌧','Pluja glaçada'],71:['❄','Neu feble'],73:['❄','Neu'],75:['❄','Nevada intensa'],
  77:['❄','Neu granulada'],80:['🌦','Ruixats'],81:['🌦','Ruixats'],82:['⛈','Ruixats forts'],85:['🌨','Ruixat de neu'],86:['🌨','Ruixat de neu'],
  95:['⛈','Tempesta'],96:['⛈','Tempesta i calamarsa'],99:['⛈','Tempesta forta']
};

const dayName = date => new Intl.DateTimeFormat('ca-ES',{weekday:'short'}).format(date).replace('.','');
const shortTime = value => new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const sum = values => values.reduce((total,value)=>total+(Number(value)||0),0);
const max = values => Math.max(...values.map(value=>Number(value)||0));
const maxIndex = values => values.reduce((best,value,index)=>Number(value)>Number(values[best])?index:best,0);

function weather(code) { return codes[code] || ['◌','Variable']; }

function timelineLabel(date, position) {
  if (position === 0) return 'Ara';
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(date); target.setHours(0,0,0,0);
  const dayDifference = Math.round((target - today) / 86400000);
  const prefix = dayDifference === 0 ? 'Avui' : dayDifference === 1 ? 'Demà' : dayName(date);
  return `${prefix} · ${shortTime(date)}`;
}

function forecastNarrative(daily) {
  const rainTotal=sum(daily.precipitation_sum||[]);
  const rainChance=max(daily.precipitation_probability_max||[]);
  const hottest=max(daily.temperature_2m_max||[]);
  const coldest=Math.min(...(daily.temperature_2m_min||[]).map(Number));
  if(rainTotal>=25) return ['Setmana marcada per la pluja',`Els models acumulen prop de ${format(rainTotal,1)} mm. Convé seguir l’evolució dels episodis més actius.`];
  if(rainChance>=65) return ['Ruixats possibles en l’horitzó',`La probabilitat màxima arriba al ${format(rainChance,0)}%, tot i que l’acumulació prevista és moderada.`];
  if(hottest>=33) return ['Calor com a protagonista',`Les màximes poden enfilar-se fins als ${format(hottest,0)} °C, amb nits que no baixaran dels ${format(coldest,0)} °C.`];
  return ['Escenari majoritàriament estable',`Pocs canvis bruscos a la vista, amb màximes al voltant dels ${format(hottest,0)} °C.`];
}

function renderOverview(daily) {
  if(!daily?.time?.length) return;
  const [headline,copy]=forecastNarrative(daily);
  setText('forecast-headline',headline); setText('forecast-headline-copy',copy);
  const rainTotal=sum(daily.precipitation_sum||[]); const rainIndex=maxIndex(daily.precipitation_probability_max||[0]);
  setText('forecast-rain-total',format(rainTotal,1)); setText('forecast-rain-signal',`${format(daily.precipitation_probability_max?.[rainIndex],0)}% màxim · ${dayName(new Date(daily.time[rainIndex]))}`);
  const gustIndex=maxIndex(daily.wind_gusts_10m_max||[0]); setText('forecast-gust-max',format(daily.wind_gusts_10m_max?.[gustIndex],0)); setText('forecast-gust-day',`Prevista ${dayName(new Date(daily.time[gustIndex]))}`);
  const daylight=(Number(daily.daylight_duration?.[0])||0)/3600; setText('forecast-daylight',format(daylight,1));
  setText('forecast-sun-times',`${shortTime(daily.sunrise?.[0])} → ${shortTime(daily.sunset?.[0])}`);
}

function renderDaily(daily) {
  const container=document.getElementById('daily-forecast'); if(!container||!daily?.time) return;
  container.innerHTML=daily.time.map((value,index)=>{
    const date=new Date(value); const [symbol,label]=weather(daily.weather_code?.[index]);
    return `<article class="day-card panel ${index===0?'is-today':''}"><header><div><span>${index===0?'Avui':dayName(date)}</span><small>${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short'}).format(date)}</small></div><i aria-hidden="true">${symbol}</i></header><strong>${label}</strong><div class="day-card__temps"><b>${format(daily.temperature_2m_max?.[index],0)}°</b><span>${format(daily.temperature_2m_min?.[index],0)}°</span></div><div class="day-card__details"><span><b>${format(daily.precipitation_probability_max?.[index],0)}%</b> pluja</span><span>${format(daily.precipitation_sum?.[index],1)} mm</span><span>Ratxa ${format(daily.wind_gusts_10m_max?.[index],0)}</span></div></article>`;
  }).join('');
}

export function renderForecast(data) {
  const strip=document.getElementById('forecast-strip'); if(!strip||!data?.hourly) return;
  const now=Date.now(); let start=data.hourly.time.findIndex(time=>new Date(time).getTime()>=now-1800000); if(start<0) start=0;
  const indices=Array.from({length:17},(_,index)=>start+(index*3)).filter(index=>data.hourly.time[index]);
  strip.innerHTML=indices.map((index,position)=>{
    const time=new Date(data.hourly.time[index]); const [symbol,label]=weather(data.hourly.weather_code[index]); const rain=Number(data.hourly.precipitation_probability[index])||0;
    return `<article class="forecast-item ${position===0?'is-now':''}"><div class="forecast-item__time"><span>${timelineLabel(time,position)}</span>${position===0?'<i></i>':''}</div><div class="forecast-item__condition"><span class="forecast-symbol" aria-hidden="true">${symbol}</span><b>${label}</b></div><div class="forecast-item__temp">${format(data.hourly.temperature_2m[index],0)}°</div><div class="forecast-item__meta"><span><b>${format(rain,0)}%</b> pluja</span><span>${format(data.hourly.wind_speed_10m[index],0)} km/h</span></div><div class="forecast-mini-rain"><span style="width:${Math.min(100,rain)}%"></span></div></article>`;
  }).join('');
  renderOverview(data.daily); renderDaily(data.daily);
  setText('forecast-status',`Actualitzat · ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`);
}

function modelRow(name,data) {
  const daily=data?.daily||{}; const rain=sum(daily.precipitation_sum||[]); const gust=max(daily.wind_gusts_10m_max||[]);
  return `<div class="model-row"><strong>${name}</strong><span><small>Màxima demà</small><b>${format(daily.temperature_2m_max?.[1],1)} °C</b></span><span><small>Mínima demà</small><b>${format(daily.temperature_2m_min?.[1],1)} °C</b></span><span><small>Pluja 7 dies</small><b>${format(rain,1)} mm</b></span><span><small>Ratxa màxima</small><b>${format(gust,0)} km/h</b></span></div>`;
}

export function renderModelComparison({ecmwf,gfs,icon}) {
  const table=document.getElementById('model-table'); if(!table) return;
  table.innerHTML=`<div class="model-row model-row--head"><strong>Model</strong><span>Temperatura</span><span>Temperatura</span><span>Precipitació</span><span>Vent</span></div>${modelRow('ECMWF',ecmwf)}${modelRow('GFS',gfs)}${modelRow('ICON',icon)}`;
  const series=[ecmwf,gfs,icon].map(model=>model?.daily?.temperature_2m_max||[]);
  const differences=(series[0]||[]).map((_,index)=>{const values=series.map(items=>Number(items[index])).filter(Number.isFinite);return values.length===3?Math.max(...values)-Math.min(...values):null;}).filter(Number.isFinite);
  const mean=differences.length?sum(differences)/differences.length:99;
  const agreement=mean<1?'Alta':mean<2.5?'Moderada':'Baixa'; setText('model-status',`Coincidència ${agreement.toLowerCase()}`);
  setText('model-reading',mean<1?'ECMWF, GFS i ICON dibuixen un escenari molt semblant: la confiança tèrmica és alta.':mean<2.5?'Hi ha petites diferències entre els tres models. L’escenari general és útil, però cal seguir-ne l’evolució.':'Els tres models divergeixen de manera notable. La predicció encara té incertesa i convé revisar les properes actualitzacions.');
}

export function initForecastControls() {
  const strip=document.getElementById('forecast-strip');
  document.getElementById('forecast-prev')?.addEventListener('click',()=>strip?.scrollBy({left:-520,behavior:'smooth'}));
  document.getElementById('forecast-next')?.addEventListener('click',()=>strip?.scrollBy({left:520,behavior:'smooth'}));
}

export function renderForecastError() {
  setText('forecast-status','Predicció temporalment no disponible');
  const strip=document.getElementById('forecast-strip'); if(strip) strip.innerHTML='<div class="forecast-loading">La predicció no està disponible ara mateix. Les dades de l’estació continuen actives.</div>';
  const daily=document.getElementById('daily-forecast'); if(daily) daily.innerHTML='<div class="forecast-loading">No s’ha pogut carregar la previsió diària.</div>';
}

export function renderModelError() { setText('model-status','Models no disponibles'); setText('model-reading','La comparació ECMWF/GFS/ICON tornarà a intentar-se en la pròxima actualització.'); }
