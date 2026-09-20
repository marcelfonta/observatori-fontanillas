import { finiteNumber } from './numeric.js';
import { madridLocalTimestamp } from './history-data.js';

// Editorial freshness budgets, not provider issuance times. The station follows
// the existing 30-minute stale limit; current hourly model values expire at 90m.
export const STATION_MAX_AGE_MS = 30 * 60_000;
export const MODEL_MAX_AGE_MS = 90 * 60_000;
export const nonNegative = value => {
  const n = finiteNumber(value);
  return n !== null && n >= 0 ? n : null;
};
export function environmentalTimestamp(value, utc = false) {
  if (typeof value !== 'string') return NaN;
  const raw = value.trim().replace(' ', 'T');
  const match = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/);
  if (!match) return NaN;
  const calendar = `${match[1]}:${match[2] || '00'}`;
  const check = new Date(`${calendar}Z`);
  if (!Number.isFinite(check.getTime()) || check.toISOString().slice(0, 19) !== calendar) return NaN;
  if (match[3] || utc) return Date.parse(calendar + (match[3] || 'Z'));
  // Reject the ambiguous autumn hour as well as nonexistent spring hours.
  const timestamp = madridLocalTimestamp(calendar);
  if (!Number.isFinite(timestamp)) return NaN;
  const local = t => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'}).format(new Date(t)).replace(' ', 'T');
  if ([timestamp-3600_000,timestamp+3600_000].some(t=>local(t)===calendar)) return NaN;
  return timestamp;
}
export function isFresh(timestamp, now, maxAge) {
  return Number.isFinite(timestamp) && Number.isFinite(now) && now - timestamp >= -5 * 60_000 && now - timestamp < maxAge;
}
export function stationUvReading(current, now = Date.now()) {
  const timestamp = environmentalTimestamp(current?.updatedUtc, true);
  const fallback = environmentalTimestamp(current?.updated);
  const time = Number.isFinite(timestamp) ? timestamp : fallback;
  const value = nonNegative(current?.uv);
  return {value:current?.stale || current?.degraded || !isFresh(time, now, STATION_MAX_AGE_MS) ? null : value, time:Number.isFinite(time)?time:null};
}
export function currentEnvironment(current, now = Date.now()) {
  return isFresh(environmentalTimestamp(current?.time), now, MODEL_MAX_AGE_MS) ? current : {};
}
