import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {FONTA,dayBounds,nextDay,evaluateFonta} from '../src/core/fonta-model.js';
import {freezeComparison,evaluateFrozenComparisons,validFrozenComparison,PAIRED_METHODS} from '../src/core/fonta-prospective.js';
import {singleRunRequest,normalizeSingleRun,probePolicy} from '../src/core/fonta-single-runs.js';
import {exportArchive,verifyExport} from '../scripts/fonta/export-archive.mjs';
import {readArchive} from '../scripts/fonta/archive.mjs';
import {scheduleEvidence} from '../scripts/fonta/audit-schedule.mjs';

const manual={databaseId:1,event:'workflow_dispatch',status:'completed',conclusion:'success',createdAt:'2026-09-20T12:41:00Z'};
assert.equal(scheduleEvidence([manual],'2026-09-20T13:00:00Z').status,'not-observed-in-window');
const scheduled={...manual,event:'schedule'};
assert.equal(scheduleEvidence([scheduled],'2026-09-20T13:00:00Z').status,'latest-scheduled-success');
assert.equal(scheduleEvidence([{...scheduled,conclusion:'failure'}],'2026-09-20T13:00:00Z').status,'latest-scheduled-needs-review');
assert.equal(scheduleEvidence([{...scheduled,status:'queued'}],'2026-09-20T13:00:00Z').status,'pending');
assert.equal(scheduleEvidence([scheduled],'2026-09-19T13:00:00Z').scheduledRunsObserved,0);

// Synthetic forecasts only: proves causality and comparability, not real-world skill.
const captures=[];
for(let i=0;i<65;i++){
  const day=nextDay('2026-05-01',i),at=day+'T08:10:00Z';
  const c={schema:1,id:day+'-am',station:FONTA.station,capturedAt:at,
    observed:[{date:nextDay(day,-1),availableAt:day+'T08:09:59Z',max:25,min:15,eligible:true}],
    forecasts:FONTA.models.map(model=>({model,availableAt:at,daily:[{date:nextDay(day),max:23,min:13,complete:true}]}))};
  c.shadowPrediction=evaluateFonta([...captures,c],{now:at}).candidate;
  c.frozenComparison=freezeComparison(captures,c,c.shadowPrediction);
  captures.push(c);
}
const now='2026-08-01T00:00:00Z',report=evaluateFrozenComparisons(captures,{now});
assert(report.days>=14);assert(report.frozenDays>report.days);assert.equal(report.holdout,false);assert.equal(report.promotionAllowed,false);
for(const m of PAIRED_METHODS)for(const k of ['max','min'])assert.equal(report.scores[m][k].samples,report.days);
assert.equal(report.scores.fonta.max.mae,0);assert.equal(report.scores.blend.max.mae,2);
assert.equal(report.scores.persistence.max.mae,0);
const c=captures.at(-1),p=c.frozenComparison;
assert(validFrozenComparison(p,c));assert(p.persistenceAvailableAt<p.issuedAt);
assert.equal(freezeComparison(captures,{...c,capturedAt:c.capturedAt.replace('08:10','20:10')},c.shadowPrediction),null);
assert.equal(freezeComparison(captures,c,null),null);
assert.equal(freezeComparison(captures,{...c,forecasts:[]},c.shadowPrediction),null);
assert.equal(freezeComparison([], {...c,observed:[]},c.shadowPrediction),null);
for(const invalid of [{...p,trainingDays:0},{...p,persistenceAvailableAt:p.issuedAt},{...p,predictions:{...p.predictions,fonta:{max:null,min:0}}},{...p,issuedAt:'invalid'},{...p,date:'2026-01-01'}])assert(!validFrozenComparison(invalid,c));
const old=captures.map(({frozenComparison,...c})=>c);assert.equal(evaluateFrozenComparisons(old,{now}).days,0);
const future=captures.map(c=>({...c,observed:c.observed.map(o=>({...o,availableAt:'2027-01-01T00:00:00Z'}))}));assert.equal(evaluateFrozenComparisons(future,{now}).days,0);
assert.deepEqual(evaluateFrozenComparisons([...captures,...captures],{now}).scores,report.scores);
const mutated=structuredClone(captures);mutated.forEach(c=>c.forecasts.forEach(f=>f.daily[0].max=40));
assert.deepEqual(evaluateFrozenComparisons(mutated,{now}).scores,report.scores); // Never recalculate frozen baselines.
const incomplete=structuredClone(captures);incomplete.find(c=>c.frozenComparison).frozenComparison.predictions.blend.min=null;
const bad=evaluateFrozenComparisons(incomplete,{now});assert.equal(bad.invalidPackets,1);assert.equal(bad.days,report.days-1);

