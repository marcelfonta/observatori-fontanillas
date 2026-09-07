import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, css, feature, app] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../css/portal.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/data-center.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/app.js', import.meta.url), 'utf8')
]);

for (const tab of ['summary', 'charts', 'rain', 'episodes', 'quality']) {
  assert.match(html, new RegExp(`data-data-center-tab="${tab}"`), `Falta la pestanya ${tab}.`);
  assert.match(html, new RegExp(`data-data-center-panel="${tab}"`), `Falta el panell ${tab}.`);
}

assert.match(css, /body\[data-page="centre-dades"\] \[data-data-center-panel\]:not\(\.is-active\)/, 'Les pestanyes no estan limitades al Centre de Dades.');
assert.match(feature, /event\.key === 'ArrowRight'/, 'Falta navegació de teclat entre pestanyes.');
assert.match(feature, /observatori:data-tab-change/, 'El canvi de pestanya no avisa els mòduls dependents.');
assert.match(feature, /searchParams\.set\('tab', activeTab\)/, 'La pestanya activa no queda reflectida a l’enllaç compartible.');
assert.match(app, /event\.detail\?\.tab!==\'charts\'/, 'Les gràfiques no es reactiven en obrir la seva pestanya.');
assert.match(html, /id="data-rain-year-coverage"/, 'L’acumulació anual no informa de la cobertura real.');

console.log('Centre de Dades per pestanyes i cobertura anual: correcte');
