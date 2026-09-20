import assert from 'node:assert/strict';
import {environmentalTimestamp as stamp,stationUvReading,currentEnvironment} from '../src/core/environment-freshness.js';
import {summarizeEnvironment,chooseEnvironmentScene,environmentalCaption} from '../scripts/social-pilot/environment.mjs';
const now=Date.parse('2026-09-20T08:10:00Z');
for(const zone of ['UTC','America/Los_Angeles','Asia/Tokyo']){
 process.env.TZ=zone;
 assert.equal(stamp('2026-09-20T10:10'),now);
 assert.equal(stamp('2026-01-20T10:10'),Date.parse('2026-01-20T09:10Z'));
}
for(const date of ['2026-02-30T10:00','2026-03-29T02:30','2026-10-25T02:30','2026-09-20T25:00','2026-09-20T10:10garbage',null,''])assert.ok(Number.isNaN(stamp(date)));
assert.ok(Number.isFinite(stamp('2026-10-25T02:30+02:00')));
assert.equal(stationUvReading({uv:0,updatedUtc:'2026-09-20T08:09:00Z'},now).value,0);
for(const o of [{},{stale:true},{degraded:true},{updatedUtc:'2026-09-20T07:40:00Z'},{updatedUtc:'2026-09-20T08:16:00Z'}]){
 const c=Object.keys(o).length?{uv:7,updatedUtc:'2026-09-20T08:09:00Z',...o}:{uv:7};
 assert.equal(stationUvReading(c,now).value,null);
}
assert.equal(currentEnvironment({time:'2026-09-20T08:40',uv_index:8},now).uv_index,undefined);
const hourly={time:[],uv_index:[],european_aqi:[],precipitation:[],precipitation_probability:[],weather_code:[]};
for(let h=0;h<=24;h++){const date=new Date('2026-09-20T00:00Z');date.setUTCHours(h);hourly.time.push(date.toISOString().slice(0,16));hourly.uv_index.push(h===14?6:0);hourly.european_aqi.push(20);hourly.precipitation.push(0);hourly.precipitation_probability.push(0);hourly.weather_code.push(0);}
const payload={timezone:'Europe/Madrid',hourly},retrievedAt=new Date(now).toISOString();
const options={date:'2026-09-20',now,retrievedAt};
const summary=summarizeEnvironment(payload,options);
assert.equal(summary.uv.value,6);assert.equal(summary.uv.peakTime,'2026-09-20T14:00');assert.equal(summary.pollen.eligible,false);
const args={summary,forecast:payload,alerts:{ok:true,status:'clear',alerts:[],checkedAt:retrievedAt},now,retrievedAt};
assert.equal(chooseEnvironmentScene(args).kind,'uv');
assert.match(environmentalCaption(summary,chooseEnvironmentScene(args)),/no és una mesura/);
assert.equal(chooseEnvironmentScene({...args,alerts:null}).kind,'rain');
assert.equal(chooseEnvironmentScene({...args,summary:{...summary,date:'2026-09-21'}}).kind,'rain');
assert.equal(chooseEnvironmentScene({...args,now:now+91*60_000}).kind,'rain');
for(const bad of [null,'',false,-1]){const p=structuredClone(payload);p.hourly.uv_index[14]=bad;assert.equal(summarizeEnvironment(p,options).uv,null);}
const wet=structuredClone(payload);wet.hourly.precipitation[24]=1;
assert.equal(chooseEnvironmentScene({...args,forecast:wet}).reason,'precipitation-priority');
const noRain=structuredClone(payload);noRain.hourly.precipitation[10]=null;
assert.equal(chooseEnvironmentScene({...args,forecast:noRain}).kind,'rain');
const noon=summarizeEnvironment(payload,{...options,startHour:14});assert.equal(noon.uv.rows[0].hour,14);
const missing=summarizeEnvironment(payload,{...options,retrievedAt:null});assert.equal(missing.uv,null);
const duplicate=structuredClone(payload);duplicate.hourly.time.push('2026-09-20T14:00');assert.equal(summarizeEnvironment(duplicate,options).uv,null);
assert.equal(chooseEnvironmentScene({...args,summary:{...summary,air:{...summary.air,value:70}}}).kind,'air');
console.log('Freshness, time zones, DST, exact coverage, editorial priority and missing-data contracts passed.');
