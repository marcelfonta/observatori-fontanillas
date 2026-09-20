import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {productionFixture} from './fixtures/social-production.js';
import {assertProductionSnapshot,collectProductionData,targetDate} from '../scripts/social-production.mjs';
import {fetchSocialEnvironment} from '../src/core/social-environment.js';
import {socialCardHtml} from '../worker/index.js';
import {fetchRainEvolution} from '../scripts/youtube-rain-map.mjs';

assert.equal(targetDate('vespre',Date.parse('2026-12-31T19:00Z')),'2027-01-01');
assert.equal(targetDate('mati',Date.parse('2026-09-20T22:30Z')),'2026-09-21');
for(const date of ['2026-03-29','2026-10-25'])assert.equal(targetDate('mati',Date.parse(date+'T05:00Z')),date);
const {now,snapshot,forecast}=productionFixture();
assert.equal(assertProductionSnapshot(snapshot,now),snapshot);
for(const mutate of [d=>d.pilot=true,d=>d.current.temperature=null,d=>d.current.stale=true,d=>d.current.degraded=true,d=>d.current.updatedUtc='2026-09-19T12:00Z',d=>d.publicationDate='2026-09-19',d=>d.day.dayparts[0].complete=false,d=>d.forecast.timezone='UTC',d=>d.capturedAt='2026-09-19T12:00Z']){
 const d=structuredClone(snapshot);mutate(d);assert.throws(()=>assertProductionSnapshot(d,now));
}
assert.throws(()=>assertProductionSnapshot(snapshot,now+31*60_000));
const unavailable=await fetchSocialEnvironment({date:snapshot.date,now,fetcher:async()=>{throw Error('Offline');}});
assert.equal(unavailable.uv,null);assert.equal(unavailable.air,null);
const valid=await fetchSocialEnvironment({date:snapshot.date,now,fetcher:async()=>Response.json(forecast)});
assert.equal(valid.uv.value,3);assert.equal(valid.air.value,25);assert.equal(valid.period,'06:00–23:00 h');
const collected=await collectProductionData({slot:'mati',now,fetcher:async url=>{
 if(url.includes('/v1/forecast'))return Response.json(forecast);
 if(url==='https://fonta-meteo.marcelfonta.workers.dev')return Response.json(snapshot.current);
 throw Error('Optional provider unavailable');
},rainFetcher:async()=>({frames:[6,12,18,23].map(h=>({time:snapshot.date+`T${h}:00`,values:[null]})),points:[{latitude:41.69,longitude:2.49}],source:'test',spatial:false})});
assert.equal(collected.rain.available,false);assert.equal(collected.environment.secondaryUv,null);assert.equal(collected.moon,null);
assertProductionSnapshot(collected,now);

for(const period of ['mati','migdia','vespre']){
 const {card}=productionFixture(period);
 const render=data=>socialCardHtml({kind:'daily_observation',payload:JSON.stringify(data)});
 const html=render(card);
 assert.match(html,/data-social-format="cinematic-v5"/);assert.match(html,/Meteo Fontanillas/);assert.match(html,/icon-512.png/);
 assert.match(html,period==='vespre'?/DEMÀ · 2026-09-21/:/AVUI · 2026-09-20/);
 assert.match(html,/Pluja 70%/);assert.match(html,/UV màx. previst: 3,0/);assert.match(html,/Aire: raonable/);
 if(period==='migdia'){assert.doesNotMatch(html,/MATÍ ·/);assert.match(html,/14:00–19:00/);}
 const missing=render({...card,environment:null,temperature:null});
 assert.match(missing,/UV màx. previst: —/);assert.match(missing,/Aire: no disponible/);assert.doesNotMatch(missing,/UV màx. previst: 0/);
 const old=render({...card,socialFormat:undefined});assert.doesNotMatch(old,/data-social-format="cinematic-v5"/);
 const wrongDate=render({...card,environment:{...card.environment,date:'2026-09-19'}});assert.match(wrongDate,/UV màx. previst: —/);
 card.forecast[period==='vespre'?1:0].dayparts[0].condition='<script>bad</script>';
 assert.doesNotMatch(render(card),/<script>bad/);
}
const oldFetch=globalThis.fetch,oldWarn=console.warn;
try{
 globalThis.fetch=async()=>{throw Error('Simulated missing map');};console.warn=()=>{};
 const fallback=await fetchRainEvolution({slot:'mati',targetDate:snapshot.date,hourlyFallback:{time:[snapshot.date+'T09:00',snapshot.date+'T13:00',snapshot.date+'T17:00',snapshot.date+'T21:00'],precipitation:[null,false,0,-1]}});
 assert.equal(fallback.spatial,false);assert.deepEqual(fallback.frames.map(f=>f.values[0]),[null,null,0,null]);
}finally{globalThis.fetch=oldFetch;console.warn=oldWarn;}
const workflow=await readFile(new URL('../.github/workflows/youtube-short-private.yml',import.meta.url),'utf8');
assert.match(workflow,/SOCIAL_VIDEO_FORMAT \|\| 'cinematic-v5'/);assert.match(workflow,/render.mjs --production/);assert.match(workflow,/social-production.mjs/);assert.match(workflow,/youtube-short-runs/);
console.log('Production v5: fresh dated data, optional outages, cards, rollback and rain nulls OK');
