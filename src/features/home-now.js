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

function forecastCard(forecast){
  const daily=forecast?.daily;
  if(!daily?.time?.[0])return {key:'forecast',state:'pending',kicker:'Avui',title:'Preparant la previsió',copy:'La resta de la portada continua disponible.',source:'Open-Meteo · previsió de model',href:'/prediccio'};
  const rain=numeric(daily.precipitation_probability_max?.[0]);
  const gust=numeric(daily.wind_gusts_10m_max?.[0]);
  const state=(rain??0)>=70||(gust??0)>=60?'warning':(rain??0)>=40||(gust??0)>=40?'watch':'good';
  const title=(rain??0)>=60?`${format(rain)}% de probabilitat de pluja`:(gust??0)>=40?`Ratxes de fins a ${format(gust)} km/h`:`Entre ${format(daily.temperature_2m_min?.[0])} i ${format(daily.temperature_2m_max?.[0])} °C`;
  return {key:'forecast',state,kicker:'Avui',title,copy:`Pluja ${format(daily.precipitation_sum?.[0],1)} mm · ratxa ${format(gust)} km/h`,source:'Open-Meteo · predicció, no avís',href:'/prediccio'};
}

function alertCard(alerts){
  if(!alerts)return {key:'alerts',state:'pending',kicker:'Vigilància oficial',title:'Comprovant avisos',copy:'Consultant fenomen, territori i vigència.',source:'Meteocat · AEMET',href:'/avisos'};
  if(alerts.ok===false)return {key:'alerts',state:'watch',kicker:'Vigilància oficial',title:'Consulta temporalment limitada',copy:'Comprova la pàgina oficial abans de prendre decisions.',source:'Fonts oficials · sense confirmar',href:'/avisos'};
  const active=Number(alerts.active)||0;
  const first=alerts.windows?.now?.[0]||alerts.alerts?.[0];
  return active?{key:'alerts',state:'warning',kicker:'Vigilància oficial',title:`${active} avís${active===1?'':'os'} actiu${active===1?'':'s'}`,copy:first?.event||first?.title||first?.headline||'Consulta el fenomen i la vigència.',source:'Meteocat · AEMET',href:'/avisos'}:{key:'alerts',state:'good',kicker:'Vigilància oficial',title:'Sense avisos actius',copy:'No consta cap avís oficial vigent per a la zona.',source:'Meteocat · AEMET',href:'/avisos'};
}

export function buildHomeNowModel(input={}){
  const confidence=homeModelConfidence(input.models);
  return [observationCard(input.current),forecastCard(input.forecast),alertCard(input.alerts),{key:'models',state:confidence.level,kicker:'Confiança entre models',title:confidence.label,copy:confidence.detail,source:'ECMWF · GFS · ICON · AROME',href:'/prediccio#models'}];
}

function render(){
  const host=document.getElementById('home-now-grid');
  if(!host)return;
  host.innerHTML=buildHomeNowModel(state).map(card=>`<a class="home-now-card is-${card.state}" href="${card.href}"><span class="home-now-card__signal" aria-hidden="true"></span><small>${card.kicker}</small><strong>${card.title}</strong><p>${card.copy}</p><footer><span>${card.source}</span><b>Veure detall →</b></footer></a>`).join('');
}

export function updateHomeNow(partial={}){Object.assign(state,partial);render();}
export function initHomeNow(){
  render();
  document.addEventListener('observatori:alerts-updated',event=>updateHomeNow({alerts:event.detail}));
  document.addEventListener('observatori:language-changed',render);
}
