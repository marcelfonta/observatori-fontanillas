import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, existsSync, readFileSync as read } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const generator=readFileSync(new URL('../scripts/camera-timelapse.sh',import.meta.url),'utf8');
const parser=generator.match(/CAMERA_AIR_URL[\s\S]*?\| python3 -c '\n([\s\S]*?)\n' "\$DATE"/)?.[1];
assert.ok(parser,'Cal trobar el validador oficial XVPCA del timelapse.');
const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
const part=type=>parts.find(item=>item.type===type).value;
const day=`${part('year')}-${part('month')}-${part('day')}`;
const stamp=`${part('day')}/${part('month')}/${part('year')} ${part('hour')}:00`;
const fixture={features:[{id:'ES1275A',properties:{localitat:'Sant Celoni',dataActualitzacio:stamp,contaminants:[
  {abbr:'NO2',dadesHoraries:[{hora:part('hour'),valor:'26',qualitat:'bona'}]},
  {abbr:'O3',dadesHoraries:[{hora:part('hour'),valor:'16',qualitat:'regular'}]},
  {abbr:'PM10',dadesHoraries:[{hora:part('hour'),valor:'17',qualitat:'bona'}]},
]}}]};
const run=(date,payload)=>{
  const folder=mkdtempSync(join(tmpdir(),'fonta-air-context-'));
  const files=Array.from({length:7},(_,index)=>join(folder,String(index)));
  const result=spawnSync('python3',['-c',parser,date,...files],{input:JSON.stringify(payload),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  return files.map(path=>existsSync(path)?read(path,'utf8'):null);
};
const values=run(day,fixture);
assert.equal(values[0],stamp);
assert.deepEqual(values.slice(1,4),['26','16','17']);
assert.deepEqual(values.slice(4),['0x238D5A','0xB8891F','0x238D5A']);
assert.deepEqual(run('2020-01-01',fixture),Array(7).fill(null),'No s’han d’atribuir lectures actuals a un vídeo antic.');
assert.deepEqual(run(day,{features:[{...fixture.features[0],id:'OTHER'}]}),Array(7).fill(null),'No es poden substituir les dades de Sant Celoni per una altra estació.');
console.log('Timelapse: lectures XVPCA exactes, fresques i del dia corresponent.');
