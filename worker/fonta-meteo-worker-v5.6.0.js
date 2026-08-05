/**
 * METEO FONTA WORKER - Versió 5.6.1 (CORREGIDA)
 * Correcció de l'enllaç d'avisos AEMET
 */

const STATION_ID = "ISANTC198";
const WORKER_VERSION = "5.6.1";
const WORKER_BUILT = "2026-08-05";
const TIME_ZONE = "Europe/Madrid";
const STORAGE_INTERVAL_MINUTES = 5;
const WEBCAM_URL = "https://www.alvar.cat/WebCam/Imatge-Camera.jpg";
const BACKGROUND_URL = "https://santceloni.cat/ARXIUS/agenda/2011/made_in_montseny.jpg";
const DEFAULT_CONTACT_FROM = "Observatori Fontanillas <formulari@fontanillas.cat>";
const AEMET_PRELITORAL_FEED = "https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAZ690803_RSS.xml";
const AEMET_PRELITORAL_PAGE = "https://www.aemet.es/es/eltiempo/prediccion/avisos?l=690803&w=hoy";

const CONTACT_TOPICS = new Set([
  "Dades de l’estació",
  "Predicció i models",
  "Webcam o fonts",
  "Proposta de col·laboració",
  "Altres",
]);
const ALLOWED_CONTACT_ORIGINS = new Set([
  "https://meteo.fontanillas.cat",
  "https://observatori-fontanillas.marcelfonta.workers.dev",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
]);

const CREATE_OBSERVATIONS = `CREATE TABLE IF NOT EXISTS observations (
  observed_epoch INTEGER PRIMARY KEY,
  observed_at_utc TEXT NOT NULL,
  local_time TEXT NOT NULL,
  local_date TEXT NOT NULL,
  station_id TEXT NOT NULL,
  temperature REAL,
  feels_like REAL,
  humidity REAL,
  dew_point REAL,
  pressure REAL,
  wind_speed REAL,
  wind_gust REAL,
  wind_direction REAL,
  rain_total REAL,
  rain_rate REAL,
  rain_delta REAL DEFAULT 0,
  solar_radiation REAL,
  uv REAL,
  quality INTEGER,
  inserted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_LOCAL_DATE_INDEX = `CREATE INDEX IF NOT EXISTS idx_observations_local_date_epoch
