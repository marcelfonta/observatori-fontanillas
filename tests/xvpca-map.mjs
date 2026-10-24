import assert from 'node:assert/strict';
import {parseAirStations} from '../src/features/environment.js';

const now=Date.parse('2026-10-24T10:15:00Z');
const station=(id,updated='24/10/2026 12:00')=>({id,geometry:{type:'Point',coordinates:[2.49,41.69]},properties:{nom:'Sant Celoni',dataActualitzacio:updated,contaminants:[
  {abbr:'NO2',unitatMida:'µg/m3',dadesHoraries:[{hora:'12',valor:'26',qualitat:'bona'}]},
  {abbr:'O3',unitatMida:'µg/m3',dadesHoraries:[{hora:'12',valor:'63',qualitat:'regular'}]},
  {abbr:'CO',unitatMida:'mg/m3',dadesHoraries:[{hora:'12',valor:'-',qualitat:'no_icqa'}]}
]}});
const items=parseAirStations({features:[station('ES1275A'),station('OLD','24/10/2026 07:00')]},now);
assert.equal(items.length,2);
assert.equal(items[0].id,'ES1275A');
assert.equal(items[0].readings.length,2);
assert.equal(items[0].rank,2,'The marker follows the worst published category');
assert.equal(items[0].readings[1].label,'Regular');
assert.equal(items[1].updated,null,'Stale stations must not show old readings');
assert.deepEqual(items[1].readings,[]);
assert.deepEqual(parseAirStations({features:[{...station('BAD'),geometry:{coordinates:[999,999]}}]},now),[]);
console.log('Mapa XVPCA: coordenades, lectures oficials, pitjor categoria i frescor correctes.');
