import { format, setText } from '../core/dom.js';

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
const hours = seconds => (Number(seconds)||0)/3600;
let modelPayload = null;
let modelDayIndex = 1;
let sourceHorizon = 'hourly';

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
    const daylight=hours(daily.daylight_duration?.[index]); const sunshine=hours(daily.sunshine_duration?.[index]); const sunShare=daylight?Math.min(100,sunshine/daylight*100):0;
    return `<article class="day-card panel ${index===0?'is-today':''}"><header><div><span>${index===0?'Avui':dayName(date)}</span><small>${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short'}).format(date)}</small></div><i aria-hidden="true">${symbol}</i></header><strong>${label}</strong><div class="day-card__temps"><b>${format(daily.temperature_2m_max?.[index],0)}°</b><span>${format(daily.temperature_2m_min?.[index],0)}°</span></div><div class="day-card__details"><span><b>${format(daily.precipitation_probability_max?.[index],0)}%</b> pluja</span><span><b>${format(daily.precipitation_sum?.[index],1)}</b> mm</span><span><b>${format(daily.wind_gusts_10m_max?.[index],0)}</b> km/h ratxa</span><span><b>${format(daylight,1)}</b> h de llum</span><span><b>${format(sunshine,1)}</b> h de sol previst</span></div><div class="day-card__sun-label"><span>${format(sunShare,0)}% del dia amb sol</span><small>${format(sunshine,1)} de ${format(daylight,1)} h</small></div><div class="day-card__sun" role="img" aria-label="${format(sunShare,0)}% de les hores de llum amb sol previst"><i style="width:${sunShare}%"></i></div></article>`;
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

function modelRow(name,data,index) {
  const daily=data?.daily||{}; const [symbol,label]=weather(daily.weather_code?.[index]);
  return `<div class="model-row"><strong>${name}<small>${symbol} ${label}</small></strong><span><small>Màxima</small><b>${format(daily.temperature_2m_max?.[index],1)} °C</b></span><span><small>Mínima</small><b>${format(daily.temperature_2m_min?.[index],1)} °C</b></span><span><small>Pluja</small><b>${format(daily.precipitation_sum?.[index],1)} mm</b></span><span><small>Ratxa màxima</small><b>${format(daily.wind_gusts_10m_max?.[index],0)} km/h</b></span></div>`;
}

function numeric(models,key,index){return models.map(model=>Number(model?.daily?.[key]?.[index])).filter(Number.isFinite);}
function range(values){return values.length?Math.max(...values)-Math.min(...values):null;}
function agreement(level,detail){
  const scores={high:3,moderate:2,low:1,unknown:0};
  const labels={high:'Alta',moderate:'Moderada',low:'Baixa',unknown:'Pendent'};
  return {level,label:labels[level],score:scores[level],detail};
}
function skyFamily(code){
  const value=Number(code);
  if([0,1].includes(value))return 'serè';
  if([2,3,45,48].includes(value))return 'núvols';
  if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(value))return 'pluja';
  if([71,73,75,77,85,86].includes(value))return 'neu';
  if([95,96,99].includes(value))return 'tempesta';
  return 'variable';
}

function modelAgreements(models,index){
  const maxima=numeric(models,'temperature_2m_max',index);
  const minima=numeric(models,'temperature_2m_min',index);
  const tempRange=Math.max(range(maxima)??99,range(minima)??99);
  const temperature=agreement(maxima.length<3||minima.length<3?'unknown':tempRange<=2?'high':tempRange<=4?'moderate':'low',tempRange<99?`rang màxim de ${format(tempRange,1)} °C`:'dades incompletes');

  const rain=numeric(models,'precipitation_sum',index);
  const rainChance=numeric(models,'precipitation_probability_max',index);
  const rainRange=range(rain); const chanceRange=range(rainChance);
  const wet=rain.map(value=>value>=0.5); const occurrenceAgreement=wet.length===3&&(wet.every(Boolean)||wet.every(value=>!value));
  const rainLevel=rain.length<3?'unknown':occurrenceAgreement&&(rainRange??99)<=2.5&&(chanceRange??0)<=25?'high':(rainRange??99)<=6&&(chanceRange??0)<=50?'moderate':'low';
  const precipitation=agreement(rainLevel,rainRange===null?'dades incompletes':`${format(Math.min(...rain),1)}–${format(Math.max(...rain),1)} mm`);

  const gusts=numeric(models,'wind_gusts_10m_max',index); const gustRange=range(gusts);
  const wind=agreement(gusts.length<3?'unknown':gustRange<=10?'high':gustRange<=20?'moderate':'low',gustRange===null?'dades incompletes':`${format(Math.min(...gusts),0)}–${format(Math.max(...gusts),0)} km/h`);

  const families=models.map(model=>skyFamily(model?.daily?.weather_code?.[index]));
  const counts=families.reduce((result,family)=>({...result,[family]:(result[family]||0)+1}),{});
  const largest=Math.max(...Object.values(counts));
  const sky=agreement(families.length<3?'unknown':largest===3?'high':largest===2?'moderate':'low',families.join(' · '));
  return {temperature,precipitation,wind,sky};
}