ON observations(local_date, observed_epoch DESC)`;
const CREATE_CONTACT_RATE_LIMIT = `CREATE TABLE IF NOT EXISTS contact_rate_limit (
  ip TEXT,
  email TEXT,
  sent_at INTEGER
)`;
const CREATE_CONTACT_RATE_LIMIT_INDEX = `CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_sent_at
ON contact_rate_limit(sent_at)`;
let schemaReady = false;
let contactSchemaReady = false;

function madridOffsetSeconds() {
  try {
    const zone = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      timeZoneName: "longOffset",
    }).formatToParts(new Date()).find(part => part.type === "timeZoneName")?.value || "GMT+1";
    const match = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 3600;
    const hours = Number(match[2]) + Number(match[3] || 0) / 60;
    return (match[1] === "+" ? hours : -hours) * 3600;
  } catch {
    return 3600;
  }
}

function securityHeaders() {
  return {
    "Content-Security-Policy": "default-src 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    ...securityHeaders(),
  };
}

function json(data, status = 200, cacheControl = "no-store", origin = "*") {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json;charset=UTF-8",
      "Cache-Control": cacheControl,
    },
  });
}

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date).replaceAll("-", "");
}

function parseDateKey(value) {
  if (!/^\d{8}$/.test(value || "")) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function value(primary, fallback = null) {
  return primary === undefined || primary === null ? fallback : primary;
}

function finite(input) {
  const number = Number(input);
  return Number.isFinite(number) ? number : null;
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);
}

async function ensureSchema(env) {
  if (!env.DB) return false;
  if (schemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_OBSERVATIONS),
    env.DB.prepare(CREATE_LOCAL_DATE_INDEX),
  ]);
  schemaReady = true;
  return true;
}

async function ensureContactSchema(env) {
  if (!env.DB) return false;
  if (contactSchemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_CONTACT_RATE_LIMIT),
    env.DB.prepare(CREATE_CONTACT_RATE_LIMIT_INDEX),
  ]);
  contactSchemaReady = true;
  return true;
}

async function checkContactRateLimit(env, ip, email) {
  if (!(await ensureContactSchema(env))) return { limited: false };
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("DELETE FROM contact_rate_limit WHERE sent_at < ?").bind(now - 86400).run();
  if (ip) {
    const perIp = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM contact_rate_limit WHERE ip = ? AND sent_at > ?"
    ).bind(ip, now - 3600).first();
    if ((Number(perIp?.total) || 0) >= 3) return { limited: true };
  }
  if (email) {
    const perEmail = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM contact_rate_limit WHERE email = ? AND sent_at > ?"
    ).bind(email, now - 86400).first();
    if ((Number(perEmail?.total) || 0) >= 5) return { limited: true };
  }
  return { limited: false };
}

async function recordContactAttempt(env, ip, email) {
  if (!(await ensureContactSchema(env))) return;
  await env.DB.prepare(
    "INSERT INTO contact_rate_limit (ip, email, sent_at) VALUES (?, ?, ?)"
  ).bind(ip || null, email || null, Math.floor(Date.now() / 1000)).run();
}

async function weatherRequest(path, params, env, cacheTtl) {
  if (!env.WU_API_KEY) throw new Error("Falta la variable secreta WU_API_KEY");
  const query = new URLSearchParams({
    stationId: STATION_ID,
    format: "json",
    units: "m",
    numericPrecision: "decimal",
    ...params,
    apiKey: env.WU_API_KEY,
  });
  const response = await fetch(`https://api.weather.com${path}?${query}`, {
    cf: { cacheEverything: true, cacheTtl },
  });
  if (!response.ok) {
    const error = new Error(`Weather Underground ha respost ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function currentObservation(env) {
  const data = await weatherRequest("/v2/pws/observations/current", {}, env, 120);
  const obs = data.observations?.[0];
  if (!obs?.metric) throw new Error("Weather Underground no ha retornat cap observació actual");
  return {
    station: "Observatori Meteorològic Fontanillas",
    stationId: STATION_ID,
    location: "Sant Celoni · Montseny",
    updated: obs.obsTimeLocal,
    updatedUtc: obs.obsTimeUtc,
    epoch: obs.epoch,
    temperature: obs.metric.temp,
    feelsLike: value(obs.metric.heatIndex, value(obs.metric.windChill, obs.metric.temp)),
    humidity: obs.humidity,
    dewPoint: obs.metric.dewpt,
    pressure: obs.metric.pressure,
    windSpeed: obs.metric.windSpeed,
    windGust: obs.metric.windGust,
    windDirection: obs.winddir,
    rainToday: obs.metric.precipTotal,
    rainRate: obs.metric.precipRate,
    solarRadiation: obs.solarRadiation,
    uv: obs.uv,
    quality: obs.qcStatus,
    webcam: WEBCAM_URL,
    background: BACKGROUND_URL,
  };
}

async function persistObservation(observation, env) {
  if (!(await ensureSchema(env))) return { stored:false, reason:"D1 no configurat" };
  const epoch = Number(observation.epoch) || Math.floor(new Date(observation.updatedUtc).getTime() / 1000);
  if (!Number.isFinite(epoch)) throw new Error("L’observació no té una hora UTC vàlida");
  const localTime = String(observation.updated || "");
  const localDate = localTime.slice(0, 10);
  const currentRain = Math.max(0, finite(observation.rainToday) || 0);
  const previous = await env.DB.prepare(
    "SELECT rain_total FROM observations WHERE local_date = ? AND observed_epoch < ? ORDER BY observed_epoch DESC LIMIT 1"
  ).bind(localDate, epoch).first();
  const previousRain = finite(previous?.rain_total);
  const rainDelta = previousRain === null ? currentRain : Math.max(0, currentRain - previousRain);

  await env.DB.prepare(`INSERT INTO observations (
    observed_epoch, observed_at_utc, local_time, local_date, station_id,
    temperature, feels_like, humidity, dew_point, pressure,
    wind_speed, wind_gust, wind_direction, rain_total, rain_rate, rain_delta,
    solar_radiation, uv, quality
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(observed_epoch) DO UPDATE SET
    observed_at_utc=excluded.observed_at_utc, local_time=excluded.local_time,
    temperature=excluded.temperature, feels_like=excluded.feels_like,
    humidity=excluded.humidity, dew_point=excluded.dew_point, pressure=excluded.pressure,
    wind_speed=excluded.wind_speed, wind_gust=excluded.wind_gust,
    wind_direction=excluded.wind_direction, rain_total=excluded.rain_total,
    rain_rate=excluded.rain_rate, solar_radiation=excluded.solar_radiation,
    uv=excluded.uv, quality=excluded.quality`).bind(
    epoch, observation.updatedUtc, localTime, localDate, STATION_ID,
    finite(observation.temperature), finite(observation.feelsLike), finite(observation.humidity),
    finite(observation.dewPoint), finite(observation.pressure), finite(observation.windSpeed),
    finite(observation.windGust), finite(observation.windDirection), currentRain,
    finite(observation.rainRate), rainDelta, finite(observation.solarRadiation),
    finite(observation.uv), finite(observation.quality)
  ).run();
  return { stored:true, epoch };
}

async function captureObservation(env) {
  const observation = await currentObservation(env);
  const storage = await persistObservation(observation, env);
  return { observation, storage };
}

function mapHistoryObservation(obs) {
  const metric = obs.metric || {};
  return {
    time: obs.obsTimeLocal,
    timeUtc: obs.obsTimeUtc,
    epoch: obs.epoch,
    temperature: metric.tempAvg,
    temperatureMin: metric.tempLow,
    temperatureMax: metric.tempHigh,
    humidity: obs.humidityAvg,
    humidityMin: obs.humidityLow,
    humidityMax: obs.humidityHigh,
    dewPoint: metric.dewptAvg,
    dewPointMin: metric.dewptLow,
    dewPointMax: metric.dewptHigh,
    pressure: Number.isFinite(metric.pressureMax) && Number.isFinite(metric.pressureMin)
      ? (metric.pressureMax + metric.pressureMin) / 2
      : value(metric.pressureMax, metric.pressureMin),
    pressureMin: metric.pressureMin,
    pressureMax: metric.pressureMax,
    pressureTrend: metric.pressureTrend,
    windSpeed: metric.windspeedAvg,
    windSpeedMax: metric.windspeedHigh,
    windGust: metric.windgustHigh,
    windDirection: obs.winddirAvg,
    rainRate: metric.precipRate,
    rainTotal: metric.precipTotal,
    solarRadiation: obs.solarRadiationHigh,
    uv: obs.uvHigh,
    quality: obs.qcStatus,
    samples: 1,
  };
}

function historyRange(requestUrl, maximumDays = 366) {
  const requestedDate = requestUrl.searchParams.get("date");
  const startParam = requestUrl.searchParams.get("start");
  const endParam = requestUrl.searchParams.get("end");
  const requestedDays = Number(requestUrl.searchParams.get("days") || 7);
  let startDate;
  let endDate;
  if (requestedDate) {
    startDate = endDate = parseDateKey(requestedDate);
  } else if (startParam || endParam) {
    startDate = parseDateKey(startParam);
    endDate = parseDateKey(endParam);
  } else {
    const days = Math.min(maximumDays, Math.max(1, Number.isFinite(requestedDays) ? Math.round(requestedDays) : 7));
    endDate = new Date();
    startDate = new Date(endDate.getTime() - (days - 1) * 8640000);
  }
  if (!startDate || !endDate || startDate > endDate) return null;
  const days = Math.floor((endDate - startDate) / 8640000) + 1;
  if (days > maximumDays) return null;
  return {
    startDate,
    endDate,
    start: dateKey(startDate),
    end: dateKey(endDate),
    days,
  };
}

function chooseResolution(days, requested) {
  if (["raw", "hourly", "daily"].includes(requested)) return requested;
  if (days <= 2) return "raw";
  if (days <= 45) return "hourly";
  return "daily";
}

function rowToObservation(row) {
  return {
    time: row.time,
    timeUtc: row.timeUtc,
    epoch: row.epoch,
    temperature: row.temperature,
    temperatureMin: row.temperatureMin,
    temperatureMax: row.temperatureMax,
    humidity: row.humidity,
    humidityMin: row.humidityMin,
    humidityMax: row.humidityMax,
    dewPoint: row.dewPoint,
    dewPointMin: row.dewPointMin,
    dewPointMax: row.dewPointMax,
    pressure: row.pressure,
    pressureMin: row.pressureMin,
    pressureMax: row.pressureMax,
    windSpeed: row.windSpeed,
    windSpeedMax: row.windSpeedMax,
    windGust: row.windGust,
    windDirection: row.windDirection,
    rainRate: row.rainRate,
    rainTotal: row.rainTotal,
    rainIncrement: row.rainIncrement,
    solarRadiation: row.solarRadiation,
    uv: row.uv,
    quality: row.quality,
    samples: Number(row.samples) || 1,
  };
}

async function d1History(env, range, resolution) {
  if (!(await ensureSchema(env))) return [];
  const commonWhere = "WHERE local_date >= ? AND local_date <= ?";
  const offset = madridOffsetSeconds();
  let sql;
  let bindOffset = false;
  if (resolution === "raw") {
    sql = `SELECT observed_epoch AS epoch, local_time AS time, observed_at_utc AS timeUtc,
      temperature, temperature AS temperatureMin, temperature AS temperatureMax,
      humidity, humidity AS humidityMin, humidity AS humidityMax,
      dew_point AS dewPoint, dew_point AS dewPointMin, dew_point AS dewPointMax,
      pressure, pressure AS pressureMin, pressure AS pressureMax,
      wind_speed AS windSpeed, wind_speed AS windSpeedMax, wind_gust AS windGust,
      wind_direction AS windDirection, rain_rate AS rainRate, rain_total AS rainTotal,
      rain_delta AS rainIncrement, solar_radiation AS solarRadiation, uv, quality, 1 AS samples
      FROM observations ${commonWhere} ORDER BY observed_epoch`;
  } else if (resolution === "hourly") {
    sql = `SELECT MIN(observed_epoch) AS epoch, MIN(local_time) AS time, MIN(observed_at_utc) AS timeUtc,
      AVG(temperature) AS temperature, MIN(temperature) AS temperatureMin, MAX(temperature) AS temperatureMax,
      AVG(humidity) AS humidity, MIN(humidity) AS humidityMin, MAX(humidity) AS humidityMax,
      AVG(dew_point) AS dewPoint, MIN(dew_point) AS dewPointMin, MAX(dew_point) AS dewPointMax,
      AVG(pressure) AS pressure, MIN(pressure) AS pressureMin, MAX(pressure) AS pressureMax,
      AVG(wind_speed) AS windSpeed, MAX(wind_speed) AS windSpeedMax, MAX(wind_gust) AS windGust,
      AVG(wind_direction) AS windDirection, MAX(rain_rate) AS rainRate, MAX(rain_total) AS rainTotal,
      SUM(rain_delta) AS rainIncrement, MAX(solar_radiation) AS solarRadiation, MAX(uv) AS uv,
      MAX(quality) AS quality, COUNT(*) AS samples
      FROM observations ${commonWhere}
      GROUP BY strftime('%Y-%m-%dT%H', observed_epoch + ?, 'unixepoch') ORDER BY epoch`;
    bindOffset = true;
  } else {
    sql = `SELECT MIN(observed_epoch) AS epoch, MIN(local_time) AS time, MIN(observed_at_utc) AS timeUtc,
      AVG(temperature) AS temperature, MIN(temperature) AS temperatureMin, MAX(temperature) AS temperatureMax,
      AVG(humidity) AS humidity, MIN(humidity) AS humidityMin, MAX(humidity) AS humidityMax,
      AVG(dew_point) AS dewPoint, MIN(dew_point) AS dewPointMin, MAX(dew_point) AS dewPointMax,
      AVG(pressure) AS pressure, MIN(pressure) AS pressureMin, MAX(pressure) AS pressureMax,
      AVG(wind_speed) AS windSpeed, MAX(wind_speed) AS windSpeedMax, MAX(wind_gust) AS windGust,
      AVG(wind_direction) AS windDirection, MAX(rain_rate) AS rainRate, SUM(rain_delta) AS rainTotal,
      SUM(rain_delta) AS rainIncrement, MAX(solar_radiation) AS solarRadiation, MAX(uv) AS uv,
      MAX(quality) AS quality, COUNT(*) AS samples
      FROM observations ${commonWhere} GROUP BY local_date ORDER BY epoch`;
  }
  const bindings = [
    `${range.start.slice(0, 4)}-${range.start.slice(4, 6)}-${range.start.slice(6, 8)}`,
    `${range.end.slice(0, 4)}-${range.end.slice(4, 6)}-${range.end.slice(6, 8)}`,
  ];
  if (bindOffset) bindings.push(offset);
  const result = await env.DB.prepare(sql).bind(...bindings).all();
  return (result.results || []).map(rowToObservation);
}

async function wuHistory(env, range) {
  const now = new Date();
  const endDate = new Date(Math.min(range.endDate.getTime(), now.getTime()));
  const startDate = new Date(Math.max(range.startDate.getTime(), endDate.getTime() - 30 * 8640000));
  const start = dateKey(startDate);
  const end = dateKey(endDate);
  const params = start === end ? { date:end } : { startDate:start, endDate:end };
  const data = await weatherRequest("/v2/pws/history/hourly", params, env, 300);
  const observations = (data.observations || []).map(mapHistoryObservation);
  return observations.map((observation, index) => {
    const previous = observations[index - 1];
    const currentRain = Math.max(0, finite(observation.rainTotal) || 0);
    const sameDay = String(previous?.time || "").slice(0, 10) === String(observation.time || "").slice(0, 10);
    const previousRain = sameDay ? finite(previous?.rainTotal) : null;
    return {
      ...observation,
      rainIncrement:previousRain === null ? currentRain : Math.max(0, currentRain - previousRain),
    };
  });
}

function average(items, key) {
  const values = items.map(item => finite(item[key])).filter(item => item !== null);
  return values.length ? values.reduce((total, item) => total + item, 0) / values.length : null;
}

function minimum(items, key) {
  const values = items.map(item => finite(item[key])).filter(item => item !== null);
  return values.length ? Math.min(...values) : null;
}

function maximum(items, key) {
  const values = items.map(item => finite(item[key])).filter(item => item !== null);
  return values.length ? Math.max(...values) : null;
}

function aggregateWuHistory(items, resolution) {
  if (resolution !== "daily") return items;
  const groups = new Map();
  items.forEach(item => {
    const key = String(item.time || "").slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.values()].map(group => {
    const first = group[0];
