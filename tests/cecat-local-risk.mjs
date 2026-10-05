import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import handler, { cecatPollSlot, parseCecatActivePlans, socialDraftTemporalEligibility } from '../worker/index.js';

const official='https://documents.dadesobertes.gencat.cat/cecat/docs/I-123_INUNCAT.pdf';
assert.deepEqual(parseCecatActivePlans([{
  plaacronim:'INUNCAT',plaactivat:'SI',plafase:'ALERTA',fasedatahora:'28/09/2026 11:36',
  descripcio:'SMP intensitat',comunicatpdf:{url:official},
}]),[{
  plan:'INUNCAT',phase:'ALERTA',description:'SMP intensitat',issuedLabel:'28/09/2026 11:36',documentUrl:official,
}]);
assert.deepEqual(parseCecatActivePlans([
  {plaacronim:'INUNCAT',plaactivat:'NO',comunicatpdf:{url:official}},
  {plaacronim:'VENTCAT',plaactivat:'SI',comunicatpdf:{url:official}},
  {plaacronim:'INUNCAT',plaactivat:'SI',comunicatpdf:{url:'https://example.com/fake.pdf'}},
]),[]);

assert.equal(cecatPollSlot(new Date('2026-09-28T08:00:00Z')),'2026-09-28:10:00');
assert.equal(cecatPollSlot(new Date('2026-09-28T08:05:00Z')),null);
assert.equal(cecatPollSlot(new Date('2026-09-28T08:30:00Z')),'2026-09-28:10:30');

const now=new Date('2026-09-28T19:00:00Z');
const payload={source:'CECAT',plan:'INUNCAT',level:'orange',targetDate:'2026-09-29',checkedAt:'2026-09-28T18:55:00Z',validUntil:'2026-09-29T12:00:00Z'};
assert.equal(socialDraftTemporalEligibility({kind:'cecat_local_risk',payload:JSON.stringify(payload)},now),true);
assert.equal(socialDraftTemporalEligibility({kind:'cecat_local_risk',payload:JSON.stringify({...payload,level:'yellow'})},now),false);
assert.equal(socialDraftTemporalEligibility({kind:'cecat_local_risk',payload:JSON.stringify({...payload,validUntil:'2026-09-28T18:59:00Z'})},now),false);

const workerSource=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const workflow=await readFile(new URL('../.github/workflows/cecat-local-risk.yml',import.meta.url),'utf8');
const script=await readFile(new URL('../scripts/cecat-local-risk.py',import.meta.url),'utf8');
const wrangler=await readFile(new URL('../ops/wrangler.example.jsonc',import.meta.url),'utf8');

assert.match(workerSource,/SOCIAL_CECAT_LOCAL_RISK_ENABLED/);
assert.match(workerSource,/SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED/);
assert.match(workerSource,/cecat-local-risk\.yml/);
assert.match(workerSource,/kind IN \('official_alert','cecat_local_risk'\)/);
assert.match(workflow,/workflow_dispatch:/);
assert.match(workflow,/SOCIAL_VIDEO_UPLOAD_TOKEN/);
assert.match(workflow,/steps\.analysis\.outputs\.publishable == 'true'/);
assert.doesNotMatch(workflow,/META_SYSTEM_USER_TOKEN|THREADS_ACCESS_TOKEN|BLUESKY_APP_PASSWORD/);
assert.match(script,/no_local_orange_red_risk/);
assert.match(script,/class NoSupportedRiskMaps\(Exception\):/);
assert.match(script,/"reason": "no_supported_risk_maps"/);
assert.match(script,/except NoSupportedRiskMaps as error:[\s\S]*?return 0/);
assert.match(script,/if 0 < len\(images\) < len\(WINDOW_BY_XOBJECT\):\s+continue/);
assert.match(script,/A page that claims to contain four maps[\s\S]*?must still fail closed/);
assert.match(script,/official-raster-local-patch-v1/);
assert.match(script,/documents\.dadesobertes\.gencat\.cat/);
assert.match(wrangler,/"SOCIAL_CECAT_LOCAL_RISK_ENABLED": "false"/);
assert.match(wrangler,/"SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED": "false"/);

