import {checkSource} from '../../scripts/fonta/io.mjs';
import {errorMetrics,FONTA,localDay,nextDay,dayBounds} from './fonta-model.js';

export const XEMA_DAILY_DATASET='7bvh-jvq2';
export const XEMA_STATIONS_DATASET='yqwd-vj5e';
export const XEMA_DAILY_VARIABLES=Object.freeze({max:'1001',min:'1002',rain:'1300'});
export const XEMA_DAILY_STATIONS=Object.freeze(['UQ','XK','KX','VX','WS','KP']);
export const XEMA_DAILY_STATION_CAPABILITIES=Object.freeze(Object.fromEntries(XEMA_DAILY_STATIONS.map(code=>[code,Object.freeze({
  temperature:code!=='KX',rain:true,
})])));
export const XEMA_DAILY_MODELS=Object.freeze([...FONTA.models]);
export const XEMA_DAILY_POLICY='fonta-xema-daily-regional-shadow-v1';
export const XEMA_DAILY_ATTRIBUTION='Generalitat de Catalunya · Servei Meteorològic de Catalunya (Meteocat)';
export const XEMA_DAILY_TERMS='https://www.meteo.cat/wpweb/avis-legal/';
const RESOURCE='https://analisi.transparenciacatalunya.cat/resource/';
const expectedUnits={max:'°C',min:'°C',rain:'mm'};
const variableByCode=Object.fromEntries(Object.entries(XEMA_DAILY_VARIABLES).map(([key,value])=>[value,key]));
const number=value=>typeof value==='number'?value:typeof value==='string'&&value.trim()!==''?Number(value):NaN;
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

function localDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?$/.test(value))throw new Error('Data diària XEMA invàlida');
  const date=value.slice(0,10);
  if(nextDay(date,0)!==date)throw new Error('Data diària XEMA invàlida');
  return date;
}
function validValue(kind,value){
  const n=number(value);
  if(!Number.isFinite(n))return null;
  if(kind==='rain')return n>=0&&n<=1000?n:null;
  return n>=-40&&n<=55?n:null;
}

export function xemaStationMetadataRequest(){
  const where=`codi_estacio in ('${XEMA_DAILY_STATIONS.join("','")}')`;
  return RESOURCE+XEMA_STATIONS_DATASET+'.json?'+new URLSearchParams({'$where':where,'$order':'codi_estacio','$limit':'7'});
}

export function xemaDailyRequest(startDate,endDate){
  if(nextDay(startDate,0)!==startDate||nextDay(endDate,0)!==endDate||startDate>=endDate)throw new Error('Interval XEMA diari invàlid');
  const where=`codi_estacio in ('${XEMA_DAILY_STATIONS.join("','")}') and codi_variable in ('${Object.values(XEMA_DAILY_VARIABLES).join("','")}') and data_lectura >= '${startDate}T00:00:00.000' and data_lectura < '${endDate}T00:00:00.000'`;
  return RESOURCE+XEMA_DAILY_DATASET+'.json?'+new URLSearchParams({'$where':where,'$order':'data_lectura,codi_estacio,codi_variable','$limit':'501'});
}

export function regionalForecastRequest(model,stations){
  if(!XEMA_DAILY_MODELS.includes(model)||!Array.isArray(stations)||stations.length!==XEMA_DAILY_STATIONS.length)throw new Error('Petició regional invàlida');
  return 'https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({
    latitude:stations.map(s=>s.latitude).join(','),longitude:stations.map(s=>s.longitude).join(','),models:model,
    timezone:'Europe/Madrid',timeformat:'unixtime',forecast_days:'3',daily:'temperature_2m_max,temperature_2m_min,precipitation_sum'
  });
}

