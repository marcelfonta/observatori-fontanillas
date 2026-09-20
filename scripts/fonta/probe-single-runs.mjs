import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {SINGLE_RUN_MODELS,singleRunRequest,normalizeSingleRun,probePolicy} from '../../src/core/fonta-single-runs.js';
import {publicSource} from './io.mjs';

// Separate schema-2 capture; opt-in workflow wrapper never modifies v1 captures.
if(process.argv.length!==4||process.argv[2]!=='--fetch')throw new Error('Ús: node scripts/fonta/probe-single-runs.mjs --fetch NOU_DIRECTORI_LOCAL');
const directory=resolve(process.argv[3]);
const startedAt=new Date().toISOString(),policy=probePolicy(startedAt);
await mkdir(dirname(directory),{recursive:true});await mkdir(directory); // EEXIST: never mix with v1 or overwrite.
const results=[];
for(const model of SINGLE_RUN_MODELS){
  const url=singleRunRequest(model,policy.run);
  try{
    const source=await publicSource(url,{maxBytes:1024*1024});
    const {raw,receivedAt}=source;
    const normalized=normalizeSingleRun(raw,{model,run:policy.run,receivedAt,targetDate:policy.targetDate,url});
    await writeFile(join(directory,model+'.json'),JSON.stringify({schema:2,policy,source,normalized})+'\n',{flag:'wx'});
    results.push({model,complete:normalized.complete,validHours:normalized.validHours,expectedHours:normalized.expectedHours,prospective:normalized.prospective});
  }catch(error){results.push({model,error:error.message});}
}
await writeFile(join(directory,'probe.json'),JSON.stringify({startedAt,finishedAt:new Date().toISOString(),policy,results,activated:false},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({directory,results,activated:false}));
if(results.some(r=>r.error||!r.complete))process.exitCode=2;
