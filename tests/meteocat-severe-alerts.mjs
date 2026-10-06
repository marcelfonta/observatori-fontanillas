import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATALONIA_COUNTY_PATHS } from '../worker/catalonia-counties.js';
import { meteocatAlertPollPlan, meteocatCountyWarningsByDay, meteocatDangerLevel, officialAlertCardDate, officialAlertSocialCopy, officialAlertTiming, parseMeteocatSmpEpisodes, socialCardHtml, storedMeteocatAlertStillRelevant } from '../worker/index.js';
import { classifyAlertWindows } from '../src/modules/avisos.js';

assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T04:30:00Z')),{time:'06:30',localDate:'2026-08-31',targetDate:'2026-08-31',targetOffset:0});
assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T10:30:00Z')),{time:'12:30',localDate:'2026-08-31',targetDate:'2026-09-01',targetOffset:1});
assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T10:55:00Z')),{time:'12:30',localDate:'2026-08-31',targetDate:'2026-09-01',targetOffset:1});
assert.deepEqual(meteocatAlertPollPlan(new Date('2026-08-31T16:30:00Z')),{time:'18:30',localDate:'2026-08-31',targetDate:'2026-09-02',targetOffset:2});
assert.equal(meteocatAlertPollPlan(new Date('2026-08-31T10:29:59Z')),null);
assert.equal(meteocatAlertPollPlan(new Date('2026-08-31T11:00:00Z')),null);

const futureWindows=classifyAlertWindows([{source:'Meteocat',starts:'2026-09-02T10:00:00Z',expires:'2026-09-02T18:00:00Z'}],new Date('2026-08-31T09:00:00Z'));
assert.equal(futureWindows.now.length,0);
assert.equal(futureWindows.today.length,0);
assert.equal(futureWindows.tomorrow.length,0);
assert.equal(futureWindows.later.length,1,'Un avís de demà passat ha d’aparèixer a «Més endavant», no com a actiu ara.');

assert.equal(meteocatDangerLevel(2).key,'yellow');
assert.equal(meteocatDangerLevel(3).key,'orange');
assert.equal(meteocatDangerLevel(4).key,'orange');
assert.equal(meteocatDangerLevel(5).key,'red');
assert.equal(meteocatDangerLevel(6).key,'red');

const warning=(idComarca,perill,estat='Vigent',phenomenon='Intensitat de pluja')=>({
  estat:{nom:'Obert'},meteor:{nom:phenomenon},avisos:[{
    estat,dataEmisio:'2026-08-30T08:15Z',dataInici:'2026-08-30T12:00Z',dataFi:'2026-08-30T23:59Z',
    evolucions:[{dia:'2026-08-30T00:00Z',comentari:'Xàfecs amb tempesta.',distribucioGeografica:'LOCAL',periodes:[
      {nom:'12-18',afectacions:[{idComarca,perill,llindar:'Intensitat > 20 mm / 30 minuts',auxiliar:false}]},
    ]}],
  }],
});
const fixtureAt=new Date('2026-08-30T11:00:00Z');

const parsed=parseMeteocatSmpEpisodes([
  warning(41,4),
  warning(13,6),
  warning(41,6,'Esborrany'),
],{at:fixtureAt});

assert.equal(parsed.length,1,'Només s’ha de publicar l’avís taronja o vermell vigent del Vallès Oriental.');
assert.equal(parsed[0].source,'Meteocat');
assert.equal(parsed[0].scopeName,'Vallès Oriental');
assert.equal(parsed[0].municipality,'Sant Celoni');
assert.equal(parsed[0].level,'orange');
assert.equal(parsed[0].distribution,'LOCAL');
assert.equal(parsed[0].targetDate,'2026-08-30');
assert.deepEqual(parsed[0].periods,['30/08 14:00–30/08 20:00 h']);
assert.deepEqual(parsed[0].countyWarnings,[
  {countyId:13,level:'red',rank:4},
  {countyId:41,level:'orange',rank:3},
]);
assert.match(parsed[0].description,/Intensitat > 20 mm \/ 30 minuts/);
assert.match(parsed[0].description,/local/);

