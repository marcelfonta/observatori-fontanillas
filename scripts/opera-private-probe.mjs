import { pathToFileURL } from 'node:url';

export const OPERA_BASE_URL='https://partner-api.meteofrance.fr/partner/radar/opera/1.0';
const CATALOG_PATH='/archive/odyssey';

export function operaAuthHeaders(token,mode='oauth2'){
  const value=String(token||'').trim();
  if(!value)throw new Error('Falta OPERA_ACCESS_TOKEN.');
  if(mode==='apikey')return {Accept:'application/json',apikey:value};
  if(mode==='oauth2')return {Accept:'application/json',Authorization:`Bearer ${value}`};
  throw new Error('OPERA_AUTH_MODE ha de ser oauth2 o apikey.');
}

export function summarizeOperaCatalog(payload){
  const entries=Array.isArray(payload)?payload:[payload].filter(Boolean);
  const unique=key=>[...new Set(entries.map(item=>item?.[key]).filter(value=>typeof value==='string'))].sort();
  return {
    entries:entries.length,
    countries:unique('country'),
    products:unique('product'),
    formats:[...new Set(entries.flatMap(item=>Array.isArray(item?.format)?item.format:[]))].sort(),
    productionRanges:unique('date').slice(0,20),
  };
}

async function safeError(response){
  try{
    const data=await response.json();
    return {code:String(data?.code||''),message:String(data?.message||data?.description||'').slice(0,160)};
  }catch{return {code:'',message:`HTTP ${response.status}`};}
}

export async function probeOperaCatalog({token,mode='oauth2',fetchImpl=fetch}={}){
  const started=Date.now();
  const response=await fetchImpl(`${OPERA_BASE_URL}${CATALOG_PATH}`,{
    headers:operaAuthHeaders(token,mode),
    redirect:'manual',
    signal:AbortSignal.timeout(30_000),
  });
  const common={httpStatus:response.status,durationMs:Date.now()-started,contentType:response.headers.get('content-type')||null};
  if(!response.ok){
    const error=await safeError(response);
    return {...common,status:response.status===401||response.status===403?'authorization-blocked':'api-error',error};
  }
  const payload=await response.json();
  return {...common,status:'ok',catalog:summarizeOperaCatalog(payload)};
}

async function main(){
  const result=await probeOperaCatalog({
    token:process.env.OPERA_ACCESS_TOKEN,
    mode:process.env.OPERA_AUTH_MODE||'oauth2',
  });
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='ok')process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
