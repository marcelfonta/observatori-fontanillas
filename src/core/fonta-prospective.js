import {FONTA,localDay,nextDay,errorMetrics} from './fonta-model.js';

// Additive v1 packet. Freeze ALL comparators at collection, never backfill old captures.
export const PAIRED_PROTOCOL='fonta-paired-daily-v1';
export const PAIRED_METHODS=[...FONTA.models,'blend','persistence','fonta'];
const validTime=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const validPair=x=>x&&['max','min'].every(k=>Number.isFinite(x[k])&&x[k]>=-40&&x[k]<=55)&&x.max>=x.min;
const inWindow=at=>new Date(at).getUTCHours()>=8&&new Date(at).getUTCHours()<10;
const eligibleObservation=(o,at)=>o?.eligible===true&&validTime(o.availableAt)&&o.availableAt<=at&&o.date<localDay(o.availableAt)&&validPair(o);
function firstObservations(captures){
  const observations=new Map();
  for(const c of captures)for(const o of c.observed||[])if(eligibleObservation(o,c.capturedAt)&&!observations.has(o.date))observations.set(o.date,o);
  return observations;
}
const archiveBefore=(captures,now)=>captures.filter(c=>c.schema===1&&c.station===FONTA.station&&validTime(c.capturedAt)&&c.capturedAt<=now).sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));

export function freezeComparison(captures,capture,candidate){
  if(capture?.schema!==1||capture.station!==FONTA.station||!validTime(capture.capturedAt)||!inWindow(capture.capturedAt))return null;
  const at=capture.capturedAt,date=nextDay(localDay(at));
  if(candidate?.version!==FONTA.version||candidate.issuedAt!==at||candidate.date!==date||!validPair(candidate)||candidate.trainingDays<FONTA.trainingDays||!Array.isArray(candidate.trainingDates))return null;
  const predictions={};
  for(const model of FONTA.models){
    const f=capture.forecasts?.find(f=>f.model===model&&validTime(f.availableAt)&&f.availableAt<=at);
    const d=f?.daily?.find(d=>d.date===date&&d.complete&&validPair(d));
    if(!d)return null;
    predictions[model]={max:d.max,min:d.min};
  }
  predictions.blend=Object.fromEntries(['max','min'].map(k=>[k,FONTA.models.filter(m=>m!=='best_match').reduce((sum,m)=>sum+predictions[m][k],0)/3]));
  const persistenceDate=nextDay(localDay(at),-1);
  const persistence=firstObservations(archiveBefore([...captures,capture],at)).get(persistenceDate);
  if(!persistence||persistence.availableAt>=at)return null;
  predictions.persistence={max:persistence.max,min:persistence.min};
  predictions.fonta={max:candidate.max,min:candidate.min};
  const packet={schema:1,protocol:PAIRED_PROTOCOL,algorithm:FONTA.version,station:FONTA.station,
    captureId:capture.id,issuedAt:at,date,codeRevision:capture.codeRevision??null,
    target:'daily-extrema-vs-five-minute-observations',instrumentEpoch:'roof-red-tiles-2026-09-unreviewed',
    trainingDays:candidate.trainingDays,trainingDates:[...candidate.trainingDates],
    persistenceDate,persistenceAvailableAt:persistence.availableAt,predictions};
  return validFrozenComparison(packet,capture)?packet:null;
}

export function validFrozenComparison(p,c){
  if(!p||p.schema!==1||p.protocol!==PAIRED_PROTOCOL||p.algorithm!==FONTA.version||p.station!==FONTA.station||p.captureId!==c.id||
    p.issuedAt!==c.capturedAt||!validTime(p.issuedAt)||!inWindow(p.issuedAt)||p.date!==nextDay(localDay(p.issuedAt))||
    p.target!=='daily-extrema-vs-five-minute-observations'||p.instrumentEpoch!=='roof-red-tiles-2026-09-unreviewed'||
    p.persistenceDate!==nextDay(localDay(p.issuedAt),-1)||!validTime(p.persistenceAvailableAt)||p.persistenceAvailableAt>=p.issuedAt||
    !Number.isInteger(p.trainingDays)||p.trainingDays<FONTA.trainingDays||p.trainingDays>FONTA.windowDays||!Array.isArray(p.trainingDates)||
    p.trainingDates.length!==p.trainingDays||new Set(p.trainingDates).size!==p.trainingDays||
    p.trainingDates.some(d=>typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d+'T12:00:00Z'))||nextDay(d,0)!==d||d>=localDay(p.issuedAt))||
    !PAIRED_METHODS.every(m=>validPair(p.predictions?.[m])))return false;
  return true;
}

export function evaluateFrozenComparisons(captures,{now=new Date().toISOString()}={}){
  if(!validTime(now))throw new Error('Data prospectiva invàlida');
  const archive=archiveBefore(captures,now),truth=firstObservations(archive),seen=new Set(),rows=[];
  let frozenDays=0,invalidPackets=0;
  for(const c of archive){
    const p=c.frozenComparison;
    if(!p)continue; // Absence is not permission to reconstruct a historical forecast.
    if(!validFrozenComparison(p,c)){invalidPackets++;continue;}
    if(seen.has(p.date))continue;
    seen.add(p.date);frozenDays++;
    const o=truth.get(p.date);
    if(!o||o.availableAt<=p.issuedAt)continue;
    rows.push({date:p.date,captureId:c.id,issuedAt:p.issuedAt,observedAvailableAt:o.availableAt,
      predictions:p.predictions,observed:{max:o.max,min:o.min}});
  }
  const scores=Object.fromEntries(PAIRED_METHODS.map(model=>[model,Object.fromEntries(['max','min'].map(k=>[k,errorMetrics(rows.map(r=>r.predictions[model][k]),rows.map(r=>r.observed[k]))]))]));
  return {schema:1,protocol:PAIRED_PROTOCOL,holdout:false,promotionAllowed:false,frozenDays,days:rows.length,invalidPackets,
    dates:rows.map(r=>r.date),scores,rows};
}