const warningMap=meteocatCountyWarningsByDay([warning(41,2),warning(13,5)]);
assert.equal(warningMap['2026-08-30'].length,2);
const mixedPhenomena=[
  warning(41,4,'Vigent','Intensitat de pluja en 3 hores'),
  warning(13,5,'Vigent','Intensitat de pluja en 3 hores'),
  warning(41,6,'Vigent','Intensitat de pluja en 30 minuts'),
];
const threeHourWarnings=meteocatCountyWarningsByDay(mixedPhenomena,{phenomenon:'Intensitat de pluja en 3 hores'});
assert.deepEqual(threeHourWarnings['2026-08-30'],[
  {countyId:13,level:'red',rank:4},
  {countyId:41,level:'orange',rank:3},
]);
const mixedParsed=parseMeteocatSmpEpisodes(mixedPhenomena,{at:fixtureAt});
const threeHourAlert=mixedParsed.find(entry=>entry.phenomenon==='Intensitat de pluja en 3 hores');
const thirtyMinuteAlert=mixedParsed.find(entry=>entry.phenomenon==='Intensitat de pluja en 30 minuts');
assert.equal(threeHourAlert.level,'orange');
assert.equal(threeHourAlert.countyWarnings.find(entry=>entry.countyId===41)?.level,'orange','El mapa d’un avís de 3 hores no pot heretar el vermell d’un fenomen de 30 minuts.');
assert.equal(thirtyMinuteAlert.level,'red');
assert.equal(thirtyMinuteAlert.countyWarnings.find(entry=>entry.countyId===41)?.level,'red');
const threeHourCard=socialCardHtml({kind:'official_alert',body:'',payload:JSON.stringify(threeHourAlert)});
assert.match(threeHourCard,/fill="#ff9f43" stroke="#f8fff9"/,'El contorn del Vallès Oriental ha de quedar taronja en la targeta taronja.');
assert.doesNotMatch(threeHourCard,/fill="#ff625f" stroke="#f8fff9"/,'El vermell d’un altre fenomen no pot aparèixer al Vallès Oriental.');
assert.equal(CATALONIA_COUNTY_PATHS.length,43,'El mapa ha de contenir totes les comarques oficials de l’ICGC.');
assert.equal(CATALONIA_COUNTY_PATHS.find(county=>county.id===41)?.name,'Vallès Oriental');

const yellow=parseMeteocatSmpEpisodes([warning(41,2)],{at:fixtureAt});
assert.equal(yellow.length,1,'Els avisos grocs vigents del Vallès Oriental també s’han de publicar.');
assert.equal(yellow[0].level,'yellow');

const red=parseMeteocatSmpEpisodes([warning(41,5)],{at:fixtureAt});
assert.equal(red[0].level,'red');

const rolloverEpisode={
  estat:{nom:'Obert'},meteor:{nom:'Intensitat de pluja en 30 minuts'},avisos:[{
    estat:'Vigent',dataEmisio:'2026-10-05T06:00Z',dataInici:'2026-10-05T06:00Z',dataFi:'2026-10-06T23:59Z',
    evolucions:[
      {dia:'2026-10-05T00:00Z',comentari:'Tempesta local.',distribucioGeografica:'LOCAL',periodes:[
        {nom:'06-12',afectacions:[{idComarca:41,perill:5,llindar:'Intensitat > 40 mm / 30 minuts'}]},
        {nom:'12-18',afectacions:[{idComarca:41,perill:5,llindar:'Intensitat > 40 mm / 30 minuts'}]},
      ]},
      {dia:'2026-10-06T00:00Z',comentari:'Xàfecs locals.',distribucioGeografica:'LOCAL',periodes:[
        {nom:'12-18',afectacions:[{idComarca:41,perill:2,llindar:'Intensitat > 20 mm / 30 minuts'}]},
        {nom:'18-00',afectacions:[{idComarca:41,perill:2,llindar:'Intensitat > 20 mm / 30 minuts'}]},
      ]},
    ],
  }],
};
const rollover=parseMeteocatSmpEpisodes([rolloverEpisode],{at:new Date('2026-10-06T09:30:00Z')});
assert.equal(rollover.length,1,'Les franges caducades no poden continuar com a avisos actius.');
assert.equal(rollover[0].level,'yellow','El vermell d’ahir no pot dominar el nivell vigent d’avui.');
assert.equal(rollover[0].targetDate,'2026-10-06');
assert.equal(rollover[0].starts,'2026-10-06T12:00:00.000Z');
assert.equal(rollover[0].expires,'2026-10-07T00:00:00.000Z');
assert.doesNotMatch(rollover[0].description,/05\/10/);

const storedRed={description:'Llindar: Intensitat > 40 mm / 30 minuts. Franges: 05/10 08:00–05/10 14:00 h, 05/10 14:00–05/10 20:00 h.'};
assert.equal(storedMeteocatAlertStillRelevant(storedRed,new Date('2026-10-06T09:30:00Z')),false,'Un avís antic ja desat també s’ha de retirar del resum públic.');
const newYearWarning={description:'Franges: 31/12 20:00–01/01 02:00 h.'};
assert.equal(storedMeteocatAlertStillRelevant(newYearWarning,new Date('2026-12-31T20:30:00Z')),true,'Una franja que travessa Cap d’Any no es pot confondre amb una franja caducada.');

