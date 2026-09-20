import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {SINGLE_RUN_MODELS,singleRunRequest,normalizeSingleRun,probePolicy} from '../../src/core/fonta-single-runs.js';

// Explicit local probe only: no workflow imports it and no production archive writes.
if(process.argv.length!==4||process.argv[2]!=='--fetch')throw new Error('Ús: node scripts/fonta/probe-single-runs.mjs --fetch NOU_DIRECTORI_LOCAL');
const directory=resolve(process.argv[3]);
const startedAt=new Date().toISOString(),policy=probePolicy(startedAt);
await mkdir(dirname(directory),{recursive:true});await mkdir(directory); // EEXIST: never mix with v1 or overwrite.
const results=[];
for(const model of SINGLE_RUN_MODELS){
  const url=singleRunRequest(model,policy.run);
  try{
    const response=await fetch(url,{signal:AbortSignal.timeout(25000),redirect:'error'});
    if(!response.ok)throw new Error('HTTP '+response.status);
    const text=await response.text();if(text.length>1024*1024)throw new Error('Resposta massa gran');
    const raw=JSON.parse(text),receivedAt=new Date().toISOString();
    const normalized=normalizeSingleRun(raw,{model,run:policy.run,receivedAt,targetDate:policy.targetDate,url});
    const source={url,receivedAt,hashFormat:'JSON.stringify',sha256:createHash('sha256').update(JSON.stringify(raw)).digest('hex'),raw};
    await writeFile(join(directory,model+'.json'),JSON.stringify({schema:2,policy,source,normalized})+'\n',{flag:'wx'});
    results.push({model,complete:normalized.complete,validHours:normalized.validHours,expectedHours:normalized.expectedHours,prospective:normalized.prospective});
  }catch(error){results.push({model,error:error.message});}
}
await writeFile(join(directory,'probe.json'),JSON.stringify({startedAt,finishedAt:new Date().toISOString(),policy,results,activated:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({directory,results,activated:false}));
if(results.some(r=>r.error||!r.complete))process.exitCode=2;
