import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EARTH_OBSERVATION_LAYERS,EARTH_VIEWER_BOUNDS,EARTH_VIEWER_LAYERS,EARTH_VIEWER_REGIONS,earthLayersFor,earthViewerUrl} from '../src/features/earth-observation.js';

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
const source=await readFile(new URL('../src/features/earth-observation.js',import.meta.url),'utf8');
assert.match(html,/data-portal-page="terra"/);
assert.match(html,/id="earth-observation-center"/);
assert.match(html,/Observació.+Model.+Context/s);
assert.deepEqual(Object.keys(EARTH_VIEWER_LAYERS),['clouds','airmass','lightning']);
assert.deepEqual(Object.keys(EARTH_VIEWER_REGIONS),['catalunya','mediterrani','europa']);
assert.deepEqual(Object.keys(EARTH_VIEWER_BOUNDS),['catalunya','mediterrani','europa']);
assert.match(earthViewerUrl('lightning','europa'),/earth-observation\/map\?layer=lightning&region=europa$/);
assert.match(html,/id="earth-viewer"/);
assert.match(html,/id="earth-viewer-map"/);
assert.doesNotMatch(html,/id="earth-viewer-image"/);
assert.match(html,/base topogràfica/i);
assert.match(source,/World_Topo_Map/);
assert.match(source,/fitBounds\(EARTH_VIEWER_BOUNDS\[region\]/);
console.log('Observació de la Terra: nou fonts, tres horitzons i visor topogràfic estable correctes');
