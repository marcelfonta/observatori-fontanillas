import assert from 'node:assert/strict';
import { hourlyComparison, localForecastHour, readingAt, retrospectiveErrors, summarize } from '../visor/consensus.js';

assert.equal(localForecastHour('2026-11-10T11:00:00Z'), '2026-11-10T12:00');
assert.equal(localForecastHour('2026-07-10T11:00:00Z'), '2026-07-10T13:00');
assert.equal(localForecastHour('2026-11-11T04:55:00Z'), '2026-11-11T06:00', 'the live forecast must use an available hourly slot');
assert.equal(localForecastHour('2026-11-11T05:00:00Z'), '2026-11-11T06:00', 'an exact hour stays unchanged');

const hour = '2026-11-10T12:00';
const data = { hourly: { time: [hour], temperature_2m: [14], precipitation: [0], wind_speed_10m: [null], cloud_cover: [60] } };
assert.equal(readingAt(data, { family: 'gfs' }, '2026-11-10T13:00'), null, 'compare only the exact valid hour');
assert.equal(readingAt(data, { family: 'gfs' }, hour).wind, null, 'missing wind is not zero');

const readings = [
  { model: { reference: true }, temperature: 30, rain: 9 },
  { model: { family: 'meteofrance', priority: 2 }, temperature: 14, rain: 0 },
  { model: { family: 'meteofrance', priority: 1 }, temperature: 16, rain: 2 },
  { model: { family: 'gfs' }, temperature: 18, rain: 0.2 },
  { model: { family: 'ecmwf' }, temperature: null, rain: null }
];
assert.deepEqual(summarize(readings, 'temperature'), { count: 2, available: 3, min: 14, max: 18, median: 16, wet: null });
assert.deepEqual(summarize(readings, 'rain'), { count: 2, available: 3, min: 0, max: 0.2, median: 0.1, wet: 1 });
assert.equal(summarize(readings, 'clouds').count, 0);
assert.deepEqual(hourlyComparison([data, data], [{ family: 'gfs' }, { family: 'gfs' }], [hour], 'temperature')[0].summary, { count: 1, available: 1, min: 14, max: 14, median: 14, wet: null }, 'one model family contributes once');
const epoch = Date.parse('2026-11-10T12:00:00Z') / 1000;
const retrospective = retrospectiveErrors([{ epoch: epoch + 40 * 60, temperature: 13 }, { epoch: epoch + 3600, temperature: null }], [{ name: 'Best Match', hourly: { time: ['2026-11-10T12:00', '2026-11-10T13:00'], temperature_2m_previous_day1: [15, 17] } }]);
assert.deepEqual(retrospective, [{ name: 'Best Match', count: 1, mae: 2 }], 'observations stay in their measured hour and nulls are omitted');
console.log('visor consensus: OK');
