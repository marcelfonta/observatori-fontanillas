import {FONTA,localDay,nextDay} from './fonta-model.js';

// Additive operational diagnostics. Never selects training data or promotes a model.
export const FONTA_PILOT_LIMITS=Object.freeze({captures:180,bytes:100*1024*1024});
const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const count=value=>Number.isInteger(value)&&value>=0?value:null;
export function executionMetadata(env={}){
  return {
    event:['schedule','workflow_dispatch'].includes(env.GITHUB_EVENT_NAME)?env.GITHUB_EVENT_NAME:'local-or-unknown',
    runId:/^\d+$/.test(env.GITHUB_RUN_ID||'')?env.GITHUB_RUN_ID:null,
  };
}

export function diagnoseArchive(captures,report,{bytes=null,execution=null}={}){
  const archive=captures.filter(c=>c.schema===1&&c.station===FONTA.station&&validTime(c.capturedAt)&&c.capturedAt<=report.generatedAt)
    .sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));
  const latest=archive.at(-1),days=new Map();
  // Last known QC for display only. Evaluation retains its own first-eligible rule.
  for(const c of archive)for(const o of c.observed||[])days.set(o.date,o);
  const observations=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
  const recentObservations=observations.slice(-14).map(o=>({date:o.date,availableAt:o.availableAt,eligible:o.eligible===true,
    coverage:o.coverage??null,samples:o.samples??null,expectedSamples:o.expectedSamples??null,
    maxGapMinutes:o.maxGapMinutes??null,reasons:o.eligible?[]:(o.reasons?.length?o.reasons:['unknown-quality'])}));
  const seen=new Set();
  const recentCaptures=archive.map(c=>{
    const target=nextDay(localDay(c.capturedAt)),hour=new Date(c.capturedAt).getUTCHours();
    const complete=FONTA.models.every(model=>c.forecasts?.some(f=>f.model===model&&validTime(f.availableAt)&&f.availableAt<=c.capturedAt&&
      f.daily?.some(d=>d.date===target&&d.complete&&Number.isFinite(d.max)&&Number.isFinite(d.min)&&d.max>=d.min)));
    let issueState=hour<8||hour>=10?'outside-window':!complete?'incomplete-models':seen.has(target)?'duplicate-day':'eligible-issue';
    if(issueState==='eligible-issue')seen.add(target);
    return {id:c.id,capturedAt:c.capturedAt,issueState,failureCount:c.failures?.length||0};
  }).slice(-14);
  const sources=FONTA.models.map(model=>{
    const f=latest?.forecasts?.find(f=>f.model===model),source=latest?.sources?.find(s=>s.kind===model);
    const d=f?.daily?.find(d=>d.date===report.targetDate);
    return {model,state:!f?'missing':d?.complete?'available':'incomplete',receivedAt:source?.receivedAt??f?.capturedAt??null,
      modelRunAt:f?.modelRunAt??null,runIdentity:f?.runIdentity??'unknown'};
  });
  sources.push({model:'observations',state:latest?.sources?.some(s=>s.kind==='observations')?'available':'missing',
    receivedAt:latest?.sources?.find(s=>s.kind==='observations')?.receivedAt??null,modelRunAt:null});
  return {schema:1,asOf:report.generatedAt,execution,
    firstCaptureAt:archive[0]?.capturedAt??null,
    budget:{captureCount:archive.length,captureLimit:FONTA_PILOT_LIMITS.captures,bytes:count(bytes),byteLimit:FONTA_PILOT_LIMITS.bytes,
      reviewNeeded:archive.length>=160||(count(bytes)!==null&&bytes>=80*1024*1024)},
    progress:{trainingDays:count(report.trainingAvailableDays),trainingRequired:FONTA.trainingDays,
      backtestDays:count(report.evaluatedDays),prospectiveDays:count(report.prospective?.days),exploratoryRequired:FONTA.evaluationDays},
    quality:{daysSeen:observations.length,accepted:observations.filter(o=>o.eligible).length,
      rejected:observations.filter(o=>!o.eligible).length,recent:recentObservations},
    sources,recentCaptures,
    latestFailures:(latest?.failures||[]).map(f=>({source:f.source})),
    // Only expected slots after the archive started; absence is not proof a job failed.
    cadence:{utcHours:[8,20],minute:10,graceMinutes:120},
  };
}

export function missingCaptureSlots(diagnostics,now=new Date().toISOString()){
  if(!validTime(diagnostics?.firstCaptureAt)||!validTime(now))return null;
  // Full presence list is not in this bounded report: inspect only the recent window.
  const captures=diagnostics.recentCaptures;
  if(!Array.isArray(captures)||!captures.length)return [];
  const start=Math.max(Date.parse(diagnostics.firstCaptureAt),Date.parse(captures[0].capturedAt),Date.parse(now)-7*86400000);
  const present=new Set(captures.map(c=>c.capturedAt.slice(0,10)+(new Date(c.capturedAt).getUTCHours()<12?'-am':'-pm')));
  const missing=[];
  for(let day=Math.floor(start/86400000)*86400000;day<=Date.parse(now);day+=86400000){
    for(const hour of [8,20]){
      const at=day+(hour*60+10)*60000;
      if(at<start||at+120*60000>Date.parse(now))continue;
      const id=new Date(day).toISOString().slice(0,10)+(hour===8?'-am':'-pm');
      if(!present.has(id))missing.push(id);
    }
  }
  return missing;
}
