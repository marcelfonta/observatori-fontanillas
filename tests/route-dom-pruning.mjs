import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, pruner, worker] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/core/route-dom-pruner.js', import.meta.url), 'utf8'),
  readFile(new URL('../service-worker.js', import.meta.url), 'utf8')
]);

const mainEnd = html.indexOf('</main>');
const prunerScript = html.indexOf('src/core/route-dom-pruner.js');
const footerStart = html.indexOf('<footer class="shell">');

assert.ok(mainEnd >= 0 && prunerScript > mainEnd && prunerScript < footerStart,
  'La poda de rutes s’ha d’executar després de construir el contingut i abans de continuar la pàgina.');
assert.match(pruner, /document\.documentElement\.dataset\.portalPage/,
  'La poda ha de respectar la ruta resolta abans del primer dibuix.');
assert.match(pruner, /pages\.includes\(activePage\)/,
  'Els blocs compartits entre diverses rutes s’han de conservar.');
assert.match(pruner, /block\.remove\(\)/,
  'Els blocs inactius s’han de retirar del DOM i no només ocultar.');
assert.match(pruner, /__PORTAL_DOM_METRICS__/,
  'La reducció del DOM ha de quedar mesurable al navegador.');
assert.ok(worker.includes("'/src/core/route-dom-pruner.js'"),
  'La poda de rutes ha de continuar disponible sense connexió.');

console.log('✓ poda del DOM per ruta');
