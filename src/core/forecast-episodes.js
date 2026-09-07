const MODEL_ORDER=['ecmwf','gfs','icon'];

const finite=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);
const average=values=>{
  const valid=values.filter(Number.isFinite);
  return valid.length?valid.reduce((sum,value)=>sum+value,0)/valid.length:null;
};
const median=values=>{
  const valid=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!valid.length)return null;
  const middle=Math.floor(valid.length/2);
  return valid.length%2?valid[middle]:(valid[middle-1]+valid[middle])/2;
};
const round=(value,digits=1)=>Number.isFinite(value)?Number(value.toFixed(digits)):null;

export function normalizeForecastModel(name,payload){
  const daily=payload?.daily||{};
  const times=Array.isArray(daily.time)?daily.time:[];
  return {
    name,
    days:times.map((date,index)=>({
      date,
      weatherCode:finite(daily.weather_code?.[index]),
      max:finite(daily.temperature_2m_max?.[index]),
      min:finite(daily.temperature_2m_min?.[index]),
      rainProbability:finite(daily.precipitation_probability_max?.[index]),
      rain:finite(daily.precipitation_sum?.[index]),
      gust:finite(daily.wind_gusts_10m_max?.[index]),
    })),
  };
}

function dayMeanTemperature(day){
  return average([finite(day?.max),finite(day?.min)]);
}

function signalFor(kind,previous,target){
  const previousMean=dayMeanTemperature(previous);
  const targetMean=dayMeanTemperature(target);
  const temperatureDelta=previousMean===null||targetMean===null?null:targetMean-previousMean;
  const rain=finite(target?.rain)||0;
  const previousRain=finite(previous?.rain)||0;
  const rainProbability=finite(target?.rainProbability)||0;
  const gust=finite(target?.gust)||0;
  const previousGust=finite(previous?.gust)||0;
  const weatherCode=finite(target?.weatherCode)||0;
  if(kind==='storm')return weatherCode>=95&&rainProbability>=45;
  if(kind==='rain')return (rain>=5||(rainProbability>=65&&rain>=2))&&rain-previousRain>=2;
  if(kind==='wind')return gust>=55&&gust-previousGust>=12;
  if(kind==='cooling')return Number.isFinite(temperatureDelta)&&temperatureDelta<=-5;
  if(kind==='warming')return Number.isFinite(temperatureDelta)&&temperatureDelta>=5;
  return false;
}

function strengthBucket(kind,metrics){
  if(kind==='cooling'||kind==='warming'){
    const change=Math.abs(metrics.temperatureDelta||0);
    return change>=10?'very-strong':change>=7?'strong':'notable';
  }
  if(kind==='rain')return metrics.rain>=20?'very-strong':metrics.rain>=10?'strong':'notable';
  if(kind==='wind')return metrics.gust>=80?'very-strong':metrics.gust>=65?'strong':'notable';
  return metrics.rain>=15?'strong':'notable';
}

function scoreCandidate(kind,agreement,metrics,horizon){
  const base={storm:100,rain:82,wind:72,cooling:64,warming:62}[kind]||0;
  const magnitude=kind==='rain'||kind==='storm'
    ? Math.min(20,metrics.rain||0)
    : kind==='wind'
      ? Math.min(20,(metrics.gust||0)/5)
      : Math.min(20,Math.abs(metrics.temperatureDelta||0)*1.5);
  return base+agreement*6+magnitude-horizon*1.5;
}

