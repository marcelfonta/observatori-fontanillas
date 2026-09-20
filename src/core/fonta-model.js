import {finiteNumber} from './numeric.js';

// Research contract v1. No production publisher imports this module.
export const FONTA = Object.freeze({version:'0.1.0',station:'ISANTC198',latitude:41.6906,longitude:2.489,
  models:['best_match','ecmwf_ifs025','icon_eu','meteofrance_arome_france'],
  trainingDays:30,windowDays:60,evaluationDays:14,correctionCap:3});
const dateFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'});
export const localDay=instant=>dateFormat.format(new Date(instant));
export const nextDay=(day,offset=1)=>new Date(Date.parse(day+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const round=x=>Number.isFinite(x)?Math.round(x*1000)/1000:null;
const temp=x=>{const n=finiteNumber(x);return n!==null&&n>=-40&&n<=55?n:null;};
const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));

export function dayBounds(day){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||nextDay(day,0)!==day)throw new Error('Data invàlida');
  const noon=Date.parse(day+'T12:00:00Z');
  const hours=[];
  for(let t=noon-15*3600000;t<=noon+15*3600000;t+=3600000)if(localDay(t)===day)hours.push(t);
  return {start:hours[0],end:hours.at(-1)+3600000,hours:hours.length,bins:hours.length*12};
}

export function normalizeForecast(raw,{model,capturedAt}){
  if(!FONTA.models.includes(model)||!iso(capturedAt))throw new Error('Origen de previsió invàlid');
  if(raw?.timezone!=='Europe/Madrid'||raw?.hourly_units?.time!=='unixtime'||raw?.daily_units?.time!=='unixtime'||
    raw?.hourly_units?.temperature_2m!=='°C'||raw?.daily_units?.temperature_2m_max!=='°C'||raw?.daily_units?.temperature_2m_min!=='°C')throw new Error('Unitats o fus inesperats');
  if(!Array.isArray(raw.hourly?.time)||!Array.isArray(raw.daily?.time))throw new Error('Sèrie absent');
  const hourly=raw.hourly.time.map((epoch,i)=>{
    if(!Number.isFinite(epoch)||epoch<=0)throw new Error('Instant invàlid');
    return {validAt:new Date(epoch*1000).toISOString(),temperature:temp(raw.hourly.temperature_2m?.[i])};
  });
  if(hourly.some((r,i)=>i&&r.validAt<=hourly[i-1].validAt))throw new Error('Hores duplicades o desordenades');
  const daily=raw.daily.time.map((epoch,i)=>{
    if(!Number.isFinite(epoch)||epoch<=0)throw new Error('Dia invàlid');
    const max=temp(raw.daily.temperature_2m_max?.[i]),min=temp(raw.daily.temperature_2m_min?.[i]);
    return {date:localDay(epoch*1000),max,min,complete:max!==null&&min!==null&&max>=min};
  });
  if(new Set(daily.map(r=>r.date)).size!==daily.length)throw new Error('Dies duplicats');
  return {model,capturedAt,availableAt:capturedAt,modelRunAt:null,runIdentity:'not-provided-by-forecast-api',
    grid:{latitude:raw.latitude,longitude:raw.longitude,elevation:raw.elevation},hourly,daily};
}

