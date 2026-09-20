import {FONTA,dayBounds,localDay,nextDay,observedDays,errorMetrics} from './fonta-model.js';
import {SINGLE_RUN_MODELS} from './fonta-single-runs.js';

export const HOURLY_PROTOCOL='fonta-hourly-nearest-150s-v1';
const validTemp=v=>typeof v==='number'&&Number.isFinite(v)&&v>=-40&&v<=55;

// Technical sampling contract, NOT a correction of the rooftop instrument.
// Keep actual sample times and offsets; never interpolate or replace gaps with 0.
export function hourlyObservations(raw,receivedAt,date){
  const bounds=dayBounds(date),daily=observedDays(raw,receivedAt).find(d=>d.date===date);
  const available=Date.parse(receivedAt);
  if(!Number.isFinite(available))throw new Error('Recepció invàlida');
  const byTime=new Map(),conflicts=new Set();
  for(const row of raw.observations){
    const at=row.epoch*1000;
    if(!Number.isFinite(at)||at<bounds.start-150000||at>=bounds.end||at>available||row.samples!==1)continue;
    if(!validTemp(row.temperature)){conflicts.add(at);continue;}
    if(byTime.has(at)&&byTime.get(at)!==row.temperature)conflicts.add(at);
    byTime.set(at,row.temperature);
  }
  const points=[...byTime].filter(([at])=>!conflicts.has(at)).sort(([a],[b])=>a-b);
  const samples=[],missing=[];
  for(let at=bounds.start;at<bounds.end;at+=3600000){
    const near=points.filter(([t])=>Math.abs(t-at)<=150000)
      .sort(([a],[b])=>Math.abs(a-at)-Math.abs(b-at)||a-b)[0]; // tie: earlier
    if(!near){missing.push(new Date(at).toISOString());continue;}
    samples.push({validAt:new Date(at).toISOString(),sampleAt:new Date(near[0]).toISOString(),
      offsetSeconds:(near[0]-at)/1000,temperature:near[1]});
  }
  const reasons=[...(daily?.reasons||['daily-qc-unavailable'])];
  if(available<bounds.end)reasons.push('unfinished-day');
  if(missing.length)reasons.push('missing-hourly-samples');
  if(conflicts.size)reasons.push('invalid-or-conflicting-sample');
  const complete=reasons.length===0;
  return {protocol:HOURLY_PROTOCOL,station:FONTA.station,date,receivedAt,expectedHours:bounds.hours,
    validHours:samples.length,complete,reasons,missing,samples,
    max:complete?Math.max(...samples.map(p=>p.temperature)):null,
    min:complete?Math.min(...samples.map(p=>p.temperature)):null};
}

// Input forecasts must come from the hash-verifying archive reader, not saved summaries.
export function evaluateHourly(runs,observations,{now=new Date().toISOString()}={}){
  const deadline=Date.parse(now);if(!Number.isFinite(deadline))throw new Error('Ara invàlid');
  const truth=new Map();
  for(const o of [...observations].sort((a,b)=>Date.parse(a.receivedAt)-Date.parse(b.receivedAt))){
    if(o.protocol!==HOURLY_PROTOCOL||o.station!==FONTA.station||!o.complete||Date.parse(o.receivedAt)>deadline||truth.has(o.date))continue;
    truth.set(o.date,o);
  }
  const selected=new Map();let excluded=0;
  for(const group of [...runs].sort((a,b)=>Date.parse(a.receivedAt)-Date.parse(b.receivedAt))){
    const at=Date.parse(group.receivedAt),hour=new Date(at).getUTCHours(),date=group.targetDate;
    if(!Number.isFinite(at)||at>deadline||hour<8||hour>=10||date!==nextDay(localDay(at))){excluded++;continue;}
    const models=SINGLE_RUN_MODELS.map(m=>group.forecasts.find(f=>f.model===m));
    if(models.some(f=>!f||!f.complete||!f.prospective||f.targetDate!==date||Date.parse(f.receivedAt)>at||
      f.modelRunAt!==localDay(at)+'T00:00Z')){excluded++;continue;}
    if(!selected.has(date))selected.set(date,{group,models});
  }
  const pairs=[];
  for(const [date,{group,models}] of selected){
    const o=truth.get(date);if(!o||Date.parse(o.receivedAt)<=Date.parse(group.receivedAt))continue;
    const expected=dayBounds(date).hours;
    if(o.samples.length!==expected||models.some(f=>f.samples.length!==expected||f.samples.some((p,i)=>p.validAt!==o.samples[i]?.validAt)))continue;
    const observed=o.samples.map(p=>p.temperature);
    if(observed.some(v=>!validTemp(v)))continue;
    const predictions=Object.fromEntries(models.map(f=>[f.model,f.samples.map(p=>p.temperature)]));
    predictions.blend=observed.map((_,i)=>models.reduce((s,f)=>s+f.samples[i].temperature,0)/models.length);
    pairs.push({date,issuedAt:group.receivedAt,observedAvailableAt:o.receivedAt,
      hours:expected,maxOffsetSeconds:Math.max(...o.samples.map(p=>Math.abs(p.offsetSeconds))),observed,predictions});
  }
  const scores=Object.fromEntries([...SINGLE_RUN_MODELS,'blend'].map(m=>[m,{
    hourly:errorMetrics(pairs.flatMap(p=>p.predictions[m]),pairs.flatMap(p=>p.observed)),
    max:errorMetrics(pairs.map(p=>Math.max(...p.predictions[m])),pairs.map(p=>Math.max(...p.observed))),
    min:errorMetrics(pairs.map(p=>Math.min(...p.predictions[m])),pairs.map(p=>Math.min(...p.observed)))}]));
  return {schema:2,protocol:HOURLY_PROTOCOL,generatedAt:now,station:FONTA.station,
    forecastDays:selected.size,pairedDays:pairs.length,excludedGroups:excluded,scores,
    dates:pairs.map(({date,issuedAt,observedAvailableAt,hours,maxOffsetSeconds})=>({date,issuedAt,observedAvailableAt,hours,maxOffsetSeconds})),
    compatibleWithDailyV1:false,trainedFonta:false,promotionAllowed:false};
}
