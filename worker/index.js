import { CATALONIA_COUNTY_PATHS } from './catalonia-counties.js';

const STATION_ID = "ISANTC198";
const WORKER_VERSION = "22.27.0";
const WORKER_BUILT = "2026-08-30";
const TIME_ZONE = "Europe/Madrid";
const STORAGE_INTERVAL_MINUTES = 5;
const STORAGE_SUMMARY_CACHE_MS = 5 * 60 * 1000;
const SOCIAL_AUTOMATIC_MAX_ATTEMPTS = 4;
const runtimeStateCache = new Map();
const STATION_LATITUDE = 41.6906;
const STATION_LONGITUDE = 2.4890;
const WEBCAM_URL = "https://www.alvar.cat/WebCam/Imatge-Camera.jpg";
const BACKGROUND_URL = "https://santceloni.cat/ARXIUS/agenda/2011/made_in_montseny.jpg";
const DEFAULT_CONTACT_FROM = "Observatori Fontanillas <formulari@fontanillas.cat>";
const YOUTUBE_OAUTH_REDIRECT_URI = "https://fonta-meteo.marcelfonta.workers.dev/oauth/youtube/callback";
const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const TIKTOK_OAUTH_REDIRECT_URI = "https://fonta-meteo.marcelfonta.workers.dev/oauth/tiktok/callback";
const TIKTOK_OAUTH_SCOPE = "user.info.basic,video.upload";
const AEMET_PRELITORAL_FEED = "https://www.aemet.es/documentos_d/eltiempo/prediccion/avisos/rss/CAP_AFAZ690803_RSS.xml";
const AEMET_PRELITORAL_PAGE = "https://www.aemet.es/es/eltiempo/prediccion/avisos?l=690803&w=hoy";
const METEOCAT_SMP_ENDPOINT = "https://api.meteo.cat/pronostic/v2/smp/episodis-oberts";
const METEOCAT_ALERTS_PAGE = "https://www.meteo.cat/prediccio/general";
const METEOCAT_VALLES_ORIENTAL_ID = 41;
const METEOCAT_VALLES_ORIENTAL_NAME = "Vallès Oriental";
const THREECAT_SEARCH_URL = "https://www.3cat.cat/cercador/";
const FORECAST_VIDEO_HTML_LIMIT = 900_000;
const COMPARISON_STATIONS = [
  { id: "fontanillas", name: "Fontanillas", municipality: "Sant Celoni", source: "Weather Underground", stationId: "ISANTC198", latitude: 41.6906, longitude: 2.4890 },
  { id: "alvar", name: "Alvar · Montseny", municipality: "Sant Celoni", source: "Weather Underground", stationId: "ICATALUN213", latitude: 41.69, longitude: 2.49 },
  { id: "santceloni-centre", name: "Sant Celoni · Centre", municipality: "Sant Celoni", source: "Weather Underground", stationId: "ICATALON13", latitude: 41.69, longitude: 2.49 },
  { id: "palautordera", name: "Santa Maria de Palautordera", municipality: "Santa Maria de Palautordera", source: "Weather Underground", stationId: "ISANTA1397", latitude: 41.69, longitude: 2.45 },
];

const CONTACT_TOPICS = new Set([
  "Dades de l'estació",
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
const CREATE_CONTACT_RATE_LIMIT_IP_INDEX = `CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_ip_time
ON contact_rate_limit(ip, sent_at DESC)`;
const CREATE_CONTACT_RATE_LIMIT_EMAIL_INDEX = `CREATE INDEX IF NOT EXISTS idx_contact_rate_limit_email_time
ON contact_rate_limit(email, sent_at DESC)`;
const CREATE_ALERT_EVENTS = `CREATE TABLE IF NOT EXISTS alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  level TEXT NOT NULL,
  phenomenon TEXT,
  title TEXT,
  description TEXT,
  started_at TEXT NOT NULL,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_ALERT_EVENTS_INDEX = `CREATE INDEX IF NOT EXISTS idx_alert_events_started ON alert_events(started_at DESC)`;
const CREATE_ALERT_STATE = `CREATE TABLE IF NOT EXISTS alert_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_PUSH_SUBSCRIPTIONS = `CREATE TABLE IF NOT EXISTS push_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  alert_rain INTEGER NOT NULL DEFAULT 0,
  alert_wind INTEGER NOT NULL DEFAULT 0,
  alert_storm INTEGER NOT NULL DEFAULT 0,
  alert_snow INTEGER NOT NULL DEFAULT 0,
  alert_temperature INTEGER NOT NULL DEFAULT 0,
  alert_level_yellow INTEGER NOT NULL DEFAULT 0,
  alert_level_orange INTEGER NOT NULL DEFAULT 0,
  alert_level_red INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_PUSH_SUBSCRIPTIONS_INDEX = `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_preferences
ON push_subscriptions(alert_rain, alert_wind, alert_storm, alert_snow, alert_temperature, alert_level_yellow, alert_level_orange, alert_level_red)`;
const CREATE_ADMIN_AUTH_ATTEMPTS = `CREATE TABLE IF NOT EXISTS admin_auth_attempts (
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
)`;
const CREATE_ADMIN_AUTH_ATTEMPTS_INDEX = `CREATE INDEX IF NOT EXISTS idx_admin_auth_attempts_ip_time
ON admin_auth_attempts(ip, attempted_at DESC)`;
const CREATE_SOCIAL_DRAFTS = `CREATE TABLE IF NOT EXISTS social_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dedupe_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  channels TEXT NOT NULL DEFAULT '["facebook","instagram","bluesky","telegram"]',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  source_url TEXT NOT NULL DEFAULT 'https://meteo.fontanillas.cat/',
  payload TEXT,
  scheduled_for TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_SOCIAL_DRAFTS_INDEX = `CREATE INDEX IF NOT EXISTS idx_social_drafts_status_created
ON social_drafts(status, created_at DESC)`;
const CREATE_SOCIAL_PUBLICATIONS = `CREATE TABLE IF NOT EXISTS social_publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  remote_id TEXT,
  response_code INTEGER,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  FOREIGN KEY(draft_id) REFERENCES social_drafts(id)
)`;
const CREATE_SOCIAL_PUBLICATIONS_INDEX = `CREATE INDEX IF NOT EXISTS idx_social_publications_draft_created
ON social_publications(draft_id, created_at DESC)`;
const CREATE_OAUTH_TOKENS = `CREATE TABLE IF NOT EXISTS oauth_tokens (
  provider TEXT PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  expires_at INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_MONITOR_STATE = `CREATE TABLE IF NOT EXISTS monitor_state (
  service_key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'unknown',
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,
  last_failure_at TEXT,
  last_success_at TEXT,
  last_notified_at TEXT,
  detail TEXT
)`;
const CREATE_AI_RATE_LIMIT = `CREATE TABLE IF NOT EXISTS ai_rate_limit (
  ip_hash TEXT NOT NULL,
  asked_at INTEGER NOT NULL
)`;
const CREATE_AI_RATE_LIMIT_INDEX = `CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_time
ON ai_rate_limit(asked_at)`;
const CREATE_AI_RATE_LIMIT_IP_INDEX = `CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_ip_time
ON ai_rate_limit(ip_hash, asked_at DESC)`;
const CREATE_FORECAST_SNAPSHOTS = `CREATE TABLE IF NOT EXISTS forecast_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_key TEXT NOT NULL UNIQUE,
  issued_at TEXT NOT NULL,
  issued_epoch INTEGER NOT NULL,
  target_date TEXT NOT NULL,
  horizon_day INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  weather_code INTEGER,
  temperature_max REAL,
  temperature_min REAL,
  precipitation_probability REAL,
  precipitation_sum REAL,
  wind_gust_max REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const CREATE_FORECAST_SNAPSHOTS_INDEX = `CREATE INDEX IF NOT EXISTS idx_forecast_target_horizon
ON forecast_snapshots(target_date DESC,horizon_day,issued_epoch DESC)`;
let schemaReady = false;
let contactSchemaReady = false;
let alertSchemaReady = false;
let adminAuthSchemaReady = false;
let socialDraftSchemaReady = false;
let operationsSchemaReady = false;
let forecastSchemaReady = false;
let oauthTokenSchemaReady = false;

// Offset (en segons) de la zona horària de Madrid respecte a UTC, calculat
// dinàmicament perquè s'adapti automàticament a CET (UTC+1) i CEST (UTC+2).
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

// Capçaleres de seguretat aplicades a totes les respostes del Worker.
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
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
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

function observationIsPlausible(observation) {
  const ranges={temperature:[-50,60],humidity:[0,100],pressure:[850,1100],windSpeed:[0,200],windGust:[0,250],windDirection:[0,360],rainToday:[0,1000],rainRate:[0,500],solarRadiation:[0,1600],uv:[0,20]};
  return Object.entries(ranges).every(([key,[min,max]])=>{const number=finite(observation[key]);return number===null||(number>=min&&number<=max);});
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
    env.DB.prepare(CREATE_CONTACT_RATE_LIMIT_IP_INDEX),
    env.DB.prepare(CREATE_CONTACT_RATE_LIMIT_EMAIL_INDEX),
  ]);
  contactSchemaReady = true;
  return true;
}

// Comprova els límits d'enviament del formulari de contacte i registra l'intent.
// Retorna { limited:true } si se supera algun límit, o { limited:false } si es permet.
async function checkContactRateLimit(env, ip, email) {
  if (!(await ensureContactSchema(env))) return { limited: false };
  const now = Math.floor(Date.now() / 1000);
  const ipKey = ip ? await sha256Text(`contact-ip:${ip}`) : '';
  const emailKey = email ? await sha256Text(`contact-email:${String(email).trim().toLowerCase()}`) : '';
  // Màxim 3 enviaments per IP a la darrera hora.
  if (ipKey) {
    const perIp = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM contact_rate_limit WHERE ip = ? AND sent_at > ?"
    ).bind(ipKey, now - 3600).first();
    if ((Number(perIp?.total) || 0) >= 3) return { limited: true };
  }
  // Màxim 5 enviaments per email a les darreres 24 h.
  if (emailKey) {
    const perEmail = await env.DB.prepare(
      "SELECT COUNT(*) AS total FROM contact_rate_limit WHERE email = ? AND sent_at > ?"
    ).bind(emailKey, now - 86400).first();
    if ((Number(perEmail?.total) || 0) >= 5) return { limited: true };
  }
  return { limited: false };
}

async function recordContactAttempt(env, ip, email) {
  if (!(await ensureContactSchema(env))) return;
  const ipKey = ip ? await sha256Text(`contact-ip:${ip}`) : null;
  const emailKey = email ? await sha256Text(`contact-email:${String(email).trim().toLowerCase()}`) : null;
  await env.DB.prepare(
    "INSERT INTO contact_rate_limit (ip, email, sent_at) VALUES (?, ?, ?)"
  ).bind(ipKey, emailKey, Math.floor(Date.now() / 1000)).run();
}

async function ensureAlertSchema(env) {
  if (!env.DB) return false;
  if (alertSchemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_ALERT_EVENTS),
    env.DB.prepare(CREATE_ALERT_EVENTS_INDEX),
    env.DB.prepare(CREATE_ALERT_STATE),
    env.DB.prepare(CREATE_PUSH_SUBSCRIPTIONS),
    env.DB.prepare(CREATE_PUSH_SUBSCRIPTIONS_INDEX),
  ]);
  alertSchemaReady = true;
  return true;
}

async function ensureAdminAuthSchema(env) {
  if (!env.DB) return false;
  if (adminAuthSchemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_ADMIN_AUTH_ATTEMPTS),
    env.DB.prepare(CREATE_ADMIN_AUTH_ATTEMPTS_INDEX),
  ]);
  adminAuthSchemaReady = true;
  return true;
}

async function ensureSocialDraftSchema(env) {
  if (!env.DB) return false;
  if (socialDraftSchemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_SOCIAL_DRAFTS),
    env.DB.prepare(CREATE_SOCIAL_DRAFTS_INDEX),
    env.DB.prepare(CREATE_SOCIAL_PUBLICATIONS),
    env.DB.prepare(CREATE_SOCIAL_PUBLICATIONS_INDEX),
  ]);
  socialDraftSchemaReady = true;
  return true;
}

async function ensureOAuthTokenSchema(env) {
  if (!env.DB) return false;
  if (oauthTokenSchemaReady) return true;
  await env.DB.prepare(CREATE_OAUTH_TOKENS).run();
  oauthTokenSchemaReady = true;
  return true;
}

async function ensureOperationsSchema(env) {
  if (!env.DB) return false;
  if (operationsSchemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_MONITOR_STATE),
    env.DB.prepare(CREATE_AI_RATE_LIMIT),
    env.DB.prepare(CREATE_AI_RATE_LIMIT_INDEX),
    env.DB.prepare(CREATE_AI_RATE_LIMIT_IP_INDEX),
  ]);
  operationsSchemaReady = true;
  return true;
}

async function recordOperationalState(env, serviceKey, status, detail = null) {
  if (!(await ensureOperationsSchema(env))) return false;
  const now = new Date().toISOString();
  const safeDetail = detail == null ? null : JSON.stringify(detail).slice(0, 12000);
  await env.DB.prepare(`INSERT INTO monitor_state
    (service_key,status,consecutive_failures,last_checked_at,last_failure_at,last_success_at,detail)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(service_key) DO UPDATE SET status=excluded.status,
      consecutive_failures=CASE WHEN excluded.status='healthy' THEN 0 WHEN excluded.status='down' THEN monitor_state.consecutive_failures+1 ELSE monitor_state.consecutive_failures END,
      last_checked_at=excluded.last_checked_at,
      last_failure_at=CASE WHEN excluded.status='down' THEN excluded.last_failure_at ELSE monitor_state.last_failure_at END,
      last_success_at=CASE WHEN excluded.status='healthy' THEN excluded.last_success_at ELSE monitor_state.last_success_at END,
      detail=excluded.detail`)
    .bind(serviceKey, status, status === 'down' ? 1 : 0, now, status === 'down' ? now : null, status === 'healthy' ? now : null, safeDetail).run();
  console.log(JSON.stringify({ event:'operational_state', service:serviceKey, status, at:now }));
  return true;
}

async function runDatabaseMaintenance(env) {
  if (!(await ensureOperationsSchema(env))) return { skipped:'no_database' };
  const previous = await env.DB.prepare("SELECT last_success_at FROM monitor_state WHERE service_key = 'database-maintenance'").first();
  const lastSuccess = previous?.last_success_at ? new Date(previous.last_success_at).getTime() : 0;
  if (lastSuccess && Date.now() - lastSuccess < 23 * 60 * 60 * 1000) return { skipped:'recent' };
  await Promise.all([ensureContactSchema(env), ensureAdminAuthSchema(env)]);
  const now = Math.floor(Date.now() / 1000);
  const results = await env.DB.batch([
    env.DB.prepare('DELETE FROM contact_rate_limit WHERE sent_at < ?').bind(now - 2 * 86400),
    env.DB.prepare('DELETE FROM ai_rate_limit WHERE asked_at < ?').bind(now - 2 * 3600),
    env.DB.prepare('DELETE FROM admin_auth_attempts WHERE attempted_at < ?').bind(now - 86400),
  ]);
  const deleted = results.reduce((total, result) => total + (Number(result?.meta?.changes) || 0), 0);
  await recordOperationalState(env, 'database-maintenance', 'healthy', { deleted });
  return { deleted };
}

function monitorPayload(row) {
  if (!row) return null;
  let detail = null;
  try { detail = row.detail ? JSON.parse(row.detail) : null; } catch { detail = row.detail || null; }
  return { status:row.status, checkedAt:row.last_checked_at, successAt:row.last_success_at, failureAt:row.last_failure_at, detail };
}

async function adminOperationsSummary(env) {
  if (!(await ensureOperationsSchema(env))) return { enabled:false };
  const result = await env.DB.prepare(`SELECT service_key,status,last_checked_at,last_failure_at,last_success_at,detail
    FROM monitor_state
    WHERE service_key IN ('scheduler','push-alert','social-automatic','social-preflight','youtube-shorts-scheduler','buffer-tiktok-diagnostics','buffer-tiktok-test','meta-video-automatic')
       OR service_key LIKE 'social-preflight:%'
       OR service_key LIKE 'buffer-tiktok:%'
       OR service_key LIKE 'buffer-x:%'`).all();
  const rows = result?.results || [];
  const states = Object.fromEntries(rows.map(row => [row.service_key, monitorPayload(row)]));
  const preflightRow = rows
    .filter(row => row.service_key === 'social-preflight' || String(row.service_key).startsWith('social-preflight:'))
    .sort((a,b) => String(b.last_checked_at || '').localeCompare(String(a.last_checked_at || '')))[0];
  const bufferRow = rows
    .filter(row => String(row.service_key).startsWith('buffer-tiktok:'))
    .sort((a,b) => String(b.last_checked_at || '').localeCompare(String(a.last_checked_at || '')))[0];
  const bufferXRow = rows
    .filter(row => String(row.service_key).startsWith('buffer-x:'))
    .sort((a,b) => String(b.last_checked_at || '').localeCompare(String(a.last_checked_at || '')))[0];
  return { enabled:true, scheduler:states.scheduler || null, push:states['push-alert'] || null, social:states['social-automatic'] || null, preflight:monitorPayload(preflightRow), youtube:states['youtube-shorts-scheduler'] || null, bufferTikTok:monitorPayload(bufferRow), bufferTikTokDiagnostics:states['buffer-tiktok-diagnostics'] || null, bufferTikTokTest:states['buffer-tiktok-test'] || null, bufferX:monitorPayload(bufferXRow), metaVideo:states['meta-video-automatic'] || null };
}

async function ensureForecastSchema(env) {
  if (!env.DB) return false;
  if (forecastSchemaReady) return true;
  await env.DB.batch([
    env.DB.prepare(CREATE_FORECAST_SNAPSHOTS),
    env.DB.prepare(CREATE_FORECAST_SNAPSHOTS_INDEX),
  ]);
  forecastSchemaReady = true;
  return true;
}

async function sha256Text(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
}

async function alertFingerprint(entry) {
  return sha256Text([entry.level,entry.phenomenon,entry.title,entry.expires,entry.description].join('|'));
}

async function recordAlertEvents(payload, env) {
  if (!(await ensureAlertSchema(env)) || !payload?.ok) return [];
  const inserted=[];
  for (const entry of payload.alerts || []) {
    const fingerprint=await alertFingerprint(entry);
    try {
      const result=await env.DB.prepare(`INSERT OR IGNORE INTO alert_events
        (fingerprint,source,level,phenomenon,title,description,started_at,expires_at)
        VALUES (?,?,?,?,?,?,?,?)`)
        .bind(fingerprint,entry.source||payload.source?.name||'AEMET',entry.level||'unknown',entry.phenomenon||null,entry.title||null,entry.description||null,entry.published||new Date().toISOString(),entry.expires||null).run();
      if(result?.meta?.changes) inserted.push({...entry,fingerprint});
    } catch(error){ console.error('Alert history insert error',error); }
  }
  return inserted;
}

function alertHistoryParams(url) {
  const integer=(name,fallback,min,max)=>{
    const value=Number.parseInt(url.searchParams.get(name)||'',10);
    return Number.isFinite(value)?Math.min(max,Math.max(min,value)):fallback;
  };
  const legacyLimit=url.searchParams.get('limit');
  const pageSize=integer('pageSize',legacyLimit?integer('limit',20,1,100):20,1,100);
  const year=/^(?:19|20|21)\d{2}$/.test(url.searchParams.get('year')||'')?url.searchParams.get('year'):'';
  const month=/^(?:0[1-9]|1[0-2])$/.test(url.searchParams.get('month')||'')?url.searchParams.get('month'):'';
  const requestedLevel=cleanText(url.searchParams.get('level'),16).toLowerCase();
  const level=['yellow','orange','red','unknown','none'].includes(requestedLevel)?requestedLevel:'';
  const observation={
    page:integer('page',1,1,100000),pageSize,year,month,level,
    source:cleanText(url.searchParams.get('source'),50),
    phenomenon:cleanText(url.searchParams.get('phenomenon'),100),
    q:cleanText(url.searchParams.get('q'),100),
  };
  if(!observationIsPlausible(observation))throw new Error("Weather Underground ha retornat una lectura fora dels límits físics esperats");
  return observation;
}

function alertHistoryWhere(filters) {
  const clauses=[];const bindings=[];
  if(filters.year){clauses.push("SUBSTR(started_at,1,4) = ?");bindings.push(filters.year);}
  if(filters.month){clauses.push("SUBSTR(started_at,6,2) = ?");bindings.push(filters.month);}
  if(filters.level){clauses.push("level = ?");bindings.push(filters.level);}
  if(filters.source){clauses.push("source = ?");bindings.push(filters.source);}
  if(filters.phenomenon){clauses.push("phenomenon = ?");bindings.push(filters.phenomenon);}
  if(filters.q){
    clauses.push("LOWER(COALESCE(phenomenon,'') || ' ' || COALESCE(title,'') || ' ' || COALESCE(description,'') || ' ' || COALESCE(source,'')) LIKE ?");
    bindings.push(`%${filters.q.toLowerCase()}%`);
  }
  return {sql:clauses.length?`WHERE ${clauses.join(' AND ')}`:'',bindings};
}

async function alertHistory(url, env) {
  const empty={ok:true,items:[],pagination:{page:1,pageSize:20,total:0,totalPages:0},stats:{total:0,severe:0,red:0,alertDays:0,latest:null,first:null,topPhenomenon:null,byMonth:[],byLevel:[],bySource:[],byPhenomenon:[],byYear:[]},facets:{years:[],sources:[],phenomena:[]}};
  if (!(await ensureAlertSchema(env))) return json({...empty,storage:'disabled'},200,'no-store');
  const filters=alertHistoryParams(url);const where=alertHistoryWhere(filters);
  const totalRow=await env.DB.prepare(`SELECT COUNT(*) AS total FROM alert_events ${where.sql}`).bind(...where.bindings).first();
  const total=Number(totalRow?.total)||0;const totalPages=total?Math.ceil(total/filters.pageSize):0;
  const page=totalPages?Math.min(filters.page,totalPages):1;const offset=(page-1)*filters.pageSize;
  const itemResult=await env.DB.prepare(`SELECT id,source,level,phenomenon,title,description,started_at,expires_at,created_at
    FROM alert_events ${where.sql} ORDER BY started_at DESC LIMIT ? OFFSET ?`).bind(...where.bindings,filters.pageSize,offset).all();
  const [summary,byMonth,byLevel,bySource,byPhenomenon,byYear,facetYears,facetSources,facetPhenomena]=await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN level IN ('orange','red') THEN 1 ELSE 0 END) AS severe,
      SUM(CASE WHEN level = 'red' THEN 1 ELSE 0 END) AS red,
      COUNT(DISTINCT SUBSTR(started_at,1,10)) AS alert_days,
      MAX(started_at) AS latest, MIN(started_at) AS first FROM alert_events ${where.sql}`).bind(...where.bindings).first(),
    env.DB.prepare(`SELECT SUBSTR(started_at,1,7) AS key,COUNT(*) AS count FROM alert_events ${where.sql} GROUP BY key ORDER BY key DESC LIMIT 24`).bind(...where.bindings).all(),
    env.DB.prepare(`SELECT level AS key,COUNT(*) AS count FROM alert_events ${where.sql} GROUP BY level ORDER BY count DESC`).bind(...where.bindings).all(),
    env.DB.prepare(`SELECT source AS key,COUNT(*) AS count FROM alert_events ${where.sql} GROUP BY source ORDER BY count DESC`).bind(...where.bindings).all(),
    env.DB.prepare(`SELECT COALESCE(NULLIF(phenomenon,''),'Altres') AS key,COUNT(*) AS count FROM alert_events ${where.sql} GROUP BY key ORDER BY count DESC LIMIT 12`).bind(...where.bindings).all(),
    env.DB.prepare(`SELECT SUBSTR(started_at,1,4) AS key,COUNT(*) AS count FROM alert_events ${where.sql} GROUP BY key ORDER BY key DESC`).bind(...where.bindings).all(),
    env.DB.prepare("SELECT DISTINCT SUBSTR(started_at,1,4) AS value FROM alert_events WHERE started_at IS NOT NULL ORDER BY value DESC").all(),
    env.DB.prepare("SELECT DISTINCT source AS value FROM alert_events WHERE source IS NOT NULL AND source <> '' ORDER BY value").all(),
    env.DB.prepare("SELECT DISTINCT phenomenon AS value FROM alert_events WHERE phenomenon IS NOT NULL AND phenomenon <> '' ORDER BY value").all(),
  ]);
  const rows=result=>result?.results||[];const phenomena=rows(byPhenomenon);
  return json({
    ok:true,items:rows(itemResult),filters,
    pagination:{page,pageSize:filters.pageSize,total,totalPages},
    stats:{total:Number(summary?.total)||0,severe:Number(summary?.severe)||0,red:Number(summary?.red)||0,alertDays:Number(summary?.alert_days)||0,latest:summary?.latest||null,first:summary?.first||null,topPhenomenon:phenomena[0]?.key||null,byMonth:rows(byMonth),byLevel:rows(byLevel),bySource:rows(bySource),byPhenomenon:phenomena,byYear:rows(byYear)},
    facets:{years:rows(facetYears).map(row=>row.value).filter(Boolean),sources:rows(facetSources).map(row=>row.value).filter(Boolean),phenomena:rows(facetPhenomena).map(row=>row.value).filter(Boolean)},
  },200,'no-store');
}

function notificationCategory(entry){
  const p=String(entry?.phenomenon||'').toLowerCase();
  if(/pluj|lluv|precipit/.test(p))return 'rain';
  if(/vent|viento|ratxa|racha|costa|costaner|oleaje|mar[ií]tim/.test(p))return 'wind';
  if(/tempest|torment|llamp|rayo/.test(p))return 'storm';
  if(/neu|nieve/.test(p))return 'snow';
  if(/calor|fred|fr[ií]o|temperatur/.test(p))return 'temperature';
  return null;
}

function alertPushStateKey(fingerprint){return `push-alert:${fingerprint}`;}

const PUSH_PREFERENCE_KEYS=['alert_rain','alert_wind','alert_storm','alert_snow','alert_temperature','alert_level_yellow','alert_level_orange','alert_level_red'];

function validPushSubscriptionId(value){return /^[A-Za-z0-9_-]{8,128}$/.test(String(value||''));}

function normalizedPushPreferences(input={}){
  const tags={};
  for(const key of PUSH_PREFERENCE_KEYS)tags[key]=String(input?.[key]||'0')==='1'?1:0;
  return tags;
}

async function savePushPreferences(request,env){
  const origin=request.headers.get('Origin')||'';
  if(!ALLOWED_CONTACT_ORIGINS.has(origin))return json({ok:false,error:'Origen no autoritzat'},403,'no-store',origin||'*');
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>4096)return json({ok:false,error:'Petició massa gran'},413,'no-store',origin);
  const body=await request.json().catch(()=>({}));
  const subscriptionId=cleanText(body.subscriptionId,128);
  if(!validPushSubscriptionId(subscriptionId))return json({ok:false,error:'Subscripció no vàlida'},400,'no-store',origin);
  const tags=normalizedPushPreferences(body.tags);
  if(!(await ensureAlertSchema(env)))return json({ok:false,error:'No s’han pogut desar les preferències ara mateix.'},503,'no-store',origin);
  await env.DB.prepare(`INSERT INTO push_subscriptions (
    subscription_id,alert_rain,alert_wind,alert_storm,alert_snow,alert_temperature,
    alert_level_yellow,alert_level_orange,alert_level_red,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
  ON CONFLICT(subscription_id) DO UPDATE SET
    alert_rain=excluded.alert_rain,alert_wind=excluded.alert_wind,alert_storm=excluded.alert_storm,
    alert_snow=excluded.alert_snow,alert_temperature=excluded.alert_temperature,
    alert_level_yellow=excluded.alert_level_yellow,alert_level_orange=excluded.alert_level_orange,
    alert_level_red=excluded.alert_level_red,updated_at=CURRENT_TIMESTAMP`)
    .bind(subscriptionId,tags.alert_rain,tags.alert_wind,tags.alert_storm,tags.alert_snow,tags.alert_temperature,tags.alert_level_yellow,tags.alert_level_orange,tags.alert_level_red).run();
  return json({ok:true},200,'no-store',origin);
}

async function registeredPushRecipients(entry,env){
  if(!env.DB)return [];
  const category=notificationCategory(entry);
  const level=['yellow','orange','red'].includes(String(entry.level||'').toLowerCase())?String(entry.level).toLowerCase():'';
  if(!category||!level)return [];
  const rows=await env.DB.prepare(`SELECT subscription_id FROM push_subscriptions
    WHERE alert_${category}=1 AND alert_level_${level}=1
    ORDER BY updated_at DESC LIMIT 2000`).all();
  return (rows.results||[]).map(row=>String(row.subscription_id||'')).filter(validPushSubscriptionId);
}

function oneSignalApiKey(env){
  return String(env.ONESIGNAL_API_KEY || env.ONESIGNAL_REST_API_KEY || '').trim();
}

function oneSignalConfigurationMessage(env){
  const missing=[];
  if(!String(env.ONESIGNAL_APP_ID || '').trim())missing.push('ONESIGNAL_APP_ID');
  if(!oneSignalApiKey(env))missing.push('ONESIGNAL_API_KEY');
  return `Falta configurar ${missing.join(' i ')} al Worker. ONESIGNAL_API_KEY ha de ser l’App API key de la mateixa aplicació de OneSignal.`;
}

function oneSignalFailureMessage(response, payload){
  if([401,403].includes(Number(response?.status))){
    return 'La clau API de OneSignal no és vàlida per a aquesta aplicació. Configura ONESIGNAL_API_KEY amb l’App API key de la mateixa app que ONESIGNAL_APP_ID.';
  }
  return cleanText(payload?.errors?.join?.(' · ') || payload?.error || 'OneSignal no ha acceptat la petició.',500);
}

// A la Create Message API, l'identificador confirma que OneSignal ha creat i
// posat el missatge en cua. El recompte de destinataris no és fiable en la
// resposta immediata (la distribució és asíncrona), i no s'ha d'usar per
// decidir si cal reintentar un avís.
function oneSignalMessageAccepted(payload){
  return Boolean(String(payload?.id||'').trim());
}

async function readAlertPushState(env,fingerprint){
  if(!env.DB||!fingerprint)return null;
  const row=await env.DB.prepare('SELECT state_value FROM alert_state WHERE state_key = ?').bind(alertPushStateKey(fingerprint)).first();
  try{return row?.state_value?JSON.parse(row.state_value):null;}catch{return null;}
}

async function writeAlertPushState(env,fingerprint,value){
  if(!env.DB||!fingerprint)return;
  await env.DB.prepare(`INSERT INTO alert_state (state_key,state_value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(state_key) DO UPDATE SET state_value=excluded.state_value,updated_at=CURRENT_TIMESTAMP`)
    .bind(alertPushStateKey(fingerprint),JSON.stringify(value)).run();
}

function canRetryAlertPush(state){
  if(!state||state.delivered)return !state?.delivered;
  const lastAttempt=Date.parse(state.lastAttempt||'');
  return !Number.isFinite(lastAttempt)||Date.now()-lastAttempt>=30*60*1000;
}

async function sendOneSignalAlert(entry, env){
  const apiKey=oneSignalApiKey(env);
  if(!env.ONESIGNAL_APP_ID || !apiKey){
    const result={sent:false,reason:'not_configured',error:oneSignalConfigurationMessage(env)};
    await recordOperationalState(env,'push-alert','down',result).catch(()=>{});
    return result;
  }
  const category=notificationCategory(entry);
  const normalizedLevel=['yellow','orange','red'].includes(String(entry.level||'').toLowerCase())?String(entry.level).toLowerCase():'unknown';
  const level=entry.levelLabel || entry.level || 'Avís';
  const heading=`${level}: ${entry.phenomenon || 'avís meteorològic'}`;
  const body=String(entry.description || entry.title || 'Consulta el detall oficial.').slice(0,180);
  const registeredRecipients=await registeredPushRecipients(entry,env).catch(error=>{console.error('Push preferences lookup error',error);return [];});
  // OneSignal avalua els operadors en una llista plana. Exigim sempre el nivell
  // triat i, quan el fenomen és conegut, també la categoria corresponent. Les
  // subscripcions desades pel portal es prioritzen: així no depenem de la
  // propagació asíncrona de les etiquetes de OneSignal en iPhone.
  const filters=[];
  if(category)filters.push({field:'tag',key:`alert_${category}`,relation:'=',value:'1'},{operator:'AND'});
  filters.push({field:'tag',key:`alert_level_${normalizedLevel}`,relation:'=',value:'1'});
  const targeting=registeredRecipients.length
    ? {include_subscription_ids:registeredRecipients}
    : {filters};
  const response=await fetch('https://api.onesignal.com/notifications',{
    method:'POST',
    headers:{'Authorization':`Key ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({app_id:env.ONESIGNAL_APP_ID,target_channel:'push',...targeting,headings:{ca:heading,en:heading},contents:{ca:body,en:body},url:'https://meteo.fontanillas.cat/?page=avisos'})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const result={sent:false,status:response.status,error:oneSignalFailureMessage(response,payload)};
    console.error(JSON.stringify({event:'push_alert',status:'failed',responseCode:response.status,error:result.error}));
    await recordOperationalState(env,'push-alert','down',result).catch(()=>{});
    return result;
  }
  const recipients=Number(payload.recipients)||0;
  if(!oneSignalMessageAccepted(payload)){
    const result={sent:false,accepted:true,id:payload.id||null,recipients:0,reason:'no_recipients',level:normalizedLevel,category,target:registeredRecipients.length?'registered':'tags'};
    await recordOperationalState(env,'push-alert','down',result).catch(()=>{});
    return result;
  }
  const result={sent:true,id:payload.id,recipients,deliveryPending:recipients===0,level:normalizedLevel,category,target:registeredRecipients.length?'registered':'tags'};
  await recordOperationalState(env,'push-alert','healthy',result).catch(()=>{});
  return result;
}