const sqlite=new DatabaseSync(':memory:');
for(const match of workerSource.matchAll(/const CREATE_[A-Z_]+ = `([\s\S]*?)`;/g))sqlite.exec(match[1]);
const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this;},async first(){return sqlite.prepare(sql).get(...values)||null;},async all(){return {results:sqlite.prepare(sql).all(...values)};},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...values).changes)}};}};},async batch(items){return Promise.all(items.map(item=>item.run()));}};
const objects=new Map();
const bucket={async put(key,body,options){objects.set(key,{data:new Uint8Array(await new Response(body).arrayBuffer()),options});}};
const uploadToken='u'.repeat(32);
const checkedAt=new Date();
const validUntil=new Date(checkedAt.getTime()+6*3600000);
const localTarget=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(validUntil);
const windows=[
  {startHourUtc:0,endHourUtc:6,windowLabel:'02:00–08:00 h',endAt:new Date(checkedAt.getTime()+1*3600000).toISOString(),level:'green',levelLabel:'Verd',riskCounts:{green:40,yellow:0,orange:0,red:0}},
  {startHourUtc:6,endHourUtc:12,windowLabel:'08:00–14:00 h',endAt:new Date(checkedAt.getTime()+2*3600000).toISOString(),level:'yellow',levelLabel:'Groc',riskCounts:{green:10,yellow:30,orange:0,red:0}},
  {startHourUtc:12,endHourUtc:18,windowLabel:'14:00–20:00 h',endAt:new Date(checkedAt.getTime()+4*3600000).toISOString(),level:'orange',levelLabel:'Taronja',riskCounts:{green:20,yellow:0,orange:40,red:0}},
  {startHourUtc:18,endHourUtc:24,windowLabel:'20:00–02:00 h',endAt:validUntil.toISOString(),level:'orange',levelLabel:'Taronja',riskCounts:{green:20,yellow:0,orange:40,red:0}},
];
const metadata={
  publishable:true,source:'CECAT',plan:'INUNCAT',phase:'ALERTA',documentKey:'a'.repeat(24),
  documentUrl:official,documentSha256:'b'.repeat(64),issuedAt:checkedAt.toISOString(),checkedAt:checkedAt.toISOString(),
  targetDate:localTarget,dateLabel:'29/09/2026',windows,validUntil:validUntil.toISOString(),
  phenomenon:'Intensitat de pluja',level:'orange',levelLabel:'Taronja',
  analysisMethod:'official-raster-local-patch-v1',
};
const multipart=async(overrides={})=>{
  const form=new FormData();
  form.set('metadata',JSON.stringify({...metadata,...overrides}));
  const png=new Uint8Array(1400).fill(1);png.set([137,80,78,71,13,10,26,10]);
  const jpeg=new Uint8Array(1400).fill(2);jpeg.set([255,216]);jpeg.set([255,217],jpeg.length-2);
  form.set('image_png',new Blob([png],{type:'image/png'}),'card.png');
  form.set('image_jpeg',new Blob([jpeg],{type:'image/jpeg'}),'card.jpg');
  const encoded=new Response(form);
  const body=await encoded.arrayBuffer();
  return new Request('https://worker.example/admin/cecat-local-risk',{method:'POST',headers:{Authorization:`Bearer ${uploadToken}`,'Content-Type':encoded.headers.get('Content-Type'),'Content-Length':String(body.byteLength)},body});
};
const env={DB,SOCIAL_VIDEO_BUCKET:bucket,SOCIAL_VIDEO_UPLOAD_TOKEN:uploadToken,SOCIAL_CECAT_LOCAL_RISK_ENABLED:'true',SOCIAL_CECAT_LOCAL_RISK_AUTOPUBLISH_ENABLED:'false'};
const incomplete=await handler.fetch(await multipart({windows:windows.slice(0,3)}),env,{waitUntil(){}});
assert.equal(incomplete.status,422);
const first=await handler.fetch(await multipart(),env,{waitUntil(){}});
const firstPayload=await first.json();
assert.equal(first.status,201,JSON.stringify(firstPayload));
assert.equal(firstPayload.created,true);assert.equal(firstPayload.autoPublish,false);assert.equal(firstPayload.status,'review');
const second=await handler.fetch(await multipart({documentKey:'c'.repeat(24),documentSha256:'d'.repeat(64)}),env,{waitUntil(){}});
assert.equal(second.status,200);assert.equal((await second.json()).created,false);
const redWindows=windows.map((item,index)=>index===3?{...item,level:'red',levelLabel:'Vermell',riskCounts:{green:0,yellow:0,orange:0,red:40}}:item);
const changed=await handler.fetch(await multipart({documentKey:'e'.repeat(24),documentSha256:'f'.repeat(64),level:'red',levelLabel:'Vermell',windows:redWindows}),env,{waitUntil(){}});
assert.equal(changed.status,201);assert.equal((await changed.json()).created,true);
assert.equal(sqlite.prepare("SELECT COUNT(*) AS total FROM social_drafts WHERE kind='cecat_local_risk'").get().total,2);
assert.equal(objects.size,4);
sqlite.close();

console.log('CECAT local complementari: correcte');