export function normalizeXemaStations(rows){
  if(!Array.isArray(rows)||rows.length>=7)throw new Error('Metadades XEMA truncades');
  return XEMA_DAILY_STATIONS.map(code=>{
    const matches=rows.filter(row=>row.codi_estacio===code&&row.nom_estat_ema==='Operativa');
    if(matches.length!==1)throw new Error('Estació XEMA absent o ambigua: '+code);
    const row=matches[0],latitude=number(row.latitud),longitude=number(row.longitud),elevation=number(row.altitud);
    if(!Number.isFinite(latitude)||latitude<40||latitude>43||!Number.isFinite(longitude)||longitude<0||longitude>4||!Number.isFinite(elevation)||elevation<0||elevation>3000)throw new Error('Coordenades XEMA invàlides: '+code);
    return {code,name:row.nom_estacio,latitude,longitude,elevation,operational:true};
  });
}

export function normalizeXemaDaily(rows,{receivedAt}){
  if(!Array.isArray(rows)||rows.length>=501||!iso(receivedAt))throw new Error('Resposta diària XEMA invàlida o truncada');
  const records=new Map(),rejected=[];
  for(const row of rows){
    const kind=variableByCode[row.codi_variable];
    if(!XEMA_DAILY_STATIONS.includes(row.codi_estacio)||!kind){rejected.push('unexpected-station-or-variable');continue;}
    let date;
    try{date=localDate(row.data_lectura);}catch{rejected.push('invalid-date');continue;}
    const value=validValue(kind,row.valor),unit=String(row.unitat||'');
    if(unit!==expectedUnits[kind]||value===null){rejected.push('invalid-unit-or-value');continue;}
    if(row.estat!=='Representatiu'){rejected.push('not-representative');continue;}
    if(date>=localDay(receivedAt)){rejected.push('day-not-closed');continue;}
    const key=`${date}/${row.codi_estacio}/${kind}`;
    if(records.has(key)){records.set(key,null);rejected.push('duplicate');continue;}
    records.set(key,{date,station:row.codi_estacio,kind,value,unit,hourUtc:typeof row.hora_tu==='string'?row.hora_tu:null});
  }
  const grouped=new Map();
  for(const record of records.values())if(record){
    const key=`${record.date}/${record.station}`;
    if(!grouped.has(key))grouped.set(key,{date:record.date,station:record.station,availableAt:receivedAt,max:null,min:null,rain:null,hoursUtc:{max:null,min:null}});
    const item=grouped.get(key);item[record.kind]=record.value;if(record.kind!=='rain')item.hoursUtc[record.kind]=record.hourUtc;
  }
  const observations=[...grouped.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.station.localeCompare(b.station)).map(item=>({
    ...item,temperatureComplete:XEMA_DAILY_STATION_CAPABILITIES[item.station].temperature&&item.max!==null&&item.min!==null&&item.max>=item.min,
    rainComplete:item.rain!==null,trainingAllowed:false,representative:true,validationScope:'daily-representative'
  }));
  return {observations,rejected:{count:rejected.length,reasons:Object.fromEntries([...new Set(rejected)].sort().map(reason=>[reason,rejected.filter(x=>x===reason).length]))}};
}

export function normalizeRegionalForecast(raw,{model,capturedAt,stations}){
  if(!XEMA_DAILY_MODELS.includes(model)||!iso(capturedAt)||!Array.isArray(stations)||stations.length!==XEMA_DAILY_STATIONS.length)throw new Error('Previsió regional invàlida');
  const locations=Array.isArray(raw)?raw:[raw];
  if(locations.length!==stations.length)throw new Error('Nombre de localitzacions de previsió inesperat');
  return locations.map((location,index)=>{
    const station=stations[index],units=location?.daily_units;
    if(location?.timezone!=='Europe/Madrid'||units?.time!=='unixtime'||units?.temperature_2m_max!=='°C'||units?.temperature_2m_min!=='°C'||units?.precipitation_sum!=='mm')throw new Error('Unitats regionals inesperades');
    if(!Array.isArray(location.daily?.time)||new Set(location.daily.time).size!==location.daily.time.length)throw new Error('Dies regionals absents o duplicats');
    const daily=location.daily.time.map((epoch,i)=>{
      if(!Number.isFinite(epoch)||epoch<=0)throw new Error('Instant regional invàlid');
      const max=validValue('max',location.daily.temperature_2m_max?.[i]),min=validValue('min',location.daily.temperature_2m_min?.[i]),rain=validValue('rain',location.daily.precipitation_sum?.[i]);
      return {date:localDay(epoch*1000),max,min,rain,complete:max!==null&&min!==null&&rain!==null&&max>=min};
    });
    return {station:station.code,model,capturedAt,grid:{latitude:location.latitude,longitude:location.longitude,elevation:location.elevation},daily};
  });
}

