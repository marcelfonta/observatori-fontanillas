import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { prepareChartHistory } from '../src/core/history-data.js';
import { rainSummary } from '../src/core/archive-coverage.js';
import { normalizeRemoteHistory, recordReading, summarizeRemoteHistory } from '../src/modules/historics.js';
import { renderCharts, renderMetricSparklines } from '../src/modules/grafiques.js';
import { aggregateWuHistory, counterRainIncrement, historyRange, persistObservation, d1History } from '../worker/index.js';

const now = Date.now(), start = now - 3600000;
const rows = [
  {t:start,temperature:0,pressure:null,rainIncrement:0},
  {t:start+300000,temperature:null,pressure:'',rainIncrement:null},
  {t:start+600000,temperature:20,pressure:1013,rainIncrement:2},
  {t:now,temperature:21,rainIncrement:1}
];
const prepared = prepareChartHistory([...rows, rows[0], {t:now+3600000,temperature:80}], '24h', now);
assert.equal(prepared.rows.length,4);
assert.equal(prepared.points.length,5,'An actual time gap must insert a break');
assert.deepEqual(prepared.points.map(row=>row.rainAccumulated),[0,null,2,undefined,3]);
const many = Array.from({length:600},(_,i)=>({t:now-(600-i)*60000,temperature:i===317?40:20,rainIncrement:1}));
const dense = prepareChartHistory(many,'24h',now);
assert.equal(dense.points.at(-1).rainAccumulated,600,'No increments lost by visual downsampling');
assert.equal(Math.max(...dense.points.map(row=>row.temperature)),40,'Isolated extremes retained');
assert.equal(prepareChartHistory([{t:now,rainIncrement:null}],'24h',now).points[0].rainAccumulated,null);
assert.equal(rainSummary([{t:now,rainIncrement:2,rainSamples:2,samples:5}]).partial,true);
assert.equal(rainSummary([{t:now,rainIncrement:0,rainSamples:5,samples:5}]).partial,false);
assert.equal(normalizeRemoteHistory({observations:[{epoch:now/1000,temperature:false},{epoch:now/1000,temperature:42},{time:''}]}).length,1);
assert.equal(normalizeRemoteHistory({observations:[{epoch:now/1000,temperature:false}]} )[0].temperature,null);

// Render the actual functions and inspect Chart.js configuration, not source strings.
const configs=[];
globalThis.window={Chart:true};
globalThis.Chart=class {constructor(canvas,config){configs.push({id:canvas.id,...config});}destroy(){}};
globalThis.document={getElementById:id=>({id})};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
renderCharts({},[]);
assert.ok(configs.every(chart=>chart.data.datasets.every(dataset=>dataset.data.length===0)),'Empty archive never fabricates 20°C or 1013 hPa');
assert.ok(configs.every(chart=>chart.options.scales.x.display===false && chart.options.scales.y.display===false),'Empty axes must not display 1970 dates or invented zero scales');
configs.length=0;
renderCharts({},rows);
const temperature=configs.find(chart=>chart.id==='temperature-chart');
assert.deepEqual(temperature.data.datasets[0].data.map(p=>p.y),[0,null,20,null,21]);
assert.equal(temperature.data.datasets[0].spanGaps,false);
assert.equal(temperature.options.scales.x.type,'linear','Spacing represents elapsed time, not row index');
assert.equal(temperature.data.datasets[0].tension,0,'No smoothing overshoot');
configs.length=0;
renderMetricSparklines({temperature:25},[]);
assert.equal(configs.length,0,'One reading must not become a fictitious flat two-point series');
renderMetricSparklines({},rows);
assert.ok(configs[0].data.datasets[0].data.some(p=>p.y===null));
assert.equal(recordReading({temperature:null}).history.length,0,'No invented observation timestamp');
const summary=summarizeRemoteHistory({updated:new Date().toISOString(),temperature:null,pressure:null},[{t:start,time:new Date(start).toISOString(),temperature:null,pressure:null,rainIncrement:null}],{maxTemperature:null,minTemperature:null});
assert.equal(summary.stats.maxTemperature,null);
assert.equal(summary.summary.deltaPressure,null);
assert.equal(summary.summary.rain24h,null);
delete globalThis.window;delete globalThis.Chart;delete globalThis.document;delete globalThis.localStorage;

for(const missing of [null,undefined,'',' ',false]) {
  assert.equal(counterRainIncrement(missing,0,true),null);
  assert.equal(counterRainIncrement(2,missing,true),null);
}
assert.equal(counterRainIncrement(0,0,true),0);
assert.equal(counterRainIncrement(2,1,true),1);
assert.equal(counterRainIncrement(0,2,true),null,'A reset is not zero rainfall');
assert.equal(counterRainIncrement(2,null,false),2,'First daily cumulative counter remains known');
const raw=[{time:'2026-09-01 01:00:00',epoch:1788217200,temperature:null,rainIncrement:null},{time:'2026-09-01 02:00:00',epoch:1788220800,temperature:20,rainIncrement:2}];
const daily=aggregateWuHistory(raw,'daily')[0];
assert.equal(daily.temperature,20);
assert.equal(daily.rainTotal,2);
assert.equal(daily.rainSamples,1);
assert.equal(aggregateWuHistory([{time:'2026-09-01',temperature:null,rainIncrement:null}],'daily')[0].rainTotal,null);
for(const days of [1,7,30,366])assert.equal(historyRange(new URL(`https://example.test/history?days=${days}`)).days,days);
assert.equal(historyRange(new URL('https://example.test/history?start=20260901&end=20260907')).days,7);
assert.equal(historyRange(new URL('https://example.test/history?start=20260101&end=20270102')),null);

// Real SQLite: validate both persistence bindings and all three SQL resolutions.
const sqlite=new DatabaseSync(':memory:');
const source=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
for(const match of source.matchAll(/const CREATE_[A-Z_]+ = `([\s\S]*?)`;/g))sqlite.exec(match[1]);
const DB={prepare(sql){let values=[];return {
  bind(...args){values=args;return this;},
  async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};},
  async all(){return {results:sqlite.prepare(sql).all(...values)};},
  async first(){return sqlite.prepare(sql).get(...values)||null;}
};},async batch(items){return Promise.all(items.map(item=>item.run()));}};
const base={epoch:1788217200,updatedUtc:'2026-09-01T01:00:00Z',updated:'2026-09-01 03:00:00'};
await persistObservation({...base,temperature:null,rainToday:null},{DB});
await persistObservation({...base,epoch:base.epoch+300,updated:'2026-09-01 03:05:00',updatedUtc:'2026-09-01T01:05:00Z',temperature:20,rainToday:0},{DB});
await persistObservation({...base,epoch:base.epoch+600,updated:'2026-09-01 03:10:00',updatedUtc:'2026-09-01T01:10:00Z',temperature:0,rainToday:0},{DB});
for(const resolution of ['raw','hourly','daily']) {
  const result=await d1History({DB},{start:'20260901',end:'20260901'},resolution);
  if(resolution==='raw') {assert.equal(result[0].temperature,null);assert.equal(result[0].rainIncrement,null);assert.equal(result[1].rainIncrement,null);assert.equal(result[2].rainIncrement,0);}
  else {assert.equal(result[0].temperature,10);assert.equal(result[0].rainSamples,1);assert.equal(result[0].samples,3);assert.equal(result[0].rainIncrement,0);}
}
sqlite.close();
console.log('Auditoria D: intervals, absències, persistència/agregació SQLite i gràfiques reals sense dades fictícies.');