export function observedDays(raw,capturedAt){
  if(raw?.stationId!==FONTA.station||raw.interval!=='raw'||raw.storage?.enabled!==true||!Array.isArray(raw.observations)||!iso(capturedAt))throw new Error('Històric brut Fontanillas requis');
  const days=new Map();
  for(const r of raw.observations){
    if(!Number.isFinite(r.epoch)||r.epoch<=0||r.epoch*1000>Date.parse(capturedAt)||r.samples!==1)continue;
    const day=localDay(r.epoch*1000);
    if(day>=localDay(capturedAt))continue;
    if(!days.has(day))days.set(day,[]);
    days.get(day).push(r);
  }
  return [...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,rows])=>{
    const bounds=dayBounds(date),bins=new Map();let invalid=0;
    // Deduplicate exact instants, NOT floor(epoch/300): cron jitter can put two
    // genuine five-minute samples in the same bin and falsely halve coverage.
    for(const r of rows){const value=temp(r.temperature);if(value===null){invalid++;continue;}const key=r.epoch;if(!bins.has(key))bins.set(key,{t:r.epoch*1000,value});else if(bins.get(key).value!==value)invalid++;}
    const points=[...bins.values()].sort((a,b)=>a.t-b.t);
    const hours=new Set(points.map(r=>Math.floor(r.t/3600000))).size;
    const gaps=points.map((r,i)=>r.t-(i?points[i-1].t:bounds.start));
    gaps.push(bounds.end-(points.at(-1)?.t??bounds.start));
    const maxGapMinutes=Math.max(...gaps)/60000;
    const suspiciousJump=points.some((r,i)=>i&&r.t-points[i-1].t<=600000&&Math.abs(r.value-points[i-1].value)>6);
    let covered=0,lastEnd=bounds.start;
    for(const p of points){const start=Math.max(bounds.start,p.t-150000),end=Math.min(bounds.end,p.t+150000);covered+=Math.max(0,end-Math.max(start,lastEnd));lastEnd=Math.max(lastEnd,end);}
    const coverage=covered/(bounds.end-bounds.start);
    const eligible=coverage>=.9&&bins.size>=Math.ceil(bounds.bins*.9)&&hours===bounds.hours&&maxGapMinutes<=20&&!suspiciousJump&&invalid===0;
    return {date,availableAt:capturedAt,max:points.length?Math.max(...points.map(r=>r.value)):null,
      min:points.length?Math.min(...points.map(r=>r.value)):null,samples:bins.size,expectedSamples:bounds.bins,
      hours,expectedHours:bounds.hours,coverage:round(coverage),maxGapMinutes:round(maxGapMinutes),invalid,suspiciousJump,eligible};
  });
}

export function errorMetrics(predictions,truth){
  if(!predictions.length||predictions.length!==truth.length)return {samples:0,mae:null,bias:null,rmse:null};
  const errors=predictions.map((v,i)=>v-truth[i]);
  return {samples:errors.length,mae:round(mean(errors.map(Math.abs))),bias:round(mean(errors)),rmse:round(Math.sqrt(mean(errors.map(e=>e*e))))};
}

