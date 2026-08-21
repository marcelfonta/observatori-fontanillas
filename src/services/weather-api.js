import { CONFIG } from '../core/config.js';

const LAST_OBS_KEY = 'fontanilles-last-obs';

// Desa la darrera observació vàlida a localStorage per poder mostrar dades
// encara que el Worker no respongui (mode sense connexió).
function storeLastObs(data) {
  try {
    localStorage.setItem(LAST_OBS_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch (error) {
    console.warn('No s’ha pogut desar la darrera lectura a localStorage.', error);
  }
}

// Recupera la darrera observació desada. Retorna { data, ts, ageMinutes } o null.
export function getLastCachedObs() {
  try {
    const raw = localStorage.getItem(LAST_OBS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data || !parsed.ts) return null;
    const ageMinutes = Math.max(0, Math.round((Date.now() - parsed.ts) / 60000));
    return { data: parsed.data, ts: parsed.ts, ageMinutes };
  } catch (error) {
    console.warn('No s’ha pogut llegir la darrera lectura de localStorage.', error);
    return null;
  }
}

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
  const data = await response.json();
  if(!data.degraded)storeLastObs(data);
  return data;
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

export async function fetchLongRangeForecast() {
  const { latitude, longitude } = CONFIG.station;
  const params = new URLSearchParams({
    latitude, longitude,
    weekly: 'temperature_2m_mean,temperature_2m_anomaly,precipitation_mean,precipitation_anomaly',
    models: 'ecmwf_ec46_ensemble_mean',
    timezone: 'Europe/Madrid',
    forecast_days: '46'
  });
  const response = await request(`https://seasonal-api.open-meteo.com/v1/seasonal?${params}`, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 18000);
  if (!response.ok) throw new Error(`Seasonal API ${response.status}`);
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

export async function fetchForecastVerification(days = 45) {
  const response=await request(`${CONFIG.apiUrl}/forecast-verification?days=${Math.min(180,Math.max(7,Number(days)||45))}`,{headers:{Accept:'application/json'},cache:'no-store'},15000);
  if(!response.ok)throw new Error(`Forecast verification API ${response.status}`);
  return response.json();
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

export async function fetchAlertHistory(filters={}) {
  const params=new URLSearchParams({page:String(filters.page||1),pageSize:String(filters.pageSize||20)});
  for(const key of ['q','year','month','level','source','phenomenon'])if(String(filters[key]||'').trim())params.set(key,String(filters[key]).trim());
  const response=await request(`${CONFIG.apiUrl}/alert-history?${params}`,{headers:{Accept:'application/json'},cache:'no-store'},12000);
  if(!response.ok)throw new Error(`Alert history API ${response.status}`);
  return response.json();
}

export async function fetchNearbyStations(period = 'now') {
  const response=await request(`${CONFIG.apiUrl}/stations?period=now`,{headers:{Accept:'application/json'},cache:'no-store'},15000);
  if(!response.ok)throw new Error(`Stations API ${response.status}`);
  return response.json();
}

export async function fetchAdvancedMeteoAI(question, context) {
  const response=await request(`${CONFIG.apiUrl}/meteo-ai`,{
    method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},cache:'no-store',
    body:JSON.stringify({question,context})
  },20000);
  if(!response.ok)throw new Error(`Meteo AI API ${response.status}`);
  return response.json();
}

export async function fetchLocalityWeather(query) {
  const name=String(query||'').trim().slice(0,80);
  if(name.length<2)throw new Error('LOCALITY_REQUIRED');
  const geocoding=new URLSearchParams({name,count:'10',language:'ca',format:'json'});
  const locationResponse=await request(`https://geocoding-api.open-meteo.com/v1/search?${geocoding}`,{headers:{Accept:'application/json'},cache:'no-store'},12000);
  if(!locationResponse.ok)throw new Error(`Geocoding API ${locationResponse.status}`);
  const candidates=(await locationResponse.json())?.results||[];
  const requested=name.split(',')[0].trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const location=candidates.find(item=>String(item.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()===requested)||candidates[0];
  if(!location)throw new Error('LOCALITY_NOT_FOUND');
  const forecast=new URLSearchParams({
    latitude:String(location.latitude),longitude:String(location.longitude),
    current:'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m',
    daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,uv_index_max',
    timezone:'auto',forecast_days:'14'
  });
  const weatherResponse=await request(`https://api.open-meteo.com/v1/forecast?${forecast}`,{headers:{Accept:'application/json'},cache:'no-store'},15000);
  if(!weatherResponse.ok)throw new Error(`Forecast API ${weatherResponse.status}`);
  return {location,weather:await weatherResponse.json()};
}
