const state={current:null,forecast:null,alerts:null,models:null};

const numeric=value=>{const number=Number(value);return Number.isFinite(number)?number:null;};
const format=(value,digits=0)=>numeric(value)===null?'—':numeric(value).toLocaleString('ca-ES',{maximumFractionDigits:digits,minimumFractionDigits:digits});

export function homeModelConfidence(payload){
  const models=['ecmwf','gfs','icon','arome'].map(key=>payload?.[key]).filter(model=>model?.daily?.time?.[0]);
  if(models.length<3)return {level:'pending',label:'Pendent',detail:'Esperant almenys tres models'};
  const maxima=models.map(model=>numeric(model.daily.temperature_2m_max?.[0])).filter(value=>value!==null);
  const rain=models.map(model=>numeric(model.daily.precipitation_sum?.[0])).filter(value=>value!==null);
  if(maxima.length<3||rain.length<3)return {level:'pending',label:'Pendent',detail:'Dades encara incompletes'};
  const spread=Math.max(...maxima)-Math.min(...maxima);
  const wet=rain.map(value=>value>=.5);
  const sameOccurrence=wet.every(Boolean)||wet.every(value=>!value);
  const level=spread<=2.5&&sameOccurrence?'good':spread<=4.5?'watch':'warning';
  const labels={good:'Alta',watch:'Moderada',warning:'Baixa'};
  return {level,label:labels[level],detail:`${models.length} models · diferència màxima ${format(spread,1)} °C`};
}

function observationCard(current){
  if(!current)return {key:'observation',state:'pending',kicker:'Observació local',title:'Carregant l’estació',copy:'Recuperant l’última lectura vàlida.',source:'Estació Fontanillas',href:'/estacio'};
  const degraded=Boolean(current.degraded);
  const age=numeric(current.ageMinutes);
  return {key:'observation',state:degraded?'watch':'good',kicker:'Observació local',title:`${format(current.temperature,1)} °C ara mateix`,copy:degraded?'Mostrem l’última lectura fiable disponible.':`Humitat ${format(current.humidity)}% · ratxa ${format(current.windGust)} km/h`,source:age!==null?`Estació · fa ${format(age)} min`:'Estació Fontanillas · en directe',href:'/estacio'};
}

