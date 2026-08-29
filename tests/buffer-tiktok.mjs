import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import workerRuntime, { bufferTikTokRecoverySlot } from '../worker/index.js';

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');
const admin = await readFile(new URL('../administracio.html', import.meta.url), 'utf8');

assert.match(worker, /BUFFER_API_KEY/);
assert.match(worker, /BUFFER_TIKTOK_AUTOMATION_ENABLED/);
assert.match(worker, /buffer-video/);
assert.match(worker, /admin\/buffer-tiktok\/test/);
assert.match(worker, /buffer-tiktok/);
assert.match(worker, /saveToDraft:true/);
assert.match(worker, /mode:draft \? 'addToQueue' : 'customScheduled'/);
assert.match(worker, /admin\/buffer-tiktok\/diagnostics/);
assert.match(worker, /previous\?\.status === 'running'/);
assert.match(workflow, /Deixa el TikTok preparat a Buffer/);
assert.match(workflow, /buffer-tiktok/);
assert.match(workflow, /steps\.social_video_upload\.outcome == 'success'/);
assert.doesNotMatch(workflow, /name: Deixa el TikTok preparat a Buffer[\s\S]{0,250}continue-on-error: true/);
assert.match(admin, /Prova segura de TikTok amb Buffer/);
assert.match(admin, /id="admin-buffer-diagnostics"/);
assert.match(worker, /bufferTikTokAutomationEnabled:bufferTikTokEnabled/);
assert.match(worker, /recoverBufferTikTokSchedule/);
assert.match(worker, /observedJob\('buffer-tiktok-recovery'/);

assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-29T04:20:00.000Z')),'morning');
assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-29T04:54:59.000Z')),'morning');
assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-29T04:55:00.000Z')),null);
assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-29T17:45:00.000Z')),'evening');
assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-29T18:24:59.000Z')),'evening');
assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-29T18:25:00.000Z')),null);

const token='t'.repeat(32);
const env={
  ADMIN_TOKEN:'a'.repeat(32),
  BUFFER_API_KEY:'b'.repeat(32),
  SOCIAL_VIDEO_UPLOAD_TOKEN:token,
  SOCIAL_VIDEO_SIGNING_SECRET:'s'.repeat(32),
  PUBLIC_WORKER_URL:'https://fonta-meteo.example',
  SOCIAL_VIDEO_BUCKET:{ async head(){ return { size:1024 }; } },
};
const context={waitUntil(){}};
const calls=[];
const originalFetch=global.fetch;
global.fetch=async (_url,options={})=>{
  const body=JSON.parse(options.body||'{}');
  calls.push(body);
  if(body.query?.includes('account { organizations'))return Response.json({data:{account:{organizations:[{id:'org-test'}]}}});
  if(body.query?.includes('query Channels'))return Response.json({data:{channels:[{id:'channel-test',service:'tiktok',isQueuePaused:false}]}});
  if(body.query?.includes('mutation CreatePost'))return Response.json({data:{createPost:{post:{id:'draft-test',status:'draft',dueAt:null}}}});
  throw new Error('Petició Buffer inesperada');
};

const diagnostic=await workerRuntime.fetch(new Request('https://fonta-meteo.example/admin/buffer-tiktok/diagnostics',{method:'POST',headers:{Authorization:`Bearer ${token}`}}),env,context);
assert.equal(diagnostic.status,200);
assert.equal((await diagnostic.json()).service,'tiktok');

const draft=await workerRuntime.fetch(new Request('https://fonta-meteo.example/admin/buffer-tiktok/test',{
  method:'POST',
  headers:{Origin:'https://meteo.fontanillas.cat',Authorization:`Bearer ${env.ADMIN_TOKEN}`,'Content-Type':'application/json'},
  body:JSON.stringify({slot:'morning'}),
}),env,context);
global.fetch=originalFetch;
assert.equal(draft.status,201);
const createInput=calls.find(call=>call.query?.includes('mutation CreatePost'))?.variables?.input;
assert.equal(createInput.mode,'addToQueue');
assert.equal(createInput.saveToDraft,true);
assert.equal('dueAt' in createInput,false);
assert.equal(createInput.text.length<=150,true);

console.log('Cua segura de TikTok amb Buffer: correcta');
