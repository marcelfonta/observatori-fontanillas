import { CONFIG } from './config.js';

export async function fetchCurrentWeather() {
  const response = await fetch(CONFIG.apiUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
