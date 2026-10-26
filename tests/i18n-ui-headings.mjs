import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UI_HEADING_PHRASES } from '../src/core/i18n-ui-headings.js';
import { getTranslationCoverage, PHRASES } from '../src/core/i18n.js';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const worker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

for (const [source, translations] of Object.entries(UI_HEADING_PHRASES)) {
  assert.ok(source.trim(), 'La clau de traducció no pot ser buida');
  for (const language of ['es', 'en', 'fr']) {
    assert.ok(translations[language]?.trim(), `Falta ${language}: ${source}`);
  }
}

for (const source of [
  'Què cal saber ara a Sant Celoni?',
  'Historial d’avisos',
  'Temperatura del mar',
  'Quins avisos vols rebre?',
  'Guia del Baix Montseny'
]) {
  assert.ok(html.includes(source), `La font ha canviat: ${source}`);
  for (const language of ['es', 'en', 'fr']) {
    assert.equal(PHRASES[source][language], UI_HEADING_PHRASES[source][language]);
  }
}

assert.deepEqual(getTranslationCoverage().missing, { es:[], en:[], fr:[] });
assert.ok(worker.includes("'/src/core/i18n-ui-headings.js'"), 'La PWA ha de desar el nou catàleg');
