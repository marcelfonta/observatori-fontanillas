import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const [html, css, js] = await Promise.all([
  readFile(new URL('../visor/analisi.html', import.meta.url), 'utf8'),
  readFile(new URL('../visor/visor.css', import.meta.url), 'utf8'),
  readFile(new URL('../visor/visor.js', import.meta.url), 'utf8')
]);
const check = spawnSync(process.execPath, ['--check', new URL('../visor/visor.js', import.meta.url).pathname], { encoding: 'utf8' });
assert.equal(check.status, 0, check.stderr || 'El JS del visor té errors de sintaxi');

for (const id of ['meteogram-variables', 'meteogram-models', 'chart-show-all', 'chart-hide-all', 'hourly-table-body', 'model-variable', 'model-focus', 'map-expand', 'map-workspace', 'evolution-chart']) {
  assert.ok(html.includes(`id="${id}"`), `Falta el control ${id}`);
}
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Els IDs del visor han de ser únics');
for (const variable of ['temperature', 'rain', 'wind', 'clouds']) {
  assert.ok(html.includes(`data-chart-variable="${variable}"`), `Falta la variable ${variable}`);
}
for (const view of ['explora', 'models', 'verification', 'territory']) {
  assert.ok(html.includes(`data-visor-view="${view}"`), `Falta vista ${view}`);
}
assert.ok(js.includes('const MODEL_COLORS =') && js.includes('DEFAULT_VISIBLE_MODELS'));
assert.ok(js.includes('initModelVisibility(); syncChartVariableButtons();'));
assert.ok(js.includes("$('#meteogram-models').addEventListener('change'"));
assert.ok(js.includes("$('#hourly-table-body').addEventListener('click'"));
assert.ok(js.includes('renderEvolution(); // visual only: no requests, no change in scientific consensus'));
assert.ok(js.includes('const segments = []'), 'Les llacunes del consens no han de connectar-se');
assert.ok(js.includes('const groups = []'), 'Les llacunes dels models no han de connectar-se');
assert.ok(js.includes('const selected = summarize(readings, state.modelVariable)'), 'El consens ha de mantenir el càlcul original');
assert.ok(css.includes('.meteogram-model-option') && css.includes('.hourly-time-link'));
assert.ok(css.includes('.map-column{order:0}'), 'El mòbil ha de prioritzar el mapa');
console.log('visor 2.0 UI: selectors, sintaxi i invariants bàsics OK');

const {paintField} = await import('../visor/color-field.js');
const pixels = new Uint8ClampedArray(9*9*4);
const samples = Array.from({length:25},(_,i)=>i%5*6);
paintField(pixels,9,samples,'temperature');
assert.equal(pixels[3],255);
assert.notDeepEqual(pixels.slice(0,3),pixels.slice(4,7), 'El degradat ha de canviar entre mostres');
samples[20]=null;
paintField(pixels,9,samples,'temperature');
assert.equal(pixels[3],0,'Una cel·la sense dades queda transparent');
for (const variable of ['rain','wetFraction','wind','clouds']){
  samples.fill(0);
  samples[20]=10;
  paintField(pixels,9,samples,variable);
  const wet=pixels.slice(0,3), middle=pixels.slice(4,7), dry=pixels.slice(8,11);
  assert.notDeepEqual(middle,wet,variable+' interpola el punt intermedi');
  assert.notDeepEqual(middle,dry,variable+' manté el contrast amb el zero');
  assert.equal(pixels[11],255,'El zero és una dada vàlida');
  samples[20]=null;
  paintField(pixels,9,samples,variable);
  assert.equal(pixels[7],0,'Una mostra absent deixa el tram transparent');
}

const {seriesWindow,rainTiming} = await import('../visor/forecast-products.js');
const {matchedObservation} = await import('../visor/station-point.js');
const start=Date.UTC(2026,10,25,22), hour=3600000;
const time=Array.from({length:24},(_,i)=>new Date(start+i*hour).toISOString().slice(0,16));
const hourly={time,precipitation:time.map((_,i)=>i===3?.2:0),snowfall:time.map(()=>0)};
for(const length of [1,3,6,12,24]){
  assert.equal(seriesWindow(hourly,'snowfall',time.at(-1),length),0);
}
assert.equal(seriesWindow(hourly,'precipitation',time[4],3),.2);
assert.equal(seriesWindow(hourly,'precipitation',time[0],3),null);
assert.equal(seriesWindow({...hourly,time:time.map((v,i)=>i===2?time[1]:v)},'precipitation',time[4],3),null);
assert.equal(seriesWindow({...hourly,snowfall:[0,null,0]},'snowfall',time[2],3),null);
const compare=[{name:'A',family:'mf',priority:2},{name:'B',family:'mf'},{name:'C',family:'gfs'},{name:'D',family:'dry'},{name:'Auto'}];
const onset=rainTiming(compare,m=>({hourly:{time,precipitation:time.map((_,i)=>i===({A:3,B:5,C:8,D:99}[m.name])?.2:0)}}),time[0]);
assert.equal(onset.families.length,3);
assert.equal(onset.spread,5);
assert.equal(matchedObservation([{epoch:start/1000+60,temperature:0}],start+90000).row.temperature,0);
assert.equal(matchedObservation([{epoch:start/1000-301,temperature:1}],start),undefined);