function localForecastHour(now){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now));
  const part=type=>parts.find(item=>item.type===type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}`;
}

function futureHours(forecast,now,hours=Infinity){
  const hourly=forecast?.hourly;
  if(!Array.isArray(hourly?.time))return [];
  const current=localForecastHour(now);
  const today=current.slice(0,10);
  const end=hours===Infinity?null:new Date(`${current}:00Z`).getTime()+hours*3600000;
  return hourly.time.flatMap((time,index)=>{
    const hour=String(time).slice(0,13);
    const stamp=new Date(`${hour}:00Z`).getTime();
    return hour>=current&&hour.startsWith(today)&&Number.isFinite(stamp)&&(!end||stamp<=end)?[index]:[];
  });
}

function forecastCard(forecast,now){
  const daily=forecast?.daily;
  if(!daily?.time?.[0]||daily.time[0]!==localForecastHour(now).slice(0,10))return {key:'forecast',state:'pending',kicker:'Avui',title:'Preparant la previsió',copy:'La resta de la portada continua disponible.',source:'Open-Meteo · previsió de model',href:'/prediccio'};
  const indices=futureHours(forecast,now);
  const values=(key)=>indices.map(index=>numeric(forecast.hourly[key]?.[index])).filter(value=>value!==null);
  const rainValues=values('precipitation_probability');
  const gustValues=values('wind_gusts_10m');
  const rain=rainValues.length?Math.max(...rainValues):null;
  const gust=gustValues.length?Math.max(...gustValues):null;
  const state=rain===null&&gust===null?'pending':(rain??0)>=70||(gust??0)>=60?'warning':(rain??0)>=40||(gust??0)>=40?'watch':'good';
  const title=(rain??0)>=60?`${format(rain)}% de probabilitat de pluja`:(gust??0)>=40?`Ratxes de fins a ${format(gust)} km/h`:rain!==null?'Sense pluja destacada la resta del dia':'Consulta la previsió actualitzada';
  const copy=rain!==null?`Resta del dia · ${rain>=30?`pluja fins al ${format(rain)}%`:'sense pluja destacada'}${gust!==null?` · ratxa ${format(gust)} km/h`:''}`:'Sense hores futures disponibles per confirmar la pluja.';
  return {key:'forecast',state,kicker:'Avui',title,copy,source:'Open-Meteo · predicció, no avís',href:'/prediccio'};
}

function alertCard(alerts){
  if(!alerts)return {key:'alerts',state:'pending',kicker:'Vigilància oficial',title:'Comprovant avisos',copy:'Consultant fenomen, territori i vigència.',source:'Meteocat · AEMET',href:'/avisos'};
  if(alerts.ok===false)return {key:'alerts',state:'watch',kicker:'Vigilància oficial',title:'Consulta temporalment limitada',copy:'Comprova la pàgina oficial abans de prendre decisions.',source:'Fonts oficials · sense confirmar',href:'/avisos'};
  const active=Number(alerts.active)||0;
  const first=alerts.windows?.now?.[0]||alerts.alerts?.[0];
  return active?{key:'alerts',state:'warning',kicker:'Vigilància oficial',title:`${active} avís${active===1?'':'os'} actiu${active===1?'':'s'}`,copy:first?.event||first?.title||first?.headline||'Consulta el fenomen i la vigència.',source:'Meteocat · AEMET',href:'/avisos'}:{key:'alerts',state:'good',kicker:'Vigilància oficial',title:'Sense avisos actius',copy:'No consta cap avís oficial vigent per a la zona.',source:'Meteocat · AEMET',href:'/avisos'};
}

export function buildHomeNowModel(input={},now=Date.now()){
  const confidence=homeModelConfidence(input.models);
  return [observationCard(input.current),forecastCard(input.forecast,now),alertCard(input.alerts),{key:'models',state:confidence.level,kicker:'Confiança entre models',title:confidence.label,copy:confidence.detail,source:'ECMWF · GFS · ICON · AROME',href:'/prediccio#models'}];
}

function immediateForecast(forecast,now){
  const hourly=forecast?.hourly;if(!Array.isArray(hourly?.time))return null;
  const indices=futureHours(forecast,now,3);
  if(!indices.length)return null;
  const rain=indices.map(index=>numeric(hourly.precipitation_probability?.[index])).filter(value=>value!==null);
  const gusts=indices.map(index=>numeric(hourly.wind_gusts_10m?.[index])).filter(value=>value!==null);
  const temperatures=indices.map(index=>numeric(hourly.temperature_2m?.[index])).filter(value=>value!==null);
  const parts=[];
  if(rain.length&&Math.max(...rain)>=30)parts.push(`les pròximes 3 h, probabilitat de pluja fins al ${format(Math.max(...rain))}%`);
  if(gusts.length&&Math.max(...gusts)>=35)parts.push(`ratxes de fins a ${format(Math.max(...gusts))} km/h`);
  if(!parts.length&&temperatures.length)parts.push(`les pròximes 3 h, temperatura entre ${format(Math.min(...temperatures),1)} i ${format(Math.max(...temperatures),1)} °C`);
  return parts.join(' i ')||null;
}

export function buildHomeNowSummary(input={},now=Date.now()){
  const phrases=[];const sources=[];const current=input.current;
  if(current&&numeric(current.temperature)!==null){
    phrases.push(`Ara, ${format(current.temperature,1)} °C${numeric(current.humidity)!==null?` i ${format(current.humidity)}% d’humitat`:''}`);
    sources.push(numeric(current.ageMinutes)!==null?`Estació Fontanillas · fa ${format(current.ageMinutes)} min`:'Estació Fontanillas');
  }
  const immediate=immediateForecast(input.forecast,now);
  if(immediate){phrases.push(immediate);sources.push('Open-Meteo · predicció');}
  if(input.alerts?.ok===true){
    const active=Number(input.alerts.active)||0;phrases.push(active?`${active} avís${active===1?'':'os'} oficial${active===1?'':'s'} actiu${active===1?'':'s'}; consulta’n la vigència`:'no consta cap avís oficial actiu per a la zona');sources.push('Meteocat · AEMET');
  }else if(input.alerts?.ok===false){phrases.push('la comprovació d’avisos no està disponible ara mateix');sources.push('Avisos oficials · estat no confirmat');}
  return {text:phrases.length?`${phrases.join('. ')}.`:'Encara no hi ha prou dades per resumir la situació amb garanties.',meta:[...new Set(sources)].join(' · ')||'S’omet qualsevol conclusió sense dades suficients'};
}

function render(){
  const host=document.getElementById('home-now-grid');
  if(!host)return;
  const summary=buildHomeNowSummary(state);const summaryNode=document.getElementById('home-now-summary');const metaNode=document.getElementById('home-now-summary-meta');
  if(summaryNode)summaryNode.textContent=summary.text;if(metaNode)metaNode.textContent=summary.meta;
  host.innerHTML=buildHomeNowModel(state).map(card=>`<a class="home-now-card is-${card.state}" href="${card.href}"><span class="home-now-card__signal" aria-hidden="true"></span><small>${card.kicker}</small><strong>${card.title}</strong><p>${card.copy}</p><footer><span>${card.source}</span><b>Veure detall →</b></footer></a>`).join('');
}

export function updateHomeNow(partial={}){Object.assign(state,partial);render();}
export function initHomeNow(){
  render();
  document.addEventListener('observatori:alerts-updated',event=>updateHomeNow({alerts:event.detail}));
  document.addEventListener('observatori:language-changed',render);
}
