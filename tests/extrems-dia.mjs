import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { summarizeRemoteHistory } from '../src/modules/historics.js';

const current = {
  updated:'2026-09-06 15:30:00',
  temperature:35.3,
  pressure:1017,
  humidity:34,
  source:'weather-underground'
};
const history = [
  { time:'2026-09-06 01:59:00', t:new Date('2026-09-06T01:59:00').getTime(), temperatureMin:23.1, temperatureMax:25.3 },
  { time:'2026-09-06 05:44:00', t:new Date('2026-09-06T05:44:00').getTime(), temperatureMin:20.6, temperatureMax:21.0 }
];

const context = summarizeRemoteHistory(current, history);
const currentTime = new Date('2026-09-06T15:30:00').getTime();
assert.equal(context.stats.maxTemperature, 35.3, 'La lectura actual ha de corregir una màxima històrica endarrerida.');
assert.equal(context.stats.maxTemperatureTime, currentTime, 'L’hora de la màxima ha de correspondre a la lectura actual quan aquesta guanya.');
assert.equal(context.stats.minTemperature, 20.6, 'La mínima històrica vàlida s’ha de conservar.');
assert.equal(context.stats.minTemperatureTime, history[1].t, 'L’hora de la mínima històrica s’ha de conservar.');
assert.equal(context.summary.high.temperature, 35.3, 'El resum del dia també ha d’incloure la lectura actual.');

const colder = summarizeRemoteHistory({ ...current, updated:'2026-09-06 06:00:00', temperature:19.8 }, history);
assert.equal(colder.stats.minTemperature, 19.8, 'La lectura actual també ha de corregir una mínima endarrerida.');
assert.equal(colder.stats.maxTemperature, 25.3, 'Una màxima històrica superior s’ha de conservar.');

const later = summarizeRemoteHistory(
  { ...current, updated:'2026-09-06 19:24:00', temperature:29.7 },
  history,
  { maxTemperature:35.8, maxTemperatureTime:currentTime, minTemperature:20.6, minTemperatureTime:history[1].t }
);
assert.equal(later.stats.maxTemperature, 35.8, 'La baixada del vespre no ha de fer perdre la màxima vista abans pel navegador.');
assert.equal(later.stats.maxTemperatureTime, currentTime, 'S’ha de conservar l’hora de la màxima local persistent.');
assert.equal(later.stats.minTemperature, 20.6, 'La combinació local i remota ha de conservar també la mínima correcta.');

const remoteCatchesUp = summarizeRemoteHistory(
  { ...current, updated:'2026-09-06 19:24:00', temperature:29.7 },
  [
    ...history,
    { time:'2026-09-06 07:05:00', t:new Date('2026-09-06T07:05:00').getTime(), temperatureMin:19.5, temperatureMax:20.3 },
    { time:'2026-09-06 13:05:00', t:new Date('2026-09-06T13:05:00').getTime(), temperatureMin:35.3, temperatureMax:37.8 }
  ],
  { maxTemperature:35.8, maxTemperatureTime:currentTime, minTemperature:20.6, minTemperatureTime:history[1].t }
);
assert.equal(remoteCatchesUp.stats.maxTemperature, 37.8, 'Quan l’històric remot es posa al dia, ha de prevaldre el màxim real superior.');
assert.equal(remoteCatchesUp.stats.minTemperature, 19.5, 'Quan l’històric remot es posa al dia, també ha de prevaldre el mínim real inferior.');

const apiSource = await readFile(new URL('../src/services/weather-api.js', import.meta.url), 'utf8');
assert.match(apiSource, /`\/api\/history\?days=\$\{days\}&resolution=\$\{resolution\}&fresh=\$\{freshness\}`/, 'La consulta d’històric ha de passar pel mateix domini i evitar còpies antigues del navegador.');

const { onRequestGet } = await import('../functions/api/history.js');
let requestedUpstream = '';
let requestedOptions = null;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  requestedUpstream = String(url);
  requestedOptions = options;
  return new Response(JSON.stringify({ source:'history-test', observations:[] }), {
    status:200,
    headers:{ 'Content-Type':'application/json', 'Set-Cookie':'private=value' }
  });
};
try {
  const proxied = await onRequestGet({
    request:new Request('https://meteo.fontanillas.cat/api/history?days=45&resolution=hourly&fresh=12345&unexpected=secret')
  });
  assert.equal(requestedUpstream, 'https://fonta-meteo.marcelfonta.workers.dev/history?days=45&resolution=hourly&fresh=12345', 'El proxy només ha de reenviar paràmetres controlats.');
  assert.equal(requestedOptions.headers.Origin, 'https://meteo.fontanillas.cat', 'El proxy ha de conservar l’origen públic perquè el Worker inclogui l’històric complet de D1.');
  assert.equal(proxied.status, 200, 'El proxy ha de conservar l’estat de la resposta de l’històric.');
  assert.equal(proxied.headers.get('cache-control'), 'no-store', 'L’històric del mateix domini no s’ha de servir des d’una memòria intermèdia HTTP.');
  assert.equal(proxied.headers.get('set-cookie'), null, 'El proxy no ha de reenviar galetes del Worker.');
} finally {
  globalThis.fetch = originalFetch;
}

const serviceWorkerSource = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
assert.match(serviceWorkerSource, /url\.pathname\.startsWith\('\/api\/'\)/, 'La PWA ha de tractar el proxy meteorològic com una API i no com un fitxer estàtic.');
assert.match(serviceWorkerSource, /extrems-v4/, 'La correcció ha d’estrenar una memòria cau de la PWA.');
const oneSignalWorkerSource = await readFile(new URL('../OneSignalSDKWorker.js', import.meta.url), 'utf8');
assert.match(oneSignalWorkerSource, /service-worker\.js\?v=extrems-v4/, 'El Worker compartit de OneSignal ha de detectar i instal·lar la nova versió de la PWA.');

console.log('Extrems del dia: la lectura en directe participa en la màxima i la mínima');
