import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import workerRuntime, { dispatchYoutubeShortFallback, youtubeShortFallbackSlot } from '../worker/index.js';

assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T04:20:00.000Z')),'mati');
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T04:54:59.000Z')),'mati');
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T04:55:00.000Z')),null);
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T17:45:00.000Z')),'vespre');
assert.equal(youtubeShortFallbackSlot(new Date('2026-12-10T18:45:00.000Z')),'vespre');

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');

assert.match(worker,/GITHUB_SHORTS_DISPATCH_TOKEN/);
assert.match(worker,/admin\/youtube-short\/diagnostics/);
assert.match(worker,/__fonta_youtube_dispatch_permission_check__/);
assert.match(worker,/actions\/workflows\/youtube-short-private\.yml\/dispatches/);
assert.match(worker,/youtube-short-runs/);
assert.match(worker,/youtube-shorts-fallback/);
assert.match(worker,/youtube-shorts-scheduler/);
assert.match(worker,/No s’ha pogut preparar el YouTube Short/);
assert.match(worker,/YOUTUBE_SHORT_DISPATCH_ACK_MS=8\*60\*1000/);
assert.match(worker,/YOUTUBE_SHORT_MAX_ATTEMPTS=4/);
assert.match(worker,/skipped:'awaiting_github'/);
assert.match(workflow,/Coordina una sola execució per franja/);
assert.match(workflow,/YOUTUBE_SHORT_SHOULD_RUN/);
assert.match(workflow,/Confirma la franja completada/);
assert.match(workflow,/Registra la franja fallida i limita els reintents/);
assert.match(workflow,/youtube-workflow-failure\.mjs/);
assert.match(worker,/if \(action === 'fail'\)/);

const token='t'.repeat(32);
const env={ SOCIAL_VIDEO_UPLOAD_TOKEN:token, GITHUB_SHORTS_DISPATCH_TOKEN:'g'.repeat(40) };
const originalFetch=global.fetch;
let diagnosticRequest;
global.fetch=async (url,options={})=>{
  diagnosticRequest={url:String(url),options};
  return new Response(JSON.stringify({message:'No ref found'}),{status:422});
};
const diagnostic=await workerRuntime.fetch(new Request('https://fonta-meteo.example/admin/youtube-short/diagnostics',{
  method:'POST',headers:{Authorization:`Bearer ${token}`},
}),env,{waitUntil(){}});
global.fetch=originalFetch;
assert.equal(diagnostic.status,200);
assert.deepEqual(await diagnostic.json(),{ok:true,permission:'verified',workflowStarted:false});
assert.match(diagnosticRequest.url,/actions\/workflows\/youtube-short-private\.yml\/dispatches$/);
assert.equal(JSON.parse(diagnosticRequest.options.body).ref,'refs/heads/__fonta_youtube_dispatch_permission_check__');

const sqlite=new DatabaseSync(':memory:');
for(const match of worker.matchAll(/const CREATE_[A-Z_]+ = `([\s\S]*?)`;/g))sqlite.exec(match[1]);
const DB={prepare(sql){let values=[];return {
  bind(...args){values=args;return this;},
  async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};},
  async all(){return {results:sqlite.prepare(sql).all(...values)};},
  async first(){return sqlite.prepare(sql).get(...values)||null;},
};},async batch(items){const results=[];for(const item of items)results.push(await item.run());return results;}};
const coordinatedEnv={...env,DB};
let dispatches=0;
global.fetch=async()=>{dispatches++;return new Response(null,{status:204});};
const control=async(localDate,slot,body)=>workerRuntime.fetch(new Request(`https://fonta-meteo.example/admin/youtube-short-runs/${localDate}/${slot}`,{
  method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),
}),coordinatedEnv,{waitUntil(){}});
try{
  const evening=new Date('2026-09-12T17:45:00Z');
  assert.equal((await dispatchYoutubeShortFallback(coordinatedEnv,evening)).attempt,1);
  assert.equal((await (await control('2026-09-12','vespre',{action:'start'})).json()).shouldRun,true);
  assert.equal((await control('2026-09-12','vespre',{action:'fail',stage:'youtube-auth',failureCode:'oauth_invalid_grant',terminal:true,error:'Token OAuth rebutjat.'})).status,200);
  assert.deepEqual(await (await control('2026-09-12','vespre',{action:'start'})).json(),{ok:true,shouldRun:false,reason:'terminal_failure'});
  assert.equal((await dispatchYoutubeShortFallback(coordinatedEnv,evening)).skipped,'terminal_failure');
  assert.equal(dispatches,1,'A permanent OAuth failure is never dispatched again');

  const morning=new Date('2026-09-12T04:20:00Z');
  for(let attempt=1;attempt<=4;attempt+=1){
    assert.equal((await dispatchYoutubeShortFallback(coordinatedEnv,morning)).attempt,attempt);
    assert.equal((await (await control('2026-09-12','mati',{action:'start'})).json()).shouldRun,true);
    assert.equal((await control('2026-09-12','mati',{action:'fail',stage:'youtube-upload',terminal:false,error:'Fallada temporal.'})).status,200);
  }
  assert.deepEqual(await (await control('2026-09-12','mati',{action:'start'})).json(),{ok:true,shouldRun:false,reason:'max_attempts'});
  assert.equal((await dispatchYoutubeShortFallback(coordinatedEnv,morning)).skipped,'max_attempts');
  assert.equal(sqlite.prepare("SELECT consecutive_failures FROM monitor_state WHERE service_key='youtube-short:2026-09-12:mati'").get().consecutive_failures,4);
  assert.equal(dispatches,5,'The four-attempt ceiling prevents a fifth retry');
}finally{global.fetch=originalFetch;sqlite.close();}

console.log('Recuperació alternativa dels Shorts: correcta');