// Expanding, forward-only evaluation. Parameters fixed before outcomes are known.
// Every candidate is compared on the identical days with all baselines.
export function evaluateFonta(captures,{now=new Date().toISOString()}={}){
  if(!iso(now)||!Array.isArray(captures))throw new Error('Entrada Fonta invàlida');
  const archive=captures.filter(c=>c.schema===1&&c.station===FONTA.station&&iso(c.capturedAt)&&c.capturedAt<=now).sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));
  const observations=new Map(),issues=new Map();
  for(const c of archive){
    for(const o of c.observed||[])if(o.eligible&&iso(o.availableAt)&&o.availableAt<=c.capturedAt&&o.date<localDay(o.availableAt)&&temp(o.max)!==null&&temp(o.min)!==null&&o.max>=o.min&&!observations.has(o.date))observations.set(o.date,o);
    // Fixed UTC issue window; DST only affects the target calendar day, not selection.
    const hour=new Date(c.capturedAt).getUTCHours();
    if(hour<8||hour>=10)continue;
    const date=nextDay(localDay(c.capturedAt));
    if(issues.has(date))continue;
    const models=FONTA.models.map(id=>c.forecasts?.find(f=>f.model===id&&iso(f.availableAt)&&f.availableAt<=c.capturedAt)?.daily.find(d=>d.date===date&&d.complete&&temp(d.max)!==null&&temp(d.min)!==null&&d.max>=d.min));
    if(models.some(x=>!x))continue;
    issues.set(date,{date,issuedAt:c.capturedAt,models:Object.fromEntries(FONTA.models.map((id,i)=>[id,{max:models[i].max,min:models[i].min}])),captureId:c.id});
  }
  const pairs=[...issues.values()].filter(r=>observations.has(r.date)).map(r=>({...r,observation:observations.get(r.date)}));
  const blend=r=>Object.fromEntries(['max','min'].map(key=>[key,mean(FONTA.models.filter(id=>id!=='best_match').map(id=>r.models[id][key]))]));
  const evaluated=[];
  for(const row of pairs){
    const training=pairs.filter(r=>r.date<row.date&&r.observation.availableAt<row.issuedAt).slice(-FONTA.windowDays);
    const persistence=observations.get(nextDay(localDay(row.issuedAt),-1));
    if(training.length<FONTA.trainingDays||!persistence||persistence.availableAt>=row.issuedAt)continue;
    const base=blend(row),correction=Object.fromEntries(['max','min'].map(key=>[key,Math.max(-FONTA.correctionCap,Math.min(FONTA.correctionCap,mean(training.map(r=>r.observation[key]-blend(r)[key]))))]));
    let candidate={max:base.max+correction.max,min:base.min+correction.min};
    const inversion=candidate.min>candidate.max;if(inversion)candidate=base;
    evaluated.push({...row,predictions:{...row.models,blend:base,persistence:{max:persistence.max,min:persistence.min},fonta:candidate},trainingDays:training.length,trainingLastAvailableAt:training.at(-1).observation.availableAt,correction,inversion});
  }
  const scores=Object.fromEntries([...FONTA.models,'blend','persistence','fonta'].map(model=>[model,Object.fromEntries(['max','min'].map(key=>[key,errorMetrics(evaluated.map(r=>r.predictions[model][key]),evaluated.map(r=>r.observation[key]))]))]));
  const latest=archive.at(-1);
  const targetDate=latest?nextDay(localDay(latest.capturedAt)):null;
  const forecast=latest?FONTA.models.map(model=>({model,...latest.forecasts?.find(f=>f.model===model)?.daily.find(d=>d.date===targetDate)})).filter(d=>d.complete):[];
  const training=latest?pairs.filter(r=>r.observation.availableAt<latest.capturedAt).slice(-FONTA.windowDays):[];
  let candidate=null;
  if(forecast.length===FONTA.models.length&&training.length>=FONTA.trainingDays){
    const base=Object.fromEntries(['max','min'].map(key=>[key,mean(forecast.filter(f=>f.model!=='best_match').map(f=>f[key]))]));
    const correction=Object.fromEntries(['max','min'].map(key=>[key,Math.max(-FONTA.correctionCap,Math.min(FONTA.correctionCap,mean(training.map(r=>r.observation[key]-blend(r)[key]))))]));
    const inverted=base.min+correction.min>base.max+correction.max;
    candidate={version:FONTA.version,date:targetDate,issuedAt:latest.capturedAt,trainingDays:training.length,
      trainingDates:training.map(r=>r.date),correction,inverted,
      max:inverted?base.max:base.max+correction.max,min:inverted?base.min:base.min+correction.min};
  }
  const frozen=archive.filter(c=>c.shadowPrediction?.version===FONTA.version&&c.shadowPrediction.issuedAt===c.capturedAt&&
    c.shadowPrediction.date===nextDay(localDay(c.capturedAt))&&observations.has(c.shadowPrediction.date));
  const prospectiveDates=new Set();
  const prospective=frozen.filter(c=>{const day=c.shadowPrediction.date;if(prospectiveDates.has(day))return false;prospectiveDates.add(day);return true;});
  return {schema:1,version:FONTA.version,generatedAt:now,station:FONTA.station,mode:'shadow',productionEnabled:false,
    status:evaluated.length>=FONTA.evaluationDays?'experimental-evaluation':'collecting',latestCaptureAt:latest?.capturedAt??null,
    captureCount:archive.length,eligibleObservedDays:observations.size,pairedDays:pairs.length,evaluatedDays:evaluated.length,
    targetDate,forecast,scores,candidate,prospective:{days:prospective.length,
      max:errorMetrics(prospective.map(c=>c.shadowPrediction.max),prospective.map(c=>observations.get(c.shadowPrediction.date).max)),
      min:errorMetrics(prospective.map(c=>c.shadowPrediction.min),prospective.map(c=>observations.get(c.shadowPrediction.date).min))},
    required:{trainingDays:FONTA.trainingDays,evaluationDays:FONTA.evaluationDays},
    promotion:{allowed:false,reasons:['Station siting and calibration require review','Independent prospective holdout and seasonal/extreme coverage required','Human approval required']},
    evaluation: evaluated.map(r=>({date:r.date,issuedAt:r.issuedAt,captureId:r.captureId,trainingDays:r.trainingDays,trainingLastAvailableAt:r.trainingLastAvailableAt,correction:r.correction,inversion:r.inversion,predictions:r.predictions,observed:{max:r.observation.max,min:r.observation.min}}))};
}
