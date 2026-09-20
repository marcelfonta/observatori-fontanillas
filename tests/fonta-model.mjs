import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readArchive} from '../scripts/fonta/archive.mjs';
import {FONTA,dayBounds,localDay,nextDay,normalizeForecast,observedDays,evaluateFonta} from '../src/core/fonta-model.js';
import {diagnoseArchive,executionMetadata,missingCaptureSlots} from '../src/core/fonta-diagnostics.js';

assert.equal(dayBounds('2026-03-29').hours,23);assert.equal(dayBounds('2026-10-25').hours,25);
assert.equal(nextDay('2026-12-31'),'2027-01-01');assert.throws(()=>dayBounds('2026-02-30'));
const history=(day,jitter=false)=>{
  const {start,end}=dayBounds(day),observations=[];
  for(let t=start+150000,i=0;t<end;t+=300000,i++)observations.push({epoch:(t+(jitter?(i%2?25000:-25000):0))/1000,temperature:20+Math.sin(i/30),samples:1});
  return {stationId:FONTA.station,interval:'raw',storage:{enabled:true},observations};
};
for(const day of ['2026-03-29','2026-10-25','2026-09-18']){
  const data=history(day,true),result=observedDays(data,nextDay(day)+'T08:00:00Z')[0];
  assert.equal(result.eligible,true);assert.equal(result.expectedSamples,dayBounds(day).bins);assert(result.coverage>=.9);
  const repeated=structuredClone(data);repeated.observations.push(...data.observations);assert.equal(observedDays(repeated,nextDay(day)+'T08:00:00Z')[0].samples,result.samples);
}
const h=history('2026-09-18');
const missing=structuredClone(h);missing.observations[20].temperature=null;assert.equal(observedDays(missing,'2026-09-19T08:00:00Z')[0].eligible,false);
const zero=structuredClone(h);zero.observations.forEach(x=>x.temperature=0);assert.equal(observedDays(zero,'2026-09-19T08:00:00Z')[0].min,0);
const jump=structuredClone(h);jump.observations[20].temperature=45;assert.equal(observedDays(jump,'2026-09-19T08:00:00Z')[0].eligible,false);
const gap=structuredClone(h);gap.observations.splice(100,5);assert.equal(observedDays(gap,'2026-09-19T08:00:00Z')[0].eligible,false);
assert(observedDays(gap,'2026-09-19T08:00:00Z')[0].reasons.includes('gap'));
assert(observedDays(missing,'2026-09-19T08:00:00Z')[0].reasons.includes('invalid'));
assert(observedDays(jump,'2026-09-19T08:00:00Z')[0].reasons.includes('jump'));
assert.deepEqual(observedDays(zero,'2026-09-19T08:00:00Z')[0].reasons,[]);
assert.throws(()=>observedDays({...h,stationId:'other'},'2026-09-19T08:00:00Z'));
assert.throws(()=>observedDays({...h,interval:'daily'},'2026-09-19T08:00:00Z'));
assert.equal(observedDays(h,'2026-09-18T20:00:00Z').length,0);
const raw={timezone:'Europe/Madrid',hourly_units:{time:'unixtime',temperature_2m:'°C'},daily_units:{time:'unixtime',temperature_2m_max:'°C',temperature_2m_min:'°C'},hourly:{time:[1789902000,1789905600],temperature_2m:[0,null]},daily:{time:[1789941600],temperature_2m_max:[25],temperature_2m_min:[15]}};
const options={model:'icon_eu',capturedAt:'2026-09-20T08:10:00Z'};
const forecast=normalizeForecast(raw,options);assert.equal(forecast.modelRunAt,null);assert.equal(forecast.hourly[0].temperature,0);assert.equal(forecast.hourly[1].temperature,null);
assert.throws(()=>normalizeForecast({...raw,hourly_units:{...raw.hourly_units,temperature_2m:'°F'}},options));
assert.throws(()=>normalizeForecast({...raw,hourly:{...raw.hourly,time:[1789902000,1789902000]}},options));
assert.throws(()=>normalizeForecast(raw,{...options,model:'fake'}));

