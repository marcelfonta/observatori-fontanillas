import { finiteNumber } from './numeric.js';

const FIVE_MINUTES = 5 * 60 * 1000;
const INTERVAL_DURATION = {
  raw: FIVE_MINUTES,
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000
};

export function sampleWeight(item) {
  const coverageMinutes = finiteNumber(item?.coverageMinutes);
  if (coverageMinutes !== null && coverageMinutes > 0) return coverageMinutes / 5;
  const samples = finiteNumber(item?.samples);
  return samples !== null && samples > 0 ? samples : 1;
}

function metric(item, key, fallbackKey) {
  const primary = finiteNumber(item?.[key]);
  return primary !== null ? primary : fallbackKey ? finiteNumber(item?.[fallbackKey]) : null;
}

export function weightedMean(items = [], key, fallbackKey) {
  let total = 0;
  let weight = 0;
  for (const item of items) {
    const value = metric(item, key, fallbackKey);
    if (value === null) continue;
    const currentWeight = sampleWeight(item);
    total += value * currentWeight;
    weight += currentWeight;
  }
  return weight ? total / weight : null;
}

export function weightedDeviation(items = [], key, fallbackKey) {
  const average = weightedMean(items, key, fallbackKey);
  if (average === null) return null;
  let squaredDifference = 0;
  let weight = 0;
  for (const item of items) {
    const value = metric(item, key, fallbackKey);
    if (value === null) continue;
    const currentWeight = sampleWeight(item);
    squaredDifference += (value - average) ** 2 * currentWeight;
    weight += currentWeight;
  }
  return weight ? Math.sqrt(squaredDifference / weight) : null;
}

export function intradayCoverage(items = [], now = Date.now()) {
  const rows = items
    .filter(item => finiteNumber(item?.t) !== null && Number(item.t) <= now)
    .sort((a, b) => Number(a.t) - Number(b.t));
  if (!rows.length) return { samples: 0, coveredSamples: 0, expectedSamples: 0, percent: null };
  const samples = rows.reduce((total, item) => total + (finiteNumber(item?.samples) > 0 ? Number(item.samples) : 1), 0);
  const coveredSamples = rows.reduce((total, item) => total + sampleWeight(item), 0);
  const first = Number(rows[0].t);
  const last = rows.at(-1);
  const intervalDuration = INTERVAL_DURATION[last.interval] || FIVE_MINUTES;
  const coveredUntil = Math.min(now, Number(last.t) + intervalDuration);
  const expectedSamples = Math.max(1, Math.ceil((coveredUntil - first) / FIVE_MINUTES));
  return {
    samples, coveredSamples,
    expectedSamples,
    percent: Math.min(100, coveredSamples / expectedSamples * 100)
  };
}
