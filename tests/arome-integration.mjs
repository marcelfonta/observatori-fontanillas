import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [api,prediction,index,fontaCore,collector,workflow,sw,fontaPage,models]=await Promise.all([
  read('src/services/weather-api.js'),read('src/modules/prediccio.js'),read('index.html'),
  read('src/core/fonta-model.js'),read('scripts/fonta/collect.mjs'),
  read('.github/workflows/fonta-shadow.yml'),read('service-worker.js'),read('fonta.html'),read('src/modules/models.js')
]);

assert.match(api,/model:'meteofrance_arome_france_hd', forecastDays:2/);
assert.match(api,/hourly:'precipitation,cloud_cover', deriveWeatherCode:true/);
assert.match(api,/export async function fetchAromeLocalGrid/);
assert.match(api,/forecast_hours:'48'/);
assert.match(api,/return \{ ecmwf, gfs, icon, arome, ensemble \}/);
assert.match(prediction,/AROME HD · 1,5 km/);
assert.match(prediction,/síntesi derivada/);
assert.match(prediction,/activeModels=\[ecmwf,gfs,icon,arome\]\.filter/);
assert.match(prediction,/if\(code===null\|\|code===undefined\|\|code===''\)return null/);
assert.match(index,/AROME HD aporta detall local durant les primeres 48 hores/);
assert.match(index,/data-viewer-model="arome"/);
assert.match(index,/data-viewer-model="aromeHd"/);
assert.match(index,/id="windy-model-catalog-title"/);
assert.match(index,/Aquesta consulta visual no modifica la previsió ni els pesos locals/);
assert.match(index,/\?arome,rain,41\.691,2\.489,9/);
assert.match(index,/\?aromeFrance,rain,41\.691,2\.489,9/);
assert.match(index,/\?nems,rain,41\.691,2\.489,9/);
assert.match(index,/\?aladin,rain,41\.691,2\.489,9/);
assert.match(index,/Windy és l’explorador visual/);
assert.match(index,/id="arome-map"/);
assert.match(index,/id="arome-complete-link"[^>]+href="\/models"/);
assert.match(models,/aromeGrid\.length\} punts AROME HD/);
assert.match(models,/function windyPublicUrl\(\)/);
assert.match(models,/Font: Windy · obrir complet/);
assert.match(models,/meteofrance\/map/);
assert.match(models,/CATALUNYA_BOUNDS/);
assert.match(models,/AROME oficial · Catalunya/);
assert.match(models,/completeLink\.hidden=!isArome/);
assert.deepEqual((await import('../src/core/fonta-model.js')).FONTA.experimentalModels,['meteofrance_arome_france_hd']);
assert.match(collector,/\.\.\.FONTA\.models,\.\.\.FONTA\.experimentalModels/);
assert.match(collector,/FONTA\.experimentalModels\.includes\(model\)\?experimentalFailures:failures/);
assert.match(workflow,/AROME HD només en ombra/);
assert.match(sw,/arome-local-v2/);
assert.match(fontaCore,/experimentalModels:\['meteofrance_arome_france_hd'\]/);
assert.match(fontaPage,/AROME HD es conserva en paral·lel com a candidat[^<]*no modifica la previsió experimental[^<]*fins que acumuli prou contrast prospectiu[^<]*\./i);

console.log('AROME: mapa oficial de Catalunya, detall HD local i candidat Fonta en ombra.');
