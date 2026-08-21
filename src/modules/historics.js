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
  const high = extreme(today, 'temperature', 'max');
  const low = extreme(today, 'temperature', 'min');
  return {
    history: trimmed,
    previous,
    stats: {
      maxTemperature: temperatures.length ? Math.max(...temperatures) : Number(data.temperature),
      maxTemperatureTime: high?.t ?? timestamp,
      minTemperature: temperatures.length ? Math.min(...temperatures) : Number(data.temperature),
      minTemperatureTime: low?.t ?? timestamp
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
function accumulatedRain(items) {
  const increments=items.map(item=>Number(item.rainIncrement)).filter(Number.isFinite);
  if(increments.length)return increments.reduce((total,value)=>total+Math.max(0,value),0);
  return items.reduce((result,item,index) => {
    const current=Number(item.rainTotal); const previous=Number(items[index-1]?.rainTotal);
    if (!Number.isFinite(current)) return result;
    if (!Number.isFinite(previous)) return result;
    return result + (current >= previous ? current - previous : current);
  },0);
}

export function summarizeRemoteHistory(data, history) {
  const currentTime = new Date(String(data.updated).replace(' ', 'T')).getTime() || Date.now();
  const dayKey = String(data.updated).slice(0, 10);
  const today = history.filter(item => String(item.time).startsWith(dayKey));
  const recent24h = history.filter(item => item.t >= currentTime - 86400000);
  const compare = closest(history.filter(item => item.t < currentTime - 3600000), currentTime - 10800000) || history[0] || null;
  const high = extreme(today, 'temperatureMax', 'max') || extreme(today, 'temperature', 'max');
  const low = extreme(today, 'temperatureMin', 'min') || extreme(today, 'temperature', 'min');
  const gust = extreme(today, 'windGust', 'max');
  const rain24h = accumulatedRain(recent24h);
  const todayTotals = numeric(today, 'rainTotal');
  const rainToday = todayTotals.length ? todayTotals[todayTotals.length - 1] : Number(data.rainToday) || 0;
  const wetHours = recent24h.filter((item,index) => Number(item.rainRate) > 0 || Number(item.rainTotal) > Number(recent24h[index-1]?.rainTotal)).length;
  return {
    history,
    previous: compare,
    stats: {
      maxTemperature: high ? Number(high.temperatureMax ?? high.temperature) : Number(data.temperature),
      maxTemperatureTime: high?.t ?? currentTime,
      minTemperature: low ? Number(low.temperatureMin ?? low.temperature) : Number(data.temperature),
      minTemperatureTime: low?.t ?? currentTime
    },
    summary: {
      high, low, gust, rain24h, rainToday, wetHours,
      comparisonHours: compare ? Math.max(1, Math.round((currentTime - compare.t) / 3600000)) : null,
      deltaTemperature: compare ? Number(data.temperature) - Number(compare.temperature) : null,
      deltaPressure: compare ? Number(data.pressure) - Number(compare.pressure) : null,
      deltaHumidity: compare ? Number(data.humidity) - Number(compare.humidity) : null,
      deltaUv: compare && Number.isFinite(Number(data.uv)) && Number.isFinite(Number(compare.uv)) ? Number(data.uv) - Number(compare.uv) : null,
    }
  };
}
