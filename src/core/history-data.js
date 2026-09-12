import { finiteNumber } from './numeric.js';
import { normalizeArchive } from './archive-coverage.js';

export const HISTORY_METRICS = ['temperature','temperatureMin','temperatureMax','dewPoint','pressure','humidity','windSpeed','windGust','rainTotal','rainIncrement','rainRate','solarRadiation','uv'];
const MADRID_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone:'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit',
  hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'
});
export function normalizeHistoryMetrics(row) {
  const result = { ...row };
  for (const key of HISTORY_METRICS) if (Object.hasOwn(row, key)) result[key] = finiteNumber(row[key]);
  return result;
}

function timestampParts(timestamp) {
  const parts = Object.fromEntries(MADRID_PARTS.formatToParts(new Date(timestamp))
    .filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
  return [parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second];
}

export function madridLocalTimestamp(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) return NaN;
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(source)) return Date.parse(source.replace(' ', 'T'));
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return NaN;
  const wanted = match.slice(1, 7).map(Number);
  const wantedAsUtc = Date.UTC(wanted[0], wanted[1] - 1, wanted[2], wanted[3], wanted[4], wanted[5] || 0);
  let candidate = wantedAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = timestampParts(candidate);
    const actualAsUtc = Date.UTC(actual[0], actual[1] - 1, actual[2], actual[3], actual[4], actual[5]);
    const adjusted = candidate + wantedAsUtc - actualAsUtc;
    if (adjusted === candidate) break;
    candidate = adjusted;
  }
  const resolved = timestampParts(candidate);
  return resolved.every((part, index) => part === (wanted[index] || 0)) ? candidate : NaN;
}

function utcTimestamp(value) {
  const source = typeof value === 'string' ? value.trim().replace(' ', 'T') : '';
  if (!source) return NaN;
  return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(source) ? source : `${source}Z`);
}

// Prefer absolute provider timestamps and interpret legacy local values in the
// station timezone, never in the visitor's browser timezone.
export function historyTimestamp(row) {
  const epoch = finiteNumber(row?.epoch);
  if (epoch !== null && epoch > 0) return epoch * 1000;
  for (const value of [row?.timeUtc, row?.updatedUtc]) {
    const utc = utcTimestamp(value);
    if (Number.isFinite(utc)) return utc;
  }
  for (const value of [row?.time, row?.updated]) {
    const local = madridLocalTimestamp(value);
    if (Number.isFinite(local)) return local;
  }
  return NaN;
}

export function prepareChartHistory(history, period = '24h', now = Date.now()) {
  const duration = { '24h':86400000, '7d':604800000, '30d':2592000000, '1y':31536000000 }[period] || 31536000000;
  const rows = normalizeArchive(history, now).filter(row => row.t >= now - duration).map(normalizeHistoryMetrics);
  const increments = rows.some(row => Object.hasOwn(row, 'rainIncrement'));
  let total = 0;
  const points = [];
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    const interval = row.interval || (period === '24h' ? 'raw' : period === '1y' ? 'daily' : 'hourly');
    const maxGap = { raw:900000, hourly:5400000, daily:129600000 }[interval] || 5400000;
    if (previous && row.t - previous.t > maxGap) points.push({ t:(previous.t + row.t) / 2, gap:true });
    const amount = finiteNumber(row.rainIncrement);
    let rainAccumulated = finiteNumber(row.rainTotal);
    if (increments) {
      if (amount !== null && amount >= 0) { total += amount; rainAccumulated = total; }
      else rainAccumulated = null;
    }
    points.push({ ...row, rainAccumulated });
  });
  return { rows, points };
}