const model='icon_eu',run='2026-03-28T00:00',receivedAt='2026-03-28T08:10:00Z';
const fixture=day=>{const b=dayBounds(day),time=[];for(let t=b.start;t<b.end;t+=3600000)time.push(t/1000);return {timezone:'Europe/Madrid',hourly_units:{time:'unixtime',temperature_2m:'°C'},hourly:{time,temperature_2m:time.map(()=>0)}};};
for(const day of ['2026-03-29','2026-10-25','2026-09-21']){
  const raw=fixture(day),options={model,run,receivedAt,targetDate:day,url:singleRunRequest(model,run)};
  const good=normalizeSingleRun(raw,options);assert(good.complete);assert.equal(good.expectedHours,dayBounds(day).hours);assert.equal(good.min,0);assert.equal(good.compatibleWithDailyV1,false);assert.equal(good.publiclyAvailableAt,null);
  const missing=structuredClone(raw);missing.hourly.temperature_2m[2]=null;
  const n=normalizeSingleRun(missing,options);assert.equal(n.complete,false);assert.equal(n.max,null);assert.equal(n.missing.length,1);
  const absent=structuredClone(raw);absent.hourly.time.pop();absent.hourly.temperature_2m.pop();assert.equal(normalizeSingleRun(absent,options).complete,false);
  const repeated=structuredClone(raw);repeated.hourly.time[1]=repeated.hourly.time[0];assert.throws(()=>normalizeSingleRun(repeated,options),/Hores/);
  assert.throws(()=>normalizeSingleRun({...raw,hourly_units:{time:'unixtime',temperature_2m:'°F'}},options));
  assert.throws(()=>normalizeSingleRun(raw,{...options,url:options.url+'&models=best_match'}));
  assert.equal(normalizeSingleRun(raw,{...options,receivedAt:'2027-01-01T00:00:00Z'}).prospective,false);
}
assert.throws(()=>singleRunRequest('best_match',run));assert.throws(()=>singleRunRequest(model,'2026-02-30T00:00'));
assert.deepEqual(probePolicy('2026-12-31T08:10:00Z'),{run:'2026-12-31T00:00',targetDate:'2027-01-01',maxRequests:3,retries:0});

const temp=await mkdtemp(join(tmpdir(),'fonta-portable-'));
try{
  const source=join(temp,'source'),dest=join(temp,'export');await mkdir(source);
  const name='2026-09-20-pm.json',raw={...fixture('2026-09-21'),daily_units:{time:'unixtime',temperature_2m_max:'°C',temperature_2m_min:'°C'},daily:{time:[dayBounds('2026-09-21').start/1000],temperature_2m_max:[1],temperature_2m_min:[0]}};
  const s={kind:model,receivedAt:'2026-09-20T12:00:00Z',raw,hashFormat:'JSON.stringify',sha256:createHash('sha256').update(JSON.stringify(raw)).digest('hex')};
  const disk={schema:1,id:name.slice(0,-5),station:FONTA.station,capturedAt:'2026-09-20T12:01:00Z',sources:[s]};
  const bytes=JSON.stringify(disk)+'\n';await writeFile(join(source,name),bytes);await writeFile(join(source,'.env'),'not an actual secret');
  const exported=await exportArchive(source,dest);assert.equal(exported.captures,1);assert.equal(await readFile(join(dest,name),'utf8'),bytes);
  await assert.rejects(()=>exportArchive(source,dest),/EEXIST/);
  await writeFile(join(dest,name),bytes+' ');await assert.rejects(()=>verifyExport(dest),/Hash/);await writeFile(join(dest,name),bytes);
  const manifest=JSON.parse(await readFile(join(dest,'manifest.json'),'utf8'));manifest.files[0].name='../bad.json';await writeFile(join(dest,'manifest.json'),JSON.stringify(manifest));await assert.rejects(()=>verifyExport(dest),/Noms/);
  const links=join(temp,'links');await mkdir(links);await symlink(join(source,name),join(links,name));await assert.rejects(()=>exportArchive(links,join(temp,'bad-export')),/regular/);
  disk.frozenComparison=p;disk.frozenComparisonSha256='bad';await writeFile(join(source,name),JSON.stringify(disk));await assert.rejects(()=>readArchive(source),/prospectiu/);
}finally{await rm(temp,{recursive:true});}
const workflow=await readFile('.github/workflows/fonta-shadow.yml','utf8');assert(!workflow.includes('probe-single-runs'));assert(!workflow.includes('export-archive'));
console.log('Fonta foundations: frozen paired baselines, no backfill, DST, nulls, run provenance, portable integrity OK.');
