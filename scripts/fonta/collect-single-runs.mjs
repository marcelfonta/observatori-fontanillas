import {mkdir,readdir,lstat} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readRunDirectory} from './hourly-report.mjs';

// Independent, opt-in series. Same day is never refetched, including a partial run.
if(process.argv.length!==3)throw new Error('Ús: DIRECTORI_V2');
const root=resolve(process.argv[2]);await mkdir(root,{recursive:true});
const today=new Date().toISOString().slice(0,10),destination=join(root,today);
const days=(await readdir(root)).filter(n=>/^\d{4}-\d{2}-\d{2}$/.test(n));
if(days.includes(today)){
  const stat=await lstat(destination);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('Directori invàlid');
  const old=await readRunDirectory(destination);
  console.log(JSON.stringify({reused:true,models:old.forecasts.length}));
  if(old.forecasts.length!==3||old.forecasts.some(f=>!f.complete))process.exitCode=2;
}else{
  if(days.length>=90)throw new Error('Pilot v2: límit de 90 dies; cap dada eliminada');
  let bytes=0;
  for(const day of days){
    const folder=join(root,day),s=await lstat(folder);if(!s.isDirectory()||s.isSymbolicLink())throw new Error('Directori v2 invàlid');
    for(const name of await readdir(folder)){const f=await lstat(join(folder,name));if(!f.isFile()||f.isSymbolicLink())throw new Error('Fitxer v2 invàlid');bytes+=f.size;}
  }
  // Reserve four MiB for the largest allowed three-response capture + metadata.
  if(bytes+4*1024*1024>25*1024*1024)throw new Error('Pressupost v2 de 25 MiB; cap dada eliminada');
  const result=spawnSync(process.execPath,[resolve(import.meta.dirname,'probe-single-runs.mjs'),'--fetch',destination],{stdio:'inherit',timeout:100000});
  process.exitCode=result.status??1;
}
