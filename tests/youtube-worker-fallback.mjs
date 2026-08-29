import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import workerRuntime, { youtubeShortFallbackSlot } from '../worker/index.js';

assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T04:20:00.000Z')),'mati');
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T04:39:59.000Z')),'mati');
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T04:40:00.000Z')),null);
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
assert.match(worker,/skipped:'awaiting_github'/);
assert.match(workflow,/Coordina una sola execució per franja/);
assert.match(workflow,/YOUTUBE_SHORT_SHOULD_RUN/);
assert.match(workflow,/Confirma la franja completada/);

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

console.log('Recuperació alternativa dels Shorts: correcta');