assert.deepEqual(officialAlertTiming({targetDate:'2026-09-09'},new Date('2026-09-07T10:30:00Z')),{
  targetDate:'2026-09-09',offset:2,isFuture:true,
  shortLabel:'dimecres 9 de setembre',longLabel:'dimecres 9 de setembre',
});
assert.deepEqual(officialAlertTiming({targetDate:'2026-09-08'},new Date('2026-09-07T10:30:00Z')),{
  targetDate:'2026-09-08',offset:1,isFuture:true,
  shortLabel:'demà, dimarts 8 de setembre',longLabel:'demà, dimarts 8 de setembre',
});
const futureCopy=officialAlertSocialCopy({
  level:'yellow',targetDate:'2026-09-09',phenomenon:'Intensitat de pluja en 30 minuts',
  scopeName:'Vallès Oriental',description:'Franges: 09/09 08:00–09/09 14:00 h.',
},new Date('2026-09-07T10:30:00Z'));
assert.match(futureCopy.title,/Avís GROC per dimecres 9 de setembre/);
assert.match(futureCopy.body,/previst per dimecres 9 de setembre; no descriu el temps actual/);

const card=socialCardHtml({kind:'official_alert',body:'',payload:JSON.stringify({
  source:'Meteocat',level:'yellow',levelLabel:'GROC',phenomenon:'Intensitat de pluja',
  scopeName:'Vallès Oriental',description:yellow[0].description,countyWarnings:parsed[0].countyWarnings,
})});
assert.match(card,/METEOCAT/);
assert.match(card,/Vallès Oriental/);
assert.match(card,/2 comarques amb avís/);
assert.match(card,/Contorn blanc: Vallès Oriental/);
assert.match(card,/Nivell màxim per comarca · mateix fenomen/);
assert.match(card,/class="map-stage"/);
assert.match(card,/class="map-focus">VALLÈS ORIENTAL/);
assert.match(card,/viewBox="0 20 500 380" preserveAspectRatio="xMidYMid meet"/);
assert.doesNotMatch(card,/AEMET/);
assert.doesNotMatch(card,/Prelitoral de Barcelona/);

const issuedAt='2026-09-07T10:30:00Z';
const alertData={source:'Meteocat',level:'yellow',levelLabel:'GROC',phenomenon:'Intensitat de pluja en 30 minuts',targetDate:'2026-09-09',issuedAt,starts:'2026-09-08T18:00Z',expires:'2026-09-09T23:59Z',periods:['09/09 08:00–09/09 14:00 h'],description:'Llindar: Intensitat > 20 mm / 30 minuts. Franges: 09/09 08:00–09/09 14:00 h.'};
const alertCard=data=>socialCardHtml({kind:'official_alert',created_at:'2026-09-07 10:30:00',payload:JSON.stringify(data)});
const dated=alertCard(alertData);
assert.match(dated,/PREVIST PER<\/small><strong>DIMECRES 9 DE SETEMBRE/);
assert.match(dated,/NO ÉS PER AVUI · AVÍS ANTICIPAT/);
assert.match(dated,/Publicació del 07\/09\/2026/);
assert.ok(dated.indexOf('DIMECRES 9 DE SETEMBRE')<dated.indexOf('<h1 class="alert-title">'));
assert.doesNotMatch(dated,/Nivell màxim vigent/);
assert.match(dated,/FRANGES LOCALS/);
assert.match(dated,/08:00–14:00 h/);
assert.match(dated,/LLINDAR OFICIAL/);
assert.doesNotMatch(alertCard({...alertData,issuedAt:'2026-09-09T00:00Z'}),/NO ÉS PER AVUI/);
assert.doesNotMatch(alertCard({...alertData,issuedAt:'2026-09-08T22:30Z'}),/NO ÉS PER AVUI/,'La mitjanit local ha de seguir Europe/Madrid.');
const legacy={...alertData,targetDate:undefined,issuedAt:undefined};
assert.equal(officialAlertCardDate(legacy),'2026-09-09','Les franges comarcals prevalen sobre l’inici general del 8.');
assert.match(alertCard(legacy),/DIMECRES 9 DE SETEMBRE/);
assert.equal(officialAlertCardDate({...legacy,periods:undefined}),'2026-09-09');
assert.equal(officialAlertCardDate({starts:'2026-12-31T18:00Z',periods:['01/01 08:00–01/01 14:00 h']}),'2027-01-01');
for(const data of [{},{targetDate:'2026-02-31'},{starts:'2026-09-08T18:00Z'}]){
  assert.equal(officialAlertCardDate(data),null);
  assert.match(alertCard(data),/DATA PENDENT DE CONFIRMAR/);
  assert.doesNotMatch(alertCard(data),/NO ÉS PER AVUI/);
}

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
assert.match(worker,/entry\.starts\|\|entry\.published/);
assert.match(worker,/no descriu el temps actual/);
assert.match(worker,/source = 'Meteocat' AND \(expires_at IS NULL OR expires_at > \?\)/);
assert.doesNotMatch(worker,/Promise\.allSettled\(localIsoDates\(\)\.map/);

console.log('Avisos Meteocat: mapa de Catalunya, detall local i font exclusiva correctes');
