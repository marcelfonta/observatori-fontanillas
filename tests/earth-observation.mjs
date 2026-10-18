import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EARTH_OBSERVATION_LAYERS,earthLayersFor} from '../src/features/earth-observation.js';

assert.equal(EARTH_OBSERVATION_LAYERS.length,9);
for(const horizon of ['now','today','evolution'])assert.equal(earthLayersFor(horizon).length,3);
assert.ok(EARTH_OBSERVATION_LAYERS.some(layer=>layer.agency.includes('EUMETSAT')));
assert.ok(EARTH_OBSERVATION_LAYERS.some(layer=>layer.agency.includes('NASA')));
assert.ok(EARTH_OBSERVATION_LAYERS.some(layer=>layer.agency.includes('ESA')));
assert.ok(EARTH_OBSERVATION_LAYERS.some(layer=>layer.agency.includes('Copernicus')));
for(const layer of EARTH_OBSERVATION_LAYERS){
  assert.ok(['observation','model','context'].includes(layer.type));
  assert.match(layer.href,/^(\.\/\?page=|https:\/\/)/);
  assert.ok(layer.freshness&&layer.use&&layer.cta);
}
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/data-portal-page="terra"/);
assert.match(html,/id="earth-observation-center"/);
assert.match(html,/Observació.+Model.+Context/s);
console.log('Observació de la Terra: nou fonts, tres horitzons i tipus explícits correctes');
