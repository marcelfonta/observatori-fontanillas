const STORAGE_KEY = 'fontanillas-weather-history-v1';
const MAX_SAMPLES = 2016; // Set dies a intervals de cinc minuts.

function read() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

export function recordReading(data) {
  const history = read();
  const timestamp = new Date(String(data.updated || '').replace(' ', 'T')).getTime() || Date.now();
  const sample = { t: timestamp, temperature: Number(data.temperature), pressure: Number(data.pressure), humidity: Number(data.humidity), windSpeed: Number(data.windSpeed) };
  const previous = history.length ? history[history.length - 1] : null;
  if (!previous || previous.t !== timestamp) history.push(sample);
  const trimmed = history.slice(-MAX_SAMPLES);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)); } catch { /* L'espai local pot estar desactivat. */ }
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const today = trimmed.filter(item => item.t >= start.getTime());
  const temperatures = today.map(item => item.temperature).filter(Number.isFinite);
  return {
    history: trimmed,
    previous,
    stats: {
      maxTemperature: temperatures.length ? Math.max(...temperatures) : Number(data.temperature),
      minTemperature: temperatures.length ? Math.min(...temperatures) : Number(data.temperature)
    }
  };
}

export function normalizeRemoteHistory(payload) {
  return (payload?.observations || []).map(item => ({
    ...item,
    t: Number(item.epoch) * 1000 || new Date(String(item.time).replace(' ', 'T')).getTime()
  })).filter(item => Number.isFinite(item.t)).sort((a, b) => a.t - b.t);
}

function numeric(items, key) { return items.map(item => Number(item[key])).filter(Number.isFinite); }
function extreme(items, key, mode) { return items.filter(item => Number.isFinite(Number(item[key]))).reduce((best,item) => !best || (mode === 'max' ? Number(item[key]) > Number(best[key]) : Number(item[key]) < Number(best[key])) ? item : best, null); }
function closest(items, target) { return items.reduce((best,item) => Math.abs(item.t-target) < Math.abs((best?.t ?? 0)-target) ? item : best, null); }

export function summarizeRemoteHistory(data, history) {
  const currentTime = new Date(String(data.updated).replace(' ', 'T')).getTime() || Date.now();
  const dayKey = String(data.updated).slice(0, 10);
  const today = history.filter(item => String(item.time).startsWith(dayKey));
  const recent24h = history.filter(item => item.t >= currentTime - 86400000);
  const compare = closest(history.filter(item => item.t < currentTime - 3600000), currentTime - 10800000) || history[0] || null;
  const high = extreme(today, 'temperatureMax', 'max') || extreme(today, 'temperature', 'max');
  const low = extreme(today, 'temperatureMin', 'min') || extreme(today, 'temperature', 'min');
  const gust = extreme(today, 'windGust', 'max');
  const rain24h = numeric(recent24h, 'rainTotal').reduce((sum,value) => sum + value, 0);
  const rainToday = numeric(today, 'rainTotal').reduce((sum,value) => sum + value, 0);
  const wetHours = recent24h.filter(item => Number(item.rainTotal) > 0 || Number(item.rainRate) > 0).length;
  return {
    history,
    previous: compare,
    stats: {
      maxTemperature: high ? Number(high.temperatureMax ?? high.temperature) : Number(data.temperature),
      minTemperature: low ? Number(low.temperatureMin ?? low.temperature) : Number(data.temperature)
    },
    summary: {
      high, low, gust, rain24h, rainToday, wetHours,
      comparisonHours: compare ? Math.max(1, Math.round((currentTime - compare.t) / 3600000)) : null,
      deltaTemperature: compare ? Number(data.temperature) - Number(compare.temperature) : null,
      deltaPressure: compare ? Number(data.pressure) - Number(compare.pressure) : null,
      deltaHumidity: compare ? Number(data.humidity) - Number(compare.humidity) : null,
    }
  };
}