async function pushTest(request,env){
  const origin=request.headers.get('Origin')||'';
  if(!ALLOWED_CONTACT_ORIGINS.has(origin))return json({ok:false,error:'Origen no autoritzat'},403,'no-store',origin||'*');
  const apiKey=oneSignalApiKey(env);
  if(!env.ONESIGNAL_APP_ID||!apiKey){
    const error=oneSignalConfigurationMessage(env);
    await recordOperationalState(env,'push-alert','down',{sent:false,reason:'not_configured',error}).catch(()=>{});
    return json({ok:false,error},503,'no-store',origin);
  }
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>2048)return json({ok:false,error:'Petició massa gran'},413,'no-store',origin);
  const body=await request.json().catch(()=>({}));
  const subscriptionId=cleanText(body.subscriptionId,128);
  if(!/^[A-Za-z0-9_-]{8,128}$/.test(subscriptionId))return json({ok:false,error:'Subscripció no vàlida'},400,'no-store',origin);
  const response=await fetch('https://api.onesignal.com/notifications',{method:'POST',headers:{Authorization:`Key ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({app_id:env.ONESIGNAL_APP_ID,target_channel:'push',include_subscription_ids:[subscriptionId],headings:{ca:'Prova d’avisos Meteo Fontanillas',en:'Meteo Fontanillas alert test'},contents:{ca:'Connexió correcta: aquest dispositiu pot rebre avisos meteorològics.',en:'Connection successful: this device can receive weather alerts.'},url:'https://meteo.fontanillas.cat/?page=avisos'})});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const error=oneSignalFailureMessage(response,payload);
    await recordOperationalState(env,'push-alert','down',{sent:false,status:response.status,error,source:'manual-test'}).catch(()=>{});
    return json({ok:false,error},502,'no-store',origin);
  }
  const recipients=Number(payload.recipients)||0;
  if(!oneSignalMessageAccepted(payload)){
    const error='OneSignal ha acceptat la petició però no ha trobat aquest dispositiu com a destinatari.';
    await recordOperationalState(env,'push-alert','down',{sent:false,accepted:true,id:payload.id||null,recipients:0,error,source:'manual-test'}).catch(()=>{});
    return json({ok:false,accepted:true,id:payload.id||null,recipients:0,error},502,'no-store',origin);
  }
  await recordOperationalState(env,'push-alert','healthy',{sent:true,id:payload.id,recipients,deliveryPending:recipients===0,source:'manual-test'}).catch(()=>{});
  return json({ok:true,accepted:true,id:payload.id,recipients,deliveryPending:recipients===0},200,'no-store',origin);
}

async function checkAlertsAndNotify(env){
  const response=await fetch(AEMET_PRELITORAL_FEED,{headers:{Accept:'application/rss+xml, application/xml, text/xml;q=0.9'},cf:{cacheEverything:false}});
  if(!response.ok)throw new Error(`AEMET RSS ${response.status}`);
  const xml=await response.text();
  const parsed=parseAemetFeed(xml);
  const payload={ok:true,alerts:parsed.activeAlerts,maxLevel:parsed.maxLevel};
  const fresh=await recordAlertEvents(payload,env);
  for(const entry of parsed.activeAlerts){
    const fingerprint=await alertFingerprint(entry);
    const state=await readAlertPushState(env,fingerprint).catch(()=>null);
    if(!canRetryAlertPush(state))continue;
    const result=await sendOneSignalAlert({...entry,fingerprint},env);
    await writeAlertPushState(env,fingerprint,{
      delivered:Boolean(result.sent),
      recipients:Number(result.recipients)||0,
      attempts:(Number(state?.attempts)||0)+1,
      lastAttempt:new Date().toISOString(),
      reason:result.reason||result.error||null,
      notificationId:result.id||null,
    }).catch(error=>console.error('Alert push state error',error));
  }
  return fresh.length;
}

function meteocatAlertSocialEnabled(env) {
  const configured=String(env.METEOCAT_ALERT_SOCIAL_ENABLED || '').trim().toLowerCase();
  if(configured)return configured==='true';
  return String(env.METEOCAT_SEVERE_SOCIAL_ENABLED || '').trim().toLowerCase()==='true';
}

export function meteocatDangerLevel(perill) {
  const value=Number(perill);
  if(value>=5)return {key:'red',label:'Vermell',rank:4};
  if(value>=3)return {key:'orange',label:'Taronja',rank:3};
  if(value>=1)return {key:'yellow',label:'Groc',rank:2};
  return {key:'none',label:'Sense avís',rank:1};
}

export function meteocatCountyWarningsByDay(episodes) {
  const days=new Map();
  for(const episode of Array.isArray(episodes)?episodes:[]){
    if(String(episode?.estat?.nom||'').toLowerCase()!=='obert')continue;
    for(const warning of Array.isArray(episode?.avisos)?episode.avisos:[]){
      const warningState=String(warning?.estat||'').toLowerCase();
      if(warningState&&!['vigent','ampliat'].includes(warningState))continue;
      for(const evolution of Array.isArray(warning?.evolucions)?warning.evolucions:[]){
        const day=String(evolution?.dia||warning?.dataInici||'').slice(0,10);
        if(!day)continue;
        const counties=days.get(day)||new Map();
        for(const period of Array.isArray(evolution?.periodes)?evolution.periodes:[]){
          for(const impact of Array.isArray(period?.afectacions)?period.afectacions:[]){
            const countyId=Number(impact?.idComarca);
            const danger=meteocatDangerLevel(impact?.perill);
            if(!Number.isInteger(countyId)||danger.rank<2)continue;
            const previous=counties.get(countyId);
            if(!previous||danger.rank>previous.rank)counties.set(countyId,{countyId,level:danger.key,rank:danger.rank});
          }
        }
        days.set(day,counties);
      }
    }
  }
  return Object.fromEntries([...days].map(([day,counties])=>[day,[...counties.values()].sort((a,b)=>a.countyId-b.countyId)]));
}

function meteocatPeriodLabel(day, period) {
  const date=String(day||'').slice(0,10);
  const match=String(period||'').match(/^(\d{2})-(\d{2})$/);
  if(!date||!match)return [date,String(period||'')].filter(Boolean).join(' ');
  const [year,month,dateDay]=date.split('-').map(Number);
  const startHour=Number(match[1]);
  const rawEndHour=Number(match[2]);
  const endHour=rawEndHour===0?24:rawEndHour;
  const formatter=new Intl.DateTimeFormat('ca-ES',{timeZone:TIME_ZONE,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  const label=value=>formatter.format(value).replace(',', '');
  const start=new Date(Date.UTC(year,month-1,dateDay,startHour));
  const end=new Date(Date.UTC(year,month-1,dateDay,endHour));
  return `${label(start)}–${label(end)} h`;
}

export function parseMeteocatSmpEpisodes(episodes) {
  const normalized=new Map();
  const countyWarningsByDay=meteocatCountyWarningsByDay(episodes);
  for(const episode of Array.isArray(episodes)?episodes:[]){
    if(String(episode?.estat?.nom||'').toLowerCase()!=='obert')continue;
    const phenomenon=cleanText(episode?.meteor?.nom||'Fenomen meteorològic',100);
    for(const warning of Array.isArray(episode?.avisos)?episode.avisos:[]){
      const warningState=String(warning?.estat||'').toLowerCase();
      if(warningState && !['vigent','ampliat'].includes(warningState))continue;
      for(const evolution of Array.isArray(warning?.evolucions)?warning.evolucions:[]){
        const affected=[];
        for(const period of Array.isArray(evolution?.periodes)?evolution.periodes:[]){
          for(const impact of Array.isArray(period?.afectacions)?period.afectacions:[]){
            if(Number(impact?.idComarca)!==METEOCAT_VALLES_ORIENTAL_ID)continue;
            const danger=meteocatDangerLevel(impact?.perill);
            if(danger.rank<2)continue;
            affected.push({
              period:meteocatPeriodLabel(evolution?.dia||impact?.dia,period?.nom),
              danger:Number(impact?.perill),level:danger.key,levelLabel:danger.label,
              threshold:cleanText(impact?.llindar||'',180),auxiliary:Boolean(impact?.auxiliar),
            });
          }
        }
        if(!affected.length)continue;
        const highest=affected.sort((a,b)=>b.danger-a.danger)[0];
        const periods=[...new Set(affected.map(item=>item.period).filter(Boolean))].sort();
        const thresholds=[...new Set(affected.map(item=>item.threshold).filter(Boolean))];
        const distribution=cleanText(evolution?.distribucioGeografica||'',30).toUpperCase();
        const comment=cleanText(evolution?.comentari||'',500);
        const day=String(evolution?.dia||warning?.dataInici||'').slice(0,10);
        const semanticKey=[phenomenon,day,highest.level,highest.danger,periods.join(','),thresholds.join(',')].join('|');
        const description=[
          thresholds.length?`Llindar: ${thresholds.join(' / ')}.`:'',
          periods.length?`Franges: ${periods.join(', ')}.`:'',
          distribution?`Distribució prevista: ${distribution.toLowerCase()}.`:'',comment,
        ].filter(Boolean).join(' ');
        normalized.set(semanticKey,{
          source:'Meteocat',sourceUrl:METEOCAT_ALERTS_PAGE,
          title:`Avís ${highest.levelLabel} de ${phenomenon} al ${METEOCAT_VALLES_ORIENTAL_NAME}`,
          description,phenomenon,level:highest.level,levelLabel:highest.levelLabel,rank:highest.danger,
          published:warning?.dataEmisio||null,starts:warning?.dataInici||null,expires:warning?.dataFi||null,
          active:true,scopeKind:'comarca',scopeName:METEOCAT_VALLES_ORIENTAL_NAME,
          municipality:'Sant Celoni',distribution:distribution||null,periods,
          countyWarnings:countyWarningsByDay[day]||[],semanticKey,
        });
      }
    }
  }
  return [...normalized.values()].sort((a,b)=>b.rank-a.rank||String(a.starts||'').localeCompare(String(b.starts||'')));
}

function localIsoDates(count=3,date=new Date()) {
  const local=new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const [year,month,day]=local.split('-').map(Number);
  return Array.from({length:count},(_,offset)=>new Date(Date.UTC(year,month-1,day+offset)).toISOString().slice(0,10));
}

async function fetchMeteocatAlerts(env) {
  const apiKey=String(env.METEOCAT_API_KEY||'').trim();
  if(!apiKey)return {ok:false,skipped:'api_key_missing',alerts:[]};
  const results=await Promise.allSettled(localIsoDates().map(async date=>{
    const response=await fetch(`${METEOCAT_SMP_ENDPOINT}?data=${date}Z`,{
      headers:{Accept:'application/json','x-api-key':apiKey},cf:{cacheEverything:true,cacheTtl:900},
    });
    if(!response.ok)throw new Error(`Meteocat SMP ${response.status}`);
    const payload=await response.json();
    if(!Array.isArray(payload))throw new Error('Resposta SMP de Meteocat no reconeguda');
    return payload;
  }));
  const successful=results.filter(item=>item.status==='fulfilled');
  if(!successful.length)throw results[0]?.reason||new Error('Meteocat SMP no disponible');
  const alerts=parseMeteocatSmpEpisodes(successful.flatMap(item=>item.value));
  return {ok:true,source:{name:'Meteocat',area:METEOCAT_VALLES_ORIENTAL_NAME,url:METEOCAT_ALERTS_PAGE},alerts,
    maxLevel:alerts[0]?.level||'none',partial:successful.length!==results.length};
}

async function checkMeteocatAlertsAndPublish(env) {
  if(!meteocatAlertSocialEnabled(env))return {skipped:'automation_disabled'};
  const payload=await fetchMeteocatAlerts(env);
  if(!payload.ok)return payload;
  const fresh=await recordAlertEvents(payload,env);
  const outcomes=[];
  for(const entry of fresh){
    const social=await createOfficialAlertSocialDraft(entry,env);
    outcomes.push(await publishAutomaticSocialDraft(social,env));
  }
  await recordOperationalState(env,'meteocat-alert-social','healthy',{
    checkedAt:new Date().toISOString(),active:payload.alerts.length,newAlerts:fresh.length,partial:payload.partial,
  }).catch(()=>{});
  return {active:payload.alerts.length,published:fresh.length,outcomes};
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

async function weatherRequestForStation(path, stationId, params, env, cacheTtl) {
  if (!env.WU_API_KEY) throw new Error("Falta la variable secreta WU_API_KEY");
  const query = new URLSearchParams({
    stationId,
    format: "json",
    units: "m",
    numericPrecision: "decimal",
    ...params,
    apiKey: env.WU_API_KEY,
  });
  const response = await fetch(`https://api.weather.com${path}?${query}`, {
    cf: { cacheEverything: true, cacheTtl },
  });
  if (!response.ok) throw new Error(`Weather Underground ${stationId} ha respost ${response.status}`);
  return response.json();
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const values=[lat1,lon1,lat2,lon2].map(Number);
  if(!values.every(Number.isFinite))return null;
  const [a,b,c,d]=values.map(value=>value*Math.PI/180);
  const h=Math.sin((c-a)/2)**2+Math.cos(a)*Math.cos(c)*Math.sin((d-b)/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

async function discoverComparisonStations(env, center=null) {
  if(!env.WU_API_KEY)return {stations:center?[]:COMPARISON_STATIONS,searchRadiusKm:center?200:20};
  try {
    const target={
      latitude:finite(center?.latitude)??41.6906,
      longitude:finite(center?.longitude)??2.489,
      label:cleanText(center?.label||"Baix Montseny",80),
      custom:Boolean(center),
    };
    const query=new URLSearchParams({geocode:`${target.latitude},${target.longitude}`,product:"pws",format:"json",apiKey:env.WU_API_KEY});
    const response=await fetch(`https://api.weather.com/v3/location/near?${query}`,{cf:{cacheEverything:true,cacheTtl:3600}});
    if(!response.ok)throw new Error(`Weather location near ha respost ${response.status}`);
    const payload=await response.json();
    const location=payload.location||payload;
    const ids=Array.isArray(location.stationId)?location.stationId:[];
    const names=Array.isArray(location.stationName)?location.stationName:[];
    const latitudes=Array.isArray(location.latitude)?location.latitude:[];
    const longitudes=Array.isArray(location.longitude)?location.longitude:[];
    const distances=Array.isArray(location.distanceKm)?location.distanceKm:[];
    const cities=Array.isArray(location.city)?location.city:[];
    const candidates=[];
    ids.forEach((stationId,index)=>{
      if(!stationId)return;
      const latitude=finite(latitudes[index]);const longitude=finite(longitudes[index]);
      const distance=finite(distances[index])??distanceKm(target.latitude,target.longitude,latitude,longitude);
      if(!Number.isFinite(distance))return;
      candidates.push({
        id:`nearby-${String(stationId).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
        name:cleanText(names[index]||stationId,80),
        municipality:cleanText(cities[index]||(target.custom?`A prop de ${target.label}`:"Entorn del Baix Montseny"),80),
        source:"Weather Underground · estació propera",
        stationId,
        latitude,
        longitude,
        distanceKm:Number(distance.toFixed(1)),
      });
    });
    candidates.sort((a,b)=>a.distanceKm-b.distanceKm);
    const searchRadiusKm=target.custom?([20,50,100,200].find(radius=>candidates.some(station=>station.distanceKm<=radius))||200):20;
    const selected=new Map(target.custom?[]:COMPARISON_STATIONS.map(station=>[station.stationId,station]));
    candidates.forEach(station=>{
      if(selected.size<6&&station.distanceKm<=searchRadiusKm&&!selected.has(station.stationId))selected.set(station.stationId,station);
    });
    return {stations:[...selected.values()].sort((a,b)=>(finite(a.distanceKm)??999)-(finite(b.distanceKm)??999)).slice(0,6),searchRadiusKm};
  } catch(error) {
    console.warn("Descobriment d’estacions properes:",error.message);
    return {stations:center?[]:COMPARISON_STATIONS,searchRadiusKm:center?200:20};
  }
}

function mapComparisonCurrent(station, obs) {
  if (!obs?.metric) return null;
  return {
    id: station.id,
    name: station.name,
    municipality: station.municipality,
    source: station.source,
    stationId: station.stationId,
    latitude: station.latitude,
    longitude: station.longitude,
    distanceKm: finite(station.distanceKm)??distanceKm(41.6906,2.489,station.latitude,station.longitude),
    updated: obs.obsTimeLocal,
    temperature: finite(obs.metric.temp),
    humidity: finite(obs.humidity),
    pressure: finite(obs.metric.pressure),
    windSpeed: finite(obs.metric.windSpeed),
    windGust: finite(obs.metric.windGust),
    windDirection: finite(obs.winddir),
    rainToday: finite(obs.metric.precipTotal),
    quality: obs.qcStatus ?? null,
  };
}

async function comparisonCurrentStation(station, env) {
  const data = await weatherRequestForStation("/v2/pws/observations/current", station.stationId, {}, env, 180);
  return mapComparisonCurrent(station, data.observations?.[0]);
}

function comparisonPeriodDates(period) {
  const now = new Date();
  if (period === "today") {
    const local = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year:"numeric", month:"2-digit", day:"2-digit" }).format(now).replaceAll("-", "");
    return { start: local, end: local };
  }
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return { start: dateKey(startDate), end: dateKey(now) };
}

async function comparisonHistoryStation(station, period, env) {
  const dates = comparisonPeriodDates(period);
  const params = dates.start === dates.end ? { date: dates.end } : { startDate: dates.start, endDate: dates.end };
  const data = await weatherRequestForStation("/v2/pws/history/hourly", station.stationId, params, env, 300);
  let items = (data.observations || []).map(obs => ({
    time: obs.obsTimeLocal,
    epoch: obs.epoch,
    temperature: finite(obs.metric?.temp),
    humidity: finite(obs.humidity),
    pressure: finite(obs.metric?.pressure),
    windSpeed: finite(obs.metric?.windSpeed),
    windGust: finite(obs.metric?.windGust),
    rainTotal: finite(obs.metric?.precipTotal),
  }));
  if (period === "24h") {
    const cutoff = Date.now() / 1000 - 24 * 3600;
    items = items.filter(item => Number(item.epoch) >= cutoff);
  }
  return items;
}

async function comparisonStations(url, env) {
  const period = "now";
  const rawLatitude=url.searchParams.get("lat");
  const rawLongitude=url.searchParams.get("lon");
  const latitude=rawLatitude===null?null:finite(rawLatitude);
  const longitude=rawLongitude===null?null:finite(rawLongitude);
  const hasCustomCenter=rawLatitude!==null&&rawLongitude!==null&&Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=-90&&latitude<=90&&longitude>=-180&&longitude<=180;
  const center=hasCustomCenter?{latitude,longitude,label:cleanText(url.searchParams.get("name")||"lloc seleccionat",80)}:null;
  const discovery=await discoverComparisonStations(env,center);
  const nearbyStations=discovery.stations;
  const results = await Promise.all(nearbyStations.map(async station => {
    try {
      const current = await comparisonCurrentStation(station, env);
      if (!current) throw new Error("Sense observació actual");
      return { ...current, status:"online", history:[] };
    } catch (error) {
      console.warn(`Comparativa ${station.stationId}:`, error.message);
      return { ...station, status:"offline", error:"Dades temporalment no disponibles", history:[] };
    }
  }));
  return json({
    ok:true,
    period,
    generatedAt:new Date().toISOString(),
    center:center?{latitude:center.latitude,longitude:center.longitude,label:center.label}:null,
    searchRadiusKm:discovery.searchRadiusKm,
    stations:results,
    sourcePolicy:{
      mode:"smart-fallback",
      note:center?`Es mostren fins a sis estacions PWS dins d’un radi adaptatiu de ${discovery.searchRadiusKm} km. La cerca comença a 20 km i només s’amplia en zones amb poca cobertura; la distància, la font i l’hora sempre són visibles.`:"Fontanillas es manté com a referència i el Worker descobreix automàticament fins a cinc estacions PWS properes en un radi màxim de 20 km. Totes les lectures es normalitzen amb les mateixes unitats."
    }
  }, 200, "public, max-age=120");
}

async function metNorwayForecast(url) {
  const rawLatitude=url.searchParams.get("lat");
  const rawLongitude=url.searchParams.get("lon");
  const latitude=rawLatitude===null?null:finite(rawLatitude);
  const longitude=rawLongitude===null?null:finite(rawLongitude);
  if(rawLatitude===null||rawLongitude===null||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude < -90||latitude > 90||longitude < -180||longitude > 180){
    return json({error:"Coordenades no vàlides"},400);
  }
  const lat=Number(latitude.toFixed(4));
  const lon=Number(longitude.toFixed(4));
  const requestedTimezone=String(url.searchParams.get("timezone")||"UTC").slice(0,80);
  let timezone="UTC";
  try{new Intl.DateTimeFormat("en-CA",{timeZone:requestedTimezone}).format(new Date());timezone=requestedTimezone;}catch{}
  const localDate=value=>new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
  const endpoint=`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
  const response=await fetch(endpoint,{
    headers:{Accept:"application/json","User-Agent":"MeteoFontanillas/22.10 (+https://meteo.fontanillas.cat/)"},
    cf:{cacheEverything:true,cacheTtl:1800},
  });
  if(!response.ok)throw Object.assign(new Error(`MET Norway ${response.status}`),{status:502});
  const payload=await response.json();
  const series=Array.isArray(payload?.properties?.timeseries)?payload.properties.timeseries:[];
  if(!series.length)throw Object.assign(new Error("MET Norway sense dades"),{status:502});
  const optional=value=>value===null||value===undefined?null:finite(value);
  const first=series[0];
  const instant=first?.data?.instant?.details||{};
  const days=new Map();
  for(const entry of series){
    const key=entry.time?localDate(entry.time):"";
    if(!key)continue;
    const details=entry?.data?.instant?.details||{};
    const temperature=optional(details.air_temperature);
    const oneHour=entry?.data?.next_1_hours;
    const symbol=oneHour?.summary?.symbol_code||entry?.data?.next_6_hours?.summary?.symbol_code||"";
    const precipitation=optional(oneHour?.details?.precipitation_amount)??0;
    const item=days.get(key)||{date:key,max:null,min:null,precipitation:0,symbolCode:"",symbolHour:99};
    if(Number.isFinite(temperature)){item.max=item.max===null?temperature:Math.max(item.max,temperature);item.min=item.min===null?temperature:Math.min(item.min,temperature);}
    item.precipitation+=precipitation;
    const hour=Number(String(entry.time||"").slice(11,13));
    if(symbol&&Math.abs(hour-12)<item.symbolHour){item.symbolCode=symbol;item.symbolHour=Math.abs(hour-12);}
    days.set(key,item);
  }
  return json({
    ok:true,
    source:{name:"MET Norway / Yr",provider:"Norwegian Meteorological Institute",url:"https://api.met.no/weatherapi/locationforecast/2.0/documentation"},
    generatedAt:payload?.properties?.meta?.updated_at||new Date().toISOString(),
    coordinates:{latitude:lat,longitude:lon,timezone},
    current:{time:first.time,temperature:optional(instant.air_temperature),humidity:optional(instant.relative_humidity),windSpeedKmh:Number.isFinite(optional(instant.wind_speed))?optional(instant.wind_speed)*3.6:null,symbolCode:first?.data?.next_1_hours?.summary?.symbol_code||""},
    days:[...days.values()].slice(0,7).map(({symbolHour,...day})=>({...day,precipitation:Number(day.precipitation.toFixed(1))})),
  },200,"public, max-age=900");
}

async function boundedResponseText(response,maxBytes=FORECAST_VIDEO_HTML_LIMIT){
  const declared=Number(response.headers.get('Content-Length'));
  if(Number.isFinite(declared)&&declared>maxBytes)throw new Error('Resposta de 3Cat massa gran');
  if(!response.body)return '';
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let received=0;let text='';
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      received+=value.byteLength;
      if(received>maxBytes)throw new Error('Resposta de 3Cat massa gran');
      text+=decoder.decode(value,{stream:true});
    }
    return text+decoder.decode();
  }finally{
    if(received>maxBytes)await reader.cancel().catch(()=>{});
  }
}

function localDateParts(date){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:TIME_ZONE,day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(date);
  return Object.fromEntries(parts.filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
}

function threeCatVideoFromHtml(html,parts){
  const dateKey=`${parts.day}${parts.month}${parts.year}`;
  const matches=[...String(html).matchAll(/href="(\/3cat\/(el-temps-[^"?#]+)\/video\/(\d+)\/)"/gi)];
  const match=matches.find(item=>item[2].includes(dateKey));
  if(!match)return null;
  const slug=match[2];const id=match[3];
  const kind=slug.includes('vespre')?'vespre':slug.includes('mati')?'matí':slug.includes('tarda')?'tarda':'darrera edició';
  return {
    id,
    title:`El temps · ${kind}`,
    publishedLabel:`el ${parts.day}/${parts.month}/${parts.year}`,
    sourceUrl:`https://www.3cat.cat${match[1]}`,
    embedUrl:`https://www.3cat.cat/3cat/video/${id}/embed/`
  };
}

async function latestThreeCatForecastVideo(){
  for(const ageDays of [0,1]){
    const date=new Date(Date.now()-ageDays*86400000);
    const parts=localDateParts(date);
    const query=`El temps ${parts.day}/${parts.month}/${parts.year}`;
    const searchUrl=new URL(THREECAT_SEARCH_URL);searchUrl.searchParams.set('text',query);
    const response=await fetch(searchUrl,{headers:{Accept:'text/html','User-Agent':`MeteoFontanillas/${WORKER_VERSION} (forecast video index)`},signal:AbortSignal.timeout(8000)});
    if(!response.ok)continue;
    const video=threeCatVideoFromHtml(await boundedResponseText(response),parts);
    if(video)return video;
  }
  return null;
}

async function forecastVideos(request,ctx){
  const cache=caches.default;
  const cacheKey=new Request(new URL('/forecast-videos',request.url).toString(),{method:'GET'});
  const cached=await cache.match(cacheKey);
  if(cached)return cached;
  let threeCat=null;
  try{threeCat=await latestThreeCatForecastVideo();}
  catch(error){console.warn('3Cat forecast discovery unavailable',cleanText(error.message,200));}
  const response=json({
    updatedAt:new Date().toISOString(),
    sources:['meteocat',...(threeCat?['3cat']:[])],
    threeCat
  },200,'public, max-age=900, s-maxage=1800, stale-while-revalidate=86400');
  ctx.waitUntil(cache.put(cacheKey,response.clone()));
  return response;
}

function publicHttpsUrl(value, fallback = null) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function windyWebcamValue(webcam, paths) {
  for (const path of paths) {
    let value = webcam;
    for (const key of path) value = value?.[key];
    if (value) return value;
  }
  return null;
}

async function nearbyWebcams(url, env) {
  const latitude = finite(url.searchParams.get("lat"));
  const longitude = finite(url.searchParams.get("lon"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return json({ error:"Coordenades no vàlides" },400);
  const provider = { name:"Windy Webcams", url:"https://www.windy.com/webcams" };
  if (!env.WINDY_WEBCAMS_API_KEY) return json({ ok:true, configured:false, webcams:[], provider },200,"no-store");
  const lat = Number(latitude.toFixed(4));
  const lon = Number(longitude.toFixed(4));
  const radiusKm = 50;
  const endpoint = `https://api.windy.com/webcams/api/v3/webcams?nearby=${lat},${lon},${radiusKm}&limit=4&include=images,location,urls`;
  let response;
  try {
    response = await fetch(endpoint, { headers:{ Accept:"application/json", "x-windy-api-key":String(env.WINDY_WEBCAMS_API_KEY) } });
  } catch (error) {
    console.warn("Consulta de webcams Windy:", error.message);
    return json({ ok:false, configured:true, webcams:[], provider, error:"Servei de webcams no disponible temporalment" },502,"no-store");
  }
  if (!response.ok) {
    console.warn("Consulta de webcams Windy:", response.status);
    return json({ ok:false, configured:true, webcams:[], provider, error:"Servei de webcams no disponible temporalment" },502,"no-store");
  }
  const payload = await response.json();
  const rows = Array.isArray(payload?.webcams) ? payload.webcams : Array.isArray(payload?.data) ? payload.data : [];
  const webcams = rows.slice(0,4).map(webcam => {
    const preview = publicHttpsUrl(windyWebcamValue(webcam, [["images","current","preview"],["images","current","thumbnail"],["images","current","icon"],["images","preview"]]));
    const detail = publicHttpsUrl(windyWebcamValue(webcam, [["urls","detail"],["urls","web"],["url"],["webUrl"]]), provider.url);
    const webcamLatitude = finite(windyWebcamValue(webcam, [["location","latitude"],["latitude"]]));
    const webcamLongitude = finite(windyWebcamValue(webcam, [["location","longitude"],["longitude"]]));
    return {
      title:cleanText(windyWebcamValue(webcam, [["title"],["name"],["location","city"]]) || "Webcam propera",100),
      location:cleanText([windyWebcamValue(webcam, [["location","city"]]),windyWebcamValue(webcam, [["location","country"]])].filter(Boolean).join(" · "),100),
      preview,
      url:detail,
      distanceKm:Number.isFinite(webcamLatitude) && Number.isFinite(webcamLongitude) ? Number(distanceKm(lat,lon,webcamLatitude,webcamLongitude).toFixed(1)) : null,
    };
  }).filter(webcam => webcam.title);
  return json({ ok:true, configured:true, generatedAt:new Date().toISOString(), radiusKm, webcams, provider },200,"no-store");
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

async function latestStoredObservation(env) {
  if (!(await ensureSchema(env))) return null;
  const row = await env.DB.prepare("SELECT * FROM observations ORDER BY observed_epoch DESC LIMIT 1").first();
  if (!row) return null;
  const ageMinutes = Math.max(0, Math.round((Date.now() / 1000 - Number(row.observed_epoch)) / 60));
  return {
    station:"Observatori Meteorològic Fontanillas", stationId:STATION_ID,
    location:"Sant Celoni · Montseny", updated:row.local_time,
    updatedUtc:row.observed_at_utc, epoch:row.observed_epoch,
    temperature:row.temperature, feelsLike:row.feels_like, humidity:row.humidity,
    dewPoint:row.dew_point, pressure:row.pressure, windSpeed:row.wind_speed,
    windGust:row.wind_gust, windDirection:row.wind_direction,
    rainToday:row.rain_total, rainRate:row.rain_rate,
    solarRadiation:row.solar_radiation, uv:row.uv, quality:row.quality,
    webcam:WEBCAM_URL, background:BACKGROUND_URL,
    source:"d1-emergency", degraded:true, stale:ageMinutes >= 30, ageMinutes,
    sourceMessage:"Weather Underground no respon. Es mostra l’última lectura fiable desada per l’Observatori.",
  };
}

async function resilientCurrentObservation(env) {
  try {
    const observation = await currentObservation(env);
    return { ...observation, source:"weather-underground", degraded:false, stale:false, ageMinutes:0 };
  } catch (error) {
    console.error("Weather Underground current error", error);
    const fallback = await latestStoredObservation(env).catch(() => null);
    if (fallback) return fallback;
    throw error;
  }
}

async function persistObservation(observation, env) {
  if (!(await ensureSchema(env))) return { stored:false, reason:"D1 no configurat" };
  const epoch = Number(observation.epoch) || Math.floor(new Date(observation.updatedUtc).getTime() / 1000);
  if (!Number.isFinite(epoch)) throw new Error("L'observació no té una hora UTC vàlida");
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
  ON CONFLICT(observed_epoch) DO NOTHING`).bind(
    epoch, observation.updatedUtc, localTime, localDate, STATION_ID,
    finite(observation.temperature), finite(observation.feelsLike), finite(observation.humidity),
    finite(observation.dewPoint), finite(observation.pressure), finite(observation.windSpeed),
    finite(observation.windGust), finite(observation.windDirection), currentRain,
    finite(observation.rainRate), rainDelta, finite(observation.solarRadiation),
    finite(observation.uv), finite(observation.quality)
  ).run();
  runtimeStateCache.delete('d1:storage-summary');
  return { stored:true, epoch };
}

async function captureObservation(env) {
  const observation = await currentObservation(env);
  const storage = await persistObservation(observation, env);
  return { observation, storage };
}

async function captureForecastSnapshot(env) {
  if (!(await ensureForecastSchema(env))) return { stored:false, reason:"D1 no configurat" };
  const issued = new Date();
  const issuedAt = issued.toISOString();
  const issuedEpoch = Math.floor(issued.getTime() / 1000);
  const bucket = `${issuedAt.slice(0,10)}T${String(Math.floor(issued.getUTCHours() / 6) * 6).padStart(2,"0")}`;
  const existing = await env.DB.prepare("SELECT 1 AS found FROM forecast_snapshots WHERE snapshot_key LIKE ? LIMIT 1").bind(`open-meteo:${bucket}:%`).first();
  if (existing?.found) return { stored:false, reason:"bucket_exists", bucket };
  const params = new URLSearchParams({
    latitude:String(STATION_LATITUDE), longitude:String(STATION_LONGITUDE),
    daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max",
    timezone:TIME_ZONE, forecast_days:"7",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { headers:{ Accept:"application/json" } });
  if (!response.ok) throw new Error(`Open-Meteo snapshot ${response.status}`);
  const payload = await response.json();
  const daily = payload.daily || {};
  if (!Array.isArray(daily.time) || !daily.time.length) throw new Error("Open-Meteo no ha retornat la previsió diària");
  const statements = daily.time.slice(0, 7).map((targetDate, index) => env.DB.prepare(`INSERT OR IGNORE INTO forecast_snapshots
    (snapshot_key,issued_at,issued_epoch,target_date,horizon_day,provider,model,weather_code,
     temperature_max,temperature_min,precipitation_probability,precipitation_sum,wind_gust_max)
    VALUES (?,?,?,?,?,'Open-Meteo','best_match',?,?,?,?,?,?)`).bind(
      `open-meteo:${bucket}:${targetDate}`, issuedAt, issuedEpoch, targetDate, index,
      finite(daily.weather_code?.[index]), finite(daily.temperature_2m_max?.[index]),
      finite(daily.temperature_2m_min?.[index]), finite(daily.precipitation_probability_max?.[index]),
      finite(daily.precipitation_sum?.[index]), finite(daily.wind_gusts_10m_max?.[index])
    ));
  const results = await env.DB.batch(statements);
  return { stored:true, inserted:results.reduce((sum,item)=>sum+(Number(item?.meta?.changes)||0),0), issuedAt, bucket };
}

function verificationMean(values) {
  const valid = values.filter(Number.isFinite);
  return valid.length ? valid.reduce((sum,item)=>sum+item,0) / valid.length : null;
}

function verificationRound(value, digits = 1) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

async function forecastVerification(url, env) {
  if (!(await ensureForecastSchema(env)) || !(await ensureSchema(env))) return json({ ok:false, status:"collecting", sampleDays:0, message:"Encara no hi ha dades disponibles." });
  const requestedDays = Math.min(180, Math.max(7, Number(url.searchParams.get("days")) || 45));
  const cutoff = new Date(Date.now() - requestedDays * 86400000).toISOString().slice(0, 10);
  const query = await env.DB.prepare(`WITH daily_observed AS (
      SELECT local_date AS target_date, MAX(temperature) AS observed_max, MIN(temperature) AS observed_min,
        SUM(COALESCE(rain_delta,0)) AS observed_rain, MAX(wind_gust) AS observed_gust,
        COUNT(*) AS observed_samples
      FROM observations WHERE local_date >= ? GROUP BY local_date
    ), ranked AS (
      SELECT f.*, ROW_NUMBER() OVER (PARTITION BY f.target_date,f.horizon_day ORDER BY f.issued_epoch DESC) AS position
      FROM forecast_snapshots f WHERE f.target_date >= ? AND f.target_date < ?
    )
    SELECT r.target_date,r.horizon_day,r.issued_at,r.temperature_max,r.temperature_min,
      r.precipitation_probability,r.precipitation_sum,r.wind_gust_max,r.weather_code,
      o.observed_max,o.observed_min,o.observed_rain,o.observed_gust,o.observed_samples
    FROM ranked r JOIN daily_observed o ON o.target_date=r.target_date
    WHERE r.position=1 AND o.observed_samples>=72 ORDER BY r.target_date DESC,r.horizon_day ASC`)
    .bind(cutoff, cutoff, new Intl.DateTimeFormat("en-CA", { timeZone:TIME_ZONE }).format(new Date())).all();
  const rows = (query?.results || []).map(row => ({ ...row,
    temperatureError:verificationMean([
      Number(row.temperature_max)-Number(row.observed_max),
      Number(row.temperature_min)-Number(row.observed_min),
    ]),
    temperatureAbsoluteError:verificationMean([
      Math.abs(Number(row.temperature_max)-Number(row.observed_max)),
      Math.abs(Number(row.temperature_min)-Number(row.observed_min)),
    ]),
    rainCorrect:(Number(row.precipitation_probability)>=40 || Number(row.precipitation_sum)>=0.2) === (Number(row.observed_rain)>=0.2),
    rainBrier:Math.pow(Math.max(0,Math.min(100,Number(row.precipitation_probability)||0))/100-(Number(row.observed_rain)>=0.2?1:0),2),
    windError:Math.abs(Number(row.wind_gust_max)-Number(row.observed_gust)),
  }));
  const horizonDefinitions = [
    { key:"today", label:"Avui", min:0, max:0 },
    { key:"tomorrow", label:"Demà", min:1, max:1 },
    { key:"two-three", label:"2–3 dies", min:2, max:3 },
    { key:"four-seven", label:"4–7 dies", min:4, max:6 },
  ];
  const summarize = subset => ({
    samples:subset.length,
    wetDays:subset.filter(row=>Number(row.observed_rain)>=0.2).length,
    dryDays:subset.filter(row=>Number(row.observed_rain)<0.2).length,
    temperatureMae:verificationRound(verificationMean(subset.map(row=>row.temperatureAbsoluteError))),
    temperatureBias:verificationRound(verificationMean(subset.map(row=>row.temperatureError))),
    rainAccuracy:verificationRound(verificationMean(subset.map(row=>row.rainCorrect?100:0)),0),
    rainBrier:verificationRound(verificationMean(subset.map(row=>row.rainBrier)),3),
    windMae:verificationRound(verificationMean(subset.map(row=>row.windError))),
  });
  // El resum principal ha de comparar sempre el mateix marge temporal.
  // Barrejar actualitzacions del mateix dia amb horitzons de fins a set dies
  // inflaria la mostra i faria que les mètriques fossin difícils de llegir.
  const primaryRows = rows.filter(row=>Number(row.horizon_day)===1);
  const summary = summarize(primaryRows);
  const horizons = horizonDefinitions.map(definition => ({ ...definition, ...summarize(rows.filter(row=>Number(row.horizon_day)>=definition.min&&Number(row.horizon_day)<=definition.max)) }));
  const detail = primaryRows.slice(0,14).map(row=>({
    date:row.target_date, issuedAt:row.issued_at,
    forecast:{ max:row.temperature_max,min:row.temperature_min,rain:row.precipitation_sum,rainProbability:row.precipitation_probability,gust:row.wind_gust_max,weatherCode:row.weather_code },
    observed:{ max:row.observed_max,min:row.observed_min,rain:verificationRound(Number(row.observed_rain)),gust:row.observed_gust },
  }));
  const firstSnapshot = await env.DB.prepare("SELECT MIN(issued_at) AS firstIssued,COUNT(*) AS total FROM forecast_snapshots").first();
  const sampleDays=new Set(primaryRows.map(row=>row.target_date)).size;
  const status = sampleDays >= 7 ? "ready" : "collecting";
  const confidence=sampleDays>=30?{level:'consolidated',label:'Mostra consolidada',note:'30 dies o més verificats'}:sampleDays>=14?{level:'growing',label:'Mostra en creixement',note:'Calen 30 dies per consolidar tendències'}:{level:'preliminary',label:'Resultat preliminar',note:'Menys de 14 dies verificats'};
  return json({ ok:true,status,requestedDays,generatedAt:new Date().toISOString(),firstIssued:firstSnapshot?.firstIssued||null,storedForecasts:Number(firstSnapshot?.total)||0,sampleDays,totalComparisons:rows.length,summaryScope:"tomorrow",confidence,summary,horizons,detail,method:{ provider:"Open-Meteo · best_match",observation:"Observatori Fontanillas · D1",minimumObservedSamples:72,rainThresholdMillimetres:0.2,rainProbabilityThreshold:40,note:"Els indicadors principals comparen només la previsió de demà guardada el dia anterior. No es reconstrueixen pronòstics passats. L’índex Brier de pluja va de 0 (millor) a 1 (pitjor)." } }, 200, "public, max-age=900");
}

function socialNumber(value, digits = 1) {
  const number = finite(value);
  return number === null ? null : number.toFixed(digits).replace('.', ',');
}

function socialWeatherLabel(code){
  const value=Number(code);
  if(value===0)return 'cel serè';
  if(value<=3)return 'núvols i clarianes';
  if(value<=48)return 'boira o núvols baixos';
  if(value<=67)return 'pluja';
  if(value<=77)return 'neu';
  if(value<=86)return 'ruixats';
  if(value>=95)return 'tempesta';
  return 'temps variable';
}

function socialWeatherEmoji(code){
  const value=Number(code);
  if(value===0)return '☀️';
  if(value<=2)return '🌤️';
  if(value===3)return '☁️';
  if(value<=48)return '🌫️';
  if(value<=67)return '🌧️';
  if(value<=77)return '🌨️';
  if(value<=86)return '🌦️';
  if(value>=95)return '⛈️';
  return '🌡️';
}

function socialForecastFocus(forecast, slot){
  if(!Array.isArray(forecast))return null;
  return forecast[slot==='evening'?1:0]||null;
}

function socialForecastSummary(day, slot){
  if(!day)return '';
  const when=slot==='evening'?'Demà':'Avui';
  const temperatures=finite(day.max)===null?'':finite(day.min)===null?` · màx. ${socialNumber(day.max,0)}°`:` · ${socialNumber(day.max,0)}°/${socialNumber(day.min,0)}°`;
  const rain=finite(day.rainProbability)===null?'':` · ${socialNumber(day.rainProbability,0)}% pluja`;
  return `${socialWeatherEmoji(day.weatherCode)} ${when}: ${day.condition||socialWeatherLabel(day.weatherCode)}${temperatures}${rain}`;
}

function socialWeatherGlyphSvg(code){
  const value=Number(code);const clear=value===0;const partly=value<=2;const fog=value===45||value===48;const rain=(value>=51&&value<=67)||(value>=80&&value<=82)||value>=95;const snow=(value>=71&&value<=77)||(value>=85&&value<=86);const storm=value>=95;
  const sun=clear?'<circle r="52" fill="#ffd166"/><g stroke="#ffd166" stroke-width="13" stroke-linecap="round"><path d="M0-94v-24M0 94v24M-94 0h-24M94 0h24M-67-67l-17-17M67 67l17 17M67-67l17-17M-67 67l-17 17"/></g>':partly?'<circle cx="-55" cy="-45" r="38" fill="#ffd166"/>':'';
  const cloud=clear?'':'<path d="M-84 60c-25 0-45-18-45-41 0-22 18-40 41-42 10-32 40-53 75-53 45 0 81 33 85 76 27 4 48 25 48 51 0 29-25 52-57 52H-84z" fill="#f2f8f5" stroke="#8cbba8" stroke-width="9"/>';
  const drops=rain?'<g stroke="#67cae9" stroke-width="11" stroke-linecap="round"><path d="M-65 119l-12 25M0 119l-12 25M65 119l-12 25"/></g>':'';
  const flakes=snow?'<g fill="#d8f4ff"><circle cx="-62" cy="137" r="9"/><circle cy="166" r="9"/><circle cx="62" cy="137" r="9"/></g>':'';
  const mist=fog?'<g stroke="#c8d4cf" stroke-width="11" stroke-linecap="round"><path d="M-92 124H74M-64 158H98"/></g>':'';
  const bolt=storm?'<path d="M8 96h42l-25 38h25l-52 45 15-35h-34z" fill="#ffd166"/>':'';
  return `<svg viewBox="-180 -180 360 360" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeHtml(socialWeatherLabel(code))}">${sun}${cloud}${drops}${flakes}${mist}${bolt}</svg>`;
}

async function socialForecast(){
  const params=new URLSearchParams({latitude:String(STATION_LATITUDE),longitude:String(STATION_LONGITUDE),timezone:TIME_ZONE,forecast_days:'4',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max'});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{headers:{Accept:'application/json'},cf:{cacheEverything:true,cacheTtl:900}});
  if(!response.ok)throw new Error(`Open-Meteo social ${response.status}`);
  const daily=(await response.json()).daily||{};
  return daily.time?.map((date,index)=>({date,weatherCode:finite(daily.weather_code?.[index]),condition:socialWeatherLabel(daily.weather_code?.[index]),max:finite(daily.temperature_2m_max?.[index]),min:finite(daily.temperature_2m_min?.[index]),rainProbability:finite(daily.precipitation_probability_max?.[index]),rain:finite(daily.precipitation_sum?.[index]),gust:finite(daily.wind_gusts_10m_max?.[index])}))||[];
}

function socialHashtags(kind='daily_observation'){
  return kind==='official_alert'
    ? '#MeteoFontanillas #SantCeloni #VallesOriental #AvisMeteorologic #Meteocat #ProteccioCivil'
    : '#MeteoFontanillas #SantCeloni #BaixMontseny #Montseny #ElTemps #MeteoCatalunya';
}

function socialSlotProfile(slot='07:00'){
  const hour=Number(String(slot).slice(0,2));
  if(hour>=19)return {period:'vespre',eyebrow:'Balanç del dia',greeting:'Bona nit',lead:'Tanquem el dia amb les dades reals de l’Observatori',forecastLead:'Demà'};
  if(hour>=12)return {period:'migdia',eyebrow:'Actualització del migdia',greeting:'Bon dia',lead:'Actualització de les dades reals de l’Observatori',forecastLead:'La resta del dia'};
  return {period:'mati',eyebrow:'Previsió del dia',greeting:'Bon dia',lead:'Dades reals de l’Observatori',forecastLead:'Avui'};
}

const SOCIAL_SCHEDULE_BLUEPRINT=[
  {time:'07:00',period:'mati',label:'Bon dia i previsió',purpose:'Dades reals, previsió d’avui i avanç de demà'},
  {time:'14:00',period:'migdia',label:'Actualització del migdia',purpose:'Evolució observada i canvis per a la resta del dia'},
  {time:'20:30',period:'vespre',label:'Balanç del dia',purpose:'Resum del dia i previsió de l’endemà'},
];

// Horaris operatius per defecte. Es poden ajustar des de les variables del
// Worker sense publicar una nova versió, però el portal ja queda útil sense
// configuració addicional.
const DEFAULT_SOCIAL_AUTO_TIMES='07:00,14:00,20:30';
const DEFAULT_SOCIAL_PREFLIGHT_TIMES='06:45,13:45,20:15';
const DEFAULT_META_VIDEO_AUTO_TIMES='07:00,20:30';
const META_VIDEO_SLOT_BY_TIME={ '07:00':'morning', '20:30':'evening' };
const META_VIDEO_AUTOMATIC_MAX_ATTEMPTS=4;
const META_VIDEO_AUTOMATIC_WINDOW_MINUTES=90;
// Cloudflare és el rellotge principal dels Shorts perquè el cron de GitHub pot
// retardar-se o no arribar a iniciar-se. Les hores són locals de Sant Celoni.
const YOUTUBE_SHORT_FALLBACK_WINDOWS={ mati:{ hour:6, minute:20 }, vespre:{ hour:19, minute:45 } };
const YOUTUBE_SHORT_FALLBACK_WINDOW_MINUTES=35;
const YOUTUBE_SHORT_DISPATCH_ACK_MS=8*60*1000;
const YOUTUBE_SHORT_RUN_STALE_MS=20*60*1000;

function socialSchedulePlan(env){
  const active=new Set(String(env.SOCIAL_AUTO_TIMES||DEFAULT_SOCIAL_AUTO_TIMES).split(',').map(value=>value.trim()));
  return SOCIAL_SCHEDULE_BLUEPRINT.map(item=>({...item,enabled:active.has(item.time)}));
}

function localClockParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone:TIME_ZONE, hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(date);
  return Object.fromEntries(parts.map(part=>[part.type,part.value]));
}

function activeTimeSlot(schedule, date = new Date()) {
  const schedules = String(schedule).split(',').map(value=>value.trim()).filter(value=>/^\d{2}:\d{2}$/.test(value));
  const parts = localClockParts(date);
  const current = Number(parts.hour) * 60 + Number(parts.minute);
  return schedules.find(value => {
    const [hour,minute] = value.split(':').map(Number);
    const scheduled = hour * 60 + minute;
    return current >= scheduled && current < scheduled + STORAGE_INTERVAL_MINUTES;
  }) || null;
}

function activeSocialSlot(env, date = new Date()) {
  return activeTimeSlot(env.SOCIAL_AUTO_TIMES || DEFAULT_SOCIAL_AUTO_TIMES, date);
}

export function metaVideoAutomationEnabled(env) {
  return String(env.META_VIDEO_AUTOMATION_ENABLED || '').trim().toLowerCase() === 'true';
}

export function dueMetaVideoSlots(env, date = new Date()) {
  const configured = new Set(String(env.META_VIDEO_AUTO_TIMES || DEFAULT_META_VIDEO_AUTO_TIMES)
    .split(',').map(value=>value.trim()).filter(value=>META_VIDEO_SLOT_BY_TIME[value]));
  const parts=localClockParts(date);
  const current=Number(parts.hour)*60+Number(parts.minute);
  return Object.entries(META_VIDEO_SLOT_BY_TIME)
    .filter(([time])=>{
      if(!configured.has(time))return false;
      const [hour,minute]=time.split(':').map(Number);
      const scheduled=hour*60+minute;
      return current>=scheduled && current<scheduled+META_VIDEO_AUTOMATIC_WINDOW_MINUTES;
    })
    .map(([,slot])=>slot);
}

export function youtubeShortFallbackSlot(date = new Date()) {
  const parts=localClockParts(date);
  const current=Number(parts.hour)*60+Number(parts.minute);
  return Object.entries(YOUTUBE_SHORT_FALLBACK_WINDOWS).find(([, time]) => {
    const start=time.hour*60+time.minute;
    return current>=start && current<start+YOUTUBE_SHORT_FALLBACK_WINDOW_MINUTES;
  })?.[0] || null;
}

function localIsoDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone:TIME_ZONE }).format(date);
}

function socialAutomationEnabled(env) {
  return String(env.SOCIAL_AUTOMATION_ENABLED || 'true').toLowerCase() !== 'false';
}

export function dailySocialChannelsForSlot(slot) {
  const channels=['facebook','instagram','bluesky','telegram','threads'];
  return socialSlotProfile(slot).period === 'migdia'
    ? channels
    : channels.filter(channel=>channel !== 'facebook' && channel !== 'instagram');
}

async function createDailySocialDraft(observation, env, slot = null) {
  if (!(await ensureSocialDraftSchema(env)) || !observation || !slot) return { created:false, reason:slot?'storage_disabled':'outside_schedule' };
  const localDate = String(observation.updated || '').slice(0, 10) || new Intl.DateTimeFormat('en-CA', { timeZone:TIME_ZONE }).format(new Date());
  const temperature = socialNumber(observation.temperature);
  const humidity = socialNumber(observation.humidity, 0);
  const wind = socialNumber(observation.windSpeed);
  const rain = socialNumber(observation.rainToday);
  const facts = [
    temperature === null ? null : `${temperature} °C`,
    humidity === null ? null : `humitat ${humidity}%`,
    wind === null ? null : `vent ${wind} km/h`,
    rain === null ? null : `pluja avui ${rain} mm`,
  ].filter(Boolean);
  const forecast=await socialForecast().catch(error=>{console.error('Social forecast error',error);return [];});
  const today=forecast[0];const tomorrow=forecast[1];
  const profile=socialSlotProfile(slot);
  const forecastText=today?` ${profile.forecastLead}: ${today.condition}, màxima ${socialNumber(today.max,0)}° i mínima ${socialNumber(today.min,0)}°, pluja ${socialNumber(today.rainProbability,0)}%.${tomorrow?` Demà: ${tomorrow.condition}, ${socialNumber(tomorrow.max,0)}°/${socialNumber(tomorrow.min,0)}°, pluja ${socialNumber(tomorrow.rainProbability,0)}%.`:''}`:'';
  const title = `${profile.eyebrow} a Sant Celoni · ${localDate}`;
  const body = `${profile.greeting} des de Meteo Fontanillas. ${profile.lead} a les ${String(observation.updated || '').slice(11,16)}: ${facts.join(' · ')}.${forecastText} Consulta l’evolució i la predicció a meteo.fontanillas.cat.\n\n${socialHashtags()}`;
  const payload = JSON.stringify({ localDate, slot, period:profile.period, eyebrow:profile.eyebrow, observationUpdated:observation.updated || null, temperature:finite(observation.temperature), feelsLike:finite(observation.feelsLike), humidity:finite(observation.humidity), pressure:finite(observation.pressure), windSpeed:finite(observation.windSpeed), windGust:finite(observation.windGust), windDirection:finite(observation.windDirection), rainToday:finite(observation.rainToday), rainRate:finite(observation.rainRate), solarRadiation:finite(observation.solarRadiation), uv:finite(observation.uv), forecast });
  const initialStatus = socialAutomationEnabled(env) ? 'approved' : 'draft';
  const result = await env.DB.prepare(`INSERT OR IGNORE INTO social_drafts
    (dedupe_key, kind, status, channels, title, body, source_url, payload)
    VALUES (?, 'daily_observation', ?, ?, ?, ?, ?, ?)`)
    .bind(`daily:${localDate}:${slot}`, initialStatus, JSON.stringify(dailySocialChannelsForSlot(slot)), title, body, 'https://meteo.fontanillas.cat/', payload).run();
  const created = Boolean(result?.meta?.changes);
  const draft = await env.DB.prepare("SELECT * FROM social_drafts WHERE dedupe_key = ?").bind(`daily:${localDate}:${slot}`).first();
  return { created, localDate, slot, draft };
}

async function createOfficialAlertSocialDraft(entry,env){
  if(entry.source!=='Meteocat')return {created:false,reason:'meteocat_only'};
  if(!(await ensureSocialDraftSchema(env)))return {created:false,reason:'storage_disabled'};
  const level=String(entry.level||'').toLowerCase();
  const levelLabel=level==='red'?'VERMELL':level==='orange'?'TARONJA':'GROC';
  const area=`${entry.scopeName||METEOCAT_VALLES_ORIENTAL_NAME}, la comarca on es troba Sant Celoni`;
  const precision=`L’avís és comarcal i no implica necessàriament afectació a tot el municipi de Sant Celoni${entry.distribution?`; distribució prevista: ${String(entry.distribution).toLowerCase()}`:''}.`;
  const title=`Avís ${levelLabel} · ${entry.phenomenon||'meteorologia'} · ${entry.scopeName||METEOCAT_VALLES_ORIENTAL_NAME} (Sant Celoni)`;
  const body=`⚠️ Avís oficial ${levelLabel} de Meteocat per ${entry.phenomenon||'fenomen meteorològic'} al ${area}. ${precision} ${cleanText(entry.description||entry.title,820)} Consulta sempre el detall oficial i segueix les indicacions de Protecció Civil.\n\n${socialHashtags('official_alert')}`;
  const payload=JSON.stringify({source:'Meteocat',level,levelLabel,phenomenon:entry.phenomenon||null,description:entry.description||entry.title||null,starts:entry.starts||entry.published||null,expires:entry.expires||null,scopeKind:entry.scopeKind||null,scopeName:entry.scopeName||null,municipality:entry.municipality||null,distribution:entry.distribution||null,periods:entry.periods||[],countyWarnings:entry.countyWarnings||[]});
  const sourceUrl=entry.sourceUrl||METEOCAT_ALERTS_PAGE;
  const result=await env.DB.prepare(`INSERT OR IGNORE INTO social_drafts (dedupe_key,kind,status,channels,title,body,source_url,payload) VALUES (?,'official_alert','approved',?,?,?,?,?)`)
    .bind(`alert:${entry.fingerprint}`,JSON.stringify(['facebook','instagram','bluesky','telegram','threads']),title,body,sourceUrl,payload).run();
  const draft=await env.DB.prepare('SELECT * FROM social_drafts WHERE dedupe_key = ?').bind(`alert:${entry.fingerprint}`).first();
  return {created:Boolean(result?.meta?.changes),localDate:String(entry.published||'').slice(0,10),draft};
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
    const rainTotal = maximum(group, "rainTotal") || 0;
    return {
      time:first.time, timeUtc:first.timeUtc, epoch:first.epoch,
      temperature:average(group, "temperature"), temperatureMin:minimum(group, "temperatureMin"), temperatureMax:maximum(group, "temperatureMax"),
      humidity:average(group, "humidity"), humidityMin:minimum(group, "humidityMin"), humidityMax:maximum(group, "humidityMax"),
      dewPoint:average(group, "dewPoint"), dewPointMin:minimum(group, "dewPointMin"), dewPointMax:maximum(group, "dewPointMax"),
      pressure:average(group, "pressure"), pressureMin:minimum(group, "pressureMin"), pressureMax:maximum(group, "pressureMax"),
      windSpeed:average(group, "windSpeed"), windSpeedMax:maximum(group, "windSpeedMax"), windGust:maximum(group, "windGust"),
      windDirection:average(group, "windDirection"), rainRate:maximum(group, "rainRate"), rainTotal, rainIncrement:rainTotal,
      solarRadiation:maximum(group, "solarRadiation"), uv:maximum(group, "uv"), quality:maximum(group, "quality"), samples:group.length,
    };
  });
}

function bucketKey(item, resolution) {
  if (resolution === "daily") return String(item.time || "").slice(0, 10);
  if (resolution === "hourly") return String(item.timeUtc || item.time || "").slice(0, 13);
  return String(item.epoch);
}

function mergeHistories(databaseRows, wuRows, resolution) {
  if (!databaseRows.length) return wuRows;
  if (!wuRows.length) return databaseRows;
  if (resolution === "raw" && databaseRows.length >= 144) return databaseRows;
  const merged = new Map(wuRows.map(item => [bucketKey(item, resolution), item]));
  const minimumSamples = resolution === "daily" ? 72 : resolution === "hourly" ? 6 : 1;
  databaseRows.forEach(item => {
    const key = bucketKey(item, resolution);
    if (!merged.has(key) || item.samples >= minimumSamples) merged.set(key, item);
  });
  return [...merged.values()].sort((a, b) => Number(a.epoch) - Number(b.epoch));
}

async function storageSummary(env) {
  const cached=runtimeStateCache.get('d1:storage-summary');
  if(cached && cached.expiresAt>Date.now())return cached.value;
  const value=await (async()=>{
    if (!(await ensureSchema(env))) return { enabled:false, storedReadings:0, coverageDays:0 };
    const row = await env.DB.prepare(`SELECT COUNT(*) AS storedReadings,
      MIN(observed_epoch) AS firstEpoch, MAX(observed_epoch) AS lastEpoch,
      MIN(local_time) AS firstObservation, MAX(local_time) AS lastObservation
      FROM observations`).first();
    const count = Number(row?.storedReadings) || 0;
    const coverageDays = row?.firstEpoch && row?.lastEpoch ? Math.max(0, (row.lastEpoch - row.firstEpoch) / 86400) : 0;
    return { enabled:true, storedReadings:count, coverageDays, firstObservation:row?.firstObservation || null, lastObservation:row?.lastObservation || null };
  })();
  runtimeStateCache.set('d1:storage-summary',{value,expiresAt:Date.now()+STORAGE_SUMMARY_CACHE_MS});
  return value;
}

async function history(requestUrl, env) {
  const range = historyRange(requestUrl);
  if (!range) return json({ error:"L'interval no és vàlid o supera els 366 dies" }, 400);
  const resolution = chooseResolution(range.days, requestUrl.searchParams.get("resolution"));
  let databaseRows = [];
  let wuRows = [];
  try { databaseRows = await d1History(env, range, resolution); }
  catch (error) { console.error("D1 history error", error); }
  try { wuRows = aggregateWuHistory(await wuHistory(env, range), resolution); }
  catch (error) { console.error("WU history fallback error", error); }
  const observations = mergeHistories(databaseRows, wuRows, resolution);
  const storage = await storageSummary(env).catch(() => ({ enabled:false, storedReadings:0, coverageDays:0 }));
  const source = databaseRows.length && wuRows.length ? "d1+weather-underground" : databaseRows.length ? "d1" : "weather-underground";
  return json({
    station:"Observatori Meteorològic Fontanillas",
    stationId:STATION_ID,
    range:{ start:range.start, end:range.end },
    requestedDays:range.days,
    interval:resolution,
    source,
    count:observations.length,
    storage,
    observations,
  }, 200, "public, max-age=300");
}

async function quality(env) {
  const started = Date.now();
  // Optimització v5.6.0: si D1 té una observació de fa menys de 5 minuts, la fem
  // servir per al health check i estalviem una crida a Weather Underground.
  let observation = null;
  let dataSource = "api";
  try {
    if (await ensureSchema(env)) {
      const latest = await env.DB.prepare(
        "SELECT * FROM observations ORDER BY observed_epoch DESC LIMIT 1"
      ).first();
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (latest && Number(latest.observed_epoch) > nowSeconds - 300) {
        observation = {
          updated: latest.local_time,
          updatedUtc: latest.observed_at_utc,
          epoch: latest.observed_epoch,
          temperature: latest.temperature,
          humidity: latest.humidity,
          pressure: latest.pressure,
          windSpeed: latest.wind_speed,
          rainToday: latest.rain_total,
        };
        dataSource = "cache";
      }
    }
  } catch (error) {
    console.error("Quality D1 cache lookup error", error);
  }
  if (!observation) {
    observation = await currentObservation(env);
    dataSource = "api";
  }
  const updated = new Date(observation.updatedUtc || observation.updated);
  const ageMinutes = Number.isNaN(updated.getTime()) ? null : Math.max(0, Math.round((Date.now() - updated.getTime()) / 60000));
  const monitored = ["temperature", "humidity", "pressure", "windSpeed", "rainToday"];
  const missingFields = monitored.filter(field => observation[field] === null || observation[field] === undefined);
  const storage = await storageSummary(env);
  let recent = null;
  if (storage.enabled) {
    recent = await env.DB.prepare(`SELECT COUNT(*) AS samples,
      SUM(CASE WHEN temperature IS NOT NULL THEN 1 ELSE 0 END) AS temperature,
      SUM(CASE WHEN humidity IS NOT NULL THEN 1 ELSE 0 END) AS humidity,
      SUM(CASE WHEN pressure IS NOT NULL THEN 1 ELSE 0 END) AS pressure,
      SUM(CASE WHEN wind_speed IS NOT NULL THEN 1 ELSE 0 END) AS wind,
      SUM(CASE WHEN rain_total IS NOT NULL THEN 1 ELSE 0 END) AS rain,
      SUM(CASE WHEN solar_radiation IS NOT NULL THEN 1 ELSE 0 END) AS solar,
      SUM(CASE WHEN uv IS NOT NULL THEN 1 ELSE 0 END) AS uv,
      MIN(observed_epoch) AS firstEpoch, MAX(observed_epoch) AS lastEpoch
      FROM observations WHERE observed_epoch >= ?`).bind(Math.floor(Date.now() / 1000) - 86400).first();
  }
  const samples = Number(recent?.samples) || 0;
  const expected = samples && recent?.firstEpoch ? Math.max(1, Math.min(288, Math.floor((Date.now() / 1000 - recent.firstEpoch) / (STORAGE_INTERVAL_MINUTES * 60)) + 1)) : 0;
  const availability = expected ? Math.min(100, samples / expected * 100) : 0;
  const sensorPercent = key => samples ? Math.min(100, Number(recent?.[key] || 0) / samples * 100) : 0;
  const stale = ageMinutes !== null && ageMinutes >= 30;
  const degraded = missingFields.length > 0 || (storage.enabled && samples > 6 && availability < 75);
  return json({
    ok:!stale && missingFields.length === 0,
    status:stale ? "stale" : degraded ? "degraded" : "healthy",
    source:dataSource,
    stationId:STATION_ID,
    updated:observation.updated,
    updatedUtc:observation.updatedUtc,
    ageMinutes,
    missingFields,
    latencyMs:Date.now() - started,
    storage:{ ...storage, cadenceMinutes:STORAGE_INTERVAL_MINUTES, availability24h:availability, samples24h:samples, expected24h:expected },
    sensors:{
      temperature:sensorPercent("temperature"), humidity:sensorPercent("humidity"),
      pressure:sensorPercent("pressure"), wind:sensorPercent("wind"), rain:sensorPercent("rain"),
      solar:sensorPercent("solar"), uv:sensorPercent("uv"),
    },
  });
}

async function health(env) {
  try {
    const result = await quality(env);
    const payload = await result.json();
    return json({
      ok:payload.ok,
      status:payload.status,
      stationId:payload.stationId,
      updated:payload.updated,
      ageMinutes:payload.ageMinutes,
      missingFields:payload.missingFields,
      latencyMs:payload.latencyMs,
      storage:payload.storage,
    });
  } catch (error) {
    // Staging no reutilitza credencials de producció. Que faltin no ha de
    // convertir la seva comprovació de salut en un error intern del Worker.
    if(String(env.ENVIRONMENT||'').toLowerCase()==='staging'&&!env.WU_API_KEY){
      return json({ok:false,status:'degraded',reason:'weather_source_not_configured',message:'Staging no té configurada una font d’observacions.'},200,'no-store');
    }
    throw error;
  }
}

async function secureTokenMatch(candidate, expected) {
  if (!candidate || !expected || candidate.length > 512) return false;
  const encoder = new TextEncoder();
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(candidateHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function youtubeOAuthSignature(payload, env) {
  const secret = String(env.ADMIN_TOKEN || "");
  if (secret.length < 24) throw Object.assign(new Error("Falta configurar la clau d’administració."), { status:503 });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

function youtubeOAuthCookie(request) {
  const cookies = request.headers.get("Cookie") || "";
  return cookies.split(";").map(value => value.trim()).find(value => value.startsWith("youtube_oauth_nonce="))?.slice("youtube_oauth_nonce=".length) || "";
}

async function youtubeOAuthStart(_request, env) {
  if (!env.YOUTUBE_CLIENT_ID || !env.YOUTUBE_CLIENT_SECRET) return json({ error:"Falten les credencials OAuth de YouTube." }, 503);
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  const payload = `${timestamp}.${nonce}`;
  const state = `${payload}.${await youtubeOAuthSignature(payload, env)}`;
  const params = new URLSearchParams({
    client_id:String(env.YOUTUBE_CLIENT_ID),
    redirect_uri:YOUTUBE_OAUTH_REDIRECT_URI,
    response_type:"code",
    scope:YOUTUBE_UPLOAD_SCOPE,
    access_type:"offline",
    include_granted_scopes:"true",
    prompt:"consent",
    state,
  });
  return new Response(null, {
    status:302,
    headers:{
      ...securityHeaders(),
      "Cache-Control":"no-store",
      "Location":`https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      "Set-Cookie":`youtube_oauth_nonce=${nonce}; Max-Age=600; Path=/oauth/youtube/callback; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

function youtubeOAuthPage(title, body, status = 200) {
  const html = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;background:#07130f;color:#f4fbf7;font:17px/1.55 system-ui,sans-serif}.card{max-width:720px;margin:8vh auto;padding:32px;border:1px solid #315246;border-radius:22px;background:#10251e}h1{margin-top:0}code{display:block;overflow-wrap:anywhere;padding:16px;border-radius:12px;background:#07130f;color:#8ee7ba}.ok{color:#8ee7ba}p{color:#c4d4cd}</style></head><body><main class="card"><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
  return new Response(html, { status, headers:{ ...securityHeaders(), "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'", "Content-Type":"text/html;charset=UTF-8", "Cache-Control":"no-store", "Set-Cookie":"youtube_oauth_nonce=; Max-Age=0; Path=/oauth/youtube/callback; HttpOnly; Secure; SameSite=Lax" } });
}

async function youtubeOAuthCallback(request, env, url) {
  const error = cleanText(url.searchParams.get("error"), 120);
  if (error) return youtubeOAuthPage("Autorització cancel·lada", `<p>Google ha retornat: ${escapeHtml(error)}.</p>`, 400);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const parts = state.split(".");
  if (!code || parts.length !== 3) return youtubeOAuthPage("Autorització no vàlida", "<p>Falta el codi o l’estat de seguretat.</p>", 400);
  const [timestampText, nonce, signature] = parts;
  const timestamp = Number(timestampText);
  const payload = `${timestampText}.${nonce}`;
  const expected = await youtubeOAuthSignature(payload, env);
  const fresh = Number.isFinite(timestamp) && Math.abs(Math.floor(Date.now() / 1000) - timestamp) <= 600;
  if (!fresh || nonce !== youtubeOAuthCookie(request) || !(await secureTokenMatch(signature, expected))) return youtubeOAuthPage("Autorització caducada", "<p>Torna a iniciar la connexió de YouTube.</p>", 403);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded" },
    body:new URLSearchParams({ code, client_id:String(env.YOUTUBE_CLIENT_ID || ""), client_secret:String(env.YOUTUBE_CLIENT_SECRET || ""), redirect_uri:YOUTUBE_OAUTH_REDIRECT_URI, grant_type:"authorization_code" }),
  });
  const tokens = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok) return youtubeOAuthPage("No s’ha pogut completar", `<p>Google ha rebutjat l’intercanvi del codi (${tokenResponse.status}). Torna-ho a provar.</p>`, 502);
  const refreshToken = String(tokens.refresh_token || "");
  if (!refreshToken) return youtubeOAuthPage("Falta el token permanent", "<p>Google no ha retornat cap refresh token. Torna a iniciar la connexió i accepta tots els permisos.</p>", 409);
  return youtubeOAuthPage("YouTube autoritzat", `<p class="ok">La connexió amb el canal s’ha completat.</p><p>Copia el valor següent i desa’l a Cloudflare com a secret <strong>YOUTUBE_REFRESH_TOKEN</strong>. No l’enviïs pel xat.</p><code>${escapeHtml(refreshToken)}</code><p>Quan l’hagis desat, pots tancar aquesta pestanya.</p>`);
}

function tiktokOAuthCookie(request) {
  const cookies = request.headers.get("Cookie") || "";
  return cookies.split(";").map(value => value.trim()).find(value => value.startsWith("tiktok_oauth_nonce="))?.slice("tiktok_oauth_nonce=".length) || "";
}

async function tiktokOAuthStart(_request, env) {
  if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) return json({ error:"Falten les credencials OAuth de TikTok." }, 503);
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = base64Url(crypto.getRandomValues(new Uint8Array(24)));
  const payload = `${timestamp}.${nonce}`;
  const state = `${payload}.${await youtubeOAuthSignature(payload, env)}`;
  const params = new URLSearchParams({
    client_key:String(env.TIKTOK_CLIENT_KEY),
    redirect_uri:TIKTOK_OAUTH_REDIRECT_URI,
    response_type:"code",
    scope:TIKTOK_OAUTH_SCOPE,
    disable_auto_auth:"1",
    state,
  });
  return new Response(null, {
    status:302,
    headers:{
      ...securityHeaders(),
      "Cache-Control":"no-store",
      "Location":`https://www.tiktok.com/v2/auth/authorize/?${params}`,
      "Set-Cookie":`tiktok_oauth_nonce=${nonce}; Max-Age=600; Path=/oauth/tiktok/callback; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

function tiktokOAuthPage(title, body, status = 200) {
  const html = `<!doctype html><html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{margin:0;background:#07130f;color:#f4fbf7;font:17px/1.55 system-ui,sans-serif}.card{max-width:720px;margin:8vh auto;padding:32px;border:1px solid #315246;border-radius:22px;background:#10251e}h1{margin-top:0}code{display:block;overflow-wrap:anywhere;margin:8px 0 18px;padding:16px;border-radius:12px;background:#07130f;color:#8ee7ba}.ok{color:#8ee7ba}p{color:#c4d4cd}</style></head><body><main class="card"><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`;
  return new Response(html, { status, headers:{ ...securityHeaders(), "Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'", "Content-Type":"text/html;charset=UTF-8", "Cache-Control":"no-store", "Set-Cookie":"tiktok_oauth_nonce=; Max-Age=0; Path=/oauth/tiktok/callback; HttpOnly; Secure; SameSite=Lax" } });
}

async function tiktokOAuthCallback(request, env, url) {
  const error = cleanText(url.searchParams.get("error"), 120);
  const errorDescription = cleanText(url.searchParams.get("error_description"), 300);
  if (error) return tiktokOAuthPage("Autorització cancel·lada", `<p>TikTok ha retornat: ${escapeHtml(errorDescription || error)}.</p>`, 400);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const parts = state.split(".");
  if (!code || parts.length !== 3) return tiktokOAuthPage("Autorització no vàlida", "<p>Falta el codi o l’estat de seguretat.</p>", 400);
  const [timestampText, nonce, signature] = parts;
  const timestamp = Number(timestampText);
  const payload = `${timestampText}.${nonce}`;
  const expected = await youtubeOAuthSignature(payload, env);
  const fresh = Number.isFinite(timestamp) && Math.abs(Math.floor(Date.now() / 1000) - timestamp) <= 600;
  if (!fresh || nonce !== tiktokOAuthCookie(request) || !(await secureTokenMatch(signature, expected))) return tiktokOAuthPage("Autorització caducada", "<p>Torna a iniciar la connexió de TikTok.</p>", 403);
  const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method:"POST",
    headers:{ "Content-Type":"application/x-www-form-urlencoded", "Cache-Control":"no-cache" },
    body:new URLSearchParams({ code, client_key:String(env.TIKTOK_CLIENT_KEY || ""), client_secret:String(env.TIKTOK_CLIENT_SECRET || ""), redirect_uri:TIKTOK_OAUTH_REDIRECT_URI, grant_type:"authorization_code" }),
  });
  const tokens = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || tokens.error) return tiktokOAuthPage("No s’ha pogut completar", `<p>TikTok ha rebutjat l’intercanvi del codi (${tokenResponse.status}). ${escapeHtml(cleanText(tokens.error_description, 300))}</p>`, 502);
  const refreshToken = String(tokens.refresh_token || "");
  const openId = String(tokens.open_id || "");
  if (!refreshToken || !openId) return tiktokOAuthPage("Falten dades permanents", "<p>TikTok no ha retornat el refresh token o l’identificador del compte. Torna a iniciar la connexió.</p>", 409);
  return tiktokOAuthPage("TikTok autoritzat", `<p class="ok">La connexió amb @meteo_fontanillas s’ha completat.</p><p>Desa aquests dos valors com a secrets de Cloudflare. No els enviïs pel xat.</p><p><strong>TIKTOK_REFRESH_TOKEN</strong></p><code>${escapeHtml(refreshToken)}</code><p><strong>TIKTOK_OPEN_ID</strong></p><code>${escapeHtml(openId)}</code><p>Quan els hagis desat, pots tancar aquesta pestanya.</p>`);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function oauthEncryptionKey(env) {
  if (!env.ADMIN_TOKEN || String(env.ADMIN_TOKEN).length < 24) throw new Error('Falta la clau de protecció dels tokens OAuth.');
  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`oauth-token-store:${env.ADMIN_TOKEN}`));
  return crypto.subtle.importKey('raw', material, { name:'AES-GCM' }, false, ['encrypt','decrypt']);
}

async function readStoredOAuthToken(provider, env) {
  if (!(await ensureOAuthTokenSchema(env))) return null;
  const row = await env.DB.prepare('SELECT ciphertext,iv,expires_at FROM oauth_tokens WHERE provider = ?').bind(provider).first();
  if (!row) return null;
  const clear = await crypto.subtle.decrypt({ name:'AES-GCM', iv:base64ToBytes(row.iv), additionalData:new TextEncoder().encode(provider) }, await oauthEncryptionKey(env), base64ToBytes(row.ciphertext));
  return { ...JSON.parse(new TextDecoder().decode(clear)), expiresAt:Number(row.expires_at) || 0 };
}

async function storeOAuthToken(provider, value, expiresAt, env) {
  if (!(await ensureOAuthTokenSchema(env))) throw new Error('La base de dades segura de tokens no està disponible.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name:'AES-GCM', iv, additionalData:new TextEncoder().encode(provider) }, await oauthEncryptionKey(env), new TextEncoder().encode(JSON.stringify(value)));
  await env.DB.prepare(`INSERT INTO oauth_tokens(provider,ciphertext,iv,expires_at,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(provider) DO UPDATE SET ciphertext=excluded.ciphertext,iv=excluded.iv,expires_at=excluded.expires_at,updated_at=CURRENT_TIMESTAMP`)
    .bind(provider, bytesToBase64(new Uint8Array(ciphertext)), bytesToBase64(iv), expiresAt || null).run();
}

async function tiktokAccessToken(env) {
  if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET || !env.TIKTOK_REFRESH_TOKEN) throw new Error('Falten les credencials de TikTok.');
  const stored = await readStoredOAuthToken('tiktok', env).catch(() => null);
  if (stored?.accessToken && stored.expiresAt > Math.floor(Date.now() / 1000) + 120) return stored;
  const refreshToken = stored?.refreshToken || String(env.TIKTOK_REFRESH_TOKEN);
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded', 'Cache-Control':'no-cache' },
    body:new URLSearchParams({ client_key:String(env.TIKTOK_CLIENT_KEY), client_secret:String(env.TIKTOK_CLIENT_SECRET), grant_type:'refresh_token', refresh_token:refreshToken }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error || !payload.access_token) throw new Error(cleanText(payload.error_description || payload.message || `TikTok ha respost ${response.status}.`, 500));
  const tokens = { accessToken:String(payload.access_token), refreshToken:String(payload.refresh_token || refreshToken), openId:String(payload.open_id || env.TIKTOK_OPEN_ID || '') };
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(60, Number(payload.expires_in) || 86400);
  await storeOAuthToken('tiktok', tokens, expiresAt, env);
  return { ...tokens, expiresAt };
}

function adminRequestToken(request) {
  const authorization = request.headers.get("Authorization") || "";
  return authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || "";
}

async function adminAuthLimited(request, env) {
  if (!(await ensureAdminAuthSchema(env))) return false;
  const ip = cleanText(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For"), 80);
  if (!ip) return false;
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_auth_attempts WHERE ip = ? AND attempted_at > ?").bind(ip, now - 900).first();
  return (Number(row?.total) || 0) >= 10;
}

async function recordAdminAuthFailure(request, env) {
  if (!(await ensureAdminAuthSchema(env))) return;
  const ip = cleanText(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For"), 80);
  if (!ip) return;
  await env.DB.prepare("INSERT INTO admin_auth_attempts (ip, attempted_at) VALUES (?, ?)").bind(ip, Math.floor(Date.now() / 1000)).run();
}

async function clearAdminAuthFailures(request, env) {
  if (!(await ensureAdminAuthSchema(env))) return;
  const ip = cleanText(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For"), 80);
  if (ip) await env.DB.prepare("DELETE FROM admin_auth_attempts WHERE ip = ?").bind(ip).run();
}

async function adminDatabaseSummary(env) {
  if (!env.DB) return { enabled:false, observations:null, alertEvents:null, contactRequests24h:null, totalRows:null, tableRows:{} };
  const storage = await storageSummary(env).catch(() => ({ enabled:true, storedReadings:0, coverageDays:0 }));
  const usage = await d1RowUsage(env).catch(error => {
    console.error("Admin D1 row usage error", error);
    return { totalRows:null, tableRows:{} };
  });
  let alertEvents = null;
  let latestAlertEvent = null;
  let contactRequests24h = null;
  try {
    await ensureAlertSchema(env);
    const alertsRow = await env.DB.prepare("SELECT COUNT(*) AS total, MAX(created_at) AS latest FROM alert_events").first();
    alertEvents = Number(alertsRow?.total) || 0;
    latestAlertEvent = alertsRow?.latest || null;
  } catch (error) { console.error("Admin alert summary error", error); }
  try {
    await ensureContactSchema(env);
    const contactsRow = await env.DB.prepare("SELECT COUNT(*) AS total FROM contact_rate_limit WHERE sent_at > ?").bind(Math.floor(Date.now() / 1000) - 86400).first();
    contactRequests24h = Number(contactsRow?.total) || 0;
  } catch (error) { console.error("Admin contact summary error", error); }
  return { enabled:true, observations:storage.storedReadings, coverageDays:storage.coverageDays, firstObservation:storage.firstObservation || null, lastObservation:storage.lastObservation || null, alertEvents, latestAlertEvent, contactRequests24h, ...usage };
}

async function d1RowUsage(env) {
  const cacheKey = "d1:row-usage";
  const cached = runtimeStateCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const tablesResult = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  const names = (tablesResult.results || [])
    .map(row => String(row.name || ''))
    .filter(name => /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) && !name.startsWith('sqlite_'));
  const counts = await Promise.all(names.map(async name => {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM "${name}"`).first();
    return [name, Number(row?.total) || 0];
  }));
  const tableRows = Object.fromEntries(counts);
  const value = { totalRows:counts.reduce((total, [, count]) => total + count, 0), tableRows };
  runtimeStateCache.set(cacheKey, { value, expiresAt:Date.now() + STORAGE_SUMMARY_CACHE_MS });
  return value;
}

async function adminSocialSummary(env) {
  const mode = socialAutomationEnabled(env) ? 'automatic' : 'draft';
  const tokenConfigured = Boolean(env.META_SYSTEM_USER_TOKEN);
  const channelCredentials = {
    meta:tokenConfigured,
    facebook:tokenConfigured,
    instagram:tokenConfigured,
    bluesky:Boolean(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD),
    telegram:Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID),
    threads:Boolean(env.THREADS_ACCESS_TOKEN),
    tiktok:Boolean(env.TIKTOK_REFRESH_TOKEN && env.TIKTOK_OPEN_ID && env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET),
    bufferTikTok:bufferTikTokConfigured(env),
    bufferX:bufferXConfigured(env),
    youtube:Boolean(env.YOUTUBE_REFRESH_TOKEN && env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET),
    whatsapp:false,
  };
  if (!(await ensureSocialDraftSchema(env))) return { enabled:false, mode, tokenConfigured, channelCredentials, schedulePlan:socialSchedulePlan(env), pendingDrafts:0, approved:0, published:0, latestCreated:null, recent:[], preflight:null };
  const [counts, recentResult, preflight] = await Promise.all([
    env.DB.prepare(`SELECT
      SUM(CASE WHEN status IN ('draft','review') THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status IN ('approved','partially_published') THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
      MAX(created_at) AS latest FROM social_drafts`).first(),
    env.DB.prepare(`SELECT id,kind,status,channels,title,created_at,scheduled_for
      FROM social_drafts ORDER BY created_at DESC LIMIT 5`).all(),
    ensureOperationsSchema(env).then(ready=>ready?env.DB.prepare("SELECT status,last_checked_at,detail FROM monitor_state WHERE service_key = 'social-preflight' OR service_key LIKE 'social-preflight:%' ORDER BY last_checked_at DESC LIMIT 1").first():null),
  ]);
  return {
    enabled:true,
    mode,
    bufferTikTokAutomationEnabled:bufferTikTokEnabled(env),
    bufferXAutomationEnabled:bufferXEnabled(env),
    schedule:String(env.SOCIAL_AUTO_TIMES || DEFAULT_SOCIAL_AUTO_TIMES),
    schedulePlan:socialSchedulePlan(env),
    tokenConfigured,
    channelCredentials,
    pendingDrafts:Number(counts?.pending) || 0,
    approved:Number(counts?.approved) || 0,
    published:Number(counts?.published) || 0,
    latestCreated:counts?.latest || null,
    preflight:preflight?{status:preflight.status,checkedAt:preflight.last_checked_at,results:(()=>{try{return JSON.parse(preflight.detail||'[]');}catch{return [];}})()}:null,
    recent:(recentResult?.results || []).map(row => ({ ...row, channels:(() => { try { return JSON.parse(row.channels); } catch { return []; } })() })),
  };
}

const SOCIAL_CHANNELS = new Set(['facebook','instagram','bluesky','telegram','threads']);
const SOCIAL_DIAGNOSTIC_CHANNELS = new Set([...SOCIAL_CHANNELS, 'tiktok', 'x']);
const SOCIAL_STATUSES = new Set(['draft','review','approved','partially_published','published','discarded']);

function parseSocialChannels(value) {
  let channels = value;
  if (typeof value === 'string') {
    try { channels = JSON.parse(value); } catch { channels = []; }
  }
  return [...new Set((Array.isArray(channels) ? channels : []).map(channel => String(channel).toLowerCase()).filter(channel => SOCIAL_CHANNELS.has(channel)))];
}

function socialDraftPayload(row, publications = []) {
  return {
    ...row,
    channels:parseSocialChannels(row?.channels),
    publications:(publications || []).map(entry => ({ ...entry, response_code:entry.response_code == null ? null : Number(entry.response_code) })),
  };
}

async function authorizeAdminRequest(request, env) {
  const origin = request.headers.get('Origin') || '*';
  if (origin !== '*' && !ALLOWED_CONTACT_ORIGINS.has(origin)) return { response:json({ error:'Origen no autoritzat' }, 403, 'no-store', 'null') };
  if (!env.ADMIN_TOKEN || String(env.ADMIN_TOKEN).length < 24) return { response:json({ error:'El panell administratiu encara no està configurat.', code:'ADMIN_NOT_CONFIGURED' }, 503, 'no-store', origin) };
  if (await adminAuthLimited(request, env)) return { response:json({ error:'Massa intents. Torna-ho a provar més tard.', code:'ADMIN_RATE_LIMITED' }, 429, 'no-store', origin) };
  if (!(await secureTokenMatch(adminRequestToken(request), String(env.ADMIN_TOKEN)))) {
    await recordAdminAuthFailure(request, env).catch(error => console.error('Admin auth rate limit error', error));
    return { response:json({ error:'Clau d’administració incorrecta.', code:'ADMIN_UNAUTHORIZED' }, 401, 'no-store', origin) };
  }
  await clearAdminAuthFailures(request, env).catch(error => console.error('Admin auth cleanup error', error));
  return { origin };
}

async function adminJsonBody(request, origin) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 20000) throw Object.assign(new Error('La petició és massa gran.'), { status:413, origin });
  try { return await request.json(); }
  catch { throw Object.assign(new Error('El contingut JSON no és vàlid.'), { status:400, origin }); }
}

async function socialPublicationsForDraft(env, draftId) {
  const result = await env.DB.prepare(`SELECT id,draft_id,channel,status,remote_id,response_code,error,created_at,published_at
    FROM social_publications WHERE draft_id = ? ORDER BY created_at DESC`).bind(draftId).all();
  return result?.results || [];
}

async function adminSocialDrafts(request, env, url) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  if (!(await ensureSocialDraftSchema(env))) return json({ error:'La base de dades no està disponible.' }, 503, 'no-store', auth.origin);
  const requestedStatus = cleanText(url.searchParams.get('status'), 30).toLowerCase();
  const status = SOCIAL_STATUSES.has(requestedStatus) ? requestedStatus : '';
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || '0', 10) || 0);
  const statement = status
    ? env.DB.prepare(`SELECT id,dedupe_key,kind,status,channels,title,body,source_url,payload,scheduled_for,created_at FROM social_drafts WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(status, limit + 1, offset)
    : env.DB.prepare(`SELECT id,dedupe_key,kind,status,channels,title,body,source_url,payload,scheduled_for,created_at FROM social_drafts ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(limit + 1, offset);
  const result = await statement.all();
  const rows = result?.results || [];
  const hasMore = rows.length > limit;
  const drafts = await Promise.all(rows.slice(0, limit).map(async row => socialDraftPayload(row, await socialPublicationsForDraft(env, row.id))));
  return json({ ok:true, drafts, limit, offset, hasMore, publicationMode:socialAutomationEnabled(env)?'automatic':'manual-confirmation', schedule:String(env.SOCIAL_AUTO_TIMES || DEFAULT_SOCIAL_AUTO_TIMES) }, 200, 'no-store, private', auth.origin);
}

async function findSocialDraft(env, draftId) {
  return env.DB.prepare(`SELECT id,dedupe_key,kind,status,channels,title,body,source_url,payload,scheduled_for,created_at
    FROM social_drafts WHERE id = ?`).bind(draftId).first();
}

async function adminUpdateSocialDraft(request, env, draftId) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  if (!(await ensureSocialDraftSchema(env))) return json({ error:'La base de dades no està disponible.' }, 503, 'no-store', auth.origin);
  const current = await findSocialDraft(env, draftId);
  if (!current) return json({ error:'No s’ha trobat l’esborrany.' }, 404, 'no-store', auth.origin);
  const body = await adminJsonBody(request, auth.origin);
  const action = cleanText(body.action, 20).toLowerCase();
  if (!['save','approve','discard','restore'].includes(action)) return json({ error:'Acció editorial no vàlida.' }, 400, 'no-store', auth.origin);
  const title = cleanText(body.title ?? current.title, 180);
  const content = cleanText(body.body ?? current.body, 3900);
  const channels = body.channels === undefined ? parseSocialChannels(current.channels) : parseSocialChannels(body.channels);
  if (title.length < 3 || content.length < 20) return json({ error:'El títol o el text són massa curts.' }, 400, 'no-store', auth.origin);
  if (!channels.length) return json({ error:'Selecciona almenys un canal.' }, 400, 'no-store', auth.origin);
  if(current.status==='published'){
    if(action!=='save'||title!==current.title||content!==current.body)return json({error:'Després de publicar només pots afegir canals pendents; el text queda protegit.'},409,'no-store',auth.origin);
    const existing=parseSocialChannels(current.channels);
    if(existing.some(channel=>!channels.includes(channel)))return json({error:'No es poden retirar canals del registre publicat.'},409,'no-store',auth.origin);
    if(!channels.some(channel=>!existing.includes(channel)))return json({error:'Selecciona almenys un canal nou.'},409,'no-store',auth.origin);
    await env.DB.prepare('UPDATE social_drafts SET channels = ? WHERE id = ?').bind(JSON.stringify(channels),draftId).run();
    await invalidateSocialCardCache(draftId, env);
    await refreshSocialDraftPublicationStatus(env,{...current,channels});
    const updated=await findSocialDraft(env,draftId);
    return json({ok:true,action,draft:socialDraftPayload(updated,await socialPublicationsForDraft(env,draftId)),published:true},200,'no-store, private',auth.origin);
  }
  let status = current.status;
  if (action === 'save') status = 'review';
  if (action === 'approve') status = 'approved';
  if (action === 'discard') status = 'discarded';
  if (action === 'restore') status = 'review';
  await env.DB.prepare(`UPDATE social_drafts SET title = ?, body = ?, channels = ?, status = ? WHERE id = ?`)
    .bind(title, content, JSON.stringify(channels), status, draftId).run();
  await invalidateSocialCardCache(draftId, env);
  const updated = await findSocialDraft(env, draftId);
  return json({ ok:true, action, draft:socialDraftPayload(updated, await socialPublicationsForDraft(env, draftId)), published:false }, 200, 'no-store, private', auth.origin);
}

function socialPostText(draft, maxLength = 3900) {
  const parts = [cleanText(draft.title, 180), cleanText(draft.body, 3900), cleanText(draft.source_url, 500)].filter(Boolean);
  const text = parts.join('\n\n');
  const graphemes = Array.from(text);
  return graphemes.length <= maxLength ? text : `${graphemes.slice(0, Math.max(1, maxLength - 1)).join('')}…`;
}

async function socialCardSignature(draftId, env) {
  const secret = String(env.ADMIN_TOKEN || '');
  if (secret.length < 24) throw new Error('Falta una clau segura per signar la targeta social.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`social-card:${draftId}`));
  return [...new Uint8Array(signature)].map(byte=>byte.toString(16).padStart(2,'0')).join('').slice(0,32);
}

async function socialCardUrl(draft, env, format = 'png') {
  const signature = await socialCardSignature(draft.id, env);
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const source = [draft.id, draft.title, draft.body, draft.channels, draft.status].map(value => String(value || '')).join('\u0000');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  const revision = [...new Uint8Array(digest)].slice(0, 6).map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${publicWorkerBaseUrl(env)}/social-card/${draft.id}.${extension}?sig=${signature}&v=${WORKER_VERSION}&r=${revision}`;
}

function publicWorkerBaseUrl(env) {
  const configured = String(env.PUBLIC_WORKER_URL || 'https://fonta-meteo.marcelfonta.workers.dev').trim();
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:') throw new Error();
    return url.origin;
  } catch {
    throw new Error('PUBLIC_WORKER_URL no és una URL HTTPS vàlida.');
  }
}

const SOCIAL_VIDEO_KEY = /^shorts\/(\d{4}-\d{2}-\d{2})\/(morning|evening)\.mp4$/;
const SOCIAL_VIDEO_MAX_BYTES = 30 * 1024 * 1024;
const SOCIAL_VIDEO_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const SOCIAL_CARD_CACHE_PREFIX = 'social-cards/';
const SOCIAL_CARD_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

function socialCardCacheKey(draftId, format = 'png') {
  const id = Number(draftId);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Identificador de targeta social no vàlid.');
  return `${SOCIAL_CARD_CACHE_PREFIX}${id}.${format === 'jpeg' ? 'jpg' : 'png'}`;
}

function socialCardContentType(format = 'png') {
  return format === 'jpeg' ? 'image/jpeg' : 'image/png';
}

async function invalidateSocialCardCache(draftId, env) {
  if (!env.SOCIAL_VIDEO_BUCKET) return;
  await env.SOCIAL_VIDEO_BUCKET.delete([
    socialCardCacheKey(draftId, 'png'),
    socialCardCacheKey(draftId, 'jpeg'),
  ]);
}

function socialVideoKey(value) {
  const key = String(value || '');
  return SOCIAL_VIDEO_KEY.test(key) ? key : '';
}

function socialVideoUploadToken(request) {
  const authorization = String(request.headers.get('Authorization') || '');
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

async function socialVideoSignature(key, expires, env) {
  const secret = String(env.SOCIAL_VIDEO_SIGNING_SECRET || env.ADMIN_TOKEN || '');
  if (secret.length < 24) throw Object.assign(new Error('Falta una clau segura per signar els vídeos socials.'), { status:503 });
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`social-video:${key}:${expires}`));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// Buffer needs a direct URL that stays valid until its scheduled publication.
// The R2 bucket remains private: only this opaque, per-video HMAC URL can read
// the temporary object and cleanup still removes it after three days.
async function bufferVideoSignature(key, env) {
  const secret = String(env.SOCIAL_VIDEO_SIGNING_SECRET || env.ADMIN_TOKEN || '');
  if (secret.length < 24) throw Object.assign(new Error('Falta una clau segura per preparar el vídeo per a Buffer.'), { status:503 });
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`buffer-video:${key}`));
  return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function bufferVideoUrl(key, env) {
  const safeKey = socialVideoKey(key);
  if (!safeKey) throw new Error('La clau del vídeo per a Buffer no és vàlida.');
  return `${publicWorkerBaseUrl(env)}/buffer-video/${safeKey}?sig=${await bufferVideoSignature(safeKey, env)}`;
}

async function socialVideoUrl(key, env, lifetimeSeconds = 1800) {
  const safeKey = socialVideoKey(key);
  if (!safeKey) throw new Error('La clau del vídeo social no és vàlida.');
  const seconds = Math.min(3600, Math.max(60, Number(lifetimeSeconds) || 1800));
  const expires = Math.floor(Date.now() / 1000) + seconds;
  const signature = await socialVideoSignature(safeKey, expires, env);
  return `${publicWorkerBaseUrl(env)}/social-video/${safeKey}?expires=${expires}&sig=${signature}`;
}

async function serveSocialVideo(request, env, key, url) {
  if (!env.SOCIAL_VIDEO_BUCKET) return json({ error:'L’emmagatzematge temporal de vídeo encara no està configurat.' }, 503, 'no-store');
  const safeKey = socialVideoKey(key);
  const expires = Number(url.searchParams.get('expires'));
  if (!safeKey || !Number.isSafeInteger(expires) || expires < Math.floor(Date.now() / 1000) || expires > Math.floor(Date.now() / 1000) + 3600) {
    return json({ error:'L’enllaç temporal del vídeo no és vàlid o ha caducat.' }, 403, 'no-store');
  }
  const expected = await socialVideoSignature(safeKey, expires, env);
  if (!(await secureTokenMatch(String(url.searchParams.get('sig') || ''), expected))) return json({ error:'Signatura de vídeo no vàlida.' }, 403, 'no-store');
  const object = await env.SOCIAL_VIDEO_BUCKET.get(safeKey);
  if (!object) return json({ error:'Vídeo temporal no trobat.' }, 404, 'no-store');
  const headers = new Headers();
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'video/mp4');
  // Meta descarrega el vídeo des dels seus propis servidors mentre el processa.
  // La URL continua sent privada perquè va signada i caduca en una hora.
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', 'inline');
  if (Number.isFinite(Number(object.size))) headers.set('Content-Length', String(object.size));
  if (object.etag) headers.set('ETag', object.etag);
  if (request.method === 'HEAD') return new Response(null, { headers });
  return new Response(object.body, { headers });
}

async function serveBufferVideo(request, env, key, url) {
  if (!env.SOCIAL_VIDEO_BUCKET) return json({ error:'L’emmagatzematge temporal de vídeo encara no està configurat.' }, 503, 'no-store');
  const safeKey = socialVideoKey(key);
  if (!safeKey) return json({ error:'Vídeo temporal no vàlid.' }, 403, 'no-store');
  const expected = await bufferVideoSignature(safeKey, env);
  if (!(await secureTokenMatch(String(url.searchParams.get('sig') || ''), expected))) return json({ error:'Signatura de vídeo no vàlida.' }, 403, 'no-store');
  const object = await env.SOCIAL_VIDEO_BUCKET.get(safeKey);
  if (!object) return json({ error:'Vídeo temporal no trobat.' }, 404, 'no-store');
  const headers = new Headers();
  if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'video/mp4');
  headers.set('Cache-Control', 'private, no-store, max-age=0');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', 'inline');
  if (Number.isFinite(Number(object.size))) headers.set('Content-Length', String(object.size));
  if (object.etag) headers.set('ETag', object.etag);
  if (request.method === 'HEAD') return new Response(null, { headers });
  return new Response(object.body, { headers });
}

async function uploadSocialVideo(request, env, key) {
  if (!env.SOCIAL_VIDEO_BUCKET) return json({ error:'L’emmagatzematge temporal de vídeo encara no està configurat.' }, 503, 'no-store');
  const expected = String(env.SOCIAL_VIDEO_UPLOAD_TOKEN || '');
  if (expected.length < 24) return json({ error:'La càrrega de vídeo encara no està configurada.' }, 503, 'no-store');
  if (!(await secureTokenMatch(socialVideoUploadToken(request), expected))) return json({ error:'No autoritzat.' }, 401, 'no-store');
  const safeKey = socialVideoKey(key);
  if (!safeKey) return json({ error:'Nom de vídeo no permès.' }, 400, 'no-store');
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (!Number.isFinite(contentLength) || contentLength < 1 || contentLength > SOCIAL_VIDEO_MAX_BYTES) return json({ error:'El vídeo ha de tenir entre 1 byte i 30 MB.' }, 413, 'no-store');
  if (!String(request.headers.get('Content-Type') || '').toLowerCase().startsWith('video/mp4')) return json({ error:'Només s’accepten vídeos MP4.' }, 415, 'no-store');
  const video = await request.arrayBuffer();
  if (video.byteLength < 1 || video.byteLength > SOCIAL_VIDEO_MAX_BYTES) return json({ error:'El vídeo ha de tenir entre 1 byte i 30 MB.' }, 413, 'no-store');
  await env.SOCIAL_VIDEO_BUCKET.put(safeKey, video, {
    httpMetadata:{ contentType:'video/mp4', cacheControl:'private, no-store, max-age=0' },
    customMetadata:{ uploadedAt:new Date().toISOString(), source:'youtube-short' },
  });
  return json({ ok:true, key:safeKey, url:await socialVideoUrl(safeKey, env) }, 201, 'no-store');
}

async function cleanupSocialVideos(env, date = new Date()) {
  if (!env.SOCIAL_VIDEO_BUCKET) return { skipped:'binding_missing' };
  const clock = localClockParts(date);
  if (Number(clock.hour) !== 3 || Number(clock.minute) >= STORAGE_INTERVAL_MINUTES) return { skipped:'outside_window' };
  const listing = await env.SOCIAL_VIDEO_BUCKET.list({ prefix:'shorts/', limit:1000 });
  const cutoff = date.getTime() - SOCIAL_VIDEO_RETENTION_MS;
  const keys = listing.objects.filter(object => new Date(object.uploaded).getTime() < cutoff).map(object => object.key);
  if (keys.length) await env.SOCIAL_VIDEO_BUCKET.delete(keys);
  return { scanned:listing.objects.length, deleted:keys.length };
}

async function cleanupSocialCards(env, date = new Date()) {
  if (!env.SOCIAL_VIDEO_BUCKET) return { skipped:'binding_missing' };
  const clock = localClockParts(date);
  if (Number(clock.hour) !== 3 || Number(clock.minute) >= STORAGE_INTERVAL_MINUTES) return { skipped:'outside_window' };
  const listing = await env.SOCIAL_VIDEO_BUCKET.list({ prefix:SOCIAL_CARD_CACHE_PREFIX, limit:1000 });
  const cutoff = date.getTime() - SOCIAL_CARD_RETENTION_MS;
  const keys = listing.objects.filter(object => new Date(object.uploaded).getTime() < cutoff).map(object => object.key);
  if (keys.length) await env.SOCIAL_VIDEO_BUCKET.delete(keys);
  return { scanned:listing.objects.length, deleted:keys.length };
}

function youtubeShortRunKey(localDate, slot) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(localDate || '')) && (slot === 'mati' || slot === 'vespre')
    ? `youtube-short:${localDate}:${slot}` : '';
}

function parseYoutubeShortRunDetail(value) {
  try { return JSON.parse(value || '{}'); } catch { return {}; }
}

async function authorizeYoutubeShortRequest(request, env) {
  const expected=String(env.SOCIAL_VIDEO_UPLOAD_TOKEN || '');
  if (expected.length < 24) return false;
  return secureTokenMatch(socialVideoUploadToken(request), expected);
}

async function updateYoutubeShortRun(env, key, status, detail) {
  const now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO monitor_state
    (service_key,status,consecutive_failures,last_checked_at,last_failure_at,last_success_at,detail)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(service_key) DO UPDATE SET status=excluded.status,
      consecutive_failures=CASE WHEN excluded.status='healthy' THEN 0 ELSE monitor_state.consecutive_failures+1 END,
      last_checked_at=excluded.last_checked_at,
      last_failure_at=CASE WHEN excluded.status='down' THEN excluded.last_failure_at ELSE monitor_state.last_failure_at END,
      last_success_at=CASE WHEN excluded.status='healthy' THEN excluded.last_success_at ELSE monitor_state.last_success_at END,
      detail=excluded.detail`)
    .bind(key,status,status==='healthy'?0:1,now,status==='down'?now:null,status==='healthy'?now:null,JSON.stringify(detail).slice(0,12000)).run();
}

async function youtubeShortRunControl(request, env, localDate, slot) {
  if (!(await authorizeYoutubeShortRequest(request,env))) return json({ error:'No autoritzat.' },401,'no-store');
  if (!(await ensureOperationsSchema(env))) return json({ error:'La coordinació de Shorts no està disponible.' },503,'no-store');
  const key=youtubeShortRunKey(localDate,slot);
  if (!key) return json({ error:'Franja o data de Short no vàlida.' },400,'no-store');
  const body=await request.json().catch(()=>({}));
  const action=cleanText(body.action,20).toLowerCase();
  const source=cleanText(body.source,80) || 'github-actions';
  const previous=await env.DB.prepare('SELECT status,last_checked_at,detail FROM monitor_state WHERE service_key = ?').bind(key).first();
  const detail=parseYoutubeShortRunDetail(previous?.detail);
  if (action === 'start') {
    if (previous?.status === 'healthy' && detail.localDate === localDate && detail.slot === slot) {
      return json({ ok:true, shouldRun:false, reason:'already_completed' },200,'no-store');
    }
    const age=previous?.last_checked_at ? Date.now()-new Date(previous.last_checked_at).getTime() : Infinity;
    if (previous?.status === 'running' && age >= 0 && age < YOUTUBE_SHORT_RUN_STALE_MS) {
      return json({ ok:true, shouldRun:false, reason:'already_running' },200,'no-store');
    }
    await updateYoutubeShortRun(env,key,'running',{ localDate,slot,source,stage:'running' });
    return json({ ok:true, shouldRun:true },200,'no-store');
  }
  if (action === 'complete') {
    await updateYoutubeShortRun(env,key,'healthy',{ localDate,slot,source,stage:'completed' });
    await recordOperationalState(env,'youtube-shorts-scheduler','healthy',{ localDate,slot,source,stage:'completed' });
    return json({ ok:true, completed:true },200,'no-store');
  }
  if (action === 'fail') {
    const failure={
      localDate,slot,source,
      stage:cleanText(body.stage,80) || 'github-workflow',
      responseCode:Number.isFinite(Number(body.responseCode)) ? Number(body.responseCode) : null,
      error:cleanText(body.error || 'GitHub Actions no ha completat la preparació o la pujada del Short.',500),
    };
    await updateYoutubeShortRun(env,key,'down',failure);
    await recordOperationalState(env,'youtube-shorts-scheduler','down',failure);
    await notifyYoutubeShortSchedulerFailure(env,failure);
    return json({ ok:true, failed:true },200,'no-store');
  }
  return json({ error:'Acció de coordinació no vàlida.' },400,'no-store');
}

const BUFFER_TIKTOK_SLOT_TIMES = { morning:{ hour:7, minute:0 }, evening:{ hour:20, minute:30 } };
const BUFFER_TIKTOK_RECOVERY_STARTS = { morning:{ hour:6, minute:20 }, evening:{ hour:19, minute:45 } };
const BUFFER_X_SLOT_TIMES = { morning:{ hour:7, minute:0 }, midday:{ hour:14, minute:0 }, evening:{ hour:20, minute:30 } };
const BUFFER_X_RECOVERY_STARTS = { morning:{ hour:6, minute:20 }, midday:{ hour:14, minute:0 }, evening:{ hour:19, minute:45 } };
const BUFFER_X_RECOVERY_AFTER_MINUTES = 90;
const BUFFER_X_MAX_ATTEMPTS = 4;

function bufferTikTokEnabled(env) {
  return String(env.BUFFER_TIKTOK_AUTOMATION_ENABLED || '').trim().toLowerCase() === 'true';
}

function bufferTikTokConfigured(env) {
  return String(env.BUFFER_API_KEY || '').trim().length >= 24;
}

function bufferXEnabled(env) {
  const configured = String(env.BUFFER_X_AUTOMATION_ENABLED || '').trim().toLowerCase();
  if (configured) return configured === 'true';
  // Compatibilitat amb producció: la mateixa automatització de Buffer que ja
  // manté TikTok activa X quan el canal s'ha connectat expressament.
  return bufferTikTokEnabled(env);
}

function bufferXConfigured(env) {
  return bufferTikTokConfigured(env);
}

function timeZoneOffsetMilliseconds(date) {
  const value = new Intl.DateTimeFormat('en-US', { timeZone:TIME_ZONE, timeZoneName:'longOffset' })
    .formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';
  const match = value.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`No s'ha pogut determinar el fus horari de ${TIME_ZONE}.`);
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === '+' ? 1 : -1) * minutes * 60_000;
}

function bufferTikTokPublishAt(localDate, slot) {
  const target = BUFFER_TIKTOK_SLOT_TIMES[slot];
  if (!target || !/^\d{4}-\d{2}-\d{2}$/.test(String(localDate || ''))) throw new Error('Franja de TikTok no vàlida.');
  const [year, month, day] = localDate.split('-').map(Number);
  const nominalUtc = Date.UTC(year, month - 1, day, target.hour, target.minute);
  return new Date(nominalUtc - timeZoneOffsetMilliseconds(new Date(nominalUtc)));
}

async function bufferGraphql(env, query, variables = {}) {
  const apiKey = String(env.BUFFER_API_KEY || '').trim();
  if (apiKey.length < 24) throw Object.assign(new Error('Falta BUFFER_API_KEY.'), { status:503 });
  const response = await fetch('https://api.buffer.com', {
    method:'POST',
    headers:{ Authorization:`Bearer ${apiKey}`, 'Content-Type':'application/json', Accept:'application/json' },
    body:JSON.stringify({ query, variables }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.errors?.length) {
    const message = cleanText(payload.errors?.[0]?.message || `Buffer ha respost ${response.status}.`, 500);
    throw Object.assign(new Error(message), { status:502, responseCode:response.status });
  }
  return payload.data || {};
}

async function bufferChannel(env, service, label) {
  const account = await bufferGraphql(env, 'query { account { organizations { id } } }');
  const organizations = Array.isArray(account.account?.organizations) ? account.account.organizations : [];
  for (const organization of organizations) {
    const data = await bufferGraphql(env, `query Channels($organizationId: OrganizationId!) {
      channels(input: { organizationId: $organizationId }) { id service isQueuePaused }
    }`, { organizationId:organization.id });
    const channel = (Array.isArray(data.channels) ? data.channels : []).find(item => String(item.service || '').toLowerCase() === service && !item.isQueuePaused);
    if (channel?.id) return { ...channel, organizationId:organization.id };
  }
  throw Object.assign(new Error(`Buffer no ha trobat cap canal de ${label} actiu.`), { status:503 });
}

async function bufferTikTokChannel(env) {
  return bufferChannel(env, 'tiktok', 'TikTok');
}

async function bufferXChannel(env) {
  return bufferChannel(env, 'twitter', 'X');
}

function bufferTikTokCaption(localDate, slot, day = null) {
  const forecast=socialForecastSummary(day,slot);
  const fallback=slot==='morning'?'El temps d’avui':'La previsió de demà';
  return truncateBufferText(`${forecast||fallback} · Sant Celoni. Dades reals i previsió. #meteo #SantCeloni #Montseny`,150);
}

async function createBufferTikTokPost(env, { localDate, slot, draft = false }) {
  if (!env.SOCIAL_VIDEO_BUCKET) throw Object.assign(new Error('L’emmagatzematge temporal de vídeo no està configurat.'), { status:503 });
  const key = `shorts/${localDate}/${slot}.mp4`;
  if (!await env.SOCIAL_VIDEO_BUCKET.head(key)) throw Object.assign(new Error('Encara no hi ha el Short temporal preparat.'), { status:409 });
  const channel = await bufferTikTokChannel(env);
  const publishAt = bufferTikTokPublishAt(localDate, slot);
  if (!draft && publishAt.getTime() - Date.now() < 5 * 60_000) {
    throw Object.assign(new Error('No queda prou marge per programar el TikTok amb seguretat.'), { status:409 });
  }
  const forecast=await socialForecast().catch(()=>[]);
  const input = {
    text:bufferTikTokCaption(localDate, slot, socialForecastFocus(forecast,slot)),
    channelId:channel.id,
    schedulingType:'automatic',
    mode:draft ? 'addToQueue' : 'customScheduled',
    assets:[{ video:{ url:await bufferVideoUrl(key, env), metadata:{ thumbnailOffset:2000 } } }],
    ...(draft ? { saveToDraft:true } : { dueAt:publishAt.toISOString() }),
  };
  const data = await bufferGraphql(env, `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status dueAt } }
      ... on MutationError { message }
    }
  }`, { input });
  const result = data.createPost || {};
  if (result.message || !result.post?.id) throw Object.assign(new Error(cleanText(result.message || 'Buffer no ha creat la publicació.', 500)), { status:502 });
  return { id:String(result.post.id), status:result.post.status || (draft ? 'draft' : 'scheduled'), dueAt:result.post.dueAt || input.dueAt || null, draft };
}

async function bufferTikTokDiagnosticsControl(request, env) {
  if (!(await authorizeYoutubeShortRequest(request, env))) return json({ error:'No autoritzat.' },401,'no-store');
  try {
    await bufferTikTokChannel(env);
    await recordOperationalState(env, 'buffer-tiktok-diagnostics', 'healthy', { stage:'channel_verified', service:'tiktok', queuePaused:false }).catch(()=>{});
    return json({ ok:true, configured:true, service:'tiktok', queuePaused:false },200,'no-store');
  } catch (error) {
    await recordOperationalState(env, 'buffer-tiktok-diagnostics', 'down', { stage:'channel_verification_failed', error:cleanText(error.message,500), responseCode:error.responseCode || null }).catch(()=>{});
    return json({ error:'La connexió de Buffer amb TikTok no és operativa.', detail:cleanText(error.message,500) },error.status || 502,'no-store');
  }
}

async function bufferTikTokScheduleControl(request, env, localDate, slot) {
  if (!(await authorizeYoutubeShortRequest(request, env))) return json({ error:'No autoritzat.' },401,'no-store');
  try {
    const result=await scheduleBufferTikTokSlot(env,localDate,slot);
    return json(result,result.scheduled?201:result.pending?202:200,'no-store');
  } catch (error) {
    return json({ error:'No s’ha pogut programar el TikTok a Buffer.', detail:cleanText(error.message,500) }, error.status || 502,'no-store');
  }
}

async function scheduleBufferTikTokSlot(env, localDate, slot) {
  if (!bufferTikTokEnabled(env)) return { ok:true, skipped:'automation_disabled' };
  if (!(await ensureOperationsSchema(env))) throw Object.assign(new Error('La coordinació de TikTok no està disponible.'),{status:503});
  const safeSlot = slot === 'morning' || slot === 'evening' ? slot : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !safeSlot) throw Object.assign(new Error('Data o franja de TikTok no vàlida.'),{status:400});
  const serviceKey = `buffer-tiktok:${localDate}:${safeSlot}`;
  const previous = await env.DB.prepare('SELECT status,last_checked_at,detail FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  const detail = parseYoutubeShortRunDetail(previous?.detail);
  if (previous?.status === 'healthy' && detail.remoteId) return { ok:true, reused:true, remoteId:detail.remoteId, dueAt:detail.dueAt || null };
  const runningAge = previous?.last_checked_at ? Date.now() - new Date(previous.last_checked_at).getTime() : Infinity;
  if (previous?.status === 'running' && runningAge >= 0 && runningAge < 30 * 60_000) {
    return { ok:true, pending:true, reused:true };
  }
  try {
    await recordOperationalState(env, serviceKey, 'running', { localDate, slot:safeSlot, stage:'scheduling' });
    const result = await createBufferTikTokPost(env, { localDate, slot:safeSlot });
    await recordOperationalState(env, serviceKey, 'healthy', { localDate, slot:safeSlot, remoteId:result.id, dueAt:result.dueAt, stage:'scheduled' });
    return { ok:true, scheduled:true, ...result };
  } catch (error) {
    await recordOperationalState(env, serviceKey, 'down', { localDate, slot:safeSlot, stage:'schedule_failed', error:cleanText(error.message,500), responseCode:error.responseCode || null }).catch(()=>{});
    await notifyBufferTikTokFailure(env, serviceKey, { localDate, slot:safeSlot, error:cleanText(error.message,500), responseCode:error.responseCode || null }).catch(()=>{});
    throw error;
  }
}

export function bufferTikTokRecoverySlot(date = new Date()) {
  const parts=localClockParts(date);
  const current=Number(parts.hour)*60+Number(parts.minute);
  return Object.entries(BUFFER_TIKTOK_RECOVERY_STARTS).find(([slot,start])=>{
    const target=BUFFER_TIKTOK_SLOT_TIMES[slot];
    const startMinutes=start.hour*60+start.minute;
    const latestMinutes=target.hour*60+target.minute-5;
    return current>=startMinutes && current<latestMinutes;
  })?.[0] || null;
}

async function recoverBufferTikTokSchedule(env, date = new Date()) {
  if (!bufferTikTokEnabled(env)) return { skipped:'automation_disabled' };
  const slot=bufferTikTokRecoverySlot(date);
  if (!slot) return { skipped:'outside_window' };
  if (!env.SOCIAL_VIDEO_BUCKET) return { skipped:'binding_missing' };
  const localDate=localIsoDate(date);
  const key=`shorts/${localDate}/${slot}.mp4`;
  if (!await env.SOCIAL_VIDEO_BUCKET.head(key)) return { skipped:'video_not_ready' };
  return scheduleBufferTikTokSlot(env,localDate,slot);
}

function bufferXPublishAt(localDate, slot) {
  const target = BUFFER_X_SLOT_TIMES[slot];
  if (!target || !/^\d{4}-\d{2}-\d{2}$/.test(String(localDate || ''))) throw new Error('Franja d’X no vàlida.');
  const [year, month, day] = localDate.split('-').map(Number);
  const nominalUtc = Date.UTC(year, month - 1, day, target.hour, target.minute);
  return new Date(nominalUtc - timeZoneOffsetMilliseconds(new Date(nominalUtc)));
}

function truncateBufferText(value, maxLength = 280) {
  const graphemes = Array.from(String(value || '').trim());
  return graphemes.length <= maxLength ? graphemes.join('') : `${graphemes.slice(0, Math.max(1, maxLength - 1)).join('')}…`;
}

function bufferXCaption(localDate, slot, draft = null, day = null) {
  if (slot === 'midday' && draft) {
    const body = cleanText(draft.body, 3900).split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
    return truncateBufferText(`Actualització del migdia a Sant Celoni · ${localDate}\n\n${body}\n\n#MeteoFontanillas #SantCeloni`, 280);
  }
  const intro=socialForecastSummary(day,slot)||(slot==='morning'?'Bon dia! El temps d’avui a Sant Celoni.':'Balanç del dia i previsió de demà a Sant Celoni.');
  return truncateBufferText(`${intro}\n\n🎥 Dades reals, evolució i previsió completa al vídeo.\nhttps://meteo.fontanillas.cat/\n\n#MeteoFontanillas #SantCeloni #Montseny`, 280);
}

async function bufferPostState(env, postId) {
  const data = await bufferGraphql(env, `query BufferPost($input: PostInput!) {
    post(input: $input) { id status dueAt sentAt externalLink }
  }`, { input:{ id:String(postId) } });
  return data.post || null;
}

async function bufferXMiddayDraft(env, localDate) {
  if (!(await ensureSocialDraftSchema(env))) return null;
  return env.DB.prepare("SELECT * FROM social_drafts WHERE dedupe_key = ?")
    .bind(`daily:${localDate}:14:00`).first();
}

async function createBufferXPost(env, { localDate, slot, draft = null }) {
  const channel = await bufferXChannel(env);
  const publishAt = bufferXPublishAt(localDate, slot);
  const delay = publishAt.getTime() - Date.now();
  if (delay > 0 && delay < 5 * 60_000) {
    throw Object.assign(new Error('Falten menys de cinc minuts: X es publicarà puntualment al següent cicle.'), { status:425, pending:true });
  }
  let assets;
  if (slot === 'midday') {
    const socialDraft = draft || await bufferXMiddayDraft(env, localDate);
    if (!socialDraft) throw Object.assign(new Error('La targeta meteorològica del migdia encara no està preparada.'), { status:409, pending:true });
    draft = socialDraft;
    assets = [{ image:{ url:await socialCardUrl(socialDraft, env) } }];
  } else {
    if (!env.SOCIAL_VIDEO_BUCKET) throw Object.assign(new Error('L’emmagatzematge temporal de vídeo no està configurat.'), { status:503 });
    const key = `shorts/${localDate}/${slot}.mp4`;
    if (!await env.SOCIAL_VIDEO_BUCKET.head(key)) throw Object.assign(new Error('El vídeo d’X encara no està preparat.'), { status:409, pending:true });
    assets = [{ video:{ url:await bufferVideoUrl(key, env) } }];
  }
  const shareNow = delay <= 0;
  const forecast=slot==='midday'?[]:await socialForecast().catch(()=>[]);
  const input = {
    text:bufferXCaption(localDate, slot, draft, socialForecastFocus(forecast,slot)),
    channelId:channel.id,
    schedulingType:'automatic',
    mode:shareNow ? 'shareNow' : 'customScheduled',
    assets,
    ...(shareNow ? {} : { dueAt:publishAt.toISOString() }),
  };
  const data = await bufferGraphql(env, `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status dueAt sentAt externalLink } }
      ... on MutationError { message }
    }
  }`, { input });
  const result = data.createPost || {};
  if (result.message || !result.post?.id || result.post.status === 'error') {
    throw Object.assign(new Error(cleanText(result.message || 'Buffer no ha creat la publicació d’X.', 500)), { status:502 });
  }
  return {
    id:String(result.post.id), status:result.post.status || (shareNow ? 'sending' : 'scheduled'),
    dueAt:result.post.dueAt || input.dueAt || publishAt.toISOString(), sentAt:result.post.sentAt || null,
    externalLink:result.post.externalLink || null,
  };
}

async function notifyBufferXFailure(env, serviceKey, detail) {
  if (!(await ensureOperationsSchema(env))) return { sent:false,reason:'no_database' };
  const previous=await env.DB.prepare('SELECT last_notified_at FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  const lastNotified=previous?.last_notified_at ? new Date(previous.last_notified_at).getTime() : 0;
  if (lastNotified && Date.now()-lastNotified < 12*60*60*1000) return { sent:false,reason:'recent_notification' };
  const when=new Date().toISOString();
  const result=await sendOperationalEmail(
    env,
    '[Observatori] No s’ha pogut publicar a X amb Buffer',
    `Buffer no ha pogut completar la publicació d’X de ${detail.slot || 'franja desconeguda'} del ${detail.localDate || 'dia desconegut'} després de ${detail.attempts || BUFFER_X_MAX_ATTEMPTS} intents.\n\nHora: ${when}\nResposta: ${detail.responseCode || '—'}\nError: ${cleanText(detail.error || 'Sense detall',500)}\n\nTikTok i la resta de xarxes continuen funcionant de manera independent.`,
    'buffer_x_publish_failed',
  ).catch(error=>({ sent:false,error:cleanText(error.message,300) }));
  if (result.sent) await env.DB.prepare('UPDATE monitor_state SET last_notified_at = ? WHERE service_key = ?').bind(when,serviceKey).run();
  return result;
}

async function scheduleBufferXSlot(env, localDate, slot) {
  if (!bufferXEnabled(env)) return { ok:true, skipped:'automation_disabled' };
  if (!(await ensureOperationsSchema(env))) throw Object.assign(new Error('La coordinació d’X no està disponible.'),{status:503});
  const safeSlot = ['morning','midday','evening'].includes(slot) ? slot : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !safeSlot) throw Object.assign(new Error('Data o franja d’X no vàlida.'),{status:400});
  const serviceKey = `buffer-x:${localDate}:${safeSlot}`;
  const previous = await env.DB.prepare('SELECT status,last_checked_at,detail FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  const detail = parseYoutubeShortRunDetail(previous?.detail);
  const targetTime = bufferXPublishAt(localDate, safeSlot).getTime();
  if (previous?.status === 'healthy' && detail.remoteId) {
    if (Date.now() < targetTime + 2 * 60_000) return { ok:true, reused:true, pending:true, remoteId:detail.remoteId, dueAt:detail.dueAt || null };
    try {
      const remote = await bufferPostState(env, detail.remoteId);
      if (remote?.status === 'sent') {
        const confirmed={ ...detail,stage:'sent',externalLink:remote.externalLink || detail.externalLink || null,sentAt:remote.sentAt || null };
        await recordOperationalState(env, serviceKey, 'healthy', confirmed);
        return { ok:true,reused:true,sent:true,remoteId:detail.remoteId,externalLink:confirmed.externalLink };
      }
      if (remote && remote.status !== 'error') return { ok:true,reused:true,pending:true,remoteId:detail.remoteId,status:remote.status };
      await recordOperationalState(env, serviceKey, 'down', { ...detail,stage:'delivery_failed',error:'Buffer ha marcat la publicació d’X com a error.' });
    } catch (error) {
      return { ok:true,reused:true,pending:true,remoteId:detail.remoteId,verificationError:cleanText(error.message,300) };
    }
  }
  const runningAge = previous?.last_checked_at ? Date.now() - new Date(previous.last_checked_at).getTime() : Infinity;
  if (previous?.status === 'running' && detail.stage !== 'waiting_target' && runningAge >= 0 && runningAge < 10 * 60_000) return { ok:true,pending:true,reused:true };
  const attempts=(Number(detail.attempts)||0)+1;
  try {
    await recordOperationalState(env, serviceKey, 'running', { localDate,slot:safeSlot,attempts,stage:'publishing' });
    const result = await createBufferXPost(env, { localDate,slot:safeSlot });
    await recordOperationalState(env, serviceKey, 'healthy', {
      localDate,slot:safeSlot,attempts,remoteId:result.id,dueAt:result.dueAt,status:result.status,
      externalLink:result.externalLink,stage:result.status === 'sent' ? 'sent' : 'submitted',
    });
    return { ok:true,scheduled:result.status !== 'sent',sent:result.status === 'sent',...result };
  } catch (error) {
    if (error.pending) {
      await recordOperationalState(env, serviceKey, 'running', {
        localDate,slot:safeSlot,attempts:Number(detail.attempts)||0,stage:'waiting_target',reason:cleanText(error.message,300),
      }).catch(()=>{});
      return { ok:true,pending:true,reason:cleanText(error.message,300) };
    }
    const failure={ localDate,slot:safeSlot,attempts,stage:'publish_failed',error:cleanText(error.message,500),responseCode:error.responseCode || null };
    await recordOperationalState(env, serviceKey, 'down', failure).catch(()=>{});
    if (attempts >= BUFFER_X_MAX_ATTEMPTS) await notifyBufferXFailure(env, serviceKey, failure).catch(()=>{});
    throw error;
  }
}

export function bufferXRecoverySlot(date = new Date()) {
  const parts=localClockParts(date);
  const current=Number(parts.hour)*60+Number(parts.minute);
  return Object.entries(BUFFER_X_RECOVERY_STARTS).find(([slot,start])=>{
    const target=BUFFER_X_SLOT_TIMES[slot];
    const startMinutes=start.hour*60+start.minute;
    const latestMinutes=target.hour*60+target.minute+BUFFER_X_RECOVERY_AFTER_MINUTES;
    return current>=startMinutes && current<latestMinutes;
  })?.[0] || null;
}

async function recoverBufferXSchedule(env, date = new Date()) {
  if (!bufferXEnabled(env)) return { skipped:'automation_disabled' };
  const slot=bufferXRecoverySlot(date);
  if (!slot) return { skipped:'outside_window' };
  const localDate=localIsoDate(date);
  if (slot !== 'midday') {
    if (!env.SOCIAL_VIDEO_BUCKET) return { skipped:'binding_missing' };
    if (!await env.SOCIAL_VIDEO_BUCKET.head(`shorts/${localDate}/${slot}.mp4`)) return { skipped:'video_not_ready' };
  } else if (!await bufferXMiddayDraft(env, localDate)) return { skipped:'card_not_ready' };
  return scheduleBufferXSlot(env,localDate,slot);
}

async function bufferXScheduleControl(request, env, localDate, slot) {
  if (!(await authorizeYoutubeShortRequest(request, env))) return json({ error:'No autoritzat.' },401,'no-store');
  try {
    const result=await scheduleBufferXSlot(env,localDate,slot);
    return json(result,result.scheduled?201:result.pending?202:200,'no-store');
  } catch (error) {
    return json({ error:'No s’ha pogut preparar X a Buffer.',detail:cleanText(error.message,500) },error.status || 502,'no-store');
  }
}

async function adminBufferTikTokTest(request, env) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  if (!bufferTikTokConfigured(env)) return json({ error:'Falta la clau de Buffer al Worker.' },503,'no-store',auth.origin);
  const body = await adminJsonBody(request, auth.origin);
  const slot = cleanText(body.slot,20).toLowerCase();
  if (slot !== 'morning' && slot !== 'evening') return json({ error:'Franja de prova de TikTok no vàlida.' },400,'no-store',auth.origin);
  const localDate = localIsoDate(new Date());
  try {
    const result = await createBufferTikTokPost(env, { localDate, slot, draft:true });
    await recordOperationalState(env, 'buffer-tiktok-test', 'healthy', { localDate,slot,remoteId:result.id,stage:'draft_created' }).catch(()=>{});
    return json({ ok:true, message:'Esborrany creat a Buffer: no es publicarà automàticament.', ...result },201,'no-store, private',auth.origin);
  } catch (error) {
    await recordOperationalState(env, 'buffer-tiktok-test', 'down', { localDate,slot,error:cleanText(error.message,500) }).catch(()=>{});
    return json({ error:'La prova amb Buffer no s’ha pogut completar.', detail:cleanText(error.message,500) },error.status || 502,'no-store, private',auth.origin);
  }
}

async function youtubeShortDispatchDiagnosticsControl(request, env) {
  if (!(await authorizeYoutubeShortRequest(request, env))) return json({ error:'No autoritzat.' },401,'no-store');
  const token=String(env.GITHUB_SHORTS_DISPATCH_TOKEN || '');
  const repository=cleanText(env.GITHUB_SHORTS_REPOSITORY || 'marcelfonta/observatori-fontanillas',160);
  if (token.length < 24 || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    await recordOperationalState(env,'youtube-shorts-dispatch-diagnostics','down',{ stage:'not_configured' }).catch(()=>{});
    return json({ error:'El disparador de YouTube no està configurat.' },503,'no-store');
  }
  const response=await fetch(`https://api.github.com/repos/${repository}/actions/workflows/youtube-short-private.yml/dispatches`,{
    method:'POST',
    headers:{ Accept:'application/vnd.github+json', Authorization:`Bearer ${token}`, 'Content-Type':'application/json', 'X-GitHub-Api-Version':'2026-03-10', 'User-Agent':'fonta-meteo-worker' },
    // Aquesta branca no existeix deliberadament: GitHub valida abans el permís
    // Actions: Write i respon 422 sense iniciar cap workflow.
    body:JSON.stringify({ ref:'refs/heads/__fonta_youtube_dispatch_permission_check__', inputs:{ slot:'mati',privacy:'private',schedule_publication:'false' } }),
  });
  const detail=cleanText(await response.text().catch(()=>''),500);
  if (response.status === 422) {
    await recordOperationalState(env,'youtube-shorts-dispatch-diagnostics','healthy',{ stage:'permission_verified',responseCode:response.status }).catch(()=>{});
    return json({ ok:true, permission:'verified', workflowStarted:false },200,'no-store');
  }
  const failure={ stage:'permission_rejected',responseCode:response.status,error:detail || 'GitHub ha rebutjat la comprovació.' };
  await recordOperationalState(env,'youtube-shorts-dispatch-diagnostics','down',failure).catch(()=>{});
  return json({ error:'GitHub no ha validat el permís per iniciar YouTube.', detail:failure.error, responseCode:response.status },502,'no-store');
}

async function dispatchYoutubeShortFallback(env, date = new Date()) {
  const slot=youtubeShortFallbackSlot(date);
  if (!slot) return { skipped:'outside_window' };
  if (!(await ensureOperationsSchema(env))) return { skipped:'no_database' };
  const token=String(env.GITHUB_SHORTS_DISPATCH_TOKEN || '');
  const repository=cleanText(env.GITHUB_SHORTS_REPOSITORY || 'marcelfonta/observatori-fontanillas',160);
  if (token.length < 24 || !/^[\w.-]+\/[\w.-]+$/.test(repository)) {
    const detail={ slot,localDate:localIsoDate(date),stage:'not_configured',error:'Falta el token restringit de GitHub o el repositori no és vàlid.' };
    await recordOperationalState(env,'youtube-shorts-scheduler','down',detail);
    await notifyYoutubeShortSchedulerFailure(env,detail);
    return { skipped:'not_configured' };
  }
  const localDate=localIsoDate(date);
  const key=youtubeShortRunKey(localDate,slot);
  const previous=await env.DB.prepare('SELECT status,last_checked_at,detail FROM monitor_state WHERE service_key = ?').bind(key).first();
  const previousDetail=parseYoutubeShortRunDetail(previous?.detail);
  const age=previous?.last_checked_at ? date.getTime()-new Date(previous.last_checked_at).getTime() : Infinity;
  if (previous?.status === 'healthy' && previousDetail.localDate === localDate && previousDetail.slot === slot) {
    await recordOperationalState(env,'youtube-shorts-scheduler','healthy',{ localDate,slot,stage:'completed' });
    return { skipped:'completed' };
  }
  if (previous?.status === 'running' && age >= 0 && age < YOUTUBE_SHORT_RUN_STALE_MS) {
    await recordOperationalState(env,'youtube-shorts-scheduler','healthy',{ localDate,slot,stage:'in_progress' });
    return { skipped:'in_progress' };
  }
  if (previous?.status === 'dispatching' && age >= 0 && age < YOUTUBE_SHORT_DISPATCH_ACK_MS) {
    await recordOperationalState(env,'youtube-shorts-scheduler','healthy',{ localDate,slot,stage:'awaiting_github' });
    return { skipped:'awaiting_github' };
  }
  const attempt=previousDetail.localDate===localDate && previousDetail.slot===slot ? Math.max(1,Number(previousDetail.attempt)||1)+1 : 1;
  const response=await fetch(`https://api.github.com/repos/${repository}/actions/workflows/youtube-short-private.yml/dispatches`,{
    method:'POST',
    headers:{ Accept:'application/vnd.github+json', Authorization:`Bearer ${token}`, 'Content-Type':'application/json', 'X-GitHub-Api-Version':'2026-03-10', 'User-Agent':'fonta-meteo-worker' },
    body:JSON.stringify({ ref:'main', inputs:{ slot, privacy:'private', schedule_publication:'true' } }),
  });
  if (!response.ok) {
    const detail=cleanText(await response.text().catch(()=>''),500);
    await updateYoutubeShortRun(env,key,'down',{ localDate,slot,stage:'dispatch_failed',responseCode:response.status,error:detail });
    const failure={ localDate,slot,stage:'dispatch_failed',responseCode:response.status,error:detail || 'GitHub ha rebutjat el disparador.' };
    await recordOperationalState(env,'youtube-shorts-scheduler','down',failure);
    await notifyYoutubeShortSchedulerFailure(env,failure);
    throw Object.assign(new Error(`GitHub no ha acceptat la recuperació del Short (${response.status}).`),{ responseCode:response.status });
  }
  await updateYoutubeShortRun(env,key,'dispatching',{ localDate,slot,stage:'dispatched',source:'cloudflare-primary',attempt });
  await recordOperationalState(env,'youtube-shorts-scheduler','healthy',{ localDate,slot,stage:'dispatched',source:'cloudflare-primary',attempt });
  return { dispatched:true,slot,localDate,attempt };
}

function officialAlertColor(level){
  return level==='red'?'#ff625f':level==='orange'?'#ff9f43':'#ffd45a';
}

function meteocatCountyAlertMapSvg(warnings){
  const levels=new Map();
  for(const warning of Array.isArray(warnings)?warnings:[]){
    const countyId=Number(warning?.countyId);
    const level=['yellow','orange','red'].includes(warning?.level)?warning.level:null;
    const rank=Number(warning?.rank)||0;
    if(!Number.isInteger(countyId)||!level)continue;
    const previous=levels.get(countyId);
    if(!previous||rank>previous.rank)levels.set(countyId,{level,rank});
  }
  const paths=CATALONIA_COUNTY_PATHS.map(county=>{
    const warning=levels.get(county.id);
    const focus=county.id===METEOCAT_VALLES_ORIENTAL_ID;
    const fill=warning?officialAlertColor(warning.level):'#173c31';
    return `<path d="${county.path}" fill="${fill}" stroke="${focus?'#f8fff9':'#55796b'}" stroke-width="${focus?'4':'1.2'}" vector-effect="non-scaling-stroke"><title>${escapeHtml(county.name)}${warning?` · ${escapeHtml(warning.level)}`:''}</title></path>`;
  }).join('');
  return `<div class="map-panel"><svg class="county-map" viewBox="0 0 500 420" role="img" aria-label="Mapa de Catalunya amb el nivell màxim d'avís per comarca">${paths}</svg><div class="map-meta"><span>CATALUNYA</span><b>${levels.size} ${levels.size===1?'comarca amb avís':'comarques amb avís'}</b><small>Nivell màxim vigent per comarca</small><div class="legend"><i class="yellow"></i>Groc<i class="orange"></i>Taronja<i class="red"></i>Vermell</div><em>Contorn blanc: Vallès Oriental</em></div></div>`;
}

export function socialCardHtml(draft) {
  let data = {};
  try { data = JSON.parse(draft.payload || '{}'); } catch {}
  const display = (value, suffix = '', digits = 1) => finite(value) === null ? '—' : `${Number(value).toFixed(digits).replace('.',',')}${suffix}`;
  const time = cleanText(String(data.observationUpdated || '').slice(11,16), 10) || '—';
  const date = cleanText(data.localDate || '', 20);
  const temperature = display(data.temperature, '°', 1);
  const feeling = display(data.feelsLike, '°', 1);
  const humidity = display(data.humidity, '%', 0);
  const wind = display(data.windSpeed, ' km/h', 1);
  const gust = display(data.windGust, ' km/h', 1);
  const rain = display(data.rainToday, ' mm', 1);
  const pressure = display(data.pressure, ' hPa', 1);
  const forecast=Array.isArray(data.forecast)?data.forecast:[];
  const today=forecast[0]||{};const tomorrow=forecast[1]||{};const afterTomorrow=forecast[2]||{};
  const isAlert=draft.kind==='official_alert';
  const alertColor=officialAlertColor(data.level);
  const main=isAlert?`<p class="eyebrow alert-eyebrow" style="color:${alertColor}">AVÍS OFICIAL METEOCAT · ${escapeHtml(data.levelLabel||'')}</p><h1 class="alert-title">${escapeHtml(data.phenomenon||'Fenomen meteorològic')}</h1><p class="stamp">Catalunya · detall del Vallès Oriental i Sant Celoni</p>${meteocatCountyAlertMapSvg(data.countyWarnings)}<section class="alert local-alert" style="border-color:${alertColor}"><div><small>DETALL PER A SANT CELONI</small><b style="color:${alertColor}">${escapeHtml(data.levelLabel||'AVÍS')} AL VALLÈS ORIENTAL</b></div><p>${escapeHtml(cleanText(data.description||draft.body,460))}</p></section><p class="advice">És un avís comarcal: consulta Meteocat i segueix les indicacions de Protecció Civil.</p>`:`<div class="headline"><div><p class="eyebrow">${escapeHtml(data.eyebrow||'El temps ara')}</p><h1>Dades reals i previsió per entendre el dia.</h1><p class="stamp">${escapeHtml(date)} · lectura de les ${escapeHtml(time)}</p></div>${finite(today.weatherCode)!==null?`<div class="forecast-symbol">${socialWeatherGlyphSvg(today.weatherCode)}<b>${escapeHtml(today.condition||socialWeatherLabel(today.weatherCode))}</b><span>Predicció d’avui</span></div>`:''}</div>
    <section class="hero"><div><small>Temperatura</small><div class="temp">${escapeHtml(temperature)}</div></div><div class="feels">Sensació tèrmica<b>${escapeHtml(feeling)}</b></div></section>
    <section class="grid"><div class="metric"><span>Humitat</span><b>${escapeHtml(humidity)}</b></div><div class="metric"><span>Vent · ratxa</span><b>${escapeHtml(wind)} · ${escapeHtml(gust)}</b></div></section>
    ${forecast.length?`<section class="forecast"><div><span>AVUI · ${escapeHtml(today.condition||'')}</span><b>${escapeHtml(display(today.max,'°',0))} / ${escapeHtml(display(today.min,'°',0))}</b><small>${escapeHtml(display(today.rainProbability,'% pluja',0))} · ratxa ${escapeHtml(display(today.gust,' km/h',0))}</small></div><div><span>DEMÀ · ${escapeHtml(tomorrow.condition||'')}</span><b>${escapeHtml(display(tomorrow.max,'°',0))} / ${escapeHtml(display(tomorrow.min,'°',0))}</b><small>${escapeHtml(display(tomorrow.rainProbability,'% pluja',0))} · ratxa ${escapeHtml(display(tomorrow.gust,' km/h',0))}</small></div><div><span>DEMÀ PASSAT · ${escapeHtml(afterTomorrow.condition||'')}</span><b>${escapeHtml(display(afterTomorrow.max,'°',0))} / ${escapeHtml(display(afterTomorrow.min,'°',0))}</b><small>${escapeHtml(display(afterTomorrow.rainProbability,'% pluja',0))} · ratxa ${escapeHtml(display(afterTomorrow.gust,' km/h',0))}</small></div></section>`:`<section class="grid"><div class="metric"><span>Pressió</span><b>${escapeHtml(pressure)}</b></div><div class="metric"><span>Pluja acumulada avui</span><b>${escapeHtml(rain)}</b></div></section>`}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden;font-family:Arial,sans-serif;background:#061713;color:#f5faf7}
    body{padding:64px;background:radial-gradient(circle at 84% 10%,#286d55 0,rgba(40,109,85,.18) 28%,transparent 44%),linear-gradient(145deg,#061713,#0b241c 62%,#102e24)}
    .top{display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:20px}.mark{width:92px;height:92px;border-radius:22px;object-fit:cover;border:2px solid rgba(255,255,255,.5)}.brand b{font-size:38px}.brand span{display:block;color:#a9beb5;font-size:21px;margin-top:5px}.live{padding:15px 22px;border:1px solid #5e8d79;border-radius:999px;color:#b9f0ce;font-weight:800;letter-spacing:2px;font-size:18px}
    .headline{display:grid;grid-template-columns:minmax(0,1fr) 205px;gap:30px;align-items:end}.eyebrow{margin:78px 0 20px;color:#8fe0ad;font-weight:800;letter-spacing:4px;font-size:22px;text-transform:uppercase}.alert-eyebrow{margin-top:38px;margin-bottom:12px}h1{margin:0;font-size:64px;line-height:1.02;letter-spacing:-3px;max-width:760px}.alert-title{font-size:54px}.stamp{margin-top:16px;color:#b2c5bc;font-size:22px}.forecast-symbol{align-self:end;padding:18px 16px 16px;border-radius:30px;border:1px solid #477764;background:rgba(7,31,24,.86);text-align:center}.forecast-symbol svg{display:block;width:150px;height:150px;margin:-15px auto -8px}.forecast-symbol b,.forecast-symbol span{display:block}.forecast-symbol b{font-size:21px;color:#f5faf7}.forecast-symbol span{font-size:15px;color:#8fe0ad;margin-top:6px;text-transform:uppercase;letter-spacing:1px}.hero{margin-top:44px;display:flex;align-items:flex-end;justify-content:space-between;padding:42px;border-radius:34px;border:1px solid #416d5b;background:rgba(12,43,33,.84)}.hero small{display:block;color:#9db5aa;font-size:23px;margin-bottom:12px}.temp{font-size:138px;line-height:.86;font-weight:900;letter-spacing:-8px}.feels{text-align:right;font-size:28px;color:#cfe0d8}.feels b{display:block;color:#fff;font-size:42px;margin-top:10px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px}.metric{padding:25px 30px;border-radius:25px;border:1px solid #315c4b;background:rgba(5,28,22,.74)}.metric span{display:block;color:#a8beb4;font-size:21px;margin-bottom:9px}.metric b{font-size:34px}.forecast{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}.forecast div{padding:22px 20px;border-radius:25px;border:1px solid #477764;background:rgba(7,31,24,.92)}.forecast span,.forecast small{display:block;color:#91d8ad;font-size:16px;line-height:1.25}.forecast b{display:block;font-size:31px;margin:11px 0}.map-panel{margin-top:22px;padding:18px 26px;border:1px solid #416d5b;border-radius:30px;background:rgba(5,28,22,.82);display:grid;grid-template-columns:600px 1fr;gap:22px;align-items:center}.county-map{display:block;width:600px;height:410px}.map-meta>span{color:#8fe0ad;font-size:18px;font-weight:800;letter-spacing:3px}.map-meta>b,.map-meta>small,.map-meta>em{display:block}.map-meta>b{font-size:31px;line-height:1.08;margin:12px 0}.map-meta>small{color:#a8beb4;font-size:18px;line-height:1.3}.map-meta>em{color:#dbe9e2;font-size:16px;font-style:normal;margin-top:18px}.legend{display:grid;grid-template-columns:16px 1fr;gap:8px 9px;align-items:center;margin-top:22px;color:#dbe9e2;font-size:17px}.legend i{width:14px;height:14px;border-radius:50%}.legend .yellow{background:#ffd45a}.legend .orange{background:#ff9f43}.legend .red{background:#ff625f}.alert{border:2px solid;border-radius:28px;background:rgba(5,28,22,.88)}.local-alert{margin-top:20px;padding:25px 30px}.local-alert small{display:block;color:#a8beb4;font-size:16px;letter-spacing:2px;margin-bottom:7px}.local-alert b{font-size:31px}.local-alert p{font-size:23px;line-height:1.28;margin:16px 0 0}.advice{font-size:21px;line-height:1.3;color:#d7e5de;margin-top:18px}.footer{position:absolute;left:64px;right:64px;bottom:44px;display:flex;justify-content:space-between;align-items:center;padding-top:19px;border-top:1px solid #315c4b;color:#aec3b9;font-size:19px}.footer strong{color:#8fe0ad}
  </style></head><body>
    <div class="top"><div class="brand"><img class="mark" src="https://meteo.fontanillas.cat/assets/icons/icon-512.png" alt=""><div><b>Meteo Fontanillas</b><span>Observatori meteorològic · Sant Celoni</span></div></div><div class="live">${isAlert?'METEOCAT':'DADA REAL'}</div></div>
    ${main}
    <div class="footer"><span>${isAlert?'Dades: Meteocat · mapa comarcal: ICGC':'Fonts: estació Fontanillas · Open-Meteo'}</span><strong>meteo.fontanillas.cat</strong></div>
  </body></html>`;
}

async function enrichedSocialCardDraft(draft, env) {
  let data = {};
  try { data = JSON.parse(draft.payload || '{}'); } catch {}
  const missing = ['feelsLike','pressure','windGust'].some(key => finite(data[key]) === null);
  if (!missing || !env.DB) return draft;
  const observedAt = cleanText(data.observationUpdated, 32);
  const localDate = cleanText(data.localDate, 20);
  let row = null;
  if (observedAt) {
    row = await env.DB.prepare(`SELECT local_time,temperature,feels_like,humidity,pressure,wind_speed,wind_gust,rain_total
      FROM observations WHERE local_time = ? LIMIT 1`).bind(observedAt).first();
  }
  if (!row && localDate) {
    row = await env.DB.prepare(`SELECT local_time,temperature,feels_like,humidity,pressure,wind_speed,wind_gust,rain_total
      FROM observations WHERE local_date = ? ORDER BY local_time ASC LIMIT 1`).bind(localDate).first();
  }
  if (!row) return draft;
  const historical = {
    observationUpdated:row.local_time,
    temperature:finite(row.temperature), feelsLike:finite(row.feels_like), humidity:finite(row.humidity),
    pressure:finite(row.pressure), windSpeed:finite(row.wind_speed), windGust:finite(row.wind_gust), rainToday:finite(row.rain_total),
  };
  for (const [key, value] of Object.entries(historical)) {
    if ((data[key] === undefined || data[key] === null) && value !== null) data[key] = value;
  }
  return { ...draft, payload:JSON.stringify(data) };
}

async function renderSocialCard(draft, env, format = 'png') {
  if (!env.BROWSER) throw Object.assign(new Error('La generació de targetes encara no està configurada.'), { status:503 });
  const jpeg = format === 'jpeg';
  const rendered = await env.BROWSER.quickAction('screenshot', {
    html:socialCardHtml(draft),
    viewport:{ width:1080,height:1350 },
    ...(jpeg ? { screenshotOptions:{ type:'jpeg', quality:90 } } : {}),
  });
  if (!rendered.ok) {
    const details = cleanText(await rendered.clone().text().catch(() => ''), 500);
    console.error('Social card rendering error', JSON.stringify({ draftId:draft.id, status:rendered.status, details }));
    throw Object.assign(new Error('No s’ha pogut generar la targeta amb dades reals.'), { status:502, details });
  }
  return rendered.arrayBuffer();
}

async function materializeSocialCard(draft, env, format = 'png') {
  if (!env.SOCIAL_VIDEO_BUCKET) return { cached:false, skipped:'binding_missing' };
  const key = socialCardCacheKey(draft.id, format);
  const existing = await env.SOCIAL_VIDEO_BUCKET.get(key);
  if (existing) return { cached:true, key };
  const enriched = await enrichedSocialCardDraft(draft, env);
  const image = await renderSocialCard(enriched, env, format);
  await env.SOCIAL_VIDEO_BUCKET.put(key, image, {
    httpMetadata:{ contentType:socialCardContentType(format), cacheControl:'public, max-age=31536000, immutable' },
    customMetadata:{ draftId:String(draft.id), format, createdAt:new Date().toISOString(), source:'social-card' },
  });
  return { cached:false, key };
}

async function socialCard(request, env, draftId, url, format = 'png') {
  if (!(await ensureSocialDraftSchema(env))) return json({ error:'D1 no configurat.' }, 503);
  const expected = await socialCardSignature(draftId, env);
  if (!(await secureTokenMatch(String(url.searchParams.get('sig') || ''), expected))) return json({ error:'Signatura no vàlida.' }, 403);
  const storedDraft = await findSocialDraft(env, draftId);
  if (!storedDraft) return json({ error:'Targeta no trobada.' }, 404);
  const type = socialCardContentType(format);
  if (env.SOCIAL_VIDEO_BUCKET) {
    const cached = await env.SOCIAL_VIDEO_BUCKET.get(socialCardCacheKey(draftId, format));
    if (cached) {
      const headers = new Headers();
      if (typeof cached.writeHttpMetadata === 'function') cached.writeHttpMetadata(headers);
      headers.set('Content-Type', headers.get('Content-Type') || type);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('X-Content-Type-Options','nosniff');
      headers.set('Access-Control-Allow-Origin','https://meteo.fontanillas.cat');
      if (cached.httpEtag || cached.etag) headers.set('ETag', cached.httpEtag || cached.etag);
      return new Response(cached.body, { headers });
    }
  }
  try {
    const image = await renderSocialCard(await enrichedSocialCardDraft(storedDraft, env), env, format);
    const headers = new Headers();
    headers.set('Content-Type', type); headers.set('Cache-Control','public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Access-Control-Allow-Origin','https://meteo.fontanillas.cat');
    return new Response(image,{headers});
  } catch (error) {
    return json({error:error.message || 'No s’ha pogut generar la targeta amb dades reals.', details:error.details || ''},error.status || 502,'no-store');
  }
}

async function ensureSocialCardUrl(draft,env,format='png'){
  // Meta must receive a stable image response. Rendering before returning the
  // public URL avoids its first fetch racing the Browser screenshot route.
  await materializeSocialCard(draft, env, format);
  return socialCardUrl(draft,env,format);
}

function metaGraphBase(env) {
  const version = cleanText(env.META_GRAPH_VERSION || 'v23.0', 12).replace(/[^a-z0-9.]/gi, '') || 'v23.0';
  return `https://graph.facebook.com/${version}`;
}

async function metaGraphRequest(env, path, { method = 'GET', params = {}, accessToken = env.META_SYSTEM_USER_TOKEN } = {}) {
  if (!accessToken) throw Object.assign(new Error('Falta el token de Meta.'), { status:503 });
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const url = new URL(`${metaGraphBase(env)}/${normalizedPath}`);
  const values = new URLSearchParams();
  Object.entries({ ...params, access_token:accessToken }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') values.set(key, String(value));
  });
  const options = { method, headers:{ Accept:'application/json' } };
  if (method === 'GET') url.search = values.toString();
  else {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    options.body = values.toString();
  }
  const response = await fetch(url.toString(), options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = cleanText(payload.error?.message || `Meta ha respost ${response.status}.`, 500);
    throw Object.assign(new Error(message), { status:502, responseCode:response.status, metaCode:payload.error?.code || null });
  }
  return { payload, responseCode:response.status };
}

async function resolveMetaAssets(env) {
  if (!env.META_SYSTEM_USER_TOKEN) throw Object.assign(new Error('Falta META_SYSTEM_USER_TOKEN.'), { status:503 });
  let pageId = cleanText(env.META_FACEBOOK_PAGE_ID, 80);
  let pageName = cleanText(env.META_FACEBOOK_PAGE_NAME, 120);
  let pageToken = env.META_SYSTEM_USER_TOKEN;
  let instagramId = cleanText(env.META_INSTAGRAM_ACCOUNT_ID, 80);
  let instagramUsername = '';
  if (pageId) {
    const { payload } = await metaGraphRequest(env, pageId, { params:{ fields:'id,name,access_token,instagram_business_account{id,username}' } });
    pageId = String(payload.id || pageId);
    pageName = cleanText(payload.name || pageName, 120);
    pageToken = payload.access_token || pageToken;
    instagramId = String(payload.instagram_business_account?.id || instagramId || '');
    instagramUsername = cleanText(payload.instagram_business_account?.username, 120);
  } else {
    const { payload } = await metaGraphRequest(env, 'me/accounts', { params:{ fields:'id,name,access_token,instagram_business_account{id,username}', limit:100 } });
    const pages = Array.isArray(payload.data) ? payload.data : [];
    const preferred = pageName.toLowerCase();
    const page = pages.find(item => preferred && String(item.name || '').toLowerCase() === preferred)
      || pages.find(item => item.instagram_business_account)
      || pages[0];
    if (!page) throw Object.assign(new Error('Meta no ha retornat cap pàgina. Afegeix META_FACEBOOK_PAGE_ID al Worker.'), { status:503 });
    pageId = String(page.id || '');
    pageName = cleanText(page.name, 120);
    pageToken = page.access_token || pageToken;
    instagramId = String(page.instagram_business_account?.id || instagramId || '');
    instagramUsername = cleanText(page.instagram_business_account?.username, 120);
  }
  return { pageId, pageName, pageToken, instagramId, instagramUsername };
}

async function publishFacebook(draft, env) {
  const assets = await resolveMetaAssets(env);
  if (!assets.pageId) throw Object.assign(new Error('No s’ha identificat la pàgina de Facebook.'), { status:503 });
  const { payload, responseCode } = await metaGraphRequest(env, `${assets.pageId}/photos`, {
    method:'POST', accessToken:assets.pageToken,
    params:{ caption:socialPostText(draft, 6000), url:await ensureSocialCardUrl(draft, env), published:true },
  });
  if (!payload.id) throw Object.assign(new Error('Facebook no ha retornat l’identificador de la publicació.'), { status:502, responseCode });
  return { remoteId:String(payload.id), responseCode };
}

async function publishInstagram(draft, env) {
  const assets = await resolveMetaAssets(env);
  if (!assets.instagramId) throw Object.assign(new Error('La pàgina no té cap compte professional d’Instagram vinculat. També pots afegir META_INSTAGRAM_ACCOUNT_ID.'), { status:503 });
  const imageUrl = await ensureSocialCardUrl(draft, env, 'jpeg');
  const created = await metaGraphRequest(env, `${assets.instagramId}/media`, {
    method:'POST', accessToken:assets.pageToken,
    params:{ image_url:imageUrl, caption:socialPostText(draft, 2200) },
  });
  if (!created.payload.id) throw Object.assign(new Error('Instagram no ha pogut preparar la imatge.'), { status:502, responseCode:created.responseCode });
  let containerReady = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const status = await metaGraphRequest(env, created.payload.id, {
      accessToken:assets.pageToken,
      params:{ fields:'status_code,status' },
    });
    const statusCode = String(status.payload.status_code || '').toUpperCase();
    if (statusCode === 'FINISHED') { containerReady = true; break; }
    if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
      throw Object.assign(new Error(cleanText(status.payload.status || 'Instagram no ha pogut processar la imatge.', 500)), { status:502, responseCode:status.responseCode });
    }
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  if (!containerReady) throw Object.assign(new Error('Instagram encara està processant la imatge. Torna-ho a provar d’aquí a uns segons.'), { status:409, responseCode:created.responseCode });
  const published = await metaGraphRequest(env, `${assets.instagramId}/media_publish`, {
    method:'POST', accessToken:assets.pageToken, params:{ creation_id:created.payload.id },
  });
  if (!published.payload.id) throw Object.assign(new Error('Instagram no ha retornat l’identificador de la publicació.'), { status:502, responseCode:published.responseCode });
  return { remoteId:String(published.payload.id), responseCode:published.responseCode };
}

const SOCIAL_REEL_SLOT = new Set(['morning','evening']);

async function socialReelCaption(localDate, slot) {
  const forecast=await socialForecast().catch(()=>[]);
  const summary=socialForecastSummary(socialForecastFocus(forecast,slot),slot);
  const fallback=slot==='morning'?'El temps d’avui a Sant Celoni.':'Balanç d’avui i previsió de demà a Sant Celoni.';
  return `${summary||fallback}\n\n🎥 Mira les dades reals, l’evolució i la previsió completa.\n📍 Observatori Meteo Fontanillas · Sant Celoni\n🔗 https://meteo.fontanillas.cat/\n\n#MeteoFontanillas #SantCeloni #BaixMontseny #ElTemps #MeteoCatalunya`;
}

async function checkInstagramReel(containerId, accessToken, env) {
  const status = await metaGraphRequest(env, containerId, {
    accessToken,
    params:{ fields:'status_code,status' },
  });
  const statusCode = String(status.payload.status_code || '').toUpperCase();
  const detail = cleanText(status.payload.status || statusCode, 500);
  if (statusCode === 'FINISHED') return status;
  if (statusCode === 'PUBLISHED') return { ...status, alreadyPublished:true };
  if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
    throw Object.assign(new Error(detail || 'Instagram no ha pogut processar el Reel.'), { status:502, responseCode:status.responseCode });
  }
  // Meta recommends polling containers at most once per minute. Returning the
  // pending container lets the explicit manual test resume it later without
  // creating a duplicate Reel or holding a Worker request open for minutes.
  throw Object.assign(new Error(`Instagram encara processa el Reel (${detail || 'sense estat'}). Torna a prémer la prova d’aquí a un minut; no es crearà cap Reel duplicat.`), {
    status:409, reelContainerId:containerId, pending:true, responseCode:status.responseCode,
  });
}

async function publishInstagramReel({ videoUrl, caption, containerId='' }, env) {
  const assets = await resolveMetaAssets(env);
  if (!assets.instagramId) throw Object.assign(new Error('No s’ha trobat el compte professional d’Instagram vinculat.'), { status:503 });
  let reelContainerId = cleanText(containerId, 100);
  let createdResponseCode = null;
  if (!reelContainerId) {
    const created = await metaGraphRequest(env, `${assets.instagramId}/media`, {
      method:'POST', accessToken:assets.pageToken,
      params:{ media_type:'REELS', video_url:videoUrl, caption, share_to_feed:true },
    });
    reelContainerId = cleanText(created.payload.id, 100);
    createdResponseCode = created.responseCode;
    if (!reelContainerId) throw Object.assign(new Error('Instagram no ha pogut preparar el Reel.'), { status:502, responseCode:created.responseCode });
  }
  const state = await checkInstagramReel(reelContainerId, assets.pageToken, env);
  if (state.alreadyPublished) return { remoteId:reelContainerId, responseCode:state.responseCode, alreadyPublished:true };
  const published = await metaGraphRequest(env, `${assets.instagramId}/media_publish`, {
    method:'POST', accessToken:assets.pageToken, params:{ creation_id:reelContainerId },
  });
  if (!published.payload.id) throw Object.assign(new Error('Instagram no ha retornat l’identificador del Reel.'), { status:502, responseCode:published.responseCode });
  return { remoteId:String(published.payload.id), responseCode:published.responseCode || createdResponseCode };
}

async function uploadFacebookHostedReel(uploadUrl, videoUrl, accessToken) {
  let target;
  try { target = new URL(uploadUrl); }
  catch { throw Object.assign(new Error('Facebook no ha retornat una URL de pujada vàlida.'), { status:502 }); }
  if (target.protocol !== 'https:' || target.hostname !== 'rupload.facebook.com') {
    throw Object.assign(new Error('Facebook ha retornat una URL de pujada inesperada.'), { status:502 });
  }
  const response = await fetch(target.toString(), {
    method:'POST',
    headers:{ Accept:'application/json', Authorization:`OAuth ${accessToken}`, file_url:videoUrl },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error || payload.success === false) {
    const message = cleanText(payload.error?.message || `Facebook no ha pogut pujar el vídeo (${response.status}).`, 500);
    throw Object.assign(new Error(message), { status:502, responseCode:response.status, metaCode:payload.error?.code || null });
  }
  return { payload, responseCode:response.status };
}

async function publishFacebookReel({ videoUrl, caption }, env) {
  const assets = await resolveMetaAssets(env);
  if (!assets.pageId) throw Object.assign(new Error('No s’ha identificat la pàgina de Facebook.'), { status:503 });
  const started = await metaGraphRequest(env, `${assets.pageId}/video_reels`, {
    method:'POST', accessToken:assets.pageToken,
    params:{ upload_phase:'start' },
  });
  const videoId = cleanText(started.payload.video_id, 100);
  const uploadUrl = cleanText(started.payload.upload_url, 1000);
  if (!videoId || !uploadUrl) throw Object.assign(new Error('Facebook no ha pogut iniciar la pujada del Reel.'), { status:502, responseCode:started.responseCode });
  await uploadFacebookHostedReel(uploadUrl, videoUrl, assets.pageToken);
  const published = await metaGraphRequest(env, `${assets.pageId}/video_reels`, {
    method:'POST', accessToken:assets.pageToken,
    params:{ upload_phase:'finish', video_id:videoId, video_state:'PUBLISHED', description:caption },
  });
  const remoteId = published.payload.id || published.payload.video_id || published.payload.post_id || videoId;
  if (!remoteId) throw Object.assign(new Error('Facebook no ha retornat l’identificador del Reel.'), { status:502, responseCode:published.responseCode });
  return { remoteId:String(remoteId), responseCode:published.responseCode };
}

async function checkInstagramStory(containerId, accessToken, env) {
  const status = await metaGraphRequest(env, containerId, {
    accessToken,
    params:{ fields:'status_code,status' },
  });
  const statusCode = String(status.payload.status_code || '').toUpperCase();
  const detail = cleanText(status.payload.status || statusCode, 500);
  if (statusCode === 'FINISHED') return status;
  if (statusCode === 'PUBLISHED') return { ...status, alreadyPublished:true };
  if (statusCode === 'ERROR' || statusCode === 'EXPIRED') {
    throw Object.assign(new Error(detail || 'Instagram no ha pogut processar la Story.'), { status:502, responseCode:status.responseCode });
  }
  throw Object.assign(new Error(`Instagram encara processa la Story (${detail || 'sense estat'}). Torna a prémer la prova d’aquí a un minut; no es crearà cap Story duplicada.`), {
    status:409, storyContainerId:containerId, pending:true, responseCode:status.responseCode,
  });
}

async function publishInstagramStory({ videoUrl, containerId='' }, env) {
  const assets = await resolveMetaAssets(env);
  if (!assets.instagramId) throw Object.assign(new Error('No s’ha trobat el compte Business d’Instagram vinculat.'), { status:503 });
  let storyContainerId = cleanText(containerId, 100);
  let createdResponseCode = null;
  if (!storyContainerId) {
    const created = await metaGraphRequest(env, `${assets.instagramId}/media`, {
      method:'POST', accessToken:assets.pageToken,
      params:{ media_type:'STORIES', video_url:videoUrl },
    });
    storyContainerId = cleanText(created.payload.id, 100);
    createdResponseCode = created.responseCode;
    if (!storyContainerId) throw Object.assign(new Error('Instagram no ha pogut preparar la Story.'), { status:502, responseCode:created.responseCode });
  }
  const state = await checkInstagramStory(storyContainerId, assets.pageToken, env);
  if (state.alreadyPublished) return { remoteId:storyContainerId, responseCode:state.responseCode, alreadyPublished:true };
  const published = await metaGraphRequest(env, `${assets.instagramId}/media_publish`, {
    method:'POST', accessToken:assets.pageToken, params:{ creation_id:storyContainerId },
  });
  if (!published.payload.id) throw Object.assign(new Error('Instagram no ha retornat l’identificador de la Story.'), { status:502, responseCode:published.responseCode });
  return { remoteId:String(published.payload.id), responseCode:published.responseCode || createdResponseCode };
}

async function publishFacebookStory({ videoUrl, videoId='', uploadUrl='', stage='' }, env) {
  const assets = await resolveMetaAssets(env);
  if (!assets.pageId) throw Object.assign(new Error('No s’ha identificat la pàgina de Facebook.'), { status:503 });
  let storyVideoId = cleanText(videoId, 100);
  let storyUploadUrl = cleanText(uploadUrl, 1000);
  let storyStage = cleanText(stage, 40);
  try {
    if (!storyVideoId || !storyUploadUrl) {
      const started = await metaGraphRequest(env, `${assets.pageId}/video_stories`, {
        method:'POST', accessToken:assets.pageToken,
        params:{ upload_phase:'start' },
      });
      storyVideoId = cleanText(started.payload.video_id, 100);
      storyUploadUrl = cleanText(started.payload.upload_url, 1000);
      storyStage = 'started';
      if (!storyVideoId || !storyUploadUrl) throw Object.assign(new Error('Facebook no ha pogut iniciar la pujada de la Story.'), { status:502, responseCode:started.responseCode });
    }
    if (storyStage !== 'finish_failed') {
      await uploadFacebookHostedReel(storyUploadUrl, videoUrl, assets.pageToken);
      storyStage = 'finish_failed';
    }
    const published = await metaGraphRequest(env, `${assets.pageId}/video_stories`, {
      method:'POST', accessToken:assets.pageToken,
      params:{ upload_phase:'finish', video_id:storyVideoId, video_state:'PUBLISHED' },
    });
    const remoteId = published.payload.post_id || published.payload.id || storyVideoId;
    if (published.payload.success === false || !remoteId) throw Object.assign(new Error('Facebook no ha confirmat la publicació de la Story.'), { status:502, responseCode:published.responseCode });
    return { remoteId:String(remoteId), responseCode:published.responseCode };
  } catch (error) {
    throw Object.assign(error, {
      facebookStoryVideoId:storyVideoId || undefined,
      facebookStoryUploadUrl:storyUploadUrl || undefined,
      facebookStoryStage:storyStage || undefined,
    });
  }
}

function socialReelRunKey(localDate, slot) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(localDate || '')) && SOCIAL_REEL_SLOT.has(slot)
    ? `social-reels:${localDate}:${slot}` : '';
}

function previousSocialReelOutcomes(detail) {
  try {
    const parsed = typeof detail === 'string' ? JSON.parse(detail) : detail;
    return Array.isArray(parsed?.outcomes) ? parsed.outcomes : [];
  } catch { return []; }
}

async function adminSocialReelTest(request, env) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  const body = await adminJsonBody(request, auth.origin);
  const slot = cleanText(body.slot, 20).toLowerCase();
  if (!SOCIAL_REEL_SLOT.has(slot)) return json({ error:'Franja de Reel no vàlida.' }, 400, 'no-store', auth.origin);
  const localDate = localIsoDate(new Date());
  const result = await publishSocialReelsForSlot(env, localDate, slot, { force:true });
  if (result.alreadyCompleted) return json({ error:'Aquesta prova de Reels ja s’ha completat per a aquesta franja. No es duplicarà.' }, 409, 'no-store', auth.origin);
  if (!result.ok) return json({ error:result.error, outcomes:result.outcomes || [], retryable:result.retryable !== false }, result.status || 502, 'no-store, private', auth.origin);
  return json(result, 200, 'no-store, private', auth.origin);
}

async function publishSocialReelsForSlot(env, localDate, slot, { force=false } = {}) {
  if (!(await ensureOperationsSchema(env))) return { ok:false, status:503, error:'La coordinació de Reels no està disponible.', retryable:false };
  if (!env.SOCIAL_VIDEO_BUCKET) return { ok:false, status:503, error:'L’emmagatzematge temporal de vídeo no està configurat.', retryable:false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(localDate || '')) || !SOCIAL_REEL_SLOT.has(slot)) return { ok:false, status:400, error:'Data o franja de Reel no vàlida.', retryable:false };
  const serviceKey = socialReelRunKey(localDate, slot);
  const previous = await env.DB.prepare('SELECT status,consecutive_failures,detail FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  const previousOutcomes = previousSocialReelOutcomes(previous?.detail);
  if (previous?.status === 'healthy') return { ok:true, localDate, slot, outcomes:previousOutcomes, alreadyCompleted:true, reused:true };
  if (!force && previous?.status === 'down' && Number(previous.consecutive_failures) >= META_VIDEO_AUTOMATIC_MAX_ATTEMPTS) {
    return { ok:false, status:502, error:'Els Reels han esgotat els reintents automàtics.', outcomes:previousOutcomes, retryable:false, blocked:true };
  }
  const key = `shorts/${localDate}/${slot}.mp4`;
  const video = await env.SOCIAL_VIDEO_BUCKET.head(key);
  if (!video) {
    const error=`No hi ha cap Short preparat per al ${slot === 'morning' ? 'matí' : 'vespre'} d’avui.`;
    await recordOperationalState(env, serviceKey, 'down', { localDate, slot, outcomes:previousOutcomes, error });
    return { ok:false, status:409, error, outcomes:previousOutcomes, retryable:true };
  }
  const payload = { videoUrl:await socialVideoUrl(key, env, 3600), caption:await socialReelCaption(localDate, slot) };
  const outcomes = [];
  for (const [channel, publisher] of [['instagram', publishInstagramReel], ['facebook', publishFacebookReel]]) {
    const previousOutcome = previousOutcomes.find(item => item?.channel === channel);
    if (previousOutcome?.ok && previousOutcome?.remoteId) {
      outcomes.push({ channel, ok:true, remoteId:previousOutcome.remoteId, reused:true });
      continue;
    }
    try {
      const result = await publisher(channel === 'instagram'
        ? { ...payload, containerId:previousOutcome?.reelContainerId || '' }
        : payload, env);
      outcomes.push({ channel, ok:true, remoteId:result.remoteId });
    } catch (error) {
      outcomes.push({
        channel, ok:false, pending:Boolean(error.pending), reelContainerId:cleanText(error.reelContainerId, 100) || undefined,
        error:cleanText(error.message, 500), responseCode:error.responseCode || null,
      });
    }
  }
  const failed = outcomes.filter(item => !item.ok);
  const pending = failed.some(item => item.pending);
  await recordOperationalState(env, serviceKey, failed.length ? (pending && failed.every(item => item.pending) ? 'degraded' : 'down') : 'healthy', { localDate, slot, outcomes });
  if (failed.length) return { ok:false, status:pending ? 202 : 502, error:pending ? 'El Reel encara s’està processant o algun canal ha fallat.' : 'La publicació de Reels ha quedat incompleta.', localDate, slot, outcomes, pending, retryable:true };
  return { ok:true, localDate, slot, outcomes };
}

function socialStoryRunKey(localDate, slot) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(localDate || '')) && SOCIAL_REEL_SLOT.has(slot)
    ? `social-stories:${localDate}:${slot}` : '';
}

async function adminSocialStoryTest(request, env) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  const body = await adminJsonBody(request, auth.origin);
  const slot = cleanText(body.slot, 20).toLowerCase();
  if (!SOCIAL_REEL_SLOT.has(slot)) return json({ error:'Franja de Story no vàlida.' }, 400, 'no-store', auth.origin);
  const localDate = localIsoDate(new Date());
  const result = await publishSocialStoriesForSlot(env, localDate, slot, { force:true });
  if (result.alreadyCompleted) return json({ error:'Aquesta prova de Stories ja s’ha completat per a aquesta franja. No es duplicarà.' }, 409, 'no-store', auth.origin);
  if (!result.ok) return json({ error:result.error, outcomes:result.outcomes || [], retryable:result.retryable !== false }, result.status || 502, 'no-store, private', auth.origin);
  return json(result, 200, 'no-store, private', auth.origin);
}

async function publishSocialStoriesForSlot(env, localDate, slot, { force=false } = {}) {
  if (!(await ensureOperationsSchema(env))) return { ok:false, status:503, error:'La coordinació de Stories no està disponible.', retryable:false };
  if (!env.SOCIAL_VIDEO_BUCKET) return { ok:false, status:503, error:'L’emmagatzematge temporal de vídeo no està configurat.', retryable:false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(localDate || '')) || !SOCIAL_REEL_SLOT.has(slot)) return { ok:false, status:400, error:'Data o franja de Story no vàlida.', retryable:false };
  const serviceKey = socialStoryRunKey(localDate, slot);
  const previous = await env.DB.prepare('SELECT status,consecutive_failures,detail FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  const previousOutcomes = previousSocialReelOutcomes(previous?.detail);
  if (previous?.status === 'healthy') return { ok:true, localDate, slot, outcomes:previousOutcomes, alreadyCompleted:true, reused:true };
  if (!force && previous?.status === 'down' && Number(previous.consecutive_failures) >= META_VIDEO_AUTOMATIC_MAX_ATTEMPTS) {
    return { ok:false, status:502, error:'Les Stories han esgotat els reintents automàtics.', outcomes:previousOutcomes, retryable:false, blocked:true };
  }
  const key = `shorts/${localDate}/${slot}.mp4`;
  if (!await env.SOCIAL_VIDEO_BUCKET.head(key)) {
    const error=`No hi ha cap Short preparat per al ${slot === 'morning' ? 'matí' : 'vespre'} d’avui.`;
    await recordOperationalState(env, serviceKey, 'down', { localDate, slot, outcomes:previousOutcomes, error });
    return { ok:false, status:409, error, outcomes:previousOutcomes, retryable:true };
  }
  const payload = { videoUrl:await socialVideoUrl(key, env, 3600) };
  const outcomes = [];
  for (const [channel, publisher] of [['instagram', publishInstagramStory], ['facebook', publishFacebookStory]]) {
    const previousOutcome = previousOutcomes.find(item => item?.channel === channel);
    if (previousOutcome?.ok && previousOutcome?.remoteId) {
      outcomes.push({ channel, ok:true, remoteId:previousOutcome.remoteId, reused:true });
      continue;
    }
    try {
      const input = channel === 'instagram'
        ? { ...payload, containerId:previousOutcome?.storyContainerId || '' }
        : {
            ...payload,
            videoId:previousOutcome?.facebookStoryVideoId || '',
            uploadUrl:previousOutcome?.facebookStoryUploadUrl || '',
            stage:previousOutcome?.facebookStoryStage || '',
          };
      const result = await publisher(input, env);
      outcomes.push({ channel, ok:true, remoteId:result.remoteId });
    } catch (error) {
      outcomes.push({
        channel, ok:false, pending:Boolean(error.pending),
        storyContainerId:cleanText(error.storyContainerId, 100) || undefined,
        facebookStoryVideoId:cleanText(error.facebookStoryVideoId, 100) || undefined,
        facebookStoryUploadUrl:cleanText(error.facebookStoryUploadUrl, 1000) || undefined,
        facebookStoryStage:cleanText(error.facebookStoryStage, 40) || undefined,
        error:cleanText(error.message, 500), responseCode:error.responseCode || null,
      });
    }
  }
  const failed = outcomes.filter(item => !item.ok);
  const pending = failed.some(item => item.pending);
  await recordOperationalState(env, serviceKey, failed.length ? (pending && failed.every(item => item.pending) ? 'degraded' : 'down') : 'healthy', { localDate, slot, outcomes });
  if (failed.length) return { ok:false, status:pending ? 202 : 502, error:pending ? 'La Story encara s’està processant o algun canal ha fallat.' : 'La publicació de Stories ha quedat incompleta.', localDate, slot, outcomes, pending, retryable:true };
  return { ok:true, localDate, slot, outcomes };
}

async function runAutomaticMetaVideos(env, date = new Date()) {
  if (!metaVideoAutomationEnabled(env)) return { processed:false, reason:'automation_disabled' };
  if (!(await ensureOperationsSchema(env))) return { processed:false, reason:'storage_disabled' };
  const localDate=localIsoDate(date);
  const slots=dueMetaVideoSlots(env,date);
  if(!slots.length)return { processed:false, reason:'before_first_slot' };
  const results=[];
  for(const slot of slots){
    const reels=await publishSocialReelsForSlot(env,localDate,slot);
    if(!reels.ok){results.push({slot,stage:'reels',...reels});continue;}
    const stories=await publishSocialStoriesForSlot(env,localDate,slot);
    results.push({slot,stage:stories.ok?'completed':'stories',reels,stories,ok:stories.ok,pending:Boolean(stories.pending),blocked:Boolean(stories.blocked),error:stories.error || null});
  }
  const failed=results.filter(item=>item.ok===false);
  const pending=failed.some(item=>item.pending);
  const status=failed.length?(pending&&failed.every(item=>item.pending)?'degraded':'down'):'healthy';
  await recordOperationalState(env,'meta-video-automatic',status,{ localDate,slots,results });
  for(const item of failed.filter(result=>result.blocked))await notifyMetaVideoBlocked(env,localDate,item);
  return { processed:true,ok:failed.length===0,localDate,slots,results };
}

async function notifyMetaVideoBlocked(env, localDate, result) {
  const stage=result.stage==='stories'?'stories':'reels';
  const serviceKey=stage==='stories'?socialStoryRunKey(localDate,result.slot):socialReelRunKey(localDate,result.slot);
  if(!serviceKey)return { sent:false,reason:'invalid_key' };
  const previous=await env.DB.prepare('SELECT last_notified_at FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  if(previous?.last_notified_at)return { sent:false,reason:'already_notified' };
  const when=new Date().toISOString();
  const sent=await sendOperationalEmail(
    env,
    `[Observatori] Automatització de ${stage === 'stories' ? 'Stories' : 'Reels'} aturada`,
    `La publicació automàtica de ${stage === 'stories' ? 'Stories' : 'Reels'} de la franja ${result.slot || 'desconeguda'} del ${localDate} ha esgotat ${META_VIDEO_AUTOMATIC_MAX_ATTEMPTS} intents.\n\nHora: ${when}\nError: ${cleanText(result.error || 'Sense detall',500)}\n\nEls canals ja completats no es duplicaran en una recuperació manual.`,
    `meta_${stage}_automatic_failed`,
  ).catch(error=>({ sent:false,error:cleanText(error.message,300) }));
  if(sent.sent)await env.DB.prepare('UPDATE monitor_state SET last_notified_at = ? WHERE service_key = ?').bind(when,serviceKey).run();
  return sent;
}

async function threadsGraphRequest(env, path, { method='GET', params={} } = {}) {
  if (!env.THREADS_ACCESS_TOKEN) throw Object.assign(new Error('Falta THREADS_ACCESS_TOKEN.'), { status:503 });
  const url = new URL(`https://graph.threads.net/v1.0/${String(path).replace(/^\/+/, '')}`);
  const values = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') values.set(key, String(value));
  });
  const options = { method, headers:{ Accept:'application/json', Authorization:`Bearer ${env.THREADS_ACCESS_TOKEN}` } };
  if (method === 'GET') url.search = values.toString();
  else {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
    options.body = values.toString();
  }
  const response = await fetch(url.toString(), options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = cleanText(payload.error?.message || `Threads ha respost ${response.status}.`, 500);
    throw Object.assign(new Error(message), { status:502, responseCode:response.status, metaCode:payload.error?.code || null });
  }
  return { payload, responseCode:response.status };
}

async function publishThreads(draft, env) {
  const text = socialPostText(draft, 500);
  const imageUrl=await ensureSocialCardUrl(draft,env);
  const created = await threadsGraphRequest(env, 'me/threads', {
    method:'POST',
    params:{ media_type:'IMAGE', image_url:imageUrl, text, alt_text:'Dades meteorològiques reals i previsió de Meteo Fontanillas' },
  });
  if (!created.payload.id) throw Object.assign(new Error('Threads no ha pogut preparar la publicació.'), { status:502, responseCode:created.responseCode });
  let lastError=null;
  for(let attempt=0;attempt<6;attempt+=1){
    await new Promise(resolve=>setTimeout(resolve,800+attempt*400));
    try{
      const published=await threadsGraphRequest(env,'me/threads_publish',{method:'POST',params:{creation_id:created.payload.id}});
      if(published.payload.id)return {remoteId:String(published.payload.id),responseCode:published.responseCode};
    }catch(error){lastError=error;if(error.metaCode&&!['1','2'].includes(String(error.metaCode)))throw error;}
  }
  throw Object.assign(new Error(lastError?.message||'Threads encara està processant la publicació. Torna-ho a provar.'),{status:502,responseCode:lastError?.responseCode||created.responseCode});
}

async function diagnoseSocialChannel(channel, env) {
  try {
    if (channel === 'facebook' || channel === 'instagram') {
      const assets = await resolveMetaAssets(env);
      if (channel === 'facebook') {
        if (!assets.pageId) throw new Error('No s’ha identificat la pàgina de Facebook.');
        return { channel, ok:true, label:assets.pageName || 'Pàgina identificada', detail:'Token i pàgina operatius. No s’ha publicat res.' };
      }
      if (!assets.instagramId) throw new Error('No s’ha trobat el compte professional d’Instagram vinculat.');
      return { channel, ok:true, label:assets.instagramUsername ? `@${assets.instagramUsername}` : 'Instagram identificat', detail:'Compte professional operatiu. No s’ha publicat res.' };
    }
    if (channel === 'telegram') {
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHANNEL_ID) throw new Error('Falten les credencials de Telegram.');
      const [botResponse, chatResponse] = await Promise.all([
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getMe`),
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getChat?chat_id=${encodeURIComponent(env.TELEGRAM_CHANNEL_ID)}`),
      ]);
      const [bot, chat] = await Promise.all([botResponse.json().catch(() => ({})), chatResponse.json().catch(() => ({}))]);
      if (!botResponse.ok || !bot.ok) throw new Error(bot.description || 'El bot de Telegram no respon.');
      if (!chatResponse.ok || !chat.ok) throw new Error(chat.description || 'El bot no pot accedir al canal.');
      return { channel, ok:true, label:chat.result?.title || env.TELEGRAM_CHANNEL_ID, detail:`Bot @${bot.result?.username || 'configurat'} connectat. No s’ha publicat res.` };
    }
    if (channel === 'bluesky') {
      if (!env.BLUESKY_HANDLE || !env.BLUESKY_APP_PASSWORD) throw new Error('Falten les credencials de Bluesky.');
      const service = String(env.BLUESKY_SERVICE_URL || 'https://bsky.social').replace(/\/$/, '');
      const response = await fetch(`${service}/xrpc/com.atproto.server.createSession`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ identifier:env.BLUESKY_HANDLE, password:env.BLUESKY_APP_PASSWORD }) });
      const session = await response.json().catch(() => ({}));
      if (!response.ok || !session.did) throw new Error(session.message || 'Bluesky no ha pogut iniciar la sessió.');
      return { channel, ok:true, label:`@${session.handle || env.BLUESKY_HANDLE}`, detail:'Contrasenya d’aplicació operativa. No s’ha publicat res.' };
    }
    if (channel === 'threads') {
      const { payload } = await threadsGraphRequest(env, 'me', { params:{ fields:'id,username' } });
      if (!payload.id) throw new Error('Threads no ha retornat el perfil autoritzat.');
      return { channel, ok:true, label:payload.username ? `@${payload.username}` : 'Perfil de Threads identificat', detail:'Token i permisos operatius. No s’ha publicat res.' };
    }
    if (channel === 'tiktok' && bufferTikTokConfigured(env)) {
      await bufferTikTokChannel(env);
      return { channel, ok:true, label:'TikTok connectat a Buffer', detail:`Canal actiu i cua disponible. Automatització ${bufferTikTokEnabled(env)?'activada':'encara desactivada'}. No s’ha publicat res.` };
    }
    if (channel === 'x' && bufferXConfigured(env)) {
      await bufferXChannel(env);
      return { channel, ok:true, label:'X connectat a Buffer', detail:`Canal actiu i cua disponible. Automatització ${bufferXEnabled(env)?'activada':'encara desactivada'}. No s’ha publicat res.` };
    }
    if (channel === 'tiktok') {
      const tokens = await tiktokAccessToken(env);
      const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', { headers:{ Authorization:`Bearer ${tokens.accessToken}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.error?.code !== 'ok' || !payload.data?.user?.open_id) throw new Error(cleanText(payload.error?.message || `TikTok ha respost ${response.status}.`, 500));
      const user = payload.data.user;
      if (env.TIKTOK_OPEN_ID && String(env.TIKTOK_OPEN_ID) !== String(user.open_id)) throw new Error('El token correspon a un compte de TikTok diferent del configurat.');
      return { channel, ok:true, label:user.display_name || 'Compte de TikTok identificat', detail:'Refresh token, compte i permís bàsic operatius. No s’ha publicat res.' };
    }
    throw new Error('Canal desconegut.');
  } catch (error) {
    return { channel, ok:false, label:'Cal revisar', detail:cleanText(error.message, 500) };
  }
}

