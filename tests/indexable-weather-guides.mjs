import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [index, methodology, roadmap] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../metodologia.html', import.meta.url), 'utf8'),
  readFile(new URL('../ROADMAP.md', import.meta.url), 'utf8')
]);

for (const [id, route] of [
  ['guia-sant-celoni', 'inici'],
  ['guia-models', 'prediccio'],
  ['guia-radar-nowcasting', 'radar']
]) {
  assert.match(index, new RegExp(`id="${id}"[\\s\\S]{0,180}data-portal-page="${route}"`));
}

for (const link of [
  '/estacio', '/prediccio#models', '/verificacio', '/radar#territori',
  '/avisos',
  '/metodologia.html#model-fonta'
]) assert.match(index, new RegExp(`href="${link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));

assert.match(index, /Observació és una mesura; predicció és una estimació/);
assert.match(index, /no publica hores d’arribada ni genera alertes automàtiques/);
assert.doesNotMatch(index, /id="guia-terratremols"/);
assert.match(index, /id="environment-panel-earthquakes"/);

assert.match(methodology, /id="model-fonta"/);
assert.match(methodology, /Best Match, ECMWF, ICON, GFS i AROME/);
assert.match(methodology, /almenys set casos reals comparables/);
assert.match(methodology, /no un model físic nou ni una intel·ligència artificial que aprengui sense control/);
assert.match(methodology, /AROME HD es recull en mode experimental/);
assert.match(index, /css\/portal\.css\?v=22\.42\.13-air-map-alerts/);
assert.match(methodology, /css\/portal\.css\?v=22\.42\.0-monthly-summary/);

assert.doesNotMatch(roadmap, /Contingut meteorològic indexable/);
assert.doesNotMatch(roadmap, /\[x\]/);

console.log('indexable weather guides ok');
