import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeArchive, calendarCoverage, rainSummary, rainTotal, dailyRainTotals, daysSinceRainRecord } from '../src/core/archive-coverage.js';

const originalNow = Date.now;
Date.now = () => Date.parse('2026-09-12T18:00:00Z');
const row = (date, rainIncrement) => ({ t: Date.parse(date), rainIncrement });
try {
  for (const invalid of [null, undefined, '', ' ', true, false, NaN, Infinity, -1]) {
    assert.equal(rainTotal([row('2026-09-12T10:00:00Z', invalid)]), null);
  }
  assert.equal(rainTotal([]), null);
  assert.equal(rainTotal([row('2026-09-12T10:00:00Z', 0)]), 0);
  const mixed = [row('2026-09-12T10:00:00Z', null), row('2026-09-12T11:00:00Z', 2)];
  assert.deepEqual(rainSummary(mixed), { total: 2, known: 1, rows: 2, partial: true });
  assert.equal(rainTotal([...mixed, mixed[1]]), 2, 'No comptar dues vegades el mateix instant.');
  const legacy = [{ t: Date.parse('2026-09-12T10:00Z'), rainTotal: 2 }, { t: Date.parse('2026-09-12T11:00Z'), rainTotal: 3 }];
  assert.equal(rainTotal(legacy), 1);
  assert.equal(rainTotal([legacy[0]]), null, 'Un comptador sol no és un increment.');
  assert.equal(rainTotal([legacy[1], { ...legacy[0], t: Date.parse('2026-09-12T12:00Z') }]), null, 'No inventar pluja en un reinici de comptador.');
  assert.equal(rainTotal(legacy.map(item => ({ ...item, rainIncrement: null }))), null, 'No substituir absències explícites per comptadors.');
  assert.equal(normalizeArchive([{ t: null }, { t: '' }, { t: true }, { t: Infinity }, { t: Date.now() + 1 }]).length, 0);

  // Calendar dates, not elapsed 24-hour units: midnight, gaps and DST.
  const calendarCase = (a, b, days) => assert.equal(calendarCoverage([{ t: Date.parse(a) }, { t: Date.parse(b) }]).spanDays, days);
  calendarCase('2026-09-10T21:59Z', '2026-09-10T22:01Z', 2);
  calendarCase('2026-09-01T23:00Z', '2026-09-11T01:00Z', 10);
  calendarCase('2026-03-28T23:05Z', '2026-03-29T21:55Z', 1);
  calendarCase('2025-10-25T22:05Z', '2025-10-26T22:55Z', 1);
  const sparse = [row('2026-09-01T10:00Z', 12), row('2026-09-12T10:00Z', null)];
  assert.equal(calendarCoverage(sparse).observedDays, 2);
  assert.equal(calendarCoverage(sparse).spanDays, 12);
  assert.equal(daysSinceRainRecord(dailyRainTotals(sparse), 10), 11);
  assert.equal(daysSinceRainRecord(dailyRainTotals(sparse), 20), null, 'Absència de registre no demostra una ratxa seca.');
  assert.equal(dailyRainTotals(sparse).get('2026-09-12'), null);

  const nodes = new Map();
  global.document = { getElementById(id) { if (!nodes.has(id)) nodes.set(id, { textContent: '' }); return nodes.get(id); } };
  const { renderDataCenter } = await import('../src/features/data-center.js');
  const text = id => nodes.get(id).textContent;
  renderDataCenter([], { rainToday: 9, updated: '2026-09-01T10:00:00Z' });
  for (const id of ['today', 'yesterday', '24h', 'month', 'year', 'episode']) assert.equal(text(`data-rain-${id}`), '— mm');
  assert.equal(text('data-rain-wet-days'), '—');
  assert.equal(text('data-rain-dry-days'), '—');
  renderDataCenter(sparse);
  assert.match(text('data-summary-coverage'), /2 dies amb registres · interval de 12 dies/);
  assert.match(text('data-rain-year-coverage'), /1 amb dades/);
  assert.equal(text('data-rain-today'), '— mm');
  assert.match(text('data-rain-coverage'), /no certifiquen una ratxa seca/);
  assert.equal(text('data-rain-since-20'), '—');
  renderDataCenter([row('2026-09-12T10:00Z', 0)]);
  assert.equal(text('data-rain-today'), '0,0 mm');
  assert.equal(text('data-rain-yesterday'), '— mm');
  assert.equal(text('data-rain-month'), '0,0 mm');
  assert.equal(text('data-rain-dry-days'), '—');
  assert.match(text('data-summary-rain-24h-note'), /Calen 48 h/);
  const sw = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');
  assert.ok(sw.includes("'/src/core/archive-coverage.js'"));
  console.log('Auditoria C: pluja absent, zeros reals, duplicats, cobertura civil i registres de pluja verificats.');
} finally { Date.now = originalNow; delete global.document; }
