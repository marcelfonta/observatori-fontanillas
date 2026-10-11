import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=file=>readFile(new URL(`../${file}`,import.meta.url),'utf8');
const [worker,html,environment,verification]=await Promise.all([
  read('worker/index.js'),
  read('index.html'),
  read('src/features/environment.js'),
  read('src/features/forecast-verification.js')
]);

for(const model of ['best_match','ecmwf','icon','gfs','arome_hd']){
  assert.match(worker,new RegExp(`model:'${model}'`));
}
assert.match(worker,/PARTITION BY f\.target_date,f\.horizon_day,f\.model/);
assert.match(worker,/byModel,weights/);
assert.match(worker,/env\.FIRMS_MAP_KEY/);
assert.match(worker,/url\.pathname === "\/fires-nearby"/);
assert.match(html,/data-environment-viewer="firms"/);
assert.match(html,/NASA FIRMS · VIIRS/);
assert.match(environment,/loadFirmsDetections/);
assert.match(verification,/payload\.byModel/);

console.log('Multimodel, pesos locals i NASA FIRMS: contractes preparats');
