import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { meteocatDangerLevel, parseMeteocatSmpEpisodes } from '../worker/index.js';

assert.equal(meteocatDangerLevel(2).key,'yellow');
assert.equal(meteocatDangerLevel(3).key,'orange');
assert.equal(meteocatDangerLevel(4).key,'orange');
assert.equal(meteocatDangerLevel(5).key,'red');
assert.equal(meteocatDangerLevel(6).key,'red');

const warning=(idComarca,perill,estat='Vigent')=>({
  estat:{nom:'Obert'},meteor:{nom:'Intensitat de pluja'},avisos:[{
    estat,dataEmisio:'2026-08-30T08:15Z',dataInici:'2026-08-30T12:00Z',dataFi:'2026-08-30T23:59Z',
    evolucions:[{dia:'2026-08-30T00:00Z',comentari:'Xàfecs amb tempesta.',distribucioGeografica:'LOCAL',periodes:[
      {nom:'12-18',afectacions:[{idComarca,perill,llindar:'Intensitat > 20 mm / 30 minuts',auxiliar:false}]},
    ]}],
  }],
});

const parsed=parseMeteocatSmpEpisodes([
  warning(41,4),
  warning(13,6),
  warning(41,6,'Esborrany'),
]);

assert.equal(parsed.length,1,'Només s’ha de publicar l’avís taronja o vermell vigent del Vallès Oriental.');
assert.equal(parsed[0].source,'Meteocat');
assert.equal(parsed[0].scopeName,'Vallès Oriental');
assert.equal(parsed[0].municipality,'Sant Celoni');
assert.equal(parsed[0].level,'orange');
assert.equal(parsed[0].distribution,'LOCAL');
assert.deepEqual(parsed[0].periods,['30/08 14:00–30/08 20:00 h']);
assert.match(parsed[0].description,/Intensitat > 20 mm \/ 30 minuts/);
assert.match(parsed[0].description,/local/);

const yellow=parseMeteocatSmpEpisodes([warning(41,2)]);
assert.equal(yellow.length,1,'Els avisos grocs vigents del Vallès Oriental també s’han de publicar.');
assert.equal(yellow[0].level,'yellow');

const red=parseMeteocatSmpEpisodes([warning(41,5)]);
assert.equal(red[0].level,'red');

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
assert.match(worker,/recoverIncompleteOfficialAlertDraft/);
assert.match(worker,/SOCIAL_AUTOMATIC_MAX_ATTEMPTS/);
assert.match(worker,/official-alert-social-recovery/);
assert.match(worker,/level==='orange'\?'TARONJA':'GROC'/);

console.log('Avisos Meteocat: filtre comarcal, nivells oficials i precisió territorial correctes');
