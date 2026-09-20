import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {FONTA,dayBounds,nextDay} from '../src/core/fonta-model.js';
import {hourlyObservations,evaluateHourly} from '../src/core/fonta-hourly.js';
import {SINGLE_RUN_MODELS,singleRunRequest,normalizeSingleRun} from '../src/core/fonta-single-runs.js';
import {auditXema,xemaRequest,XEMA_CANDIDATES} from '../src/core/fonta-xema.js';
import {exportArchive} from '../scripts/fonta/export-archive.mjs';
import {uploadExport,restoreExport,r2Transport,REMOTE_BUDGET} from '../scripts/fonta/remote-archive.mjs';
import {sha256,checkSource,publicSource} from '../scripts/fonta/io.mjs';
import {readRunDirectory} from '../scripts/fonta/hourly-report.mjs';

// Entirely synthetic data: never used as scientific evidence or published scores.
function observed(date){
  const b=dayBounds(date),observations=[];
  for(let t=b.start;t<b.end;t+=300000)observations.push({epoch:t/1000+120,temperature:0,samples:1});
  return {stationId:FONTA.station,interval:'raw',storage:{enabled:true},observations};
}
function fixture(date){const b=dayBounds(date),time=[];for(let t=b.start;t<b.end;t+=3600000)time.push(t/1000);return {timezone:'Europe/Madrid',hourly_units:{time:'unixtime',temperature_2m:'°C'},hourly:{time,temperature_2m:time.map(()=>1)}};}
for(const date of ['2026-03-29','2026-10-25','2026-09-21']){
  const received=nextDay(date)+'T12:00:00Z',raw=observed(date),truth=hourlyObservations(raw,received,date);
  assert(truth.complete);assert.equal(truth.validHours,dayBounds(date).hours);assert.equal(truth.min,0);assert.equal(truth.samples[0].offsetSeconds,120);
  const missing=structuredClone(raw);missing.observations.splice(12,1);assert(!hourlyObservations(missing,received,date).complete);
  const duplicate=structuredClone(raw);duplicate.observations.push({...raw.observations[0],temperature:3});assert(!hourlyObservations(duplicate,received,date).complete);
  const absent=structuredClone(raw);absent.observations[0].temperature=null;assert(!hourlyObservations(absent,received,date).complete);
  assert(!hourlyObservations(raw,date+'T12:00:00Z',date).complete);
  const day=nextDay(date,-1),run=day+'T00:00',issuedAt=day+'T08:20:00Z';
  const forecasts=SINGLE_RUN_MODELS.map(model=>normalizeSingleRun(fixture(date),{model,run,receivedAt:issuedAt,targetDate:date,url:singleRunRequest(model,run)}));
  const group={receivedAt:issuedAt,targetDate:date,forecasts},report=evaluateHourly([group],[truth],{now:received});
  assert.equal(report.pairedDays,1);assert.equal(report.promotionAllowed,false);assert.equal(report.trainedFonta,false);
  for(const score of Object.values(report.scores)){assert.equal(score.hourly.samples,truth.expectedHours);assert.equal(score.hourly.mae,1);assert.equal(score.max.samples,1);}
  assert.equal(evaluateHourly([group,group],[truth],{now:received}).pairedDays,1);
  assert.equal(evaluateHourly([{...group,forecasts:forecasts.slice(1)}],[truth],{now:received}).pairedDays,0);
  assert.equal(evaluateHourly([{...group,receivedAt:day+'T12:00:00Z'}],[truth],{now:received}).pairedDays,0);
  assert.equal(evaluateHourly([group],[truth],{now:issuedAt}).pairedDays,0);
  assert.equal(evaluateHourly([group],[{...truth,complete:false}],{now:received}).pairedDays,0);
}
const variable={codi_variable:'32',unitat:'°C'},metadata=XEMA_CANDIDATES.map(code=>({codi_estacio:code,nom_estacio:code,nom_estat_ema:'Operativa',latitud:'41.7',longitud:'2.4',altitud:'100'}));
for(const date of ['2026-03-29','2026-10-25','2026-09-19']){
  const b=dayBounds(date),rows=[];
  for(let t=b.start;t<b.end;t+=1800000)rows.push({codi_estacio:'KP',codi_variable:'32',data_lectura:new Date(t).toISOString().slice(0,-1),valor_lectura:'0',codi_base:'SH',codi_estat:'V'});
  const options={date,receivedAt:nextDay(date)+'T12:00:00Z'},good=auditXema(rows,metadata,variable,options);
  assert(good.stations[0].complete);assert.equal(good.stations[0].records,b.hours*2);assert.equal(good.stations[0].intervals[0].value,0);
  assert.equal(good.stations[1].coverage,0);assert.equal(good.automatedCollectionAllowed,false);
  const provisional=rows.map(({codi_estat,...r})=>r),p=auditXema(provisional,metadata,variable,options).stations[0];
  assert.equal(p.validatedCoverage,0);assert.equal(p.coverage,1);assert.equal(p.complete,false);
  assert(!auditXema([...rows,rows[0]],metadata,variable,options).stations[0].complete);
  const blank=structuredClone(rows);blank[0].valor_lectura='';assert(!auditXema(blank,metadata,variable,options).stations[0].complete);
  assert.throws(()=>auditXema(rows,metadata,{...variable,unitat:'°F'},options));
  assert.throws(()=>auditXema([{...rows[0],data_lectura:'2026-02-30T00:00:00'}],metadata,variable,options));
  assert(xemaRequest(date).includes('%24301')===false);assert(new URL(xemaRequest(date)).searchParams.get('$limit')==='301');
}
await assert.rejects(()=>publicSource('https://example.invalid',{maxBytes:4,fetcher:async()=>new Response('12345')}),/gran/);
assert.throws(()=>checkSource({raw:{},receivedAt:'bad'}));

