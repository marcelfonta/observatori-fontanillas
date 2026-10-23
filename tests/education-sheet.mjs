import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const sheet = read('aula/analisi-aiguat-4-octubre-2026.html');
const solutions = read('aula/analisi-aiguat-4-octubre-2026-solucions.html');
const csv = read('assets/data/aula/aiguat-fontanillas-2026-10-04.csv').trim().split('\n');
const index = read('index.html');

assert.equal(csv.length, 9, 'El CSV ha de contenir capçalera i vuit intervals');
const rows = csv.slice(1).map(row => row.split(';'));
const rain = rows.map(row => Number(row[2]));
assert.equal(Math.round(rain.reduce((sum, value) => sum + value, 0) * 100) / 100, 82.55, 'El total de pluja ha de ser 82,55 mm');
assert.equal(rain[0] + rain[1], 71.12, 'Abans de les 06 h han de constar 71,12 mm');
assert.equal(Math.round(((rain[0] + rain[1]) / 82.55) * 1000) / 10, 86.2, 'El percentatge docent ha de ser 86,2%');
assert.equal(Math.max(...rain), 37.85, 'El màxim ha de correspondre a 00–03 h');

for (const text of ['Objectius d’aprenentatge', '2n–4t d’ESO', '4 d’octubre de 2026', 'Autoria:', 'CC BY 4.0', 'cobertura del dia és del 99%']) {
  assert.ok(sheet.includes(text), `La fitxa ha d’incloure: ${text}`);
}
assert.ok(sheet.includes('<caption>') && sheet.includes('scope="col"') && sheet.includes('scope="row"'), 'La taula ha de tenir estructura accessible');
assert.ok(solutions.includes('86,2%') && solutions.includes('3,1 °C') && solutions.includes('Rúbrica breu'), 'La guia ha d’incloure solucions i rúbrica');
assert.ok(solutions.includes('revisió externa per part d’una persona docent'), 'La guia no ha de fingir la revisió docent pendent');
assert.ok(index.includes('/aula/analisi-aiguat-4-octubre-2026') && index.includes('aiguat-fontanillas-2026-10-04.csv'), 'Aula oberta ha d’enllaçar la fitxa i el CSV');
assert.ok(read('_redirects').includes('/aula/analisi-aiguat-4-octubre-2026'), 'La ruta neta ha de tenir redirect');
assert.ok(read('sitemap.xml').includes('/aula/analisi-aiguat-4-octubre-2026</loc>'), 'La fitxa ha de constar al sitemap');
assert.ok(read('service-worker.js').includes('/css/worksheet.css') && read('service-worker.js').includes('/assets/data/aula/aiguat-fontanillas-2026-10-04.csv'), 'El material ha de ser disponible offline');
assert.ok(read('ROADMAP.md').includes('Provar el material amb almenys una persona docent'), 'La revisió docent ha de continuar pendent');

console.log('education-sheet: OK');
