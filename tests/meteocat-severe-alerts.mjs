import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALONIA_COUNTY_PATHS } from '../worker/catalonia-counties.js';
import { meteocatAlertPollPlan, meteocatCountyWarningsByDay, meteocatDangerLevel, parseMeteocatSmpEpisodes, socialCardHtml } from '../worker/index.js';

assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T04:30:00Z')),{time:'06:30',localDate:'2026-08-31',targetDate:'2026-08-31',targetOffset:0});
assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T10:30:00Z')),{time:'12:30',localDate:'2026-08-31',targetDate:'2026-09-01',targetOffset:1});
assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T10:55:00Z')),{time:'12:30',localDate:'2026-08-31',targetDate:'2026-09-01',targetOffset:1});
assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T16:30:00Z')),{time:'18:30',localDate:'2026-08-31',targetDate:'2026-08-31',targetOffset:0});
assert.equal(meteocatAlertPollPlan(new Date('2026-08-31T10:29:59Z')),null);
assert.equal(meteocatAlertPollPlan(new Date('2026-08-31T11:00:00Z')),null);

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
assert.deepEqual(parsed[0].countyWarnings,[
  {countyId:13,level:'red',rank:4},
  {countyId:41,level:'orange',rank:3},
]);
assert.match(parsed[0].description,/Intensitat > 20 mm \/ 30 minuts/);
assert.match(parsed[0].description,/local/);

const warningMap=meteocatCountyWarningsByDay([warning(41,2),warning(13,5)]);
assert.equal(warningMap['2026-08-30'].length,2);
assert.equal(CATALONIA_COUNTY_PATHS.length,43,'El mapa ha de contenir totes les comarques oficials de l’ICGC.');
assert.equal(CATALONIA_COUNTY_PATHS.find(county=>county.id===41)?.name,'Vallès Oriental');

const yellow=parseMeteocatSmpEpisodes([warning(41,2)]);
assert.equal(yellow.length,1,'Els avisos grocs vigents del Vallès Oriental també s’han de publicar.');
assert.equal(yellow[0].level,'yellow');

const red=parseMeteocatSmpEpisodes([warning(41,5)]);
assert.equal(red[0].level,'red');

const card=socialCardHtml({kind:'official_alert',body:'',payload:JSON.stringify({
  source:'Meteocat',level:'yellow',levelLabel:'GROC',phenomenon:'Intensitat de pluja',
  scopeName:'Vallès Oriental',description:yellow[0].description,countyWarnings:parsed[0].countyWarnings,
})});
assert.match(card,/METEOCAT/);
assert.match(card,/Vallès Oriental/);
assert.match(card,/2 comarques amb avís/);
assert.match(card,/Contorn blanc: Vallès Oriental/);
assert.doesNotMatch(card,/AEMET/);
assert.doesNotMatch(card,/Prelitoral de Barcelona/);

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
assert.match(worker,/recoverIncompleteOfficialAlertDraft/);
assert.match(worker,/SOCIAL_AUTOMATIC_MAX_ATTEMPTS/);
assert.match(worker,/official-alert-social-recovery/);
assert.match(worker,/level==='orange'\?'TARONJA':'GROC'/);
assert.match(worker,/AVÍS OFICIAL METEOCAT/);
assert.match(worker,/Dades: Meteocat · mapa comarcal: ICGC/);
assert.match(worker,/if\(entry\.source!=='Meteocat'\)return \{created:false,reason:'meteocat_only'\}/);
assert.match(worker,/METEOCAT_MONTHLY_PREDICTION_LIMIT = 100/);
assert.match(worker,/plannedMaximum:31\*METEOCAT_ALERT_POLL_SLOTS\.length/);
assert.doesNotMatch(worker,/Promise\.allSettled\(localIsoDates\(\)\.map/);

console.log('Avisos Meteocat: mapa de Catalunya, detall local i font exclusiva correctes');