async function adminSocialDiagnostics(request, env) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  const body = await adminJsonBody(request, auth.origin);
  const requested = cleanText(body.channel || 'all', 20).toLowerCase();
  const channels = requested === 'all' ? [...SOCIAL_DIAGNOSTIC_CHANNELS] : SOCIAL_DIAGNOSTIC_CHANNELS.has(requested) ? [requested] : [];
  if (!channels.length) return json({ error:'Canal de diagnòstic no vàlid.' }, 400, 'no-store', auth.origin);
  const results = await Promise.all(channels.map(channel => diagnoseSocialChannel(channel, env)));
  return json({ ok:results.every(item => item.ok), readOnly:true, checkedAt:new Date().toISOString(), results }, 200, 'no-store, private', auth.origin);
}

async function runDailyIntegrationPreflight(env, date = new Date()) {
  const slot=activeTimeSlot(env.SOCIAL_PREFLIGHT_TIME || DEFAULT_SOCIAL_PREFLIGHT_TIMES,date);
  if(!slot || !(await ensureOperationsSchema(env)))return {checked:false,reason:slot?'storage_disabled':'outside_schedule'};
  const localDate=localIsoDate(date);
  const serviceKey=`social-preflight:${localDate}:${slot}`;
  const previous=await env.DB.prepare('SELECT last_checked_at FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  if(previous?.last_checked_at && localIsoDate(new Date(previous.last_checked_at))===localDate)return {checked:false,reason:'already_checked'};
  const results=await Promise.all([...SOCIAL_DIAGNOSTIC_CHANNELS].map(channel=>diagnoseSocialChannel(channel,env)));
  const failed=results.filter(item=>!item.ok);
  const now=new Date().toISOString();
  const detail=JSON.stringify(results.map(item=>({channel:item.channel,ok:item.ok,detail:cleanText(item.detail,240)})));
  await env.DB.prepare(`INSERT INTO monitor_state (service_key,status,consecutive_failures,last_checked_at,last_failure_at,last_success_at,last_notified_at,detail)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(service_key) DO UPDATE SET status=excluded.status,consecutive_failures=excluded.consecutive_failures,
      last_checked_at=excluded.last_checked_at,last_failure_at=excluded.last_failure_at,last_success_at=excluded.last_success_at,
      last_notified_at=excluded.last_notified_at,detail=excluded.detail`)
    .bind(serviceKey,failed.length?'down':'healthy',failed.length?1:0,now,failed.length?now:null,failed.length?null:now,failed.length?now:null,detail).run();
  if(failed.length)await sendOperationalEmail(env,'[Observatori] Connexió social no preparada',`La comprovació preventiva de les ${slot} ha detectat ${failed.length} canal(s) amb incidències abans de la publicació automàtica.\n\n${failed.map(item=>`${item.channel}: ${item.detail}`).join('\n')}\n\nLa resta de canals podran continuar publicant de manera independent.`,'social_preflight_failed');
  return {checked:true,ok:failed.length===0,results};
}

async function publishTelegram(draft, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHANNEL_ID) throw Object.assign(new Error('Falten les credencials de Telegram.'), { status:503 });
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method:'POST', headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ chat_id:env.TELEGRAM_CHANNEL_ID, photo:await socialCardUrl(draft, env), caption:socialPostText(draft, 1000) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok !== true) throw Object.assign(new Error(payload.description || `Telegram ha respost ${response.status}.`), { status:502, responseCode:response.status });
  return { remoteId:String(payload.result?.message_id || ''), responseCode:response.status };
}

