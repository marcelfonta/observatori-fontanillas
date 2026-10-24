import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { parseOfficialAir } from '../src/features/environment.js';

assert.match(readFileSync(new URL('../_headers',import.meta.url),'utf8'),/connect-src[^;]*https:\/\/www\.gencat\.cat/);

const updated='24/10/2026 11:00';
const now=Date.parse('2026-10-24T10:15:00Z');
const pollutant=(abbr,valor,qualitat='bona')=>({abbr,dadesHoraries:[{hora:'10',valor:'999',qualitat},{hora:'11',valor,qualitat}]});
const payload={features:[{id:'ES1275A',properties:{localitat:'Sant Celoni',dataActualitzacio:updated,contaminants:[pollutant('NO2','26'),pollutant('O3','16'),pollutant('PM10','17'),pollutant('PM2.5','8'),pollutant('SO2','3'),pollutant('H2S','1,2')]}}]};
const station=parseOfficialAir(payload,now);
assert.equal(station.updated,updated);
assert.deepEqual(Object.fromEntries(Object.entries(station.readings).map(([key,reading])=>[key,reading.value])),{no2:26,o3:16,pm10:17,pm25:8,so2:3,h2s:1.2});
assert.equal(station.readings.no2.label,'Bona');
assert.equal(parseOfficialAir(payload,now+3*60*60_000),null,'An old measurement must disappear');
assert.equal(parseOfficialAir({...payload,features:[{...payload.features[0],id:'OTHER'}]},now),null,'No neighbouring station may replace Sant Celoni');
const missing=structuredClone(payload);missing.features[0].properties.contaminants[0].dadesHoraries[1].valor='-';
assert.equal(missing.features[0].properties.contaminants[0].dadesHoraries[1].hora,'11');
assert.equal(parseOfficialAir(missing,now).readings.no2,undefined,'An absent value must not turn into zero');
console.log('XVPCA Sant Celoni: station ID, hour, values, quality and freshness verified.');
