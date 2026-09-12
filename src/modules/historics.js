import { finiteNumber } from '../core/numeric.js';
import { normalizeArchive, rainTotal } from '../core/archive-coverage.js';
import { historyTimestamp, normalizeHistoryMetrics } from '../core/history-data.js';

const STORAGE_KEY = 'fontanillas-weather-history-v1';
const MAX_SAMPLES = 2016; // Set dies a intervals de cinc minuts.

function read() {
  try { const rows = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(rows) ? normalizeArchive(rows).map(normalizeHistoryMetrics) : []; }
  catch { return []; }
}

export function recordReading(data) {
  const history = read();
  const timestamp = historyTimestamp(data);
  const sample = { t: timestamp, temperature: finiteNumber(data.temperature), pressure: finiteNumber(data.pressure), humidity: finiteNumber(data.humidity), windSpeed: finiteNumber(data.windSpeed) };
  const previous = history.length ? history[history.length - 1] : null;
  if (Number.isFinite(timestamp) && timestamp <= Date.now() && (!previous || previous.t !== timestamp)) history.push(sample);
  const trimmed = history.slice(-MAX_SAMPLES);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* L'espai local pot estar desactivat. */ }
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const today = trimmed.filter(item => item.t >= start.getTime());
  const temperatures = today.map(item => item.temperature).filter(Number.isFinite);
  const high = extreme(today, 'temperature', 'max');
  const low = extreme(today, 'temperature', 'min');
  return {
    history: trimmed,
    previous,
    stats: {
      maxTemperature: temperatures.length ? Math.max(...temperatures) : finiteNumber(data.temperature),
      maxTemperatureTime: high?.t ?? timestamp,
      minTemperature: temperatures.length ? Math.min(...temperatures) : finiteNumber(data.temperature),
      minTemperatureTime: low?.t ?? timestamp
    }
  };
}

export function normalizeRemoteHistory(payload) {
  return normalizeArchive((payload?.observations || []).map(item => ({ ...normalizeHistoryMetrics(item), interval:payload.interval, t:historyTimestamp(item) })));
}

function numeric(items, key) { return items.map(item => finiteNumber(item[key])).filter(value=>value!==null); }
function extreme(items, key, mode) { return items.filter(item => finiteNumber(item[key])!==null).reduce((best,item) => !best || (mode === 'max' ? Number(item[key]) > Number(best[key]) : Number(item[key]) < Number(best[key])) ? item : best, null); }
function temperatureExtreme(items, mode) {
  const aggregateKey = mode === 'max' ? 'temperatureMax' : 'temperatureMin';
  const value = item => {
    const aggregate = finiteNumber(item?.[aggregateKey]);
    if (item?.[aggregateKey] !== null && item?.[aggregateKey] !== '' && Number.isFinite(aggregate)) return aggregate;
    const temperature = finiteNumber(item?.temperature);
    return item?.temperature !== null && item?.temperature !== '' && Number.isFinite(temperature) ? temperature : NaN;
  };
  return items.reduce((best, item) => {
    const candidate = value(item);
    if (!Number.isFinite(candidate)) return best;
    if (!best) return item;
    return mode === 'max' ? (candidate > value(best) ? item : best) : (candidate < value(best) ? item : best);
  }, null);
}
function closest(items, target) { return items.reduce((best,item) => Math.abs(item.t-target) < Math.abs((best?.t ?? 0)-target) ? item : best, null); }
function difference(a,b) { const left=finiteNumber(a), right=finiteNumber(b); return left!==null && right!==null ? left-right : null; }

export function summarizeRemoteHistory(data, history, localStats = {}) {
  const currentTime = historyTimestamp(data);
  const dayKey = String(data.updated).slice(0, 10);
  const today = history.filter(item => String(item.time).startsWith(dayKey));
  const currentTemperature = finiteNumber(data.temperature);
  const currentObservation = Number.isFinite(currentTime) && data.temperature !== null && data.temperature !== '' && Number.isFinite(currentTemperature)
    ? { t:currentTime, time:data.updated, temperature:currentTemperature, source:data.source || 'current' }
    : null;
  const localHigh = finiteNumber(localStats.maxTemperature);
  const localLow = finiteNumber(localStats.minTemperature);
  const localObservations = [];
  if (Number.isFinite(localHigh)) localObservations.push({ t:Number(localStats.maxTemperatureTime) || currentTime, temperatureMax:localHigh, source:'browser-history' });
  if (Number.isFinite(localLow)) localObservations.push({ t:Number(localStats.minTemperatureTime) || currentTime, temperatureMin:localLow, source:'browser-history' });
  const todayWithCurrent = [...today, ...localObservations, ...(currentObservation ? [currentObservation] : [])];
  const recent24h = history.filter(item => item.t >= currentTime - 86400000);
  const compare = Number.isFinite(currentTime) ? closest(history.filter(item => item.t < currentTime - 3600000), currentTime - 10800000) || history[0] || null : null;
  const high = temperatureExtreme(todayWithCurrent, 'max');
  const low = temperatureExtreme(todayWithCurrent, 'min');
  const gust = extreme(today, 'windGust', 'max');
  const rain24h = rainTotal(recent24h);
  const todayTotals = numeric(today, 'rainTotal');
  const rainToday = todayTotals.length ? todayTotals[todayTotals.length - 1] : finiteNumber(data.rainToday);
  const wetHours = recent24h.filter((item,index) => Number(item.rainRate) > 0 || Number(item.rainTotal) > Number(recent24h[index-1]?.rainTotal)).length;
  return {
    history,
    previous: compare,
    stats: {
      maxTemperature: high ? Number(high.temperatureMax ?? high.temperature) : currentTemperature,
      maxTemperatureTime: high?.t ?? currentTime,
      minTemperature: low ? Number(low.temperatureMin ?? low.temperature) : currentTemperature,
      minTemperatureTime: low?.t ?? currentTime
    },
    summary: {
      high, low, gust, rain24h, rainToday, wetHours,
      comparisonHours: compare ? Math.max(1, Math.round((currentTime - compare.t) / 3600000)) : null,
      deltaTemperature: difference(data.temperature, compare?.temperature),
      deltaPressure: difference(data.pressure, compare?.pressure),
      deltaHumidity: difference(data.humidity, compare?.humidity),
      deltaUv: difference(data.uv, compare?.uv),
    }
  };
}