async function publishBluesky(draft, env) {
  if (!env.BLUESKY_HANDLE || !env.BLUESKY_APP_PASSWORD) throw Object.assign(new Error('Falten les credencials de Bluesky.'), { status:503 });
  const service = String(env.BLUESKY_SERVICE_URL || 'https://bsky.social').replace(/\/$/, '');
  const sessionResponse = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
    method:'POST', headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ identifier:env.BLUESKY_HANDLE, password:env.BLUESKY_APP_PASSWORD }),
  });
  const session = await sessionResponse.json().catch(() => ({}));
  if (!sessionResponse.ok || !session.accessJwt || !session.did) throw Object.assign(new Error(session.message || 'Bluesky no ha pogut iniciar la sessió.'), { status:502, responseCode:sessionResponse.status });
  const imageResponse = await fetch(await socialCardUrl(draft, env));
  let imageEmbed = null;
  if (imageResponse.ok) {
    const uploadResponse = await fetch(`${service}/xrpc/com.atproto.repo.uploadBlob`, {
      method:'POST', headers:{ 'Authorization':`Bearer ${session.accessJwt}`, 'Content-Type':'image/png' }, body:await imageResponse.arrayBuffer(),
    });
    const uploaded = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok || !uploaded.blob) throw Object.assign(new Error(uploaded.message || 'Bluesky no ha pogut rebre la imatge.'), { status:502, responseCode:uploadResponse.status });
    imageEmbed = { '$type':'app.bsky.embed.images', images:[{ alt:'Dades meteorològiques reals de l’Observatori Fontanillas', image:uploaded.blob }] };
  } else {
    const details = cleanText(await imageResponse.text().catch(() => ''), 500);
    console.error('Bluesky card fallback', JSON.stringify({ draftId:draft.id, status:imageResponse.status, details }));
  }
  const post = { '$type':'app.bsky.feed.post', text:socialPostText(draft, 300), createdAt:new Date().toISOString(), langs:['ca'] };
  if (imageEmbed) post.embed = imageEmbed;
  const recordResponse = await fetch(`${service}/xrpc/com.atproto.repo.createRecord`, {
    method:'POST', headers:{ 'Authorization':`Bearer ${session.accessJwt}`, 'Content-Type':'application/json' },
    body:JSON.stringify({ repo:session.did, collection:'app.bsky.feed.post', record:post }),
  });
  const record = await recordResponse.json().catch(() => ({}));
  if (!recordResponse.ok || !record.uri) throw Object.assign(new Error(record.message || 'Bluesky no ha pogut crear la publicació.'), { status:502, responseCode:recordResponse.status });
  return { remoteId:String(record.uri), responseCode:recordResponse.status };
}

