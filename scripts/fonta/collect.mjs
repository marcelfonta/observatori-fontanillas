import {mkdir,readdir,writeFile,stat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {FONTA,normalizeForecast,observedDays,evaluateFonta} from '../../src/core/fonta-model.js';
import {readArchive} from './archive.mjs';
import {freezeComparison} from '../../src/core/fonta-prospective.js';

// One capture per UTC half-day, create-only files, no D1 or social writes.
const directory=resolve(process.argv[2]||'build/fonta-archive');
await mkdir(directory,{recursive:true});
const startedAt=new Date().toISOString(),id=startedAt.slice(0,10)+'-'+(new Date().getUTCHours()<12?'am':'pm');
const path=join(directory,id+'.json');
try{await stat(path);console.log('Fonta: franja ja arxivada, no es repeteix.');process.exit(0);}catch(e){if(e.code!=='ENOENT')throw e;}
const names=(await readdir(directory)).filter(n=>/^\d{4}-\d{2}-\d{2}-(am|pm)\.json$/.test(n));
if(names.length>=180)throw new Error('Límit pilot de 180 captures. Revisar arxiu durable i pressupost abans de continuar.');
const total=(await Promise.all(names.map(n=>stat(join(directory,n))))).reduce((s,x)=>s+x.size,0);
if(total>100*1024*1024)throw new Error('Pressupost pilot de 100 MiB assolit; cap arxiu eliminat.');
async function get(url){
  const response=await fetch(url,{signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const text=await response.text();if(text.length>2*1024*1024)throw new Error('Resposta massa gran');
  const raw=JSON.parse(text);
  return {raw,sha256:createHash('sha256').update(JSON.stringify(raw)).digest('hex'),hashFormat:'JSON.stringify',receivedAt:new Date().toISOString(),url};
}
const forecasts=[],sources=[],failures=[];
for(const model of FONTA.models){
  const params=new URLSearchParams({latitude:String(FONTA.latitude),longitude:String(FONTA.longitude),models:model,
    timezone:'Europe/Madrid',timeformat:'unixtime',forecast_days:'3',hourly:'temperature_2m',daily:'temperature_2m_max,temperature_2m_min'});
  try{const source=await get('https://api.open-meteo.com/v1/forecast?'+params);forecasts.push(normalizeForecast(source.raw,{model,capturedAt:source.receivedAt}));sources.push({kind:model,...source});}
  catch(error){failures.push({source:model,message:error.message});}
}
let observed=[];
try{const source=await get('https://fonta-meteo.marcelfonta.workers.dev/history?days=3&resolution=raw');observed=observedDays(source.raw,source.receivedAt);sources.push({kind:'observations',...source});}
catch(error){failures.push({source:'observations',message:error.message});}
if(!forecasts.length&&!observed.length)throw new Error('Cap font disponible; no es crea una captura buida.');
const capture={schema:1,id,station:FONTA.station,version:FONTA.version,startedAt,capturedAt:new Date().toISOString(),forecasts,observed,sources,failures};
capture.codeRevision=process.env.GITHUB_SHA||null;
// Freeze any candidate before the target day. Never replace it after observing truth.
const previous=await readArchive(directory);
capture.shadowPrediction=evaluateFonta([...previous,capture]).candidate;
capture.frozenComparison=freezeComparison(previous,capture,capture.shadowPrediction);
if(capture.frozenComparison)capture.frozenComparisonSha256=createHash('sha256').update(JSON.stringify(capture.frozenComparison)).digest('hex');
await writeFile(path,JSON.stringify(capture)+'\n',{flag:'wx'});
console.log(JSON.stringify({id,forecasts:forecasts.length,observedDays:observed.length,failures}));
if(failures.length)process.exitCode=2; // Archive partial evidence, signal a degraded job.
