import {readFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {normalizeForecast,observedDays} from '../../src/core/fonta-model.js';

export async function readArchive(directory){
  const names=(await readdir(directory)).filter(n=>/^\d{4}-\d{2}-\d{2}-(am|pm)\.json$/.test(n)).sort();
  if(names.length>180)throw new Error('Arxiu superior al límit pilot');
  const captures=[];
  for(const name of names){
    if((await stat(join(directory,name))).size>12*1024*1024)throw new Error('Captura massa gran');
    const c=JSON.parse(await readFile(join(directory,name),'utf8'));
    if(c.id+'.json'!==name||c.schema!==1||!Array.isArray(c.sources))throw new Error('Contracte d’arxiu invàlid');
    c.forecasts=[];c.observed=[];
    const kinds=new Set();
    for(const s of c.sources){
      if(kinds.has(s.kind)||s.receivedAt>c.capturedAt||s.hashFormat!=='JSON.stringify'||createHash('sha256').update(JSON.stringify(s.raw)).digest('hex')!==s.sha256)throw new Error('Integritat incorrecta: '+name);
      kinds.add(s.kind);
      if(s.kind==='observations')c.observed=observedDays(s.raw,s.receivedAt);
      else c.forecasts.push(normalizeForecast(s.raw,{model:s.kind,capturedAt:s.receivedAt}));
    }
    captures.push(c);
  }
  return captures;
}