async function recordSocialPublication(env, draftId, channel, status, details = {}) {
  await env.DB.prepare(`INSERT INTO social_publications (draft_id,channel,status,remote_id,response_code,error,published_at)
    VALUES (?,?,?,?,?,?,?)`)
    .bind(draftId, channel, status, details.remoteId || null, details.responseCode || null, details.error || null, status === 'published' ? new Date().toISOString() : null).run();
}

async function refreshSocialDraftPublicationStatus(env, draft) {
  const publishable = parseSocialChannels(draft.channels);
  const publications = await socialPublicationsForDraft(env, draft.id);
  const published = new Set(publications.filter(item => item.status === 'published').map(item => item.channel));
  const status = publishable.length && publishable.every(channel => published.has(channel)) ? 'published' : published.size ? 'partially_published' : 'approved';
  await env.DB.prepare('UPDATE social_drafts SET status = ? WHERE id = ?').bind(status, draft.id).run();
  return status;
}

async function publishAutomaticSocialDraft(result, env) {
  const draft = result?.draft;
  if (!draft || !socialAutomationEnabled(env)) return { published:false, reason:result?.reason || 'automation_disabled' };
  const configured = {
    facebook:Boolean(env.META_SYSTEM_USER_TOKEN), instagram:Boolean(env.META_SYSTEM_USER_TOKEN),
    bluesky:Boolean(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD),
    telegram:Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID),
    threads:Boolean(env.THREADS_ACCESS_TOKEN),
  };
  const publishers = { facebook:publishFacebook, instagram:publishInstagram, telegram:publishTelegram, bluesky:publishBluesky, threads:publishThreads };
  const previous = await socialPublicationsForDraft(env, draft.id);
  const completed = new Set(previous.filter(item=>item.status==='published').map(item=>item.channel));
  const retryChannels = Array.isArray(result?.retryChannels) ? new Set(result.retryChannels) : null;
  const requested = parseSocialChannels(draft.channels).filter(channel=>!completed.has(channel) && (!retryChannels || retryChannels.has(channel)));
  const unavailable = requested.filter(channel=>!configured[channel]);
  const channels = requested.filter(channel=>configured[channel]);
  const outcomes = [];
  for (const channel of unavailable) {
    const error='El canal no té les credencials necessàries configurades a Cloudflare.';
    await recordSocialPublication(env, draft.id, channel, 'failed', { error, responseCode:503 });
    outcomes.push({ channel, ok:false, error });
  }
  for (const channel of channels) {
    try {
      const details = await publishers[channel](draft, env);
      await recordSocialPublication(env, draft.id, channel, 'published', details);
      outcomes.push({ channel, ok:true });
    } catch (error) {
      await recordSocialPublication(env, draft.id, channel, 'failed', { error:cleanText(error.message,500), responseCode:error.responseCode||null });
      outcomes.push({ channel, ok:false, error:cleanText(error.message,500) });
    }
  }
  await refreshSocialDraftPublicationStatus(env, draft);
  const failed = outcomes.filter(item=>!item.ok);
  const definitiveFailures = failed.filter(item=>{
    const previousAttempts=previous.filter(publication=>publication.channel===item.channel).length;
    return previousAttempts + 1 >= SOCIAL_AUTOMATIC_MAX_ATTEMPTS;
  });
  await recordOperationalState(env,'social-automatic',failed.length?'down':'healthy',{
    draftId:draft.id, localDate:result.localDate || null, slot:result.slot || null,
    published:outcomes.filter(item=>item.ok).map(item=>item.channel),
    failed:failed.map(item=>({channel:item.channel,error:item.error})), skipped:requested.length===0,
  }).catch(()=>{});
  // A provider pot fallar puntualment. El planificador reintenta cada cinc minuts;
  // avisem per correu només quan s'han esgotat tots els intents, per no convertir
  // una recuperació automàtica correcta en una alarma aparentment definitiva.
  if (definitiveFailures.length) await sendOperationalEmail(env, '[Observatori] Publicació automàtica incompleta', `No s’ha pogut publicar l’informe de ${result.localDate || 'avui'} després de ${SOCIAL_AUTOMATIC_MAX_ATTEMPTS} intents a: ${definitiveFailures.map(item=>item.channel).join(', ')}.\n\n${definitiveFailures.map(item=>`${item.channel}: ${item.error}`).join('\n')}`, 'social_publish_failed').catch(error=>console.error('Social notification error',error));
  return { published:outcomes.some(item=>item.ok), outcomes };
}

