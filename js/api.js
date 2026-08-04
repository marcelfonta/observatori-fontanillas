import { CONFIG } from './config.js';

export async function fetchCurrentWeather() {
  const response = await fetch(CONFIG.apiUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export async function fetchForecast() {
  const { latitude, longitude } = CONFIG.station;
  const params = new URLSearchParams({
    latitude, longitude,
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,sunrise,sunset,daylight_duration,sunshine_duration',
    timezone: 'Europe/Madrid',
    forecast_days: '7'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Forecast API ${response.status}`);
  return response.json();
}

async function fetchModel(endpoint) {
  const { latitude, longitude } = CONFIG.station;
  const params = new URLSearchParams({
    latitude, longitude,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max',
    timezone: 'Europe/Madrid',
    forecast_days: '7'
  });
  const response = await fetch(`https://api.open-meteo.com${endpoint}?${params}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Model API ${response.status}`);
  return response.json();
}

export async function fetchModelComparison() {
  const [ecmwf, gfs] = await Promise.all([fetchModel('/v1/ecmwf'), fetchModel('/v1/gfs')]);
  return { ecmwf, gfs };
}

export async function fetchStationHistory(days = 31) {
  const response = await fetch(`${CONFIG.apiUrl}/history?days=${days}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`History API ${response.status}`);
  return response.json();
}
