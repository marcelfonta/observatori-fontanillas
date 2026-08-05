import { CONFIG } from './config.js';

async function request(url, options={}, timeoutMs=12000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    return await fetch(url,{...options,signal:controller.signal});
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCurrentWeather() {
  const response = await request(CONFIG.apiUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export async function fetchForecast() {
  const { latitude, longitude } = CONFIG.station;
  const params = new URLSearchParams({
    latitude, longitude,
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,cloud_cover,visibility,uv_index,is_day,shortwave_radiation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max',
    timezone: 'Europe/Madrid',
    forecast_days: '7'
  });
  const response = await request(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store' },15000);
  if (!response.ok) throw new Error(`Forecast API ${response.status}`);
  return response.json();
}

async function fetchModel(endpoint) {
  const { latitude, longitude } = CONFIG.station;
  const params = new URLSearchParams({
    latitude, longitude,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max',
    timezone: 'Europe/Madrid',
    forecast_days: '7'
  });
  const response = await request(`https://api.open-meteo.com${endpoint}?${params}`, { cache: 'no-store' },15000);
  if (!response.ok) throw new Error(`Model API ${response.status}`);
  return response.json();
}

export async function fetchModelComparison() {
  const [ecmwf, gfs, icon] = await Promise.all([fetchModel('/v1/ecmwf'), fetchModel('/v1/gfs'), fetchModel('/v1/dwd-icon')]);
  return { ecmwf, gfs, icon };
}

export async function fetchStationHistory(days = 31, resolution = 'auto') {
  const response = await request(`${CONFIG.apiUrl}/history?days=${days}&resolution=${resolution}`, { headers: { Accept: 'application/json' }, cache: 'no-store' },18000);
  if (!response.ok) throw new Error(`History API ${response.status}`);
  return response.json();
}

export async function fetchDataQuality() {
  const response = await request(`${CONFIG.apiUrl}/quality`, { headers: { Accept:'application/json' }, cache:'no-store' });
  if (!response.ok) throw new Error(`Quality API ${response.status}`);
  return response.json();
}

export async function fetchAlerts() {
  const freshness=Math.floor(Date.now()/60000);
  const response = await request(`${CONFIG.apiUrl}/alerts?fresh=${freshness}`, { headers:{ Accept:'application/json' }, cache:'no-store' });
  if (!response.ok) throw new Error(`Alerts API ${response.status}`);
  return response.json();
}
