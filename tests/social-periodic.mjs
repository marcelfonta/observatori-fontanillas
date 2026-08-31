import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { periodicSocialKindForDate, stationEventCandidates, socialCardHtml } from '../worker/index.js';

const wrangler=await readFile(new URL('../ops/wrangler.example.jsonc',import.meta.url),'utf8');
for(const flag of ['SOCIAL_PERIODIC_ENABLED','SOCIAL_EVENT_POSTS_ENABLED','SOCIAL_ENVIRONMENTAL_ENABLED','SOCIAL_EPHEMERIDES_ENABLED']){
  assert.match(wrangler,new RegExp(`"${flag}": "false"`));
}
assert.match(wrangler,/"SOCIAL_DUST_THRESHOLD_UG_M3": "0"/);

assert.equal(periodicSocialKindForDate(new Date('2026-09-07T10:00:00Z')),'weekly_summary');
assert.equal(periodicSocialKindForDate(new Date('2026-10-02T10:00:00Z')),'monthly_summary');
assert.equal(periodicSocialKindForDate(new Date('2026-09-03T10:00:00Z')),'seasonal_summary');
assert.equal(periodicSocialKindForDate(new Date('2027-01-04T10:00:00Z')),'annual_summary');
assert.equal(periodicSocialKindForDate(new Date('2026-09-08T10:00:00Z')),null);

const events=stationEventCandidates({temperature:36,windGust:74,rainRate:34,rainToday:55,uv:9},{previousTemperature:24});
assert.equal(events[0].type,'intense_rain');
assert.ok(events.some(item=>item.type==='strong_gust'));
assert.ok(events.some(item=>item.type==='temperature_change'));
assert.ok(events.some(item=>item.type==='very_high_uv'&&item.cooldown==='weekly'));
assert.deepEqual(stationEventCandidates({temperature:21,windGust:12,rainRate:0,rainToday:0,uv:2}),[]);

const periodicCard=socialCardHtml({kind:'monthly_summary',payload:JSON.stringify({
  eyebrow:'El mes meteorològic',reportTitle:'El mes en xifres a Sant Celoni',
  range:{start:'2026-08-01',end:'2026-08-31'},
  stats:{observedDays:31,temperatureMax:36.2,temperatureMin:12.1,temperatureMean:24.3,rainTotal:18.4,windGustMax:51.2,uvMax:9.1,coverage:96},
  verification:{samples:20,temperatureMae:1.4,rainAccuracy:85},forecast:[],
})});
assert.match(periodicCard,/El mes en xifres a Sant Celoni/);
assert.match(periodicCard,/no és una normal climàtica oficial/);

const eventCard=socialCardHtml({kind:'station_event',payload:JSON.stringify({
  eyebrow:'RATXA DESTACADA',eventTitle:'El vent ha superat el llindar de ratxa forta',value:74,unit:'km\/h',
  advice:'Consulta els avisos oficials.',localDate:'2026-08-31',observationUpdated:'2026-08-31 12:00',
})});
assert.match(eventCard,/És una observació local, no un avís oficial/);

const droughtCard=socialCardHtml({kind:'environmental_event',payload:JSON.stringify({
  eventType:'drought_state_change',eyebrow:'CANVI OFICIAL DE SEQUERA',eventTitle:'Nou estat hidrològic per a Sant Celoni',
  value:'NORMALITAT',advice:'Consulta les mesures vigents a l’ACA.',localDate:'2026-08-31',
  observationUpdated:'2026-08-31',sourceNote:'Agència Catalana de l’Aigua',
})});
assert.match(droughtCard,/actualització oficial de l’ACA/);
assert.doesNotMatch(droughtCard,/lectura real de les/);
assert.match(droughtCard,/class="is-text"/);

console.log('Publicacions periòdiques i puntuals: calendari, llindars i targetes correctes');
