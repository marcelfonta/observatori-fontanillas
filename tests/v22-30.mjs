import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,portalStatic,headerTools,i18n,weatherApi,portalCss,serviceWorker]=await Promise.all([
  read('src/app.js'),read('src/features/portal-static.js'),read('src/features/header-tools.js'),
  read('src/core/i18n.js'),read('src/services/weather-api.js'),read('css/portal.css'),read('service-worker.js')
]);

assert.match(app,/initLanguage\(\);[\s\S]*initPortal\(\);[\s\S]*initHeaderTools\(\);/,'La portada ha d’inicialitzar idioma i eines de capçalera');
assert.match(portalStatic,/initLanguage\(\);[\s\S]*mountPortalShell[\s\S]*initHeaderTools\(\);/,'Les pàgines estàtiques han de compartir les eines de capçalera');
assert.match(headerTools,/municipis\.html/,'La cerca superior ha de portar a El temps arreu');
assert.match(headerTools,/searchParams\.set\('lat'/,'La navegació ha de conservar la latitud seleccionada');
assert.match(headerTools,/searchParams\.set\('lon'/,'La navegació ha de conservar la longitud seleccionada');
assert.match(headerTools,/ArrowDown/,'Els suggeriments han de ser navegables amb teclat');
assert.match(i18n,/\['ca','es','en','fr'\]/,'El selector ha d’oferir català, castellà, anglès i francès');
assert.match(i18n,/localStorage\.setItem\(STORAGE_KEY/,'La llengua triada s’ha de recordar al navegador');
assert.match(weatherApi,/searchMunicipalities\(query,language='ca'\)/,'La geocodificació ha d’acceptar la llengua activa');
assert.match(portalCss,/@media \(max-width: 780px\)[\s\S]*\.header-place-search:focus-within/,'La cerca ha de tenir un mode mòbil específic');
assert.match(serviceWorker,/src\/core\/i18n\.js/,'La traducció ha d’estar disponible també a la PWA');
assert.match(serviceWorker,/src\/features\/header-tools\.js/,'La cerca superior ha d’estar disponible també a la PWA');

console.log('Test V22.30: idiomes i cerca municipal superior correctes');
