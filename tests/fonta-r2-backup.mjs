import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {S3Client} from '@aws-sdk/client-s3';
import {s3Config,s3Transport} from '../scripts/fonta/r2-s3.mjs';
import {backupArchive} from '../scripts/fonta/backup.mjs';
import {ARCHIVE_BUCKET,REMOTE_BUDGET} from '../scripts/fonta/remote-archive.mjs';
import {FONTA} from '../src/core/fonta-model.js';

const credentials={accountId:'a'.repeat(32),accessKeyId:'b'.repeat(32),secretAccessKey:'c'.repeat(64)};
const cfg=s3Config(credentials),key='captures/'+'d'.repeat(64)+'.json';
assert.equal(cfg.region,'auto');assert.equal(cfg.maxAttempts,1);assert.equal(cfg.followRegionRedirects,false);
assert.equal(s3Config({...credentials,jurisdiction:'eu'}).endpoint,`https://${credentials.accountId}.eu.r2.cloudflarestorage.com`);
for(const bad of [{accountId:'bad'},{accessKeyId:''},{secretAccessKey:''},{jurisdiction:'evil'}])assert.throws(()=>s3Config({...credentials,...bad}));
const commands=[];
let response={IsTruncated:false,KeyCount:0},destroyed=false;
const client={send:async(command,options)=>{commands.push(command);assert(options.abortSignal instanceof AbortSignal);return response;},destroy(){destroyed=true;}};
const transport=s3Transport(credentials,{client});
assert.deepEqual(await transport.inventory(),[]);
assert.deepEqual(commands.at(-1).input,{Bucket:ARCHIVE_BUCKET,MaxKeys:1000});
for(const bad of [{IsTruncated:true,KeyCount:0},{KeyCount:0},{IsTruncated:false,KeyCount:1},
  {IsTruncated:false,KeyCount:0,NextContinuationToken:'next'},
  {IsTruncated:false,KeyCount:1000,Contents:Array(1000).fill({Key:key,Size:1})}]){
  response=bad;await assert.rejects(()=>transport.inventory(),/incomplet/);
}
response={IsTruncated:false,KeyCount:1,Contents:[{Key:key,Size:3}]};
assert.deepEqual(await transport.inventory(),[{key,size:3}]);
response={Body:Readable.from([Buffer.from('abc')]),ContentLength:3};
assert.equal((await transport.get(key)).toString(),'abc');assert(response.Body.destroyed);
for(const size of [2,13*1024*1024,undefined]){
  response={Body:Readable.from([Buffer.from('abc')]),ContentLength:size};
  await assert.rejects(()=>transport.get(key),/Lectura/);assert(response.Body.destroyed);
}
response={};await transport.put(key,Buffer.from('abc'));
assert.equal(commands.at(-1).input.IfNoneMatch,'*');assert.equal(commands.at(-1).input.StorageClass,'STANDARD');
const before=commands.length;
await assert.rejects(()=>transport.get('../secret'),/Clau/);
await assert.rejects(()=>transport.put(key,Buffer.alloc(0)),/invàlid/);assert.equal(commands.length,before);
transport.close();assert(destroyed);
const failing=s3Transport(credentials,{client:{send:async()=>{throw Object.assign(new Error('SECRET must not leak'),{$metadata:{httpStatusCode:403}});}}});
await assert.rejects(()=>failing.inventory(),e=>e.message==='S3 R2 HTTP 403'&&!e.message.includes('SECRET'));

// Exercise real SDK serialization, SigV4 and XML parsing without network access.
const sdk=new S3Client({...cfg,requestHandler:{
  async handle(request){
    assert.equal(request.hostname,credentials.accountId+'.r2.cloudflarestorage.com');
    assert(request.headers.authorization.includes('Credential='+credentials.accessKeyId));
    assert(!request.headers.authorization.includes(credentials.secretAccessKey));
    assert.equal(request.query['list-type'],'2');
    return {response:{statusCode:200,headers:{'content-type':'application/xml'},body:Readable.from([Buffer.from(
      '<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Name>fonta-research-archive</Name><KeyCount>0</KeyCount><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated></ListBucketResult>')])}};
  },destroy(){}
}});
assert.deepEqual(await s3Transport(credentials,{client:sdk}).inventory(),[]);sdk.destroy();

