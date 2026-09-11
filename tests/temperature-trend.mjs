import assert from 'node:assert/strict';
import { summarizeTemperatureTrend, temperatureTrendGeometry } from '../src/core/temperature-trend.js';

const start=1_789_000_000;
const readings=Array.from({length:289},(_,index)=>({epoch:start+index*300,temperature:20+Math.sin(index/28)*5+index/289*2}));
const trend=summarizeTemperatureTrend(readings);
assert.equal(trend.sampleCount,289);
assert.equal(trend.hours,24);
assert.equal(trend.points.length,25);
assert.equal(trend.startEpoch,start);
assert.equal(trend.endEpoch,start+86400);
assert.equal(trend.current,Number(readings.at(-1).temperature.toFixed(1)));
assert.ok(trend.maximum>trend.minimum);

const full=temperatureTrendGeometry(trend,{width:800,height:140});
const partial=temperatureTrendGeometry(trend,{width:800,height:140,progress:.25});
assert.match(full.path,/^M/);
assert.match(full.area,/ Z$/);
assert.equal(full.visibleCount,25);
assert.equal(partial.visibleCount,7);
assert.ok(partial.current.x<full.current.x);

assert.equal(summarizeTemperatureTrend([{epoch:start,temperature:null},{epoch:start+300,temperature:100}]),null);
assert.equal(temperatureTrendGeometry({points:[]}),null);

console.log('Tendència tèrmica social: resum de 24 h i geometria correctes');