export function detectForecastEpisode(models,{issuedAt=new Date().toISOString(),minimumAgreement=2}={}){
  const normalized=(Array.isArray(models)?models:[])
    .filter(model=>MODEL_ORDER.includes(model?.name)&&Array.isArray(model?.days)&&model.days.length>=3);
  if(normalized.length<minimumAgreement)return null;
  const candidates=[];
  const maximumHorizon=Math.min(5,...normalized.map(model=>model.days.length-1));
  for(let horizon=1;horizon<=maximumHorizon;horizon+=1){
    const targetDate=normalized[0]?.days[horizon]?.date;
    if(!targetDate)continue;
    for(const kind of ['storm','rain','wind','cooling','warming']){
      const agreeing=normalized.filter(model=>model.days[horizon]?.date===targetDate&&signalFor(kind,model.days[horizon-1],model.days[horizon]));
      if(agreeing.length<minimumAgreement)continue;
      const temperatureDeltas=agreeing.map(model=>{
        const previousMean=dayMeanTemperature(model.days[horizon-1]);
        const targetMean=dayMeanTemperature(model.days[horizon]);
        return previousMean===null||targetMean===null?null:targetMean-previousMean;
      });
      const metrics={
        temperatureDelta:round(median(temperatureDeltas),1),
        rain:round(median(agreeing.map(model=>finite(model.days[horizon]?.rain))),1),
        rainProbability:round(median(agreeing.map(model=>finite(model.days[horizon]?.rainProbability))),0),
        gust:round(median(agreeing.map(model=>finite(model.days[horizon]?.gust))),0),
        max:round(median(agreeing.map(model=>finite(model.days[horizon]?.max))),1),
        min:round(median(agreeing.map(model=>finite(model.days[horizon]?.min))),1),
      };
      candidates.push({
        kind,targetDate,horizon,agreement:agreeing.length,totalModels:normalized.length,
        confidence:agreeing.length===normalized.length?'high':'moderate',
        agreeingModels:agreeing.map(model=>model.name),metrics,
        strength:strengthBucket(kind,metrics),score:scoreCandidate(kind,agreeing.length,metrics,horizon),
      });
    }
  }
  const selected=candidates.sort((a,b)=>b.score-a.score||a.horizon-b.horizon)[0];
  if(!selected)return null;
  return {
    ...selected,issuedAt,
    models:normalized.map(model=>({name:model.name,days:model.days.slice(0,6)})),
    episodeKey:`${selected.kind}:${selected.targetDate}`,
  };
}

export function forecastEpisodeCopy(episode){
  if(!episode)return null;
  const date=new Intl.DateTimeFormat('ca-ES',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Madrid'})
    .format(new Date(`${episode.targetDate}T12:00:00Z`));
  const agreement=`${episode.agreement} de ${episode.totalModels} models`;
  const confidence=episode.confidence==='high'?'coincidència alta':'coincidència moderada';
  const value=number=>Number(number).toLocaleString('ca-ES',{maximumFractionDigits:1});
  let title='Canvi de temps en seguiment';
  let lead='Ja es comença a dibuixar un canvi de temps';
  let detail='';
  if(episode.kind==='cooling'){
    title='Baixada notable de la temperatura';
    lead=`La calor podria perdre força ${date}`;
    detail=`Els models estimen una baixada propera als ${value(Math.abs(episode.metrics.temperatureDelta))} °C respecte del dia anterior.`;
  }else if(episode.kind==='warming'){
    title='Pujada notable de la temperatura';
    lead=`La temperatura podria pujar clarament ${date}`;
    detail=`Els models estimen un augment proper als ${value(Math.abs(episode.metrics.temperatureDelta))} °C respecte del dia anterior.`;
  }else if(episode.kind==='rain'){
    title='La pluja guanya protagonisme';
    lead=`Els models comencen a marcar un episodi de pluja per ${date}`;
    detail=`La mediana dels models coincidents situa l’acumulació diària prop dels ${value(episode.metrics.rain)} mm, amb una probabilitat màxima al voltant del ${value(episode.metrics.rainProbability)}%.`;
  }else if(episode.kind==='wind'){
    title='El vent podria reforçar-se';
    lead=`El vent podria guanyar força ${date}`;
    detail=`La mediana dels models coincidents situa les ratxes màximes prop dels ${value(episode.metrics.gust)} km/h.`;
  }else if(episode.kind==='storm'){
    title='Possibles tempestes en seguiment';
    lead=`Alguns models dibuixen tempestes per ${date}`;
    detail=`La senyal apareix en ${agreement}, amb una probabilitat de precipitació al voltant del ${value(episode.metrics.rainProbability)}%.`;
  }
  const body=`${lead}. ${detail} Hi ha ${confidence} (${agreement}), però encara caldrà afinar la intensitat i l’horari a mesura que s’acosti. Ho continuarem seguint des del Baix Montseny.\n\nPredicció de models, no avís oficial. Consulta Meteocat i Protecció Civil si s’activa algun avís.\n\n#MeteoFontanillas #SantCeloni #BaixMontseny #CanviDeTemps #Prediccio`;
  return {title,body,lead,detail,dateLabel:date,confidenceLabel:confidence};
}
