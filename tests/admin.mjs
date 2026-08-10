import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { overallState, serviceState } from '../src/features/admin.js';

assert.equal(serviceState(true).label,'Configurat');
assert.equal(serviceState(false).className,'is-muted');
assert.equal(overallState({ok:true,station:{ok:true},alerts:{ok:true}}).label,'Sistema operatiu');
assert.equal(overallState({ok:true,station:{ok:false},alerts:{ok:true}}).className,'is-warning');

const context={waitUntil(){}};
const unconfigured=await worker.fetch(new Request('https://fonta-meteo.example/admin/status',{headers:{Origin:'https://meteo.fontanillas.cat',Authorization:'Bearer '+('a'.repeat(32))}}),{},context);
assert.equal(unconfigured.status,503);
assert.equal((await unconfigured.json()).code,'ADMIN_NOT_CONFIGURED');

const unauthorized=await worker.fetch(new Request('https://fonta-meteo.example/admin/status',{headers:{Origin:'https://meteo.fontanillas.cat',Authorization:'Bearer '+('b'.repeat(32))}}),{ADMIN_TOKEN:'a'.repeat(32)},context);
assert.equal(unauthorized.status,401);
assert.equal((await unauthorized.json()).code,'ADMIN_UNAUTHORIZED');

const preflight=await worker.fetch(new Request('https://fonta-meteo.example/admin/status',{method:'OPTIONS',headers:{Origin:'https://meteo.fontanillas.cat'}}),{},context);
assert.equal(preflight.status,204);
assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Authorization/);

const nowSeconds=Math.floor(Date.now()/1000);
const fakeDb={
  batch:async()=>[],
  prepare(sql){
    const statement={sql,bindings:[],bind(...values){this.bindings=values;return this;},async run(){return {meta:{changes:0}};},async all(){return {results:[]};},async first(){
      if(sql.includes('SELECT * FROM observations'))return {observed_epoch:nowSeconds-60,local_time:new Date((nowSeconds-60)*1000).toISOString(),observed_at_utc:new Date((nowSeconds-60)*1000).toISOString(),temperature:24,humidity:55,pressure:1016,wind_speed:4,rain_total:0};
      if(sql.includes('FROM observations')&&sql.includes('storedReadings'))return {storedReadings:1200,firstEpoch:nowSeconds-864000,lastEpoch:nowSeconds-60,firstObservation:new Date((nowSeconds-864000)*1000).toISOString(),lastObservation:new Date((nowSeconds-60)*1000).toISOString()};
      if(sql.includes('FROM observations WHERE'))return {samples:280,temperature:280,humidity:280,pressure:280,wind:280,rain:280,solar:240,uv:180,firstEpoch:nowSeconds-84000,lastEpoch:nowSeconds-60};
      if(sql.includes('FROM alert_events'))return {total:4,latest:new Date().toISOString()};
      if(sql.includes('FROM contact_rate_limit'))return {total:1};
      if(sql.includes('FROM admin_auth_attempts'))return {total:0};
      return {};
    }};
    return statement;
  }
};
const originalFetch=global.fetch;
global.fetch=async()=>new Response('<rss><channel><lastBuildDate>Sun, 10 Aug 2026 12:00:00 GMT</lastBuildDate><item><title>Sin avisos</title><description>No hay avisos</description></item></channel></rss>',{status:200,headers:{'Content-Type':'application/rss+xml'}});
const authorized=await worker.fetch(new Request('https://fonta-meteo.example/admin/status',{headers:{Origin:'https://meteo.fontanillas.cat',Authorization:'Bearer '+('a'.repeat(32))}}),{ADMIN_TOKEN:'a'.repeat(32),WU_API_KEY:'configured',DB:fakeDb,ENVIRONMENT:'test'},context);
global.fetch=originalFetch;
assert.equal(authorized.status,200);
assert.match(authorized.headers.get('Cache-Control'),/no-store/);
const adminPayload=await authorized.json();
assert.equal(adminPayload.worker.version,'19.0.2');
assert.equal(adminPayload.station.ok,true);
assert.equal(adminPayload.database.observations,1200);
assert.equal(adminPayload.integrations.database,true);

console.log('Test d’Administració V18: correcte');
