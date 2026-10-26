import { weightedMean, sampleWeight } from './statistics.js';
import { finiteNumber } from './numeric.js';

const DAY = 24 * 60 * 60 * 1000;
const EXPECTED_SAMPLES = 288;

function period(rows, start, end) {
  const hourly = rows.filter(row => row.interval !== 'daily' && finiteNumber(row.t) !== null && row.t >= start && row.t < end && finiteNumber(row.temperature) !== null);
  const coverage = Math.min(100, hourly.reduce((sum, row) => sum + sampleWeight(row), 0) / EXPECTED_SAMPLES * 100);
  return { mean:weightedMean(hourly, 'temperature'), coverage };
}

export function recentStationContext(history = [], now = Date.now()) {
  if (!Number.isFinite(now)) return null;
  const current = period(history, now - DAY, now);
  const previous = period(history, now - 2 * DAY, now - DAY);
  if (current.mean === null || previous.mean === null || current.coverage < 80 || previous.coverage < 80) return null;
  return { current:current.mean, previous:previous.mean, difference:current.mean - previous.mean,
    currentCoverage:current.coverage, previousCoverage:previous.coverage };
}