const temp=await mkdtemp(join(tmpdir(),'fonta-r2-test-'));
try{
  const source=join(temp,'source');await mkdir(source);
  const capture={schema:1,id:'2026-09-20-am',station:FONTA.station,capturedAt:'2026-09-20T08:10:00Z',sources:[]};
  await writeFile(join(source,capture.id+'.json'),JSON.stringify(capture));
  const objects=new Map(),writes=[];
  const remote={inventory:async()=>[...objects].map(([key,b])=>({key,size:b.length})),
    get:async k=>objects.get(k),put:async(k,b)=>{writes.push(k);objects.set(k,Buffer.from(b));}};
  const args={source,sourceCommit:'e'.repeat(40),snapshotAt:'2026-09-20T08:11:00Z',transport:remote};
  const plan=await backupArchive({...args,workspace:join(temp,'plan')});assert.equal(writes.length,0);assert(!plan.restored);
  const complete=await backupArchive({...args,workspace:join(temp,'complete'),commit:true});
  assert(complete.restored);assert(complete.verified.verified);assert.equal(complete.report.productionEnabled,false);
  assert.equal(writes.length,2);assert(writes.at(-1).startsWith('manifests/'));
  const again=await backupArchive({...args,workspace:join(temp,'again'),commit:true});
  assert.equal(again.manifestId,complete.manifestId);assert.equal(again.uploaded,0);assert.equal(writes.length,2);
  assert.deepEqual(JSON.parse(await readFile(join(temp,'again','receipt.json'),'utf8')),again);
  await assert.rejects(()=>backupArchive({...args,workspace:join(temp,'again'),commit:true}),/EEXIST/);
  const noSpace={...remote,inventory:async()=>[{key:'reserved',size:REMOTE_BUDGET}]};
  await assert.rejects(()=>backupArchive({...args,transport:noSpace,workspace:join(temp,'full'),commit:true}),/Límit/);assert.equal(writes.length,2);
  // Corruption detected during restore must not emit a successful receipt.
  let reads=0;
  const corrupt={...remote,get:async k=>{reads++;return reads>2?Buffer.from('corrupt'):remote.get(k);}};
  await assert.rejects(()=>backupArchive({...args,transport:corrupt,workspace:join(temp,'broken'),commit:true}),/Integritat/);
  await assert.rejects(()=>access(join(temp,'broken','receipt.json')),/ENOENT/);
  // Partial upload is safely resumable; no final manifest precedes its captures.
  objects.clear();writes.length=0;
  const partial={...remote,put:async(k,b)=>{if(k.startsWith('manifests/'))throw new Error('offline');return remote.put(k,b);}};
  await assert.rejects(()=>backupArchive({...args,transport:partial,workspace:join(temp,'partial'),commit:true}),/offline/);
  assert.equal(objects.size,1);
  const resumed=await backupArchive({...args,workspace:join(temp,'resumed'),commit:true});
  assert(resumed.restored);assert.equal(resumed.uploaded,1);
}finally{await rm(temp,{recursive:true,force:true});}

const workflow=await readFile('.github/workflows/fonta-r2-backup.yml','utf8');
for(const required of ["cron: '45 8,20 * * *'","vars.FONTA_R2_BACKUP_ENABLED == 'true'","github.ref == 'refs/heads/main'",
  'contents: read','group: fonta-r2-backup','cancel-in-progress: false','--ignore-scripts','--frozen-lockfile','persist-credentials: false',
  'secrets.FONTA_R2_ACCESS_KEY_ID','secrets.FONTA_R2_SECRET_ACCESS_KEY','default: plan','timeout-minutes: 15'])assert(workflow.includes(required),required);
for(const forbidden of ['contents: write','CLOUDFLARE_API_TOKEN','workflow_run:','pull_request:','git push','collect.mjs','wrangler deploy'])assert(!workflow.includes(forbidden));
console.log('Fonta R2 backup: least-privilege S3, real SDK parsing/signing, dry-run, restore, retry, integrity and budget OK (no remote writes).');
