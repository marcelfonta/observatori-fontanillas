import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {verifyExport,validateManifest} from './export-archive.mjs';
import {sha256,boundedBody} from './io.mjs';

export const ARCHIVE_BUCKET='fonta-research-archive';
export const REMOTE_BUDGET=100*1024*1024;
const validHash=h=>typeof h==='string'&&/^[a-f0-9]{64}$/.test(h);
const objectKey=h=>'captures/'+h+'.json';
const manifestKey=h=>'manifests/'+h+'.json';

// REST transport for this small archive. No token is logged or saved. Use a
// dedicated credential, not the Worker's production token. No DELETE operation.
export function r2Transport({accountId,token,jurisdiction='default',fetcher=fetch}){
  if(!/^[a-f0-9]{32}$/.test(accountId)||typeof token!=='string'||!token.trim()||!['default','eu'].includes(jurisdiction))throw new Error('Credencials R2 incompletes');
  const base=`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${ARCHIVE_BUCKET}`;
  async function request(suffix,{method='GET',body}={}){
    const response=await fetcher(base+suffix,{method,body,redirect:'error',signal:AbortSignal.timeout(25000),
      headers:{Authorization:'Bearer '+token,'cf-r2-jurisdiction':jurisdiction,'Content-Type':'application/octet-stream','cf-r2-storage-class':'Standard'}});
    if(!response.ok)throw new Error('R2 HTTP '+response.status); // never echo credential/server body
    return response;
  }
  const key=k=>{if(!/^(captures|manifests)\/[a-f0-9]{64}\.json$/.test(k))throw new Error('Clau R2 invàlida');return k;};
  return {
    async inventory(){
      const response=await request('/objects?per_page=1000');
      const j=JSON.parse(await boundedBody(response,2*1024*1024));
      // Fail closed rather than silently budget only the first page.
      if(j.success!==true||!Array.isArray(j.result)||j.result.length>=1000||j.result_info?.is_truncated!==false)throw new Error('Inventari R2 incomplet');
      return j.result;
    },
    async get(k){return boundedBody(await request('/objects/'+key(k)),12*1024*1024);},
    async put(k,body){await request('/objects/'+key(k),{method:'PUT',body});}
  };
}

export async function uploadExport(directory,transport,{commit=false}={}){
  await verifyExport(directory);
  const manifestBytes=await readFile(join(directory,'manifest.json'));
  const manifest=validateManifest(JSON.parse(manifestBytes)),id=sha256(manifestBytes);
  const inventory=await transport.inventory();
  if(!Array.isArray(inventory)||inventory.some(o=>typeof o.key!=='string'||!Number.isSafeInteger(o.size)||o.size<0)||new Set(inventory.map(o=>o.key)).size!==inventory.length)throw new Error('Inventari R2 invàlid');
  const objects=new Map(inventory.map(o=>[o.key,o.size]));
  const planned=[...manifest.files.map(f=>({key:objectKey(f.sha256),hash:f.sha256,bytes:f.bytes,name:f.name})),
    {key:manifestKey(id),hash:id,bytes:manifestBytes.length,name:'manifest.json'}];
  const extra=planned.filter(p=>!objects.has(p.key)).reduce((s,p)=>s+p.bytes,0);
  const total=inventory.reduce((s,o)=>s+o.size,0)+extra;
  if(total>REMOTE_BUDGET||inventory.length+planned.filter(p=>!objects.has(p.key)).length>=1000)throw new Error('Límit remot assolit; res eliminat');
  // Even a dry-run checks conflicts in objects already present.
  for(const p of planned)if(objects.has(p.key)){
    const bytes=await transport.get(p.key);
    if(objects.get(p.key)!==p.bytes||bytes.length!==p.bytes||sha256(bytes)!==p.hash)throw new Error('Conflicte remot; cap sobreescriptura');
  }
  let uploaded=0;
  if(commit)for(const p of planned){
    if(objects.has(p.key))continue;
    const data=await readFile(join(directory,p.name));
    if(data.length!==p.bytes||sha256(data)!==p.hash)throw new Error('Origen modificat');
    // Content-addressed keys: concurrent identical writers have identical bytes.
    // Budget requires one serialized writer; no atomic object lock is claimed.
    await transport.put(p.key,data);
    const back=await transport.get(p.key);
    if(back.length!==p.bytes||sha256(back)!==p.hash)throw new Error('Verificació després de pujada incorrecta');
    uploaded++;
  }
  return {manifestId:id,bucket:ARCHIVE_BUCKET,committed:commit,uploaded,additionalBytes:extra,totalBytes:total,budgetBytes:REMOTE_BUDGET};
}

export async function restoreExport(manifestId,destination,transport){
  if(!validHash(manifestId))throw new Error('Identificador de manifest invàlid');
  const bytes=await transport.get(manifestKey(manifestId));
  if(bytes.length>1024*1024||sha256(bytes)!==manifestId)throw new Error('Integritat del manifest incorrecta');
  const manifest=validateManifest(JSON.parse(bytes));
  await mkdir(dirname(destination),{recursive:true});await mkdir(destination); // must be new
  for(const f of manifest.files){
    const data=await transport.get(objectKey(f.sha256));
    if(data.length!==f.bytes||sha256(data)!==f.sha256)throw new Error('Integritat de restauració incorrecta');
    await mkdir(dirname(join(destination,f.name)),{recursive:true});
    await writeFile(join(destination,f.name),data,{flag:'wx'});
  }
  // A manifest alone is not a successful restore: final semantic verification
  // below must succeed. Never promote this directory to the active archive here.
  await writeFile(join(destination,'manifest.json'),bytes,{flag:'wx'});
  return verifyExport(destination);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [mode,source,arg,...extra]=process.argv.slice(2);
  if(extra.length||!source||!['plan','upload','restore'].includes(mode)||(mode==='upload'&&arg!=='--confirm')||(mode==='plan'&&arg)||(mode==='restore'&&!arg))throw new Error('Ús: plan EXPORT | upload EXPORT --confirm | restore MANIFEST_SHA DIRECTORI_NOU');
  const transport=r2Transport({accountId:process.env.FONTA_R2_ACCOUNT_ID,token:process.env.FONTA_R2_API_TOKEN,jurisdiction:process.env.FONTA_R2_JURISDICTION||'default'});
  console.log(JSON.stringify(mode==='restore'?await restoreExport(source,resolve(arg),transport):await uploadExport(resolve(source),transport,{commit:mode==='upload'})));
}