// Synthetic data tests algorithms, never a claimed real skill score.
const captures=[];
for(let i=0;i<65;i++){
  const day=nextDay('2026-05-01',i),capturedAt=day+'T08:10:00Z';
  captures.push({schema:1,id:day+'-am',station:FONTA.station,capturedAt,
    observed:[{date:nextDay(day,-1),availableAt:day+'T08:09:59Z',max:25,min:15,eligible:true}],
    forecasts:FONTA.models.map(model=>({model,availableAt:capturedAt,daily:[{date:nextDay(day),max:23,min:13,complete:true}]}))});
}
const result=evaluateFonta(captures,{now:'2026-08-01T00:00:00Z'});
assert.equal(result.status,'experimental-evaluation');assert.equal(result.productionEnabled,false);assert.equal(result.promotion.allowed,false);
assert(result.evaluatedDays>=14);assert.equal(result.scores.fonta.max.mae,0);assert.equal(result.scores.blend.max.mae,2);
assert.equal(result.candidate.max,25);assert.equal(result.candidate.min,15);assert.equal(result.prospective.days,0);
const frozen=structuredClone(captures);
for(let i=0;i<frozen.length;i++)frozen[i].shadowPrediction=evaluateFonta(frozen.slice(0,i+1),{now:frozen[i].capturedAt}).candidate;
const prospective=evaluateFonta(frozen,{now:'2026-08-01T00:00:00Z'});assert(prospective.prospective.days>0);assert.equal(prospective.prospective.max.mae,0);
for(const row of result.evaluation){assert(row.trainingLastAvailableAt<row.issuedAt);assert.equal(row.correction.max,2);assert(row.trainingDays>=30);}
for(const score of Object.values(result.scores))assert.equal(score.max.samples,result.evaluatedDays);
const initial=evaluateFonta(captures.slice(0,12),{now:'2026-08-01T00:00:00Z'});assert.equal(initial.status,'collecting');assert.equal(initial.scores.fonta.max.mae,null);
const delayed=structuredClone(captures);delayed.forEach(c=>c.observed.forEach(o=>o.availableAt='2026-09-01T00:00:00Z'));
assert.equal(evaluateFonta(delayed,{now:'2026-08-01T00:00:00Z'}).evaluatedDays,0);
const noModels=structuredClone(captures);noModels.forEach(c=>c.forecasts.pop());assert.equal(evaluateFonta(noModels,{now:'2026-08-01T00:00:00Z'}).pairedDays,0);
const wrongWindow=structuredClone(captures);wrongWindow.forEach(c=>c.capturedAt=c.capturedAt.replace('08:10','15:10'));assert.equal(evaluateFonta(wrongWindow,{now:'2026-08-01T00:00:00Z'}).pairedDays,0);
const before=evaluateFonta(captures,{now:'2026-05-15T23:00:00Z'});assert.equal(before.captureCount,15);
assert.deepEqual(evaluateFonta([...captures,...captures],{now:'2026-08-01T00:00:00Z'}).scores,result.scores);
const changed=structuredClone(captures);changed.at(-1).observed[0].max=40;
const changedResult=evaluateFonta(changed,{now:'2026-08-01T00:00:00Z'});assert.deepEqual(changedResult.evaluation[0],result.evaluation[0]);

