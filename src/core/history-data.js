import { finiteNumber } from './numeric.js';
import { normalizeArchive } from './archive-coverage.js';

export const HISTORY_METRICS = ['temperature','temperatureMin','temperatureMax','dewPoint','pressure','humidity','windSpeed','windGust','rainTotal','rainIncrement','rainRate','solarRadiation','uv'];
export function normalizeHistoryMetrics(row) {
  const result = { ...row };
  for (const key of HISTORY_METRICS) if (Object.hasOwn(row, key)) result[key] = finiteNumber(row[key]);
  return result;
}

// Prefer absolute provider timestamps. The final branch preserves the legacy
// local browser-history contract; it never substitutes the time of consultation.
export function historyTimestamp(row) {
  const epoch = finiteNumber(row?.epoch);
  if (epoch !== null && epoch > 0) return epoch * 1000;
  const source = row?.timeUtc || row?.updatedUtc || row?.time || row?.updated;
  return typeof source === 'string' && source.trim() ? Date.parse(source.replace(' ', 'T')) : NaN;
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
