import assert from 'node:assert/strict';
import { intradayCoverage, sampleWeight, weightedDeviation, weightedMean } from '../src/core/statistics.js';
import { historyTimestamp, madridLocalTimestamp } from '../src/core/history-data.js';

const start = Date.parse('2026-09-01T00:00:00Z');
const mixed = [
  { t:start, interval:'daily', temperature:10, samples:288 },
  { t:start + 86400000, interval:'hourly', temperature:20, samples:12 }
];
assert.equal(sampleWeight({samples:0}),1);
assert.equal(sampleWeight({samples:12}),12);
assert.equal(sampleWeight({samples:1,coverageMinutes:60}),12,'One provider hourly aggregate represents one hour');
assert.equal(weightedMean(mixed,'temperature'),10.4,'Daily and hourly aggregates must be weighted by raw samples');
assert.ok(Math.abs(weightedDeviation(mixed,'temperature') - 1.9595917942265424) < 1e-10);
assert.deepEqual(intradayCoverage(mixed,start + 90000000),{samples:300,coveredSamples:300,expectedSamples:300,percent:100});
assert.deepEqual(intradayCoverage([]),{samples:0,coveredSamples:0,expectedSamples:0,percent:null});

assert.equal(madridLocalTimestamp('2026-01-15 12:00:00'),Date.parse('2026-01-15T11:00:00Z'));
assert.equal(madridLocalTimestamp('2026-07-15 12:00:00'),Date.parse('2026-07-15T10:00:00Z'));
assert.equal(historyTimestamp({timeUtc:'2026-07-15 10:00:00'}),Date.parse('2026-07-15T10:00:00Z'));
assert.equal(historyTimestamp({time:'2026-07-15 12:00:00'}),Date.parse('2026-07-15T10:00:00Z'));
assert.ok(Number.isNaN(madridLocalTimestamp('2026-03-29 02:30:00')),'A nonexistent spring DST time must not be invented');

console.log('Auditoria F: estadística ponderada, continuïtat intradiària i hora Europe/Madrid.');