// Diagnostic progress never confuses observation count with paired training days.
const diagnostic=diagnoseArchive(captures,result,{bytes:0,execution:executionMetadata({GITHUB_EVENT_NAME:'schedule',GITHUB_RUN_ID:'123'})});
assert.equal(diagnostic.progress.trainingDays,result.trainingAvailableDays);
assert.equal(diagnostic.progress.prospectiveDays,0);assert.equal(diagnostic.budget.bytes,0);
assert.equal(diagnostic.execution.event,'schedule');assert.equal(diagnostic.execution.runId,'123');
assert.equal(diagnostic.recentCaptures.length,14);assert.equal(diagnostic.quality.recent.length,14);
assert(diagnostic.sources.slice(0,4).every(s=>s.modelRunAt===null));
assert.equal(diagnoseArchive(captures,result,{bytes:81*1024*1024}).budget.reviewNeeded,true);
assert.equal(diagnoseArchive([],evaluateFonta([])).budget.bytes,null);
assert.equal(diagnoseArchive([],evaluateFonta([])).progress.trainingDays,0);
assert.equal(diagnoseArchive(wrongWindow,evaluateFonta(wrongWindow,{now:'2026-08-01T00:00:00Z'})).recentCaptures[0].issueState,'outside-window');
assert.equal(diagnoseArchive(noModels,evaluateFonta(noModels,{now:'2026-08-01T00:00:00Z'})).recentCaptures[0].issueState,'incomplete-models');
assert.deepEqual(executionMetadata({GITHUB_EVENT_NAME:'secret-value',GITHUB_RUN_ID:'https://evil.example'}),{event:'local-or-unknown',runId:null});
const cadence={firstCaptureAt:'2026-09-20T12:12:00Z',recentCaptures:[{capturedAt:'2026-09-20T12:12:00Z'}]};
assert.deepEqual(missingCaptureSlots(cadence,'2026-09-20T23:00:00Z'),[]); // manual pm fills its slot
assert.deepEqual(missingCaptureSlots(cadence,'2026-09-21T10:09:59Z'),[]);
assert.deepEqual(missingCaptureSlots(cadence,'2026-09-21T10:10:00Z'),['2026-09-21-am']);
assert.equal(missingCaptureSlots({},'2026-09-21T10:10:00Z'),null);
assert(missingCaptureSlots(cadence,'2026-10-29T12:00:00Z').length<=14); // bounded and UTC across DST

// Idempotent collector must exit before making any network call.
const temp=await mkdtemp(join(tmpdir(),'fonta-test-'));
try{
  const now=new Date(),id=now.toISOString().slice(0,10)+'-'+(now.getUTCHours()<12?'am':'pm')+'.json';
  await writeFile(join(temp,id),'existing');
  const run=spawnSync(process.execPath,['scripts/fonta/collect.mjs',temp],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);assert.equal(await readFile(join(temp,id),'utf8'),'existing');
  const source={kind:'icon_eu',receivedAt:options.capturedAt,hashFormat:'JSON.stringify',raw,sha256:createHash('sha256').update(JSON.stringify(raw)).digest('hex')};
  const valid={schema:1,id:id.slice(0,-5),capturedAt:now.toISOString(),sources:[source]};
  await writeFile(join(temp,id),JSON.stringify(valid));assert.equal((await readArchive(temp))[0].forecasts.length,1);
  const reportRun=spawnSync(process.execPath,['scripts/fonta/report.mjs',temp],{encoding:'utf8'});
  assert.equal(reportRun.status,0,reportRun.stderr);
  const diskReport=JSON.parse(await readFile(join(temp,'status.json'),'utf8'));
  assert.equal(diskReport.diagnostics.schema,1);assert(diskReport.diagnostics.budget.bytes>0);
  valid.sources[0].raw.daily.temperature_2m_max[0]=35;await writeFile(join(temp,id),JSON.stringify(valid));await assert.rejects(()=>readArchive(temp),/Integritat/);
}finally{await rm(temp,{recursive:true});}
const worker=await readFile('worker/index.js','utf8');assert(!worker.includes('fonta-model.js'));
const workflow=await readFile('.github/workflows/fonta-shadow.yml','utf8');
assert(workflow.includes("vars.FONTA_SHADOW_ENABLED == 'true'"));assert(workflow.includes('HEAD:fonta-data'));assert(!/\$\{\{\s*secrets\./.test(workflow));assert(!workflow.includes('--force'));
console.log('Fonta: dates/DST, absències, jitter, qualitat, embargament, comparadors, idempotència i aïllament OK.');
