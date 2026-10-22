import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DATA_LICENSE } from '../src/features/data-center.js';
import { buildSeoStructuredGraph } from '../src/features/seo.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [html, dataCenter, guide, readme] = await Promise.all([
  read('index.html'), read('src/features/data-center.js'), read('docs/DADES-OBERTES.md'), read('README.md')
]);

assert.equal(DATA_LICENSE.identifier, 'CC BY 4.0');
assert.equal(DATA_LICENSE.url, 'https://creativecommons.org/licenses/by/4.0/');
assert.match(DATA_LICENSE.scope, /no inclou previsions, avisos, mapes, webcams ni dades de tercers/);

const dataset = buildSeoStructuredGraph('centre-dades', null, 'ca')['@graph'].find(item => item['@type'] === 'Dataset');
assert.equal(dataset.license, DATA_LICENSE.url);
assert.equal(dataset.creditText, DATA_LICENSE.attribution);
assert.equal(dataset.isAccessibleForFree, true);

assert.match(html, /id="open-data-license-title"/);
assert.match(html, /"license":"https:\/\/creativecommons\.org\/licenses\/by\/4\.0\/"/);
assert.match(dataCenter, /llicencia: DATA_LICENSE\.identifier/);
assert.match(dataCenter, /license: DATA_LICENSE/);
assert.match(guide, /La llicència MIT del repositori cobreix el programari/);
assert.match(guide, /No cobreix previsions, avisos oficials, mapes, radar/);
assert.match(readme, /El programari es distribueix sota la \[llicència MIT\]/);

console.log('Llicència oberta: abast, atribució, exportacions i Dataset verificats.');