export function decodeRegionalCapture(capture){
  if(capture?.schema!==1||capture.kind!=='fonta-xema-daily-capture'||capture.policy!==XEMA_DAILY_POLICY||!iso(capture.capturedAt)||!capture.sources)throw new Error('Captura regional invàlida');
  checkSource(capture.sources.stations);checkSource(capture.sources.daily);
  if(!Array.isArray(capture.sources.forecasts)||capture.sources.forecasts.length!==XEMA_DAILY_MODELS.length)throw new Error('Fonts regionals incompletes');
  for(const source of capture.sources.forecasts)checkSource(source);
  const stations=normalizeXemaStations(capture.sources.stations.raw);
  const daily=normalizeXemaDaily(capture.sources.daily.raw,{receivedAt:capture.sources.daily.receivedAt});
  const forecasts=capture.sources.forecasts.flatMap(source=>normalizeRegionalForecast(source.raw,{model:source.model,capturedAt:source.receivedAt,stations}));
  return {capturedAt:capture.capturedAt,stations,observations:daily.observations,rejected:daily.rejected,forecasts};
}

function rainScore(predictions,truth,threshold){
  if(!predictions.length||predictions.length!==truth.length)return {samples:0,hits:0,misses:0,falseAlarms:0,correctNegatives:0};
  const score={samples:predictions.length,hits:0,misses:0,falseAlarms:0,correctNegatives:0};
  predictions.forEach((value,index)=>{const predicted=value>=threshold,observed=truth[index]>=threshold;if(predicted&&observed)score.hits++;else if(predicted)score.falseAlarms++;else if(observed)score.misses++;else score.correctNegatives++;});
  return score;
}

