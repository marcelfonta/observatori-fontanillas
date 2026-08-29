import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import { analyticsServiceState, overallState, performanceRating, serviceState } from '../src/features/admin.js';
import { readFile } from 'node:fs/promises';

assert.equal(serviceState(true).label,'Configurat');
assert.equal(serviceState(false).className,'is-muted');
assert.equal(overallState({ok:true,station:{ok:true},alerts:{ok:true}}).label,'Sistema operatiu');
assert.equal(overallState({ok:true,station:{ok:false},alerts:{ok:true}}).className,'is-warning');
assert.equal(performanceRating('lcp',2500),'good');
assert.equal(performanceRating('lcp',2501),'needs-improvement');
assert.equal(performanceRating('cls',0.26),'poor');
assert.equal(performanceRating('inp',null),'pending');
assert.equal(analyticsServiceState({cloudflareBeacon:true}).label,'Cloudflare actiu');
assert.equal(analyticsServiceState({cloudflareEnabled:true}).label,'Actiu al domini');
assert.equal(analyticsServiceState({cloudflareEnabled:true}).className,'is-ok');
assert.equal(analyticsServiceState({googleMeasurementId:'G-TEST'}).provider,'google');
assert.equal(analyticsServiceState().provider,'none');
const adminHtml=await readFile(new URL('../administracio.html',import.meta.url),'utf8');
assert.match(adminHtml,/id="admin-youtube-schedule"/);
assert.match(adminHtml,/id="admin-youtube-operation"/);
assert.match(adminHtml,/id="admin-buffer-diagnostics"/);
assert.match(adminHtml,/id="admin-buffer-operation"/);

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
    const statement={sql,bindings:[],bind(...values){this.bindings=values;return this;},async run(){return {meta:{changes:0}};},async all(){
      if(sql.includes('sqlite_master'))return {results:[{name:'observations'},{name:'alert_events'},{name:'contact_rate_limit'}]};
      if(sql.includes('FROM social_drafts'))return {results:[{id:1,kind:'daily_observation',status:'draft',channels:'["facebook","instagram","bluesky","telegram"]',title:'Dades de Sant Celoni',created_at:new Date().toISOString(),scheduled_for:null}]};
      return {results:[]};
    },async first(){
      if(sql.includes('SELECT * FROM observations'))return {observed_epoch:nowSeconds-60,local_time:new Date((nowSeconds-60)*1000).toISOString(),observed_at_utc:new Date((nowSeconds-60)*1000).toISOString(),temperature:24,humidity:55,pressure:1016,wind_speed:4,rain_total:0};
      if(sql.includes('SELECT COUNT(*) AS total FROM')&&sql.includes('observations'))return {total:1200};
      if(sql.includes('FROM observations')&&sql.includes('storedReadings'))return {storedReadings:1200,firstEpoch:nowSeconds-864000,lastEpoch:nowSeconds-60,firstObservation:new Date((nowSeconds-864000)*1000).toISOString(),lastObservation:new Date((nowSeconds-60)*1000).toISOString()};
      if(sql.includes('FROM observations WHERE'))return {samples:280,temperature:280,humidity:280,pressure:280,wind:280,rain:280,solar:240,uv:180,firstEpoch:nowSeconds-84000,lastEpoch:nowSeconds-60};
      if(sql.includes('alert_events'))return {total:4,latest:new Date().toISOString()};
      if(sql.includes('FROM social_drafts'))return {pending:2,approved:0,published:0,latest:new Date().toISOString()};
      if(sql.includes('contact_rate_limit'))return {total:1};
      if(sql.includes('FROM admin_auth_attempts'))return {total:0};
      return {};
    }};
    return statement;
  }
};
const originalFetch=global.fetch;
global.fetch=async()=>new Response('<rss><channel><lastBuildDate>Sun, 10 Aug 2026 12:00:00 GMT</lastBuildDate><item><title>Sin avisos</title><description>No hay avisos</description></item></channel></rss>',{status:200,headers:{'Content-Type':'application/rss+xml'}});
const authorized=await worker.fetch(new Request('https://fonta-meteo.example/admin/status',{headers:{Origin:'https://meteo.fontanillas.cat',Authorization:'Bearer '+('a'.repeat(32))}}),{ADMIN_TOKEN:'a'.repeat(32),WU_API_KEY:'configured',META_SYSTEM_USER_TOKEN:'test-token-not-a-secret',BLUESKY_HANDLE:'meteofontanillas.bsky.social',BLUESKY_APP_PASSWORD:'test-app-password',TELEGRAM_BOT_TOKEN:'test-bot-token',TELEGRAM_CHANNEL_ID:'@meteofontanillas',THREADS_ACCESS_TOKEN:'test-threads-token',DB:fakeDb,ENVIRONMENT:'test'},context);
global.fetch=originalFetch;
assert.equal(authorized.status,200);
assert.match(authorized.headers.get('Cache-Control'),/no-store/);
const adminPayload=await authorized.json();
assert.equal(adminPayload.worker.version,'22.22.0');
assert.equal(adminPayload.station.ok,true);
assert.equal(adminPayload.database.observations,1200);
assert.equal(adminPayload.database.totalRows,1205);
assert.equal(adminPayload.integrations.database,true);
assert.equal(adminPayload.integrations.socialToken,true);
assert.equal(adminPayload.integrations.bluesky,true);
assert.equal(adminPayload.integrations.telegram,true);
assert.equal(adminPayload.integrations.threads,true);
assert.equal(adminPayload.integrations.advancedAI,false);
assert.equal(adminPayload.social.mode,'automatic');
assert.deepEqual(Object.fromEntries(['meta','facebook','instagram','bluesky','telegram','threads'].map(key=>[key,adminPayload.social.channelCredentials[key]])),{meta:true,facebook:true,instagram:true,bluesky:true,telegram:true,threads:true});
assert.equal(adminPayload.social.pendingDrafts,2);
assert.equal(adminPayload.social.recent.length,1);

const socialDrafts=await worker.fetch(new Request('https://fonta-meteo.example/admin/social-drafts?limit=6&offset=0',{headers:{Origin:'https://meteo.fontanillas.cat',Authorization:'Bearer '+('a'.repeat(32))}}),{ADMIN_TOKEN:'a'.repeat(32),DB:fakeDb},context);
assert.equal(socialDrafts.status,200);
const socialDraftPayload=await socialDrafts.json();
assert.equal(socialDraftPayload.limit,6);
assert.equal(socialDraftPayload.offset,0);
assert.equal(socialDraftPayload.hasMore,false);
assert.equal(socialDraftPayload.drafts.length,1);

console.log('Test d’Administració V21: correcte');
