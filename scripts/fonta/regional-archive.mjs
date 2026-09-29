import {sha256} from './io.mjs';
import {REMOTE_BUDGET} from './remote-archive.mjs';
import {decodeRegionalCapture} from '../../src/core/fonta-xema-daily.js';

export const REGIONAL_CAPTURE_LIMIT=90;
export const REGIONAL_OBJECT_LIMIT=1000;
const capturePattern=/^regional\/captures\/([a-f0-9]{64})\.json$/;
const reportPattern=/^regional\/reports\/([a-f0-9]{64})\.json$/;

function bytes(value){return Buffer.from(JSON.stringify(value)+'\n');}
function validateInventory(inventory){
  if(!Array.isArray(inventory)||inventory.length>=REGIONAL_OBJECT_LIMIT||inventory.some(object=>typeof object.key!=='string'||!Number.isSafeInteger(object.size)||object.size<0)||new Set(inventory.map(object=>object.key)).size!==inventory.length)throw new Error('Inventari R2 regional invàlid');
  return inventory;
}

export async function readRegionalCaptures(transport){
  const inventory=validateInventory(await transport.inventory());
  const objects=inventory.filter(object=>capturePattern.test(object.key));
  if(objects.length>REGIONAL_CAPTURE_LIMIT)throw new Error('Límit de captures regionals assolit');
  const captures=[];
  for(const object of objects){
    if(object.size<=0||object.size>2*1024*1024)throw new Error('Mida de captura regional invàlida');
    const body=await transport.get(object.key),expected=object.key.match(capturePattern)[1];
    if(body.length!==object.size||sha256(body)!==expected)throw new Error('Integritat regional incorrecta');
    const capture=JSON.parse(body);decodeRegionalCapture(capture);captures.push(capture);
  }
  return {captures,inventory};
}

export async function uploadRegionalEvidence(capture,report,transport,{commit=false,inventory}={}){
  decodeRegionalCapture(capture);
  if(report?.schema!==1||report.kind!=='fonta-xema-daily-report'||report.productionEnabled!==false||report.promotion?.allowed!==false)throw new Error('Informe regional invàlid');
  inventory=validateInventory(inventory??await transport.inventory());
  const captureBody=bytes(capture),reportBody=bytes(report);
  const planned=[{key:`regional/captures/${sha256(captureBody)}.json`,body:captureBody},{key:`regional/reports/${sha256(reportBody)}.json`,body:reportBody}];
  const existing=new Map(inventory.map(object=>[object.key,object.size]));
  const newObjects=planned.filter(item=>!existing.has(item.key));
  const totalBytes=inventory.reduce((sum,object)=>sum+object.size,0)+newObjects.reduce((sum,item)=>sum+item.body.length,0);
  if(totalBytes>REMOTE_BUDGET||inventory.length+newObjects.length>=REGIONAL_OBJECT_LIMIT)throw new Error('Límit remot assolit; res eliminat');
  for(const item of planned)if(existing.has(item.key)){
    const remote=await transport.get(item.key);
    if(remote.length!==item.body.length||sha256(remote)!==sha256(item.body))throw new Error('Conflicte regional; cap sobreescriptura');
  }
  let uploaded=0;
  if(commit)for(const item of planned){
    if(existing.has(item.key))continue;
    await transport.put(item.key,item.body);
    const remote=await transport.get(item.key);
    if(remote.length!==item.body.length||sha256(remote)!==sha256(item.body))throw new Error('Verificació regional posterior incorrecta');
    uploaded++;
  }
  return {schema:1,kind:'fonta-xema-daily-receipt',committed:commit,uploaded,captureKey:planned[0].key,reportKey:planned[1].key,
    totalBytes,budgetBytes:REMOTE_BUDGET,productionEnabled:false};
}

export const isRegionalReportKey=key=>reportPattern.test(key);