async function recoverIncompleteDailySocialDraft(env, date = new Date()) {
  if (!socialAutomationEnabled(env) || !(await ensureSocialDraftSchema(env))) return null;
  const localDate = localIsoDate(date);
  const draft = await env.DB.prepare(`SELECT * FROM social_drafts
    WHERE dedupe_key LIKE ? AND status IN ('approved','partially_published')
    ORDER BY id DESC LIMIT 1`).bind(`daily:${localDate}:%`).first();
  if (!draft) return null;
  const publications = await socialPublicationsForDraft(env, draft.id);
  const published = new Set(publications.filter(item=>item.status==='published').map(item=>item.channel));
  const pending = parseSocialChannels(draft.channels).filter(channel=>!published.has(channel));
  if (!pending.length) return null;
  // Avoid retry storms for persistent provider errors while allowing transient card failures to recover.
  const attempts = new Map();
  for (const item of publications) attempts.set(item.channel,(attempts.get(item.channel)||0)+1);
  const retryChannels=pending.filter(channel=>(attempts.get(channel)||0)<SOCIAL_AUTOMATIC_MAX_ATTEMPTS);
  if (!retryChannels.length) return null;
  return { created:false, recovered:true, localDate, slot:'recovery', retryChannels, draft };
}

async function recoverIncompleteOfficialAlertDraft(env) {
  if (!socialAutomationEnabled(env) || !(await ensureSocialDraftSchema(env))) return null;
  const draft=await env.DB.prepare(`SELECT * FROM social_drafts
    WHERE kind = 'official_alert' AND status IN ('approved','partially_published')
      AND created_at >= datetime('now','-4 days')
      AND created_at <= datetime('now','-2 minutes')
    ORDER BY id DESC LIMIT 1`).first();
  if(!draft)return null;
  let payload={};
  try{payload=JSON.parse(draft.payload||'{}');}catch{}
  if(payload.source!=='Meteocat')return null;
  const publications=await socialPublicationsForDraft(env,draft.id);
  const published=new Set(publications.filter(item=>item.status==='published').map(item=>item.channel));
  const attempts=new Map();
  for(const item of publications)attempts.set(item.channel,(attempts.get(item.channel)||0)+1);
  const retryChannels=parseSocialChannels(draft.channels)
    .filter(channel=>!published.has(channel)&&(attempts.get(channel)||0)<SOCIAL_AUTOMATIC_MAX_ATTEMPTS);
  if(!retryChannels.length)return null;
  return {created:false,recovered:true,localDate:String(draft.created_at||'').slice(0,10),slot:'official-alert-recovery',retryChannels,draft};
}

