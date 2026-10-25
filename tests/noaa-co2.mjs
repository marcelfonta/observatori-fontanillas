import assert from 'node:assert/strict';
import { parseNoaaCo2, publicNoaaCo2, readNoaaCo2, refreshNoaaCo2, NOAA_CO2_KEY } from '../worker/noaa-co2.js';
import { dailySocialCardV5 } from '../worker/social-daily-v5.js';
import { productionFixture } from './fixtures/social-production.js';
import { productionMetadata } from '../scripts/social-production.mjs';

const now=Date.parse('2026-10-23T12:00:00Z');
const csv=`# NOAA GML daily Mauna Loa CO2\n2016,10,22,2016.8,401.42\n2025,10,22,2025.8,423.10\n2026,10,20,2026.8,-999.99\n2026,10,22,2026.8,426.46\n2026,10,24,2026.8,427.10\n2026,2,30,2026.2,425.00\n`;
const parsed=parseNoaaCo2(csv,now);
assert.equal(parsed.date,'2026-10-22');
assert.equal(parsed.ppm,426.46);
assert.equal(parsed.yearAgoDate,'2025-10-22');
assert.equal(parsed.yearChangePpm,3.36);
assert.equal(parsed.tenYearsAgoPpm,401.42);
assert.equal(parsed.tenYearsAgoDate,'2016-10-22');
assert.equal(publicNoaaCo2(parsed,now).fresh,true);
assert.equal(publicNoaaCo2(parsed,Date.parse('2026-10-26T12:00:00Z')).fresh,false);
assert.equal(publicNoaaCo2(parsed,Date.parse('2026-10-30T12:00:00Z')),null);
assert.throws(()=>parseNoaaCo2('# missing\n',now));
const store=new Map();
const bucket={
  async get(key){const value=store.get(key);return value?{customMetadata:value.metadata,async json(){return JSON.parse(value.body);}}:null;},
  async put(key,body,options){store.set(key,{body,metadata:options.customMetadata});},
};
const env={CAMERA_BUCKET:bucket};
const fetcher=async()=>({ok:true,headers:new Headers(),text:async()=>csv});
assert.equal((await refreshNoaaCo2(env,now,fetcher)).updated,true);
assert.ok(store.has(NOAA_CO2_KEY));
assert.equal((await refreshNoaaCo2(env,now+3600000,fetcher)).reason,'checked_today');
assert.equal((await readNoaaCo2(env,now)).date,'2026-10-22');
assert.equal(await readNoaaCo2(env,now+8*86400000),null);
const {card,snapshot}=productionFixture();
card.co2={...parsed,fresh:true};
assert.match(dailySocialCardV5(card,()=>''),/CO₂ atmosfèric · Mauna Loa, NOAA · 426,46 ppm/);
snapshot.co2=card.co2;
snapshot.rain={source:'AROME France HD'};
snapshot.environment={secondaryUv:null};
assert.match(productionMetadata(snapshot).description,/no una mesura local ni qualitat de l’aire de Sant Celoni/);
console.log('NOAA CO₂: validació, frescor i instantània compartida correctes');
