import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  ASTRONOMICAL_EVENTS,
  astronomyEventsForDate,
  astronomyVisibilitySummary,
  seasonTransitionForDate,
} from '../src/data/astronomical-calendar.js';
import { socialCardHtml } from '../worker/index.js';

const autumn=seasonTransitionForDate(new Date('2026-09-23T07:00:00Z'));
assert.equal(autumn?.id,'autumn-2026');
assert.equal(autumn?.date,'2026-09-23T02:05:00+02:00');
assert.match(autumn?.sourceUrl,/astronomia\.ign\.es/);
assert.equal(seasonTransitionForDate(new Date('2026-09-22T07:00:00Z')),null);

assert.deepEqual(astronomyEventsForDate(new Date('2026-10-18T16:00:00Z'),'advance').map(item=>item.id),['orionids-2026']);
assert.deepEqual(astronomyEventsForDate(new Date('2026-10-20T15:00:00Z'),'reminder').map(item=>item.id),['orionids-2026']);
assert.deepEqual(astronomyEventsForDate(new Date('2027-01-03T16:00:00Z'),'reminder'),[],
  'Un esdeveniment sense hora anual confirmada no s’ha de publicar automàticament.');

const orionids=ASTRONOMICAL_EVENTS.find(item=>item.id==='orionids-2026');
const times=['2026-10-20T21:00','2026-10-20T22:00','2026-10-20T23:00','2026-10-21T00:00','2026-10-21T01:00','2026-10-21T02:00','2026-10-21T03:00','2026-10-21T04:00'];
const favorable=astronomyVisibilitySummary({
  time:times,cloud_cover:times.map(()=>25),precipitation_probability:times.map(()=>10),precipitation:times.map(()=>0),
},orionids);
assert.deepEqual(favorable,{averageCloud:25,maxRainProbability:10,precipitation:0,hours:7,reasonable:true});
const unfavorable=astronomyVisibilitySummary({
  time:times,cloud_cover:times.map(()=>90),precipitation_probability:times.map(()=>80),precipitation:times.map(()=>0.5),
},orionids);
assert.equal(unfavorable?.reasonable,false);
assert.equal(astronomyVisibilitySummary({time:['2026-10-21T00:00'],cloud_cover:[10],precipitation_probability:[0],precipitation:[0]},orionids),null);

const advanceCard=socialCardHtml({kind:'astronomical_event',payload:JSON.stringify({
  eventType:'astronomical_event',phase:'advance',eyebrow:'D’AQUÍ DOS DIES',eventTitle:'Màxim dels Oriònids',symbol:'☄',
  dateLabel:'dimecres 21 d’octubre',advice:'La segona meitat de la nit serà la més favorable.',sourceNote:'IGN · Observatori Astronòmic Nacional',
})});
assert.match(advanceCard,/ASTRONOMIA/);
assert.match(advanceCard,/dimecres 21 d’octubre/);
assert.match(advanceCard,/les condicions meteorològiques es comprovaran el mateix dia/);
assert.doesNotMatch(advanceCard,/Nuvolositat mitjana/);

const reminderCard=socialCardHtml({kind:'astronomical_event',payload:JSON.stringify({
  eventType:'astronomical_event',phase:'reminder',eyebrow:'AQUESTA NIT',eventTitle:'Màxim dels Gemínids',symbol:'✦',
  dateLabel:'dilluns 14 de desembre',advice:'Una de les pluges de meteors més actives de l’any.',
  visibility:{averageCloud:28,maxRainProbability:15,precipitation:0,hours:8,reasonable:true},sourceNote:'IGN · Observatori Astronòmic Nacional',
})});
assert.match(reminderCard,/Nuvolositat mitjana/);
assert.match(reminderCard,/28%/);
assert.match(reminderCard,/Probabilitat màxima de pluja/);

const example=await readFile(new URL('../ops/wrangler.example.jsonc',import.meta.url),'utf8');
assert.match(example,/"SOCIAL_ASTRONOMY_ENABLED": "false"/);

console.log('Publicacions astronòmiques: calendari compartit, filtres i targetes correctes');
