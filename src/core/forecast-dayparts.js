import { finiteNumber } from './numeric.js';

export const DAYPART_HOURLY_VARIABLES = 'weather_code,temperature_2m,precipitation_probability,wind_gusts_10m';
export const FORECAST_DAYPARTS = Object.freeze([
  Object.freeze({ id:'morning', label:'Matí', startHour:6, endHour:12 }),
  Object.freeze({ id:'afternoon', label:'Tarda', startHour:12, endHour:19 }),
  Object.freeze({ id:'evening', label:'Vespre', startHour:19, endHour:24 }),
]);

const VALID_CODES = new Set([0,1,2,3,45,48,51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]);
const pad = value => String(value).padStart(2,'0');
const clock = hour => `${pad(hour)}:00`;
const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') &&
  Number.isFinite(Date.parse(`${value}T12:00Z`)) && new Date(`${value}T12:00Z`).toISOString().slice(0,10) === value;

export function daypartWeatherLabel(code) {
  const value = finiteNumber(code);
  if (!VALID_CODES.has(value)) return 'Previsió no disponible';
  if (value === 0) return 'Cel serè';
  if (value === 1) return 'Poc ennuvolat';
  if (value === 2) return 'Núvols i clarianes';
  if (value === 3) return 'Cel cobert';
  if (value <= 48) return 'Boira o núvols baixos';
  if (value <= 55) return 'Plugim';
  if (value <= 57 || value === 66 || value === 67) return 'Precipitació engelant';
  if (value <= 65) return 'Pluja';
  if (value <= 77) return 'Neu';
  if (value <= 82) return 'Ruixats';
  if (value <= 86) return 'Ruixats de neu';
  return 'Tempesta';
}

function impact(code) {
  if (code >= 95) return 600 + code;
  if ([56,57,66,67].includes(code)) return 500 + code;
  if (code >= 71 && code <= 86 && ![80,81,82].includes(code)) return 400 + code;
  if (code >= 61 || code >= 51 && code <= 55) return 300 + code;
  if (code === 45 || code === 48) return 200 + code;
  return code;
}

function representativeCode(values) {
  if (!values.length || values.some(value => !VALID_CODES.has(value))) return null;
  const meaningful = values.filter(value => value >= 45);
  // Do not hide a short shower or thunderstorm behind hours of dry/cloudy sky.
  if (meaningful.length) return meaningful.reduce((best,value) => impact(value) > impact(best) ? value : best);
  const counts = new Map();
  for (const value of values) counts.set(value,(counts.get(value) || 0) + 1);
  return [...counts.keys()].sort((a,b) => counts.get(b)-counts.get(a) || b-a)[0];
}

function boundary(date,hour) {
  if (hour < 24) return `${date}T${clock(hour)}`;
  const next = new Date(`${date}T12:00Z`);
  next.setUTCDate(next.getUTCDate()+1);
  return `${next.toISOString().slice(0,10)}T00:00`;
}

/** Input times must be ISO local times returned with timezone=Europe/Madrid.
 * Instantaneous temperature/code: [start,end). Probability/gust describe the
 * preceding hour, so their endpoints are (start,end], including next midnight.
 * A missing hour/field stays unavailable: no daily fallback or fabricated zero.
 */
export function summarizeForecastDayparts(hourly,date,{fromHour=0}={}) {
  if (!validDate(date)) return [];
  const rows = new Map();
  for (const [index,time] of (Array.isArray(hourly?.time) ? hourly.time : []).entries()) {
    if (/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):00$/.test(time)) rows.set(time,index);
  }
  const cutoff = finiteNumber(fromHour);
  return FORECAST_DAYPARTS.flatMap(part => {
    const startHour = Math.max(part.startHour,Math.ceil(cutoff ?? 0));
    if (startHour >= part.endHour) return [];
    const hours = part.endHour-startHour;
    const values = (field,preceding=false) => Array.from({length:hours},(_,offset) => {
      const index = rows.get(boundary(date,startHour+offset+(preceding ? 1 : 0)));
      return index === undefined ? null : finiteNumber(hourly?.[field]?.[index]);
    });
    const temperatures = values('temperature_2m').map(value => value !== null && value >= -60 && value <= 60 ? value : null);
    const probabilities = values('precipitation_probability',true).map(value => value !== null && value >= 0 && value <= 100 ? value : null);
    const gusts = values('wind_gusts_10m',true).map(value => value !== null && value >= 0 && value <= 400 ? value : null);
    const codes = values('weather_code');
    const weatherCode = representativeCode(codes);
    const complete = list => list.every(value => value !== null);
    const condition = daypartWeatherLabel(weatherCode);
    const mixed = weatherCode !== null && weatherCode >= 45 && codes.some(value => value < 45);
    return [{ ...part, date, startHour, hours, timeLabel:`${clock(startHour)}–${clock(part.endHour)}`,
      weatherCode, condition:mixed ? `Possibilitat de ${condition.toLowerCase()}` : condition,
      min:complete(temperatures) ? Math.min(...temperatures) : null,
      max:complete(temperatures) ? Math.max(...temperatures) : null,
      // Maximum HOURLY probability, not the probability of rain in the period.
      rainProbability:complete(probabilities) ? Math.max(...probabilities) : null,
      gust:complete(gusts) ? Math.max(...gusts) : null,
      complete:weatherCode !== null && complete(temperatures) && complete(probabilities) && complete(gusts),
    }];
  });
}

export function normalizeSocialForecast(payload) {
  const daily = payload?.daily || {};
  return (Array.isArray(daily.time) ? daily.time : []).map((date,index) => ({
    date, weatherCode:finiteNumber(daily.weather_code?.[index]),
    condition:daypartWeatherLabel(daily.weather_code?.[index]),
    max:finiteNumber(daily.temperature_2m_max?.[index]), min:finiteNumber(daily.temperature_2m_min?.[index]),
    rainProbability:finiteNumber(daily.precipitation_probability_max?.[index]),
    rain:finiteNumber(daily.precipitation_sum?.[index]), gust:finiteNumber(daily.wind_gusts_10m_max?.[index]),
    dayparts:summarizeForecastDayparts(payload.hourly,date),
  }));
}

export function daypartCaption(parts) {
  return (parts || []).map(part => `${part.label} (${part.timeLabel} h): ${part.condition}`).join(' · ');
}
