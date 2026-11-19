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
