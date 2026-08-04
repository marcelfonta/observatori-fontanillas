import { CONFIG } from './config.js';

export async function fetchCurrentWeather() {
  const response = await fetch(CONFIG.apiUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export async function fetchHourlyForecast() {
  const { latitude, longitude } = CONFIG.station;
  const params = new URLSearchParams({
    latitude, longitude,
    hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
    timezone: 'Europe/Madrid',
    forecast_days: '2'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Forecast API ${response.status}`);
  return response.json();
}
