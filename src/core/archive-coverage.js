import { finiteNumber } from './numeric.js';

const DAY = 86400000;
const calendar = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' });
export const archiveDateKey = value => calendar.format(new Date(value));
const dayNumber = key => Date.parse(`${key}T12:00:00Z`) / DAY;
const nonnegative = value => { const n = finiteNumber(value); return n !== null && n >= 0 ? n : null; };

// Timestamps are normalized milliseconds, not dates inferred from missing values.
export function normalizeArchive(items = [], now = Date.now()) {
  const byTime = new Map();
  for (const item of items) {
    const t = finiteNumber(item?.t);
    if (t === null || !Number.isFinite(new Date(t).getTime()) || t > now) continue;
    if (!byTime.has(t)) byTime.set(t, { ...item, t });
  }
  return [...byTime.values()].sort((a, b) => a.t - b.t);
}

export function calendarCoverage(items = []) {
  const valid = normalizeArchive(items);
  if (!valid.length) return { observedDays: 0, spanDays: 0, first: null, last: null };
  const first = valid[0].t, last = valid.at(-1).t;
  return {
    observedDays: new Set(valid.map(item => archiveDateKey(item.t))).size,
    spanDays: dayNumber(archiveDateKey(last)) - dayNumber(archiveDateKey(first)) + 1,
    first, last
  };
}

export function rainSummary(items = []) {
  const valid = normalizeArchive(items);
  let total = 0, known = 0;
  const hasIncrements = valid.some(row => Object.hasOwn(row, 'rainIncrement'));
  valid.forEach((item, index) => {
    let amount = nonnegative(item.rainIncrement);
    // Counter differences are a legacy fallback only when the whole series has
    // no increment field. Never bridge an explicit missing increment or reset.
    if (amount === null && !hasIncrements) {
      const previous = valid[index - 1];
      const counter = nonnegative(item.rainTotal), before = nonnegative(previous?.rainTotal);
      if (previous && archiveDateKey(item.t) === archiveDateKey(previous.t) && counter !== null && before !== null && counter >= before) amount = counter - before;
    }
    if (amount !== null) { total += amount; known += 1; }
  });
  return { total: known ? total : null, known, rows: valid.length, partial: known < valid.length };
}

export const rainTotal = items => rainSummary(items).total;

export function dailyRainTotals(items = []) {
  const groups = new Map();
  for (const item of normalizeArchive(items)) {
    const key = archiveDateKey(item.t);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return new Map([...groups].map(([key, rows]) => [key, rainTotal(rows)]));
}

// This is the age of a recorded event, NOT proof of uninterrupted dry weather.
export function daysSinceRainRecord(totals, threshold, now = Date.now()) {
  const today = archiveDateKey(now);
  const matches = [...totals].filter(([key, value]) => key <= today && value !== null && value >= threshold).map(([key]) => key).sort();
  return matches.length ? dayNumber(today) - dayNumber(matches.at(-1)) : null;
}