async function adminPublishSocialDraft(request, env, draftId) {
  const auth = await authorizeAdminRequest(request, env);
  if (auth.response) return auth.response;
  if (!(await ensureSocialDraftSchema(env))) return json({ error:'La base de dades no està disponible.' }, 503, 'no-store', auth.origin);
  const draft = await findSocialDraft(env, draftId);
  if (!draft) return json({ error:'No s’ha trobat l’esborrany.' }, 404, 'no-store', auth.origin);
  if (!['approved','partially_published','published'].includes(draft.status)) return json({ error:'Primer cal aprovar l’esborrany. Aprovar no el publica.' }, 409, 'no-store', auth.origin);
  const body = await adminJsonBody(request, auth.origin);
  const channel = cleanText(body.channel, 20).toLowerCase();
  if (!SOCIAL_CHANNELS.has(channel)) return json({ error:'Aquest canal no admet publicació manual des del panell.' }, 400, 'no-store', auth.origin);
  if (!parseSocialChannels(draft.channels).includes(channel)) return json({ error:'El canal no està seleccionat en aquest esborrany.' }, 409, 'no-store', auth.origin);
  const previousAttempts = await socialPublicationsForDraft(env, draftId);
  if (previousAttempts.some(item => item.channel === channel && item.status === 'published')) {
    return json({ error:'Aquest contingut ja s’ha publicat en aquest canal i no es tornarà a enviar.' }, 409, 'no-store', auth.origin);
  }
  try {
    const publishers = { facebook:publishFacebook, instagram:publishInstagram, telegram:publishTelegram, bluesky:publishBluesky, threads:publishThreads };
    const details = await publishers[channel](draft, env);
    await recordSocialPublication(env, draftId, channel, 'published', details);
    const status = await refreshSocialDraftPublicationStatus(env, draft);
    const updated = await findSocialDraft(env, draftId);
    return json({ ok:true, channel, status, draft:socialDraftPayload(updated, await socialPublicationsForDraft(env, draftId)) }, 200, 'no-store, private', auth.origin);
  } catch (error) {
    await recordSocialPublication(env, draftId, channel, 'failed', { error:cleanText(error.message, 500), responseCode:error.responseCode || null }).catch(recordError => console.error('Social publication log error', recordError));
    return json({ error:error.message || 'No s’ha pogut publicar.', channel, retryable:true }, error.status || 502, 'no-store', auth.origin);
  }
}

