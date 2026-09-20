import {readFile,readdir,lstat,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readArchive} from './archive.mjs';
import {checkSource} from './io.mjs';
import {normalizeSingleRun,SINGLE_RUN_MODELS,probePolicy} from '../../src/core/fonta-single-runs.js';
import {hourlyObservations,evaluateHourly} from '../../src/core/fonta-hourly.js';

export async function readRunDirectory(directory){
  const probeStat=await lstat(join(directory,'probe.json'));
  if(!probeStat.isFile()||probeStat.isSymbolicLink()||probeStat.size>1024*1024)throw new Error('Manifest v2 invàlid');
  const probe=JSON.parse(await readFile(join(directory,'probe.json'),'utf8'));
  const policy=probePolicy(probe.startedAt);
  if(JSON.stringify(policy)!==JSON.stringify(probe.policy)||Date.parse(probe.finishedAt)<Date.parse(probe.startedAt)||!Number.isFinite(Date.parse(probe.finishedAt)))throw new Error('Política de captura invàlida');
  const forecasts=[];
  for(const model of SINGLE_RUN_MODELS){
    const path=join(directory,model+'.json');
    try{
      const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>2*1024*1024)throw new Error('Fitxer de run invàlid');
      const c=JSON.parse(await readFile(path,'utf8'));checkSource(c.source);
      if(c.schema!==2||JSON.stringify(c.policy)!==JSON.stringify(policy)||Date.parse(c.source.receivedAt)<Date.parse(probe.startedAt)||Date.parse(c.source.receivedAt)>Date.parse(probe.finishedAt))throw new Error('Recepció incoherent');
      forecasts.push(normalizeSingleRun(c.source.raw,{model,run:policy.run,receivedAt:c.source.receivedAt,targetDate:policy.targetDate,url:c.source.url}));
    }catch(e){if(e.code!=='ENOENT')throw e;}
  }
  return {receivedAt:probe.finishedAt,targetDate:policy.targetDate,forecasts};
}
export async function hourlyReport(archiveDirectory,runsDirectory){
  const captures=await readArchive(archiveDirectory),observations=[],runs=[];
  for(const c of captures){const source=c.sources.find(s=>s.kind==='observations');if(!source)continue;
    for(const d of c.observed)observations.push(hourlyObservations(source.raw,source.receivedAt,d.date));}
  const entries=await readdir(runsDirectory,{withFileTypes:true});
  const days=entries.filter(e=>/^\d{4}-\d{2}-\d{2}$/.test(e.name));
  if(days.length>90)throw new Error('Límit de 90 dies v2');
  for(const e of days){if(!e.isDirectory()||e.isSymbolicLink())throw new Error('Directori v2 invàlid');runs.push(await readRunDirectory(join(runsDirectory,e.name)));}
  return {...evaluateHourly(runs,observations),observationDays:observations.map(o=>({date:o.date,receivedAt:o.receivedAt,complete:o.complete,validHours:o.validHours,expectedHours:o.expectedHours,reasons:o.reasons}))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [archive,runs,out,...extra]=process.argv.slice(2);if(!out||extra.length)throw new Error('Ús: ARXIU_V1 RUNS_V2 INFORME');
  const report=await hourlyReport(archive,runs);await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pairedDays:report.pairedDays,forecastDays:report.forecastDays,promotionAllowed:false}));
}
