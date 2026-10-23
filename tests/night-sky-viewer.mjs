import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const { stellariumUrl,formatMadridDateTime,madridDateTimeToDate,eveningSolarEvent }=await import('../src/features/night-sky-viewer.js');
const url=new URL(stellariumUrl({name:'Sant Celoni',latitude:41.6906,longitude:2.489,elevation:153},new Date('2026-10-23T20:30:00Z'),'east'));
assert.equal(url.origin,'https://stellarium-web.org');
assert.equal(url.pathname,'/');
assert.equal(url.searchParams.get('lat'),'41.690600');
assert.equal(url.searchParams.get('lng'),'2.489000');
assert.equal(url.searchParams.get('date'),'2026-10-23T20:30:00.000Z');
assert.equal(url.searchParams.get('az'),'90');

assert.equal(formatMadridDateTime(new Date('2026-01-15T20:00:00Z')),'2026-01-15T21:00');
assert.equal(formatMadridDateTime(new Date('2026-07-15T20:00:00Z')),'2026-07-15T22:00');
assert.equal(madridDateTimeToDate('2026-01-15T21:00').toISOString(),'2026-01-15T20:00:00.000Z');
assert.equal(madridDateTimeToDate('2026-07-15T22:00').toISOString(),'2026-07-15T20:00:00.000Z');
const place={latitude:41.6906,longitude:2.489,elevation:153};
const sunset=eveningSolarEvent('2026-10-23T12:00',place,'sunset');
const astronomical=eveningSolarEvent('2026-10-23T12:00',place,'astronomical');
assert.ok(sunset instanceof Date&&astronomical instanceof Date);
assert.ok(astronomical.getTime()>sunset.getTime()+45*60000);
assert.match(formatMadridDateTime(sunset),/^2026-10-23T1[78]:/);

const html=await readFile(resolve(root,'index.html'),'utf8');
assert.match(html,/id="night-sky-viewer"/);
assert.match(html,/id="night-sky-frame"[^>]*loading="lazy"[^>]*hidden/);
assert.doesNotMatch(html,/id="night-sky-frame"[^>]*src=/);
assert.match(html,/alternativa accessible/i);
assert.match(html,/data-sky-time-preset="sunset"/);
assert.match(html,/data-sky-time-preset="astronomical"/);
assert.match(html,/Europe\/Madrid · CET\/CEST/);
assert.match(html,/data-sky-direction="south" aria-pressed="true"/);

const app=await readFile(resolve(root,'src/app.js'),'utf8');
assert.match(app,/ACTIVE_PAGE==='cel'.*night-sky-viewer/s);
const worker=await readFile(resolve(root,'service-worker.js'),'utf8');
const appShell=worker.match(/APP_SHELL\s*=\s*\[([\s\S]*?)\n\];/)?.[1]||'';
assert.doesNotMatch(appShell,/stellarium-web\.org/);
assert.doesNotMatch(worker,/vendor\/stellarium-web/);

const headers=await readFile(resolve(root,'_headers'),'utf8');
assert.match(headers,/frame-src[^\n]*https:\/\/stellarium-web\.org/);
assert.doesNotMatch(headers,/connect-src[^\n]*stellarium\.sfo2/);
console.log('Visor nocturn: càrrega diferida, paràmetres i política externa correctes');