async function adminPrepareWhatsApp(request, env, draftId) {
  const auth=await authorizeAdminRequest(request,env);
  if(auth.response)return auth.response;
  if(!(await ensureSocialDraftSchema(env)))return json({error:'La base de dades no està disponible.'},503,'no-store',auth.origin);
  const draft=await findSocialDraft(env,draftId);
  if(!draft)return json({error:'No s’ha trobat l’esborrany.'},404,'no-store',auth.origin);
  const imageUrl=await ensureSocialCardUrl(draft,env,'jpeg');
  return json({ok:true,text:socialPostText(draft,3000),imageUrl,channelUrl:'https://whatsapp.com/channel/0029VbD9jmL4CrfajJnZIi25'},200,'no-store, private',auth.origin);
}

async function adminStatus(request, env) {
  const origin = request.headers.get("Origin") || "*";
  if (origin !== "*" && !ALLOWED_CONTACT_ORIGINS.has(origin)) return json({ error:"Origen no autoritzat" }, 403, "no-store", "null");
  if (!env.ADMIN_TOKEN || String(env.ADMIN_TOKEN).length < 24) return json({ error:"El panell administratiu encara no està configurat.", code:"ADMIN_NOT_CONFIGURED" }, 503, "no-store", origin);
  if (await adminAuthLimited(request, env)) return json({ error:"Massa intents. Torna-ho a provar més tard.", code:"ADMIN_RATE_LIMITED" }, 429, "no-store", origin);
  if (!(await secureTokenMatch(adminRequestToken(request), String(env.ADMIN_TOKEN)))) {
    await recordAdminAuthFailure(request, env).catch(error => console.error("Admin auth rate limit error", error));
    return json({ error:"Clau d’administració incorrecta.", code:"ADMIN_UNAUTHORIZED" }, 401, "no-store", origin);
  }
  await clearAdminAuthFailures(request, env).catch(error => console.error("Admin auth cleanup error", error));

  const started = Date.now();
  const [qualityResult, alertsResult, database, social, operations] = await Promise.all([
    quality(env).then(response => response.json()).catch(error => ({ ok:false, status:"unavailable", error:error.message })),
    alerts(env).then(response => response.json()).catch(error => ({ ok:false, status:"unavailable", error:error.message })),
    adminDatabaseSummary(env),
    adminSocialSummary(env).catch(error => ({ enabled:false, mode:'draft', bufferTikTokAutomationEnabled:bufferTikTokEnabled(env), bufferXAutomationEnabled:bufferXEnabled(env), tokenConfigured:Boolean(env.META_SYSTEM_USER_TOKEN), channelCredentials:{ meta:Boolean(env.META_SYSTEM_USER_TOKEN), facebook:Boolean(env.META_SYSTEM_USER_TOKEN), instagram:Boolean(env.META_SYSTEM_USER_TOKEN), bluesky:Boolean(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD), telegram:Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID), threads:Boolean(env.THREADS_ACCESS_TOKEN), bufferTikTok:bufferTikTokConfigured(env), bufferX:bufferXConfigured(env) }, error:error.message, pendingDrafts:0, recent:[] })),
    adminOperationsSummary(env).catch(error => ({ enabled:false, error:error.message })),
  ]);
  return json({
    ok:true,
    generatedAt:new Date().toISOString(),
    latencyMs:Date.now() - started,
    worker:{ version:WORKER_VERSION, built:WORKER_BUILT, environment:env.ENVIRONMENT || "production" },
    station:{ ok:Boolean(qualityResult.ok), status:qualityResult.status || (qualityResult.ok ? "healthy" : "unavailable"), updated:qualityResult.updated || null, ageMinutes:qualityResult.ageMinutes ?? null, latencyMs:qualityResult.latencyMs ?? null, missingFields:qualityResult.missingFields || [], storage:qualityResult.storage || null, sensors:qualityResult.sensors || null },
    alerts:{ ok:Boolean(alertsResult.ok), status:alertsResult.status || "unavailable", active:alertsResult.active ?? null, maxLevel:alertsResult.maxLevel || "unknown", checkedAt:alertsResult.checkedAt || null, latencyMs:alertsResult.latencyMs ?? null },
    database,
    social,
    operations,
    integrations:{
      weatherUnderground:Boolean(env.WU_API_KEY),
      database:Boolean(env.DB),
      contact:Boolean(env.RESEND_API_KEY && env.CONTACT_TO),
      push:Boolean(env.ONESIGNAL_APP_ID && oneSignalApiKey(env)),
      admin:true,
      socialToken:Boolean(env.META_SYSTEM_USER_TOKEN),
      facebook:Boolean(env.META_SYSTEM_USER_TOKEN),
      instagram:Boolean(env.META_SYSTEM_USER_TOKEN),
      bluesky:Boolean(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD),
      telegram:Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID),
      threads:Boolean(env.THREADS_ACCESS_TOKEN),
      bufferTikTok:bufferTikTokConfigured(env),
      bufferX:bufferXConfigured(env),
      youtube:Boolean(env.GITHUB_SHORTS_DISPATCH_TOKEN),
      advancedAI:Boolean(env.AI),
    },
    schedule:{ observationMinutes:STORAGE_INTERVAL_MINUTES, alerts:"cada 5 minuts", social:String(env.SOCIAL_AUTO_TIMES || DEFAULT_SOCIAL_AUTO_TIMES), preflight:String(env.SOCIAL_PREFLIGHT_TIME || DEFAULT_SOCIAL_PREFLIGHT_TIMES), youtube:'06:20,19:45', metaVideo:String(env.META_VIDEO_AUTO_TIMES || DEFAULT_META_VIDEO_AUTO_TIMES), metaVideoEnabled:metaVideoAutomationEnabled(env), timeZone:TIME_ZONE },
  }, 200, "no-store, private", origin);
}

function decodeXml(input = "") {
  const entities = { amp:"&", lt:"<", gt:">", quot:'"', apos:"'", nbsp:" " };
  return String(input)
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match);
}

function xmlTag(block, tag) {
  const match = String(block).match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
}

function plainAlertText(input = "") {
  return decodeXml(input)
    .replace(/<br\s*\/?\s*>/gi, " · ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function alertLevel(text) {
  const value = plainAlertText(text).toLowerCase();
  if (/rojo|vermell|red level|nivel red/.test(value)) return { key:"red", rank:4, label:"Vermell" };
  if (/naranja|taronja|orange/.test(value)) return { key:"orange", rank:3, label:"Taronja" };
  if (/amarillo|groc|yellow/.test(value)) return { key:"yellow", rank:2, label:"Groc" };
  if (/verde|verd|green|sin avisos|sense avisos|no hay avisos|no existen avisos/.test(value)) return { key:"none", rank:1, label:"Sense avís" };
  return { key:"unknown", rank:0, label:"Avís actiu" };
}

function alertPhenomenon(text) {
  const value = plainAlertText(text).toLowerCase();
  const phenomena = [
    [/torment|tempest/, "Tempestes"], [/lluv|pluj|precipit/, "Pluja"],
    [/viento|vent|racha|ratxa/, "Vent"], [/calor|temperatur.*máxima|temperatur.*màxima/, "Calor"],
    [/frío|fred|temperatur.*mínima|temperatur.*mínima/, "Fred"], [/nieve|neu|nevad/, "Neu"],
    [/niebla|boira/, "Boira"], [/costa|oleaje|marítim|maritimo/, "Fenòmens costaners"],
  ];
  return phenomena.find(([pattern]) => pattern.test(value))?.[1] || "Fenomen meteorològic";
}

function alertExpiry(text) {
  const value = plainAlertText(text);
  const matches = [...value.matchAll(/(?:a|hasta|fins(?:\s+a)?)\s+(\d{1,2}):(\d{2})\s+(\d{2})-(\d{2})-(\d{4})(?:[^()]*\(UTC\s*([+-]\d{1,2})\))?/gi)];
  const match = matches.at(-1);
  if (!match) return null;
  const [, hour, minute, day, month, year, offsetText] = match;
  const offset = Number(offsetText || 0);
  const valueUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - offset, Number(minute));
  const parsed = new Date(valueUtc);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseAemetFeed(xml) {
  const blocks = [...String(xml).matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map(match => match[1]);
  const channelUpdated = xmlTag(xml, "lastBuildDate") || xmlTag(xml, "pubDate") || null;
  const noAlertPattern = /sin avisos|sense avisos|no hay avisos|no existen avisos|no se han emitido avisos/i;
  const metadataPattern = /estado completo de avisos|estat complet d.?avisos|fichero tar\.gz|fitxer tar\.gz|contiene todos los avisos|conté tots els avisos/i;
  const entries = blocks.map(block => {
    const title = plainAlertText(xmlTag(block, "title"));
    const description = plainAlertText(xmlTag(block, "description"));
    const combined = `${title} ${description}`;
    const level = alertLevel(combined);
    const expires = alertExpiry(combined);
    const isCurrent = !expires || expires.getTime() > Date.now();
    return {
      title:title || alertPhenomenon(combined),
      description:description.slice(0, 650),
      phenomenon:alertPhenomenon(combined),
      level:level.key,
      levelLabel:level.label,
      rank:level.rank,
      published:xmlTag(block, "pubDate") || null,
      expires:expires?.toISOString() || null,
      // CORRECCIÓ v5.6.1: Sempre forcem el link a la pàgina web oficial d'avisos,
      // ignorant el tag <link> del feed RSS que apunta a un fitxer XML/CAP.
      link: AEMET_PRELITORAL_PAGE,
      active:!noAlertPattern.test(combined) && !metadataPattern.test(combined) && level.key !== "none" && isCurrent,
    };
  });
  const activeAlerts = entries.filter(entry => entry.active).sort((a, b) => b.rank - a.rank);
  const highest = activeAlerts[0] || null;
  return { channelUpdated, activeAlerts, maxLevel:highest?.level || "none" };
}

async function alerts(env) {
  const started = Date.now();
  try {
    const response = await fetch(AEMET_PRELITORAL_FEED, {
      headers:{ "Accept":"application/rss+xml, application/xml, text/xml;q=0.9" },
      cf:{ cacheEverything:true, cacheTtl:300 },
    });
    if (!response.ok) throw new Error(`AEMET RSS ${response.status}`);
    const xml = await response.text();
    if (!/<rss\b/i.test(xml) || !/<channel\b/i.test(xml)) throw new Error("Resposta AEMET no reconeguda");
    const parsed = parseAemetFeed(xml);
    const payload = {
      ok:true,
      version:WORKER_VERSION,
      status:parsed.activeAlerts.length ? "active" : "clear",
      source:{ name:"AEMET", area:"Prelitoral de Barcelona", url:AEMET_PRELITORAL_PAGE, feed:AEMET_PRELITORAL_FEED },
      updated:parsed.channelUpdated,
      checkedAt:new Date().toISOString(),
      latencyMs:Date.now() - started,
      active:parsed.activeAlerts.length,
      maxLevel:parsed.maxLevel,
      alerts:parsed.activeAlerts,
    };
    await recordAlertEvents(payload, env).catch(error=>console.error("Alert history error",error));
    return json(payload, 200, "no-store");
  } catch (error) {
    console.error("AEMET alerts error", error);
    return json({
      ok:false,
      version:WORKER_VERSION,
      status:"unavailable",
      source:{ name:"AEMET", area:"Prelitoral de Barcelona", url:AEMET_PRELITORAL_PAGE, feed:AEMET_PRELITORAL_FEED },
      checkedAt:new Date().toISOString(),
      active:null,
      maxLevel:"unknown",
      alerts:[],
      error:"No s'ha pogut verificar el canal oficial ara mateix.",
    }, 200, "public, max-age=120");
  }
}

async function sendOperationalEmail(env, subject, message, kind) {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) return { sent:false, reason:"email_not_configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${env.RESEND_API_KEY}`, "Content-Type":"application/json", "Idempotency-Key":crypto.randomUUID() },
    body:JSON.stringify({
      from:env.CONTACT_FROM || DEFAULT_CONTACT_FROM,
      to:[env.CONTACT_TO], subject, text:message,
      html:`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#15211d"><h2>${escapeHtml(subject)}</h2><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p><a href="https://meteo.fontanillas.cat/">Obrir l’Observatori</a></p></div>`,
      tags:[{ name:"source", value:"observatori_monitor" },{ name:"event", value:kind }],
    }),
  });
  if (!response.ok) throw new Error(`Resend monitor ${response.status}: ${await response.text()}`);
  return { sent:true };
}

async function notifyYoutubeShortSchedulerFailure(env, detail) {
  if (!(await ensureOperationsSchema(env))) return { sent:false,reason:'no_database' };
  const previous=await env.DB.prepare("SELECT last_notified_at FROM monitor_state WHERE service_key = 'youtube-shorts-scheduler'").first();
  const lastNotified=previous?.last_notified_at ? new Date(previous.last_notified_at).getTime() : 0;
  if (lastNotified && Date.now()-lastNotified < 12*60*60*1000) return { sent:false,reason:'recent_notification' };
  const when=new Date().toISOString();
  const result=await sendOperationalEmail(
    env,
    '[Observatori] No s’ha pogut preparar el YouTube Short',
    `El planificador principal no ha pogut iniciar el Short de ${detail.slot || 'franja desconeguda'}.\n\nHora: ${when}\nFase: ${detail.stage || 'desconeguda'}\nResposta: ${detail.responseCode || '—'}\nError: ${cleanText(detail.error || 'Sense detall',500)}\n\nCal revisar el token GITHUB_SHORTS_DISPATCH_TOKEN o GitHub Actions.`,
    'youtube_short_scheduler_failed',
  ).catch(error=>({ sent:false,error:cleanText(error.message,300) }));
  if (result.sent) await env.DB.prepare("UPDATE monitor_state SET last_notified_at = ? WHERE service_key = 'youtube-shorts-scheduler'").bind(when).run();
  return result;
}

async function notifyBufferTikTokFailure(env, serviceKey, detail) {
  if (!(await ensureOperationsSchema(env))) return { sent:false,reason:'no_database' };
  const previous=await env.DB.prepare('SELECT last_notified_at FROM monitor_state WHERE service_key = ?').bind(serviceKey).first();
  const lastNotified=previous?.last_notified_at ? new Date(previous.last_notified_at).getTime() : 0;
  if (lastNotified && Date.now()-lastNotified < 12*60*60*1000) return { sent:false,reason:'recent_notification' };
  const when=new Date().toISOString();
  const result=await sendOperationalEmail(
    env,
    '[Observatori] No s’ha pogut programar el TikTok a Buffer',
    `Buffer no ha pogut preparar el vídeo de ${detail.slot || 'franja desconeguda'} del ${detail.localDate || 'dia desconegut'}.\n\nHora: ${when}\nResposta: ${detail.responseCode || '—'}\nError: ${cleanText(detail.error || 'Sense detall',500)}\n\nYouTube es controla per separat; cal revisar Buffer abans del següent horari.`,
    'buffer_tiktok_schedule_failed',
  ).catch(error=>({ sent:false,error:cleanText(error.message,300) }));
  if (result.sent) await env.DB.prepare('UPDATE monitor_state SET last_notified_at = ? WHERE service_key = ?').bind(when,serviceKey).run();
  return result;
}

async function monitorWeatherUnderground(env, capturePromise) {
  const now = new Date().toISOString();
  let previous = null;
  if (await ensureOperationsSchema(env)) previous = await env.DB.prepare("SELECT * FROM monitor_state WHERE service_key = 'weather-underground'").first();
  try {
    const result = await capturePromise;
    const wasDown = previous?.status === "down" && Boolean(previous?.last_notified_at);
    if (env.DB) await env.DB.prepare(`INSERT INTO monitor_state
      (service_key,status,consecutive_failures,last_checked_at,last_success_at,detail)
      VALUES ('weather-underground','healthy',0,?,?,NULL)
      ON CONFLICT(service_key) DO UPDATE SET status='healthy', consecutive_failures=0,
      last_checked_at=excluded.last_checked_at, last_success_at=excluded.last_success_at, detail=NULL`)
      .bind(now, now).run();
    if (wasDown) await sendOperationalEmail(env, "[Observatori] Weather Underground torna a funcionar", `El servei s’ha recuperat a les ${now}. La lectura en directe torna a ser la font principal.`, "weather_recovered");
    return result;
  } catch (error) {
    const failures = (Number(previous?.consecutive_failures) || 0) + 1;
    const lastNotified = previous?.last_notified_at ? new Date(previous.last_notified_at).getTime() : 0;
    const shouldNotify = failures >= 3 && (!lastNotified || Date.now() - lastNotified >= 6 * 60 * 60 * 1000);
    if (env.DB) await env.DB.prepare(`INSERT INTO monitor_state
      (service_key,status,consecutive_failures,last_checked_at,last_failure_at,last_notified_at,detail)
      VALUES ('weather-underground','down',?,?,?,?,?)
      ON CONFLICT(service_key) DO UPDATE SET status='down', consecutive_failures=excluded.consecutive_failures,
      last_checked_at=excluded.last_checked_at, last_failure_at=excluded.last_failure_at,
      last_notified_at=COALESCE(excluded.last_notified_at,monitor_state.last_notified_at), detail=excluded.detail`)
      .bind(failures, now, now, shouldNotify ? now : null, cleanText(error.message, 500)).run();
    if (shouldNotify) await sendOperationalEmail(env, "[Observatori] Weather Underground no respon", `S’han produït ${failures} comprovacions fallides consecutives.\n\nHora: ${now}\nError: ${cleanText(error.message, 500)}\n\nLa web mostrarà l’última lectura fiable de D1 i indicarà clarament el mode degradat.`, "weather_down");
    throw error;
  }
}

async function meteoAI(request, env) {
  const origin = request.headers.get("Origin") || "*";
  if (origin !== "*" && !ALLOWED_CONTACT_ORIGINS.has(origin)) return json({ error:"Origen no autoritzat" }, 403, "no-store", "null");
  if (!env.AI) return json({ error:"Meteo IA avançada no configurada" }, 503, "no-store", origin);
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 24000) return json({ error:"Consulta massa gran" }, 413, "no-store", origin);
  let body;
  try { body = await request.json(); } catch { return json({ error:"Consulta no vàlida" }, 400, "no-store", origin); }
  const question = cleanText(body.question, 240);
  if (question.length < 3) return json({ error:"Escriu una pregunta meteorològica" }, 400, "no-store", origin);
  if (await ensureOperationsSchema(env)) {
    const ip = cleanText(request.headers.get("CF-Connecting-IP") || "anonymous", 100);
    const ipHash = await sha256Text(`meteo-ai:${ip}`);
    const now = Math.floor(Date.now() / 1000);
    const row = await env.DB.prepare("SELECT COUNT(*) AS total FROM ai_rate_limit WHERE ip_hash = ? AND asked_at > ?").bind(ipHash, now - 3600).first();
    if ((Number(row?.total) || 0) >= 30) return json({ error:"Massa consultes. Torna-ho a provar més tard." }, 429, "no-store", origin);
    await env.DB.prepare("INSERT INTO ai_rate_limit (ip_hash,asked_at) VALUES (?,?)").bind(ipHash, now).run();
  }
  const rawContext=body.context&&typeof body.context==='object'?body.context:{};
  const context=JSON.stringify({current:rawContext.current||null,forecast:rawContext.forecast||null,alerts:rawContext.alerts||null,environment:rawContext.environment||null,historySummary:rawContext.historySummary||rawContext.history||null,conversation:rawContext.conversation||null}).slice(0,18000);
  const system=`Ets Meteo IA, l’assistent expert de l’Observatori Fontanillas de Sant Celoni. Respon sempre en català clar, natural i útil, en un màxim de 180 paraules. Entén errades ortogràfiques, frases incompletes i preguntes quotidianes molt senzilles. Dona primer una resposta directa i després una explicació breu. Si és una pregunta meteorològica general, respon amb coneixement científic encara que no depengui de les dades locals. Si pregunta per valors actuals, prediccions o avisos, prioritza el context verificat, indica el període utilitzat i diferencia observació de previsió. Pots donar consells pràctics prudents —paraigua, roba o activitat exterior—, però no presentis una predicció com una certesa. Si una dada concreta falta, explica què sí que pots concloure amb les dades disponibles en lloc d’aturar-te amb un “no ho trobo”. No inventis valors, fonts ni alertes. En emergències remet a Meteocat, AEMET, Protecció Civil i 112.`;
  const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages:[{role:"system",content:system},{role:"user",content:`Context verificat (JSON): ${context}\n\nPregunta: ${question}`}], max_tokens:520, temperature:0.2 });
  const textAnswer = cleanText(typeof result === "string" ? result : result?.response || result?.choices?.[0]?.message?.content, 3000);
  if (!textAnswer) return json({ error:"La IA no ha generat cap resposta" }, 502, "no-store", origin);
  return json({ title:"Resposta de Meteo IA", body:textAnswer, facts:[], sources:[{ label:"Meteo IA", detail:"Cloudflare Workers AI · Llama 3.3 70B" }] }, 200, "no-store", origin);
}

async function contact(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (!ALLOWED_CONTACT_ORIGINS.has(origin)) return json({ error:"Origen no autoritzat" }, 403, "no-store", origin || "null");
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) return json({ error:"El servei de contacte encara no està configurat." }, 503, "no-store", origin);
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > 20000) return json({ error:"El missatge és massa gran." }, 413, "no-store", origin);
  let body;
  try { body = await request.json(); }
  catch { return json({ error:"El formulari no és vàlid." }, 400, "no-store", origin); }
  if (cleanText(body.website, 200)) return json({ ok:true }, 200, "no-store", origin);
  const startedAt = Number(body.startedAt);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 2500 || elapsed > 720000) return json({ error:"Recarrega el formulari i torna-ho a provar." }, 400, "no-store", origin);
  const name = cleanText(body.name, 80);
  const email = cleanText(body.email, 254).toLowerCase();
  const topic = cleanText(body.topic, 80);
  const message = cleanText(body.message, 3000);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (name.length < 2) return json({ error:"Indica un nom vàlid." }, 400, "no-store", origin);
  if (!emailPattern.test(email)) return json({ error:"Indica un correu de resposta vàlid." }, 400, "no-store", origin);
  if (!CONTACT_TOPICS.has(topic)) return json({ error:"Selecciona un motiu de contacte." }, 400, "no-store", origin);
  if (message.length < 20) return json({ error:"El missatge ha de tenir com a mínim 20 caràcters." }, 400, "no-store", origin);
  if (body.consent !== true) return json({ error:"Cal acceptar l'ús de les dades per poder respondre." }, 400, "no-store", origin);
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "";
  try {
    const rate = await checkContactRateLimit(env, clientIp, email);
    if (rate.limited) return json({ error:"Massa sol·licituds. Torna-ho a provar més tard." }, 429, "no-store", origin);
  } catch (error) {
    console.error("Rate limit check error", error);
  }
  const sentAt = new Intl.DateTimeFormat("ca-ES", { dateStyle:"long", timeStyle:"short", timeZone:TIME_ZONE }).format(new Date());
  const text = `Nou missatge des de meteo.fontanillas.cat\n\nNom: ${name}\nCorreu de resposta: ${email}\nMotiu: ${topic}\nData: ${sentAt}\n\nMissatge:\n${message}`;
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#15211d"><h2>Nou missatge de l'Observatori</h2><p><strong>Nom:</strong> ${escapeHtml(name)}<br><strong>Correu de resposta:</strong> ${escapeHtml(email)}<br><strong>Motiu:</strong> ${escapeHtml(topic)}<br><strong>Data:</strong> ${escapeHtml(sentAt)}</p><hr style="border:0;border-top:1px solid #d9e5de"><p style="white-space:pre-wrap">${escapeHtml(message)}</p></div>`;
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${env.RESEND_API_KEY}`, "Content-Type":"application/json", "Idempotency-Key":crypto.randomUUID() },
    body:JSON.stringify({ from:env.CONTACT_FROM || DEFAULT_CONTACT_FROM, to:[env.CONTACT_TO], reply_to:email, subject:`[Observatori] ${topic} · ${name.replace(/[\r\n]/g, " ")}`, text, html, tags:[{ name:"source", value:"observatori_web" }] }),
  });
  if (!response.ok) {
    console.error("Resend error", response.status, await response.text());
    return json({ error:"No s'ha pogut enviar ara mateix. Torna-ho a provar més tard." }, 502, "no-store", origin);
  }
  try { await recordContactAttempt(env, clientIp, email); }
  catch (error) { console.error("Rate limit record error", error); }
  return json({ ok:true, message:"Missatge enviat" }, 200, "no-store", origin);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";
    if (request.method === "OPTIONS") {
      const allowedOrigin = ALLOWED_CONTACT_ORIGINS.has(origin) ? origin : "*";
      return new Response(null, { status:204, headers:corsHeaders(allowedOrigin) });
    }
    try {
      if (request.method === "POST" && url.pathname === "/contact") return contact(request, env);
      if (request.method === "POST" && url.pathname === "/meteo-ai") return meteoAI(request, env);
      if (request.method === "POST" && url.pathname === "/push-test") return pushTest(request, env);
      if (request.method === "POST" && url.pathname === "/push-preferences") return savePushPreferences(request, env);
      if (request.method === "GET" && url.pathname === "/oauth/youtube/start") return youtubeOAuthStart(request, env);
      if (request.method === "GET" && url.pathname === "/oauth/youtube/callback") return youtubeOAuthCallback(request, env, url);
      if (request.method === "GET" && url.pathname === "/oauth/tiktok/start") return tiktokOAuthStart(request, env);
      if (request.method === "GET" && url.pathname === "/oauth/tiktok/callback") return tiktokOAuthCallback(request, env, url);
      const socialCardMatch = url.pathname.match(/^\/social-card\/(\d+)\.(png|jpg)$/);
      if (request.method === "GET" && socialCardMatch) return socialCard(request, env, Number(socialCardMatch[1]), url, socialCardMatch[2] === 'jpg' ? 'jpeg' : 'png');
      const socialVideoMatch = url.pathname.match(/^\/social-video\/(shorts\/\d{4}-\d{2}-\d{2}\/(?:morning|evening)\.mp4)$/);
      if ((request.method === 'GET' || request.method === 'HEAD') && socialVideoMatch) return serveSocialVideo(request, env, socialVideoMatch[1], url);
      const bufferVideoMatch = url.pathname.match(/^\/buffer-video\/(shorts\/\d{4}-\d{2}-\d{2}\/(?:morning|evening)\.mp4)$/);
      if ((request.method === 'GET' || request.method === 'HEAD') && bufferVideoMatch) return serveBufferVideo(request, env, bufferVideoMatch[1], url);
      const socialVideoUploadMatch = url.pathname.match(/^\/admin\/social-video-upload\/(shorts\/\d{4}-\d{2}-\d{2}\/(?:morning|evening)\.mp4)$/);
      if (request.method === 'POST' && socialVideoUploadMatch) return uploadSocialVideo(request, env, socialVideoUploadMatch[1]);
      const youtubeShortRunMatch = url.pathname.match(/^\/admin\/youtube-short-runs\/(\d{4}-\d{2}-\d{2})\/(mati|vespre)$/);
      if (request.method === 'POST' && youtubeShortRunMatch) return youtubeShortRunControl(request, env, youtubeShortRunMatch[1], youtubeShortRunMatch[2]);
      const bufferTikTokScheduleMatch = url.pathname.match(/^\/admin\/buffer-tiktok\/schedule\/(\d{4}-\d{2}-\d{2})\/(morning|evening)$/);
      if (request.method === 'POST' && bufferTikTokScheduleMatch) return bufferTikTokScheduleControl(request, env, bufferTikTokScheduleMatch[1], bufferTikTokScheduleMatch[2]);
      const bufferXScheduleMatch = url.pathname.match(/^\/admin\/buffer-x\/schedule\/(\d{4}-\d{2}-\d{2})\/(morning|midday|evening)$/);
      if (request.method === 'POST' && bufferXScheduleMatch) return bufferXScheduleControl(request, env, bufferXScheduleMatch[1], bufferXScheduleMatch[2]);
      if (request.method === 'POST' && url.pathname === '/admin/buffer-tiktok/diagnostics') return bufferTikTokDiagnosticsControl(request, env);
      if (request.method === 'POST' && url.pathname === '/admin/youtube-short/diagnostics') return youtubeShortDispatchDiagnosticsControl(request, env);
      if (request.method === "GET" && url.pathname === "/admin/social-drafts") return adminSocialDrafts(request, env, url);
      if (request.method === "POST" && url.pathname === "/admin/social-diagnostics") return adminSocialDiagnostics(request, env);
      if (request.method === "POST" && url.pathname === "/admin/social-reels/test") return adminSocialReelTest(request, env);
      if (request.method === "POST" && url.pathname === "/admin/social-stories/test") return adminSocialStoryTest(request, env);
      if (request.method === "POST" && url.pathname === "/admin/buffer-tiktok/test") return adminBufferTikTokTest(request, env);
      const socialPublishMatch = url.pathname.match(/^\/admin\/social-drafts\/(\d+)\/publish$/);
      if (request.method === "POST" && socialPublishMatch) return adminPublishSocialDraft(request, env, Number(socialPublishMatch[1]));
      const socialWhatsAppMatch = url.pathname.match(/^\/admin\/social-drafts\/(\d+)\/prepare-whatsapp$/);
      if (request.method === "POST" && socialWhatsAppMatch) return adminPrepareWhatsApp(request, env, Number(socialWhatsAppMatch[1]));
      const socialDraftMatch = url.pathname.match(/^\/admin\/social-drafts\/(\d+)$/);
      if (request.method === "POST" && socialDraftMatch) return adminUpdateSocialDraft(request, env, Number(socialDraftMatch[1]));
      if (request.method !== "GET") return json({ error:"Mètode no permès" }, 405);
      if (url.pathname === "/" || url.pathname === "") {
        const observation = await resilientCurrentObservation(env);
        if (String(env.PERSIST_ON_REQUEST || "").toLowerCase() === "true" && env.DB && !observation.degraded) {
          ctx.waitUntil(persistObservation(observation, env).catch(error => console.error("D1 persist error", error)));
        }
        return json(observation, 200, "public, max-age=60");
      }
      if (url.pathname === "/history") return history(url, env);
      if (url.pathname === "/quality") return quality(env);
      if (url.pathname === "/health") return health(env);
      if (url.pathname === "/alerts") return alerts(env);
      if (url.pathname === "/alert-history") return alertHistory(url, env);
      if (url.pathname === "/stations") return comparisonStations(url, env);
      if (url.pathname === "/met-forecast") return metNorwayForecast(url);
      if (url.pathname === "/webcams-nearby") return nearbyWebcams(url, env);
      if (url.pathname === "/forecast-videos") return forecastVideos(request, ctx);
      if (url.pathname === "/forecast-verification") return forecastVerification(url, env);
      if (url.pathname === "/admin/status") return adminStatus(request, env);
      if (url.pathname === "/version") {
        return json({ version:WORKER_VERSION, built:WORKER_BUILT, env:(env.ENVIRONMENT || "production") }, 200, "public, max-age=300");
      }
      return json({ error:"Ruta no trobada", routes:["/", "/history?days=365", "/quality", "/health", "/alerts", "/alert-history", "/stations?period=now", "/met-forecast?lat=41.69&lon=2.49", "/webcams-nearby?lat=41.69&lon=2.49", "/forecast-videos", "/forecast-verification?days=45", "/version", "/admin/status", "/admin/social-drafts", "POST /meteo-ai", "POST /push-test", "POST /push-preferences", "POST /contact"] }, 404);
    } catch (error) {
      console.error("Worker error", error);
      return json({ error:error.message || "Error intern" }, error.status || 500);
    }
  },

  async scheduled(event, env, ctx) {
    const scheduledAt = new Date().toISOString();
    const capture = monitorWeatherUnderground(env, captureObservation(env));
    const social = capture.then(async result => {
      const slot=activeSocialSlot(env);
      return slot ? createDailySocialDraft(result.observation,env,slot) : recoverIncompleteDailySocialDraft(env);
    })
      .then(result => publishAutomaticSocialDraft(result, env));
    const aemetAlerts=checkAlertsAndNotify(env);
    const meteocatAlerts=checkMeteocatAlertsAndPublish(env);
    const officialAlertRecovery=Promise.allSettled([aemetAlerts,meteocatAlerts])
      .then(()=>recoverIncompleteOfficialAlertDraft(env))
      .then(result=>publishAutomaticSocialDraft(result,env));
    const observedJob=(label,promise)=>promise.catch(error=>{console.error(JSON.stringify({event:'scheduled_job_failed',job:label,error:cleanText(error.message,500)}));throw error;});
    const jobs = [
      observedJob('observation',capture),
      observedJob('forecast',captureForecastSnapshot(env)),
      observedJob('social',social),
      observedJob('meta-video',runAutomaticMetaVideos(env)),
      observedJob('alerts',aemetAlerts),
      observedJob('meteocat-alert-social',meteocatAlerts),
      observedJob('official-alert-social-recovery',officialAlertRecovery),
      observedJob('preflight',runDailyIntegrationPreflight(env)),
      observedJob('database-maintenance',runDatabaseMaintenance(env)),
      observedJob('social-video-cleanup',cleanupSocialVideos(env)),
      observedJob('social-card-cleanup',cleanupSocialCards(env)),
      observedJob('youtube-shorts-fallback',dispatchYoutubeShortFallback(env)),
      observedJob('buffer-tiktok-recovery',recoverBufferTikTokSchedule(env)),
      observedJob('buffer-x-recovery',recoverBufferXSchedule(env)),
    ];
    ctx.waitUntil(Promise.allSettled(jobs).then(async results => {
      const rejected=results.filter(item=>item.status==='rejected');
      await recordOperationalState(env,'scheduler',rejected.length?'down':'healthy',{
        scheduledAt, cron:event?.cron || null, jobs:results.length, failed:rejected.length,
        errors:rejected.map(item=>cleanText(item.reason?.message||item.reason,300)),
      });
    }).catch(error=>console.error(JSON.stringify({event:'scheduler_audit_failed',error:cleanText(error.message,500)}))));
  },
};
