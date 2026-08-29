import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,feature,weather,portal,worker,style,project,serviceWorker,sitemap,roadmap]=await Promise.all([
  read('municipis.html'),read('src/features/municipality-explorer.js'),read('src/services/weather-api.js'),read('src/features/portal-shell.js'),read('worker/index.js'),read('css/portal.css'),read('project.json'),read('service-worker.js'),read('sitemap.xml'),read('ROADMAP.md')
]);

assert.equal(JSON.parse(project).version,'22.22.1');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-22-1')&&serviceWorker.includes("'/municipis.html'")&&serviceWorker.includes("'/src/features/municipality-explorer.js'"));
assert.ok(page.includes('data-portal-static="municipis"')&&page.includes('municipality-search-form')&&page.includes('Fonts diferents, papers diferents'));
assert.ok(page.includes('municipality-favorites')&&feature.includes('fontanillas-municipality-favorites-v1')&&feature.includes('toggleFavorite'),'Falten els municipis desats localment.');
assert.ok(feature.includes("const isFavorite=savedFavorites().some")&&feature.includes("isFavorite?'★ Desat':'☆ Desar municipi'"),'L’estat inicial d’un municipi desat no és coherent.');
assert.ok(feature.includes('searchMunicipalities')&&feature.includes('fetchLocalityForecast')&&feature.includes("fetchNearbyStations('now',location)"));
assert.ok(feature.includes('No és una estació')&&feature.includes('Cap estació disponible fins a'));
assert.ok(feature.includes('municipality-stations panel')&&feature.includes("rawLat!==null&&rawLon!==null"));
assert.ok(weather.includes('export async function searchMunicipalities')&&weather.includes('export async function fetchLocalityForecast'));
assert.ok(weather.includes('compatibilityWarning:true'));
assert.ok(portal.includes("['municipis','El temps arreu','./municipis.html']")&&portal.includes("['Ara',['inici','meteo-ia','estacio','municipis']")&&portal.includes("['municipis','Arreu']"));
assert.ok(worker.includes('hasCustomCenter')&&worker.includes('[20,50,100,200]')&&worker.includes('searchRadiusKm:discovery.searchRadiusKm'));
assert.ok(worker.includes('SOCIAL_SCHEDULE_BLUEPRINT')&&worker.includes("time:'14:00'")&&worker.includes("time:'20:30'")&&worker.includes('schedulePlan:socialSchedulePlan(env)'));
assert.ok(style.includes('.municipality-search')&&style.includes('.municipality-station-grid'));
assert.ok(sitemap.includes('/municipis.html')&&roadmap.includes('V22.9.0 — Consulta meteorològica per municipi'));

console.log('Test V22.10.0: cercador de municipis, previsió i estacions properes');