export function evaluateRegionalDaily(captures,{now=new Date().toISOString()}={}){
  if(!Array.isArray(captures)||!iso(now))throw new Error('Arxiu regional invàlid');
  const decoded=captures.map(decodeRegionalCapture).filter(c=>c.capturedAt<=now).sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));
  const issues=new Map(),observations=new Map();
  for(const capture of decoded){
    for(const observation of capture.observations){
      const key=`${observation.station}/${observation.date}`;
      if(observation.availableAt<=capture.capturedAt&&!observations.has(key))observations.set(key,observation);
    }
    for(const station of XEMA_DAILY_STATIONS){
      const target=nextDay(localDay(capture.capturedAt)),key=`${station}/${target}`;
      if(issues.has(key)||Date.parse(capture.capturedAt)>=dayBounds(target).start)continue;
      const models=Object.fromEntries(XEMA_DAILY_MODELS.map(model=>{
        const match=capture.forecasts.find(f=>f.station===station&&f.model===model)?.daily.find(day=>day.date===target&&day.complete);
        return [model,match||null];
      }));
      if(Object.values(models).every(Boolean))issues.set(key,{station,date:target,issuedAt:capture.capturedAt,models});
    }
  }
  const pairs=[...issues.values()].filter(issue=>observations.has(`${issue.station}/${issue.date}`)).map(issue=>({...issue,observation:observations.get(`${issue.station}/${issue.date}`)}));
  const metrics={};
  for(const variable of ['max','min','rain']){
    const comparable=pairs.filter(pair=>(variable==='rain'?pair.observation.rainComplete:pair.observation.temperatureComplete)&&XEMA_DAILY_MODELS.every(model=>pair.models[model][variable]!==null));
    const truth=comparable.map(pair=>pair.observation[variable]);
    const predictions=Object.fromEntries(XEMA_DAILY_MODELS.map(model=>[model,comparable.map(pair=>pair.models[model][variable])]));
    predictions.blend=comparable.map(pair=>XEMA_DAILY_MODELS.filter(model=>model!=='best_match').reduce((sum,model)=>sum+pair.models[model][variable],0)/(XEMA_DAILY_MODELS.length-1));
    metrics[variable]=Object.fromEntries(Object.entries(predictions).map(([model,values])=>[model,{...errorMetrics(values,truth),...(variable==='rain'?{events:{rain:rainScore(values,truth,.2),heavy:rainScore(values,truth,20)}}:{})}]));
  }
  const coverage=Object.fromEntries(XEMA_DAILY_STATIONS.map(station=>[station,{supportsTemperature:XEMA_DAILY_STATION_CAPABILITIES[station].temperature,supportsRain:true,issues:[...issues.values()].filter(x=>x.station===station).length,
    paired:[...new Set(pairs.filter(x=>x.station===station).map(x=>x.date))].length,
    temperature:[...new Set(pairs.filter(x=>x.station===station&&x.observation.temperatureComplete).map(x=>x.date))].length,
    rain:[...new Set(pairs.filter(x=>x.station===station&&x.observation.rainComplete).map(x=>x.date))].length}]));
  return {schema:1,kind:'fonta-xema-daily-report',policy:XEMA_DAILY_POLICY,generatedAt:now,mode:'private-shadow',productionEnabled:false,
    captureCount:decoded.length,issueCount:issues.size,pairedStationDays:pairs.length,coverage,metrics,
    science:{forecastFrozenBeforeTargetDay:true,identicalSamplesPerComparator:true,rawRedistribution:false,regionalTrainingEnabled:false},
    promotion:{allowed:false,reasons:['Regional series is still collecting','No leave-one-station-out validation yet','Meteocat reuse clarification is still pending','Human approval is mandatory']}};
}

export function publicRegionalStatus(report,{publishedAt=report?.generatedAt}={}){
  if(report?.schema!==1||report.kind!=='fonta-xema-daily-report'||report.policy!==XEMA_DAILY_POLICY||report.productionEnabled!==false||report.mode!=='private-shadow'||!iso(publishedAt))throw new Error('Informe regional no publicable');
  return {schema:1,kind:'fonta-xema-public-status',policy:XEMA_DAILY_POLICY,publishedAt,
    mode:'regional-shadow',productionEnabled:false,promotionAllowed:false,
    source:XEMA_DAILY_ATTRIBUTION,terms:XEMA_DAILY_TERMS,
    progress:{captureCount:report.captureCount,pairedStationDays:report.pairedStationDays,status:report.pairedStationDays>0?'contrasting':'collecting'},
    stations:XEMA_DAILY_STATIONS.map(code=>({code,temperature:XEMA_DAILY_STATION_CAPABILITIES[code].temperature,rain:true})),
    safeguards:{rawDataPublished:false,weatherValuesPublished:false,errorMetricsPublished:false,noRedistribution:true,
      note:'Només es publica l’estat operatiu del pilot. Les lectures originals i les mètriques meteorològiques romanen privades.'}};
}

export function regionalCapture({capturedAt,sources}){
  const capture={schema:1,kind:'fonta-xema-daily-capture',policy:XEMA_DAILY_POLICY,capturedAt,attribution:XEMA_DAILY_ATTRIBUTION,terms:XEMA_DAILY_TERMS,
    scope:'non-commercial private research',productionEnabled:false,trainingEnabled:false,sources};
  decodeRegionalCapture(capture);
  return capture;
}