function renderAgreementCards(items){
  const container=document.getElementById('model-agreement'); if(!container)return;
  const definitions=[['Temperatura',items.temperature],['Pluja',items.precipitation],['Vent',items.wind],['Estat del cel',items.sky]];
  container.innerHTML=definitions.map(([name,item])=>`<article class="is-${item.level}"><span>${name}</span><strong>Coincidència ${item.label.toLowerCase()}</strong><small>${item.detail}</small></article>`).join('');
}

function renderModelDay() {
  if(!modelPayload)return;
  const {ecmwf,gfs,icon}=modelPayload;
  const table=document.getElementById('model-table'); if(!table) return;
  table.innerHTML=`<div class="model-row model-row--head"><strong>Model</strong><span>Temperatura</span><span>Temperatura</span><span>Precipitació</span><span>Vent</span></div>${modelRow('ECMWF',ecmwf,modelDayIndex)}${modelRow('GFS',gfs,modelDayIndex)}${modelRow('ICON',icon,modelDayIndex)}`;
  const selectedDate=new Date(ecmwf?.daily?.time?.[modelDayIndex]||Date.now());
  setText('model-day-label',modelDayIndex===0?`Avui · ${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short'}).format(selectedDate)}`:modelDayIndex===1?`Demà · ${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short'}).format(selectedDate)}`:`${dayName(selectedDate)} · ${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short'}).format(selectedDate)}`);
  const items=modelAgreements([ecmwf,gfs,icon],modelDayIndex);
  renderAgreementCards(items);
  const available=Object.values(items).filter(item=>item.score>0);
  const mean=available.length?available.reduce((total,item)=>total+item.score,0)/available.length:0;
  const overall=mean>=2.5?'alta':mean>=1.75?'moderada':'baixa';
  setText('model-status',`Confiança general ${overall}`);
  const weakest=available.sort((a,b)=>a.score-b.score)[0];
  const weakestName=Object.entries(items).find(([,item])=>item===weakest)?.[0];
  const names={temperature:'la temperatura',precipitation:'la pluja',wind:'el vent',sky:'l’estat del cel'};
  setText('model-reading',overall==='alta'?'Els tres models dibuixen un escenari consistent en totes les variables principals.':`La confiança conjunta és ${overall}. El punt amb més diferències és ${names[weakestName] || 'una de les variables'} (${weakest?.detail || 'dades incompletes'}).`);
  const previous=document.getElementById('model-day-prev'); const next=document.getElementById('model-day-next');
  if(previous)previous.disabled=modelDayIndex<=0; if(next)next.disabled=modelDayIndex>=6;
}

export function renderModelComparison(payload) {
  modelPayload=payload;
  renderModelDay();
}

function updateSourceHorizon() {
  const meteocat=document.getElementById('source-meteocat-frame');
  const shell=document.getElementById('source-meteocat-shell');
  if(meteocat) {
    meteocat.src=sourceHorizon==='hourly'?'https://static-m.meteo.cat/ginys/municipal72h?location=082021&language=ca&color=0f2a22&tempFormat=%20%C2%BAC&windSpeedFormat=km/h&mainChart=estCel&secondaryChart=true&target=_blank':'https://static-m.meteo.cat/ginys/municipal8d?location=082021&language=ca&color=0f2a22&tempFormat=%20%C2%BAC&target=_blank';
  }
  if(shell) {
    shell.classList.toggle('is-hourly',sourceHorizon==='hourly');
    shell.classList.toggle('is-daily',sourceHorizon==='daily');
  }
  setText('source-meteocat-title',sourceHorizon==='hourly'?'Meteocat · pròximes 72 hores':'Meteocat · previsió de 8 dies');
  setText('source-meteocat-copy',sourceHorizon==='hourly'?'Cel, temperatura, precipitació, humitat, xafogor i vent per hores':'Símbol, màxima, mínima i probabilitat de precipitació per dia');
}