const temp=await mkdtemp(join(tmpdir(),'fonta-independent-'));
try{
  const source=join(temp,'source'),portable=join(temp,'export');await mkdir(source);
  const date='2026-09-19',raw=observed(date),receivedAt='2026-09-20T08:00:00Z';
  const capture={schema:1,id:'2026-09-20-am',station:FONTA.station,capturedAt:receivedAt,sources:[{kind:'observations',raw,receivedAt,hashFormat:'JSON.stringify',sha256:sha256(JSON.stringify(raw))}]};
  await writeFile(join(source,capture.id+'.json'),JSON.stringify(capture)+'\n');await exportArchive(source,portable);
  const objects=new Map(),calls=[];
  const transport={inventory:async()=>[...objects].map(([key,data])=>({key,size:data.length})),get:async key=>{if(!objects.has(key))throw new Error('Not found');return objects.get(key);},put:async(key,data)=>{calls.push(key);objects.set(key,Buffer.from(data));}};
  const plan=await uploadExport(portable,transport);assert.equal(calls.length,0);assert(!plan.committed);
  const uploaded=await uploadExport(portable,transport,{commit:true});assert.equal(uploaded.uploaded,2);assert(calls.at(-1).startsWith('manifests/'));
  assert.equal((await uploadExport(portable,transport,{commit:true})).uploaded,0);
  const restored=join(temp,'restored');assert.equal((await restoreExport(uploaded.manifestId,restored,transport)).captures,1);
  assert.equal(await readFile(join(restored,capture.id+'.json'),'utf8'),await readFile(join(source,capture.id+'.json'),'utf8'));
  await assert.rejects(()=>restoreExport(uploaded.manifestId,restored,transport),/EEXIST/);
  await assert.rejects(()=>restoreExport('../bad',join(temp,'bad'),transport),/invàlid/);
  const key=calls[0],original=objects.get(key);objects.set(key,Buffer.from('bad'));
  await assert.rejects(()=>uploadExport(portable,transport,{commit:true}),/Conflicte/);
  await assert.rejects(()=>restoreExport(uploaded.manifestId,join(temp,'broken'),transport),/Integritat/);objects.set(key,original);
  const before=calls.length;await assert.rejects(()=>uploadExport(portable,{...transport,inventory:async()=>[{key:'unrelated',size:REMOTE_BUDGET}]},{commit:true}),/Límit/);assert.equal(calls.length,before);
  const failing={...transport,inventory:async()=>[],put:async()=>{throw new Error('offline');}};
  await assert.rejects(()=>uploadExport(portable,failing,{commit:true}),/offline/);
  const wrongManifest=Buffer.from(JSON.stringify({schema:1,kind:'fonta-portable-captures',files:[{name:'../bad'}]}));
  await assert.rejects(()=>restoreExport(sha256(wrongManifest),join(temp,'traversal'),{get:async()=>wrongManifest}),/Noms/);

  const v2=join(temp,'v2');await mkdir(v2);const run='2026-09-20T00:00',policy={run,targetDate:'2026-09-21',maxRequests:3,retries:0};
  await writeFile(join(v2,'probe.json'),JSON.stringify({startedAt:'2026-09-20T08:10:00Z',finishedAt:'2026-09-20T08:20:00Z',policy}));
  const model=SINGLE_RUN_MODELS[0],forecast=fixture(policy.targetDate),s={raw:forecast,url:singleRunRequest(model,run),receivedAt:'2026-09-20T08:15:00Z',hashFormat:'JSON.stringify',sha256:sha256(JSON.stringify(forecast))};
  await writeFile(join(v2,model+'.json'),JSON.stringify({schema:2,policy,source:s,normalized:{max:999}}));
  assert.equal((await readRunDirectory(v2)).forecasts[0].max,1); // ignores mutable derived fields
  await mkdir(join(source,'single-runs'));
  await cp(v2,join(source,'single-runs','2026-09-20'),{recursive:true});
  const mixed=join(temp,'mixed');assert.equal((await exportArchive(source,mixed)).runDays,1);
  const mixedUpload=await uploadExport(mixed,transport,{commit:true});
  assert.equal((await restoreExport(mixedUpload.manifestId,join(temp,'mixed-restored'),transport)).runDays,1);
  s.raw.hourly.temperature_2m[0]=3;await writeFile(join(v2,model+'.json'),JSON.stringify({schema:2,policy,source:s}));
  await assert.rejects(()=>readRunDirectory(v2),/Integritat/);
}finally{await rm(temp,{recursive:true});}

const r2=r2Transport({accountId:'a'.repeat(32),token:'test-only',fetcher:async()=>new Response(JSON.stringify({success:true,result:[],result_info:{is_truncated:true}}))});
await assert.rejects(()=>r2.inventory(),/incomplet/);
const workflow=await readFile('.github/workflows/fonta-single-runs.yml','utf8');assert(workflow.includes("vars.FONTA_SINGLE_RUNS_ENABLED == 'true'"));assert(workflow.includes('group: fonta-shadow-archive'));assert(!workflow.includes('secrets.'));
console.log('Fonta independent: hourly pairing/DST/missing/QC, XEMA provisional/UTC, archive roundtrip/conflicts/budgets and opt-in workflow OK.');
