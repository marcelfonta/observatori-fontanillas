import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,feature,weather,portal,worker,style,project,serviceWorker]=await Promise.all([
  read('municipis.html'),read('src/features/municipality-explorer.js'),read('src/services/weather-api.js'),read('src/features/portal-shell.js'),read('worker/index.js'),read('css/style.css'),read('project.json'),read('service-worker.js')
]);

assert.equal(JSON.parse(project).version,'22.30.1');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-30-1-traduccio-mobil'));
assert.ok(page.includes('El temps arreu')&&page.includes('MET Norway / Yr')&&page.includes('Meteoblue')&&page.includes('eltiempo.es'));
assert.ok(portal.includes("['municipis','El temps arreu','./municipis.html']")&&portal.includes("['municipis','Arreu']"));
assert.ok(feature.includes('fetchMetNorwayForecast')&&feature.includes('fetchNearbyWebcams')&&feature.includes('renderComparisons')&&feature.includes('renderWebcams')&&feature.includes('www.meteoblue.com/en/weather/search'));
assert.ok(feature.includes('weatherIcon')&&feature.includes('municipality-weather-icon')&&feature.includes('data-forecast-tab="meteoblue"')&&feature.includes('data-forecast-tab="eltiempo"'));
assert.ok(weather.includes('export async function fetchMetNorwayForecast')&&weather.includes('export async function fetchNearbyWebcams'));
assert.ok(worker.includes('api.met.no/weatherapi/locationforecast/2.0/compact')&&worker.includes('MeteoFontanillas/22.10')&&worker.includes('requestedTimezone')&&worker.includes('url.pathname === "/met-forecast"'));
assert.ok(worker.includes('api.windy.com/webcams/api/v3/webcams')&&worker.includes('WINDY_WEBCAMS_API_KEY')&&worker.includes('url.pathname === "/webcams-nearby"'));
assert.ok(style.includes('.municipality-comparisons')&&style.includes('.municipality-met-days')&&style.includes('.municipality-source-tablist'));
assert.ok(style.includes('.municipality-webcams')&&style.includes('.municipality-webcam-grid'));

console.log('Test V22.10.0: El temps arreu i contrast transparent de fonts');
