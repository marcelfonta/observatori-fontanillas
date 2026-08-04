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
