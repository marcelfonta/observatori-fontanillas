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
assert.match(worker,/comparableDates/);
assert.match(worker,/maximumTemperatureMae/);
assert.match(worker,/minimumTemperatureMae/);
assert.match(worker,/minimumWetDays=7/);
assert.match(worker,/modelMaturity,weights/);
assert.match(worker,/env\.FIRMS_MAP_KEY/);
assert.match(worker,/url\.pathname === "\/fires-nearby"/);
assert.match(html,/data-environment-viewer="firms"/);
assert.match(html,/NASA FIRMS · VIIRS/);
assert.match(html,/id="environment-firms-map"/);
assert.match(html,/Veure el mapa mundial/);
assert.match(environment,/loadFirmsDetections/);
assert.match(environment,/renderFirmsMap/);
assert.match(environment,/circleMarker/);
assert.match(verification,/payload\.byModel/);
assert.match(verification,/fetchForecastVerification\(90\)/);
assert.match(verification,/modelMaturityCopy/);

const {modelMaturityCopy}=await import('../src/features/forecast-verification.js');
assert.match(modelMaturityCopy({modelMaturity:{comparableDays:6}}),/6 de 7/);
assert.match(modelMaturityCopy({modelMaturity:{comparableDays:8,wetDays:3,minimumWetDays:7,nextReviewDays:60,daysToNextReview:52}}),/60 dies \(52 pendents\).*3 de 7 dies plujosos/);
assert.match(modelMaturityCopy({modelMaturity:{comparableDays:90,wetDays:12,minimumWetDays:7,rainWeightsReady:true}}),/60 i 90 dies.*supera el mínim/);

console.log('Multimodel, pesos locals i NASA FIRMS: contractes preparats');
