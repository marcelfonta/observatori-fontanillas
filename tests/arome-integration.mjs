import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [api,prediction,index,fontaCore,collector,workflow,sw,fontaPage]=await Promise.all([
  read('src/services/weather-api.js'),read('src/modules/prediccio.js'),read('index.html'),
  read('src/core/fonta-model.js'),read('scripts/fonta/collect.mjs'),
  read('.github/workflows/fonta-shadow.yml'),read('service-worker.js'),read('fonta.html')
]);

assert.match(api,/fetchModel\('\/v1\/meteofrance', \{ model:'meteofrance_arome_france_hd', forecastDays:2 \}\)/);
assert.match(api,/forecastDays:2 \}\)\.catch\(\(\)=>null\)/);
assert.match(api,/return \{ ecmwf, gfs, icon, arome \}/);
assert.match(prediction,/AROME HD · 1,5 km/);
assert.match(prediction,/activeModels=\[ecmwf,gfs,icon,arome\]\.filter/);
assert.match(prediction,/if\(code===null\|\|code===undefined\|\|code===''\)return null/);
assert.match(index,/AROME HD aporta detall local durant les primeres 48 hores/);
assert.match(index,/visor cartogràfic de Windy continua limitat als tres models/);
assert.deepEqual((await import('../src/core/fonta-model.js')).FONTA.experimentalModels,['meteofrance_arome_france_hd']);
assert.match(collector,/\.\.\.FONTA\.models,\.\.\.FONTA\.experimentalModels/);
assert.match(collector,/FONTA\.experimentalModels\.includes\(model\)\?experimentalFailures:failures/);
assert.match(workflow,/AROME HD només en ombra/);
assert.match(sw,/arome-hd-v1/);
assert.match(fontaCore,/experimentalModels:\['meteofrance_arome_france_hd'\]/);
assert.match(fontaPage,/AROME HD es conserva en paral·lel com a candidat[^<]*no modifica la previsió experimental[^<]*fins que acumuli prou contrast prospectiu[^<]*\./i);

console.log('AROME HD: comparació 48 h, absències explícites i candidat Fonta en ombra.');