function loadSourcePanel(panel) {
  const compactMeteoblue=panel?.dataset.sourcePanel==='meteoblue'&&window.matchMedia('(max-width: 510px)').matches;
  panel?.querySelectorAll('iframe[data-src]').forEach(frame=>{
    if (!compactMeteoblue&&!frame.getAttribute('src')) frame.src=frame.dataset.src;
  });
  if (panel?.dataset.sourcePanel === 'eltiempo' && !document.getElementById('eltiempo-widget-script')) {
    const definition=document.getElementById('eltiempo-widget-loader');
    const placeholder=document.querySelector('#c_24805d485986fb044ec8a4db971cf9bb .widget-placeholder');
    placeholder?.remove();
    const script=document.createElement('script');
    script.id='eltiempo-widget-script'; script.src=definition?.dataset.src || ''; script.async=true;
    if (script.src) document.body.appendChild(script);
  }
}

function activateSource(button, focus=false) {
  document.querySelectorAll('[data-source-tab]').forEach(item=>{
    const selected=item===button;
    item.classList.toggle('is-active',selected);
    item.setAttribute('aria-selected',String(selected));
    item.tabIndex=selected?0:-1;
  });
  document.querySelectorAll('[data-source-panel]').forEach(panel=>{
    const selected=panel.dataset.sourcePanel===button.dataset.sourceTab;
    panel.classList.toggle('is-active',selected);
    panel.hidden=!selected;
    if(selected)loadSourcePanel(panel);
  });
  if(focus)button.focus();
}

export function initForecastControls() {
  const strip=document.getElementById('forecast-strip');
  document.getElementById('forecast-prev')?.addEventListener('click',()=>strip?.scrollBy({left:-520,behavior:'smooth'}));
  document.getElementById('forecast-next')?.addEventListener('click',()=>strip?.scrollBy({left:520,behavior:'smooth'}));
  document.getElementById('model-day-prev')?.addEventListener('click',()=>{modelDayIndex=Math.max(0,modelDayIndex-1);renderModelDay();});
  document.getElementById('model-day-next')?.addEventListener('click',()=>{modelDayIndex=Math.min(6,modelDayIndex+1);renderModelDay();});
  const sourceTabs=[...document.querySelectorAll('[data-source-tab]')];
  const sourceTabsList=document.querySelector('.source-tabs');
  const sourceHint=document.getElementById('source-tabs-hint');
  const updateSourceHint=()=>{
    if(!sourceTabsList||!sourceHint)return;
    const overflow=sourceTabsList.scrollWidth-sourceTabsList.clientWidth>8;
    const atEnd=sourceTabsList.scrollLeft+sourceTabsList.clientWidth>=sourceTabsList.scrollWidth-10;
    sourceHint.hidden=!overflow||atEnd;
  };
  sourceTabsList?.addEventListener('scroll',updateSourceHint,{passive:true});
  window.addEventListener('resize',updateSourceHint,{passive:true});
  requestAnimationFrame(updateSourceHint);
  sourceTabs.forEach((button,index)=>{
    button.addEventListener('click',()=>activateSource(button));
    button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const targetIndex=event.key==='Home'?0:event.key==='End'?sourceTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+sourceTabs.length)%sourceTabs.length;
      activateSource(sourceTabs[targetIndex],true);
    });
  });
  document.querySelectorAll('[data-source-horizon]').forEach(button=>button.addEventListener('click',()=>{
    sourceHorizon=button.dataset.sourceHorizon;
    document.querySelectorAll('[data-source-horizon]').forEach(item=>item.classList.toggle('is-active',item===button));
    updateSourceHorizon();
  }));
}

export function renderForecastError() {
  setText('forecast-status','Predicció temporalment no disponible');
  const strip=document.getElementById('forecast-strip'); if(strip) strip.innerHTML='<div class="forecast-loading">La predicció no està disponible ara mateix. Les dades de l’estació continuen actives.</div>';
  const daily=document.getElementById('daily-forecast'); if(daily) daily.innerHTML='<div class="forecast-loading">No s’ha pogut carregar la previsió diària.</div>';
}

export function renderModelError() { setText('model-status','Models no disponibles'); setText('model-reading','La comparació ECMWF/GFS/ICON tornarà a intentar-se en la pròxima actualització.'); const agreement=document.getElementById('model-agreement'); if(agreement)agreement.innerHTML='<article class="is-unknown"><span>Comparació multivariable</span><strong>Temporalment no disponible</strong><small>Nou intent en la pròxima actualització</small></article>'; }
