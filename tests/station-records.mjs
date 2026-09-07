import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildStationRecordPayload } from '../worker/index.js';
import { recordAge } from '../src/features/station-records.js';
import { onRequestGet } from '../functions/api/records.js';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [html,worker,app,proxy,cache]=await Promise.all([read('index.html'),read('worker/index.js'),read('src/app.js'),read('functions/api/records.js'),read('service-worker.js')]);

const payload=buildStationRecordPayload({
  stored_readings:400,first_epoch:1788100000,last_epoch:1788700000,
  temperature_high:38.4,temperature_high_at:1788500000,
  temperature_low:12.1,temperature_low_at:1788200000,
  wind_gust:61.2,wind_gust_at:1788300000,
  rain_rate:24.8,rain_rate_at:1788400000,
  pressure_high:1031.4,pressure_high_at:1788450000,
  pressure_low:995.2,pressure_low_at:1788250000,
  humidity_high:99,humidity_high_at:1788350000,
  humidity_low:22,humidity_low_at:1788550000,
  solar_high:978,solar_high_at:1788600000,
  uv_high:8.1,uv_high_at:1788600000
},{local_date:'2026-09-01',value:42.3});
assert.equal(payload.records.length,11,'La taula completa ha de contenir els onze extrems definits.');
assert.equal(payload.records.find(item=>item.key==='rain_day').value,42.3);
assert.equal(payload.records.find(item=>item.key==='temperature_high').occurredAt,new Date(1788500000*1000).toISOString());
assert.equal(recordAge('2026-09-06T10:00:00Z',new Date('2026-09-07T10:00:00Z').getTime()),'fa 1 dia');

for(const id of ['station-records-main','station-records-complete','station-records-status'])assert.match(html,new RegExp(`id="${id}"`));
assert.match(html,/href="\.\/\?page=centre-dades#records"/,'La portada i Estació han d’enllaçar la taula completa.');
assert.match(worker,/WITH extremes AS/);
assert.match(worker,/GROUP BY local_date ORDER BY value DESC/);
assert.match(worker,/neighbour\.observed_epoch BETWEEN base\.observed_epoch - 600 AND base\.observed_epoch \+ 600/,'Els rècords d’humitat han de descartar lectures aïllades sense corroboració temporal.');
assert.match(worker,/ABS\(neighbour\.humidity - base\.humidity\) <= 5/,'La corroboració d’humitat ha d’exigir una lectura veïna coherent.');
assert.equal((worker.match(/base\.humidity BETWEEN 10 AND 100/g) || []).length,2,'Els dos extrems d’humitat han d’ignorar valors fora del rang local plausible.');
assert.match(worker,/url\.pathname === "\/records"/);
assert.match(worker,/caches\.default/,'El resum s’ha de conservar a la memòria cau de Cloudflare per protegir les lectures D1.');
assert.match(app,/initStationRecords\(fetchStationRecords\)/);
assert.match(proxy,/fonta-meteo\.marcelfonta\.workers\.dev\/records/);
assert.match(cache,/records-v1/);

let requestedUpstream='';
const previousFetch=globalThis.fetch;
globalThis.fetch=async input=>{requestedUpstream=String(input);return new Response('{}',{headers:{'Content-Type':'application/json'}});};
try{
  await onRequestGet({request:new Request('https://meteo.fontanillas.cat/api/records?fresh=12345&unexpected=secret')});
}finally{globalThis.fetch=previousFetch;}
assert.equal(requestedUpstream,'https://fonta-meteo.marcelfonta.workers.dev/records?fresh=12345','El proxy només ha de reenviar la renovació horària controlada.');

console.log('Rècords de tot l’arxiu: resum eficient, dates i accessos correctes');
