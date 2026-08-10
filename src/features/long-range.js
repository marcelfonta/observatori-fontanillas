const number=value=>Number.isFinite(Number(value))?Number(value):null;
const fmt=(value,digits=1)=>value===null?'—':new Intl.NumberFormat('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
const signed=(value,digits=1)=>value===null?'—':new Intl.NumberFormat('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits,signDisplay:'exceptZero'}).format(value);
const dateLabel=value=>{
  const date=new Date(`${value}T12:00:00`);
  if(Number.isNaN(date.getTime()))return value;
  const end=new Date(date);end.setDate(end.getDate()+6);
  const format=new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short'});
  return `${format.format(date)} – ${format.format(end)}`.replaceAll('.','');
};

function temperatureSignal(value){
  if(value===null)return {label:'Sense senyal',tone:'neutral'};
  if(value>=2)return {label:'Molt més càlida',tone:'warm'};
  if(value>=.6)return {label:'Més càlida',tone:'warm'};
  if(value<=-2)return {label:'Molt més freda',tone:'cool'};
  if(value<=-.6)return {label:'Més freda',tone:'cool'};
  return {label:'Prop de la normal',tone:'neutral'};
}

function rainSignal(value){
  if(value===null)return {label:'Sense senyal',tone:'neutral'};
  if(value>=2)return {label:'Més humida',tone:'wet'};
  if(value<=-2)return {label:'Més seca',tone:'dry'};
  return {label:'Sense senyal clar',tone:'neutral'};
}

export function renderLongRangeForecast(payload){
  const weekly=payload?.weekly||{};
  const times=Array.isArray(weekly.time)?weekly.time:[];
  const temperatureUnit=payload?.weekly_units?.temperature_2m_mean||'°C';
  const temperatureAnomalyUnit=payload?.weekly_units?.temperature_2m_anomaly||'°C';
  const rainUnit=payload?.weekly_units?.precipitation_mean||'mm';
  const rainAnomalyUnit=payload?.weekly_units?.precipitation_anomaly||'mm';
  const list=document.getElementById('long-range-weeks');
  if(!list||!times.length)throw new Error('LONG_RANGE_EMPTY');
  list.replaceChildren();
  times.slice(0,6).forEach((time,index)=>{
    const temp=number(weekly.temperature_2m_mean?.[index]);
    const tempAnomaly=number(weekly.temperature_2m_anomaly?.[index]);
    const rain=number(weekly.precipitation_mean?.[index]);
    const rainAnomaly=number(weekly.precipitation_anomaly?.[index]);
    const tempState=temperatureSignal(tempAnomaly);const rainState=rainSignal(rainAnomaly);
    const article=document.createElement('article');article.className='long-range-week';
    article.innerHTML=`<header><span>Setmana ${index+1}</span><strong>${dateLabel(time)}</strong></header><div class="long-range-week__mean"><small>Temperatura mitjana del model</small><b>${fmt(temp)} ${temperatureUnit}</b></div><div class="long-range-signals"><span class="is-${tempState.tone}"><i></i><b>${tempState.label}</b><small>${tempAnomaly===null?'Anomalia no disponible':`${signed(tempAnomaly)} ${temperatureAnomalyUnit}`}</small></span><span class="is-${rainState.tone}"><i></i><b>${rainState.label}</b><small>${rainAnomaly===null?'Anomalia no disponible':`${signed(rainAnomaly)} ${rainAnomalyUnit}`} · mitjana ${fmt(rain)} ${rainUnit}</small></span></div>`;
    list.append(article);
  });
  const status=document.getElementById('long-range-status');if(status)status.textContent='ECMWF EC46 · actualització diària';
}

export function renderLongRangeError(){
  const list=document.getElementById('long-range-weeks');if(!list)return;
  list.innerHTML='<div class="long-range-fallback"><strong>La tendència automàtica no està disponible ara mateix.</strong><span>Pots consultar la predicció mensual oficial d’AEMET amb els botons de sota.</span></div>';
  const status=document.getElementById('long-range-status');if(status)status.textContent='Consulta oficial disponible';
}
