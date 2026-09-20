import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {publicSource} from './io.mjs';
import {XEMA_CANDIDATES,xemaRequest,auditXema} from '../../src/core/fonta-xema.js';

const [flag,date,destination,...extra]=process.argv.slice(2);
if(flag!=='--fetch'||!destination||extra.length)throw new Error('Ús: --fetch DIA_LOCAL DIRECTORI_NOU');
const readingsUrl=xemaRequest(date),directory=resolve(destination);
await mkdir(dirname(directory),{recursive:true});await mkdir(directory);
const base='https://analisi.transparenciacatalunya.cat/';
const requests=[...['yqwd-vj5e','nzvn-apee','4fb2-n3yi'].map(id=>['metadata-'+id,base+'api/views/'+id+'.json']),
  ['stations',base+'resource/yqwd-vj5e.json?'+new URLSearchParams({'$where':`codi_estacio in ('${XEMA_CANDIDATES.join("','")}') and nom_estat_ema='Operativa'`,'$limit':'20'})],
  ['variable',base+'resource/4fb2-n3yi.json?codi_variable=32'],['readings',readingsUrl]];
const sources={};
// Six bounded GETs, no SMP API key or quota, no retry or scheduled caller.
for(const [name,url] of requests){const source=await publicSource(url);await writeFile(join(directory,name+'.json'),JSON.stringify(source)+'\n',{flag:'wx'});sources[name]=source;}
const report=auditXema(sources.readings.raw,sources.stations.raw,sources.variable.raw[0],{date,receivedAt:sources.readings.receivedAt});
report.datasetUpdatedAt=Object.fromEntries(['yqwd-vj5e','nzvn-apee','4fb2-n3yi'].map(id=>[id,sources['metadata-'+id].raw.rowsUpdatedAt]));
await writeFile(join(directory,'audit.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({directory,stations:report.stations.map(({code,records,coverage,validatedCoverage,reasons})=>({code,records,coverage,validatedCoverage,reasons})),automatedCollectionAllowed:false}));
