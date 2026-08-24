const STATION_ID = "ISANTC198";
const WORKER_VERSION = "22.9.0";
const WORKER_BUILT = "2026-08-24";
const TIME_ZONE = "Europe/Madrid";
const STORAGE_INTERVAL_MINUTES = 5;
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

// Comprova els límits d'enviament del formulari de contacte i registra l'intent.
// Retorna { limited:true } si se supera algun límit, o { limited:false } si es permet.
async function checkContactRateLimit(env, ip, email) {
  if (!(await ensureContactSchema(env))) return { limited: false };
  const now = Math.floor(Date.now() / 1000);
  const ipKey = ip ? await sha256Text(`contact-ip:${ip}`) : '';
  const emailKey = email ? await sha256Text(`contact-email:${String(email).trim().toLowerCase()}`) : '';
  // Neteja de registres antics (> 24 h).
  await env.DB.prepare("DELETE FROM contact_rate_limit WHERE sent_at < ?").bind(now - 86400).run();
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
      consecutive_failures=CASE WHEN excluded.status='healthy' THEN 0 ELSE monitor_state.consecutive_failures+1 END,
      last_checked_at=excluded.last_checked_at,
      last_failure_at=CASE WHEN excluded.status='healthy' THEN monitor_state.last_failure_at ELSE excluded.last_failure_at END,
      last_success_at=CASE WHEN excluded.status='healthy' THEN excluded.last_success_at ELSE monitor_state.last_success_at END,
      detail=excluded.detail`)
    .bind(serviceKey, status, status === 'healthy' ? 0 : 1, now, status === 'healthy' ? null : now, status === 'healthy' ? now : null, safeDetail).run();
  console.log(JSON.stringify({ event:'operational_state', service:serviceKey, status, at:now }));
  return true;
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
    FROM monitor_state WHERE service_key IN ('scheduler','push-alert','social-automatic','social-preflight')`).all();
  const states = Object.fromEntries((result?.results || []).map(row => [row.service_key, monitorPayload(row)]));
  return { enabled:true, scheduler:states.scheduler || null, push:states['push-alert'] || null, social:states['social-automatic'] || null, preflight:states['social-preflight'] || null };
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
        .bind(fingerprint,'AEMET',entry.level||'unknown',entry.phenomenon||null,entry.title||null,entry.description||null,entry.published||new Date().toISOString(),entry.expires||null).run();
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
  return {
    page:integer('page',1,1,100000),pageSize,year,month,level,
    source:cleanText(url.searchParams.get('source'),50),
    phenomenon:cleanText(url.searchParams.get('phenomenon'),100),
    q:cleanText(url.searchParams.get('q'),100),
  };
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
  if(/vent|viento|ratxa|racha/.test(p))return 'wind';
  if(/tempest|torment|llamp|rayo/.test(p))return 'storm';
  if(/neu|nieve/.test(p))return 'snow';
  if(/calor|fred|frío|temperatur/.test(p))return 'temperature';
  return 'all';
}

async function sendOneSignalAlert(entry, env){
  if(!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY){
    const result={sent:false,reason:'not_configured'};
    await recordOperationalState(env,'push-alert','down',result).catch(()=>{});
    return result;
  }
  const category=notificationCategory(entry);
  const normalizedLevel=['yellow','orange','red'].includes(String(entry.level||'').toLowerCase())?String(entry.level).toLowerCase():'unknown';
  const level=entry.levelLabel || entry.level || 'Avís';
  const heading=`${level}: ${entry.phenomenon || 'avís meteorològic'}`;
  const body=String(entry.description || entry.title || 'Consulta el detall oficial.').slice(0,180);
  const filters=[
    {field:'tag',key:'alert_all',relation:'=',value:'1'},
    {operator:'OR'},
    {field:'tag',key:`alert_${category}`,relation:'=',value:'1'},
    {operator:'AND'},
    {field:'tag',key:`alert_level_${normalizedLevel}`,relation:'=',value:'1'},
  ];
  const response=await fetch('https://api.onesignal.com/notifications',{
    method:'POST',
    headers:{'Authorization':`Key ${env.ONESIGNAL_REST_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({app_id:env.ONESIGNAL_APP_ID,target_channel:'push',filters,headings:{ca:heading,en:heading},contents:{ca:body,en:body},url:'https://meteo.fontanillas.cat/?page=avisos'})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok){
    const result={sent:false,status:response.status,error:cleanText(payload.errors?.join?.(' · ')||payload.error||'Error de OneSignal',500)};
    console.error(JSON.stringify({event:'push_alert',status:'failed',responseCode:response.status,error:result.error}));
    await recordOperationalState(env,'push-alert','down',result).catch(()=>{});
    return result;
  }
  const result={sent:true,id:payload.id||null,recipients:Number(payload.recipients)||0,level:normalizedLevel,category};
  await recordOperationalState(env,'push-alert','healthy',result).catch(()=>{});
  return result;
}

async function pushTest(request,env){
  const origin=request.headers.get('Origin')||'';
  if(!ALLOWED_CONTACT_ORIGINS.has(origin))return json({ok:false,error:'Origen no autoritzat'},403,'no-store',origin||'*');
  if(!env.ONESIGNAL_APP_ID||!env.ONESIGNAL_REST_API_KEY)return json({ok:false,error:'Servei push no configurat'},503,'no-store',origin);
  const length=Number(request.headers.get('Content-Length')||0);
  if(length>2048)return json({ok:false,error:'Petició massa gran'},413,'no-store',origin);
  const body=await request.json().catch(()=>({}));
  const subscriptionId=cleanText(body.subscriptionId,128);
  if(!/^[A-Za-z0-9_-]{8,128}$/.test(subscriptionId))return json({ok:false,error:'Subscripció no vàlida'},400,'no-store',origin);
  const response=await fetch('https://api.onesignal.com/notifications',{method:'POST',headers:{Authorization:`Key ${env.ONESIGNAL_REST_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({app_id:env.ONESIGNAL_APP_ID,target_channel:'push',include_subscription_ids:[subscriptionId],headings:{ca:'Prova d’avisos Meteo Fontanillas',en:'Meteo Fontanillas alert test'},contents:{ca:'Connexió correcta: aquest dispositiu pot rebre avisos meteorològics.',en:'Connection successful: this device can receive weather alerts.'},url:'https://meteo.fontanillas.cat/?page=avisos'})});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)return json({ok:false,error:cleanText(payload.errors?.join?.(' · ')||'OneSignal no ha acceptat la prova',300)},502,'no-store',origin);
  return json({ok:true,accepted:true},200,'no-store',origin);
}

async function checkAlertsAndNotify(env){
  const response=await fetch(AEMET_PRELITORAL_FEED,{headers:{Accept:'application/rss+xml, application/xml, text/xml;q=0.9'},cf:{cacheEverything:false}});
  if(!response.ok)throw new Error(`AEMET RSS ${response.status}`);
  const xml=await response.text();
  const parsed=parseAemetFeed(xml);
  const payload={ok:true,alerts:parsed.activeAlerts,maxLevel:parsed.maxLevel};
  const fresh=await recordAlertEvents(payload,env);
  for(const entry of fresh){
    await sendOneSignalAlert(entry,env);
    if(['orange','red'].includes(String(entry.level||'').toLowerCase())){
      const social=await createOfficialAlertSocialDraft(entry,env);
      await publishAutomaticSocialDraft(social,env);
    }
  }
  return fresh.length;
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
    temperatureMae:verificationRound(verificationMean(subset.map(row=>row.temperatureAbsoluteError))),
    temperatureBias:verificationRound(verificationMean(subset.map(row=>row.temperatureError))),
    rainAccuracy:verificationRound(verificationMean(subset.map(row=>row.rainCorrect?100:0)),0),
    rainBrier:verificationRound(verificationMean(subset.map(row=>row.rainBrier)),3),
    windMae:verificationRound(verificationMean(subset.map(row=>row.windError))),
  });
  const summary = summarize(rows);
  const horizons = horizonDefinitions.map(definition => ({ ...definition, ...summarize(rows.filter(row=>Number(row.horizon_day)>=definition.min&&Number(row.horizon_day)<=definition.max)) }));
  const detail = rows.filter(row=>Number(row.horizon_day)===1).slice(0,14).map(row=>({
    date:row.target_date, issuedAt:row.issued_at,
    forecast:{ max:row.temperature_max,min:row.temperature_min,rain:row.precipitation_sum,rainProbability:row.precipitation_probability,gust:row.wind_gust_max,weatherCode:row.weather_code },
    observed:{ max:row.observed_max,min:row.observed_min,rain:verificationRound(Number(row.observed_rain)),gust:row.observed_gust },
  }));
  const firstSnapshot = await env.DB.prepare("SELECT MIN(issued_at) AS firstIssued,COUNT(*) AS total FROM forecast_snapshots").first();
  const sampleDays=new Set(rows.map(row=>row.target_date)).size;
  const status = sampleDays >= 7 ? "ready" : "collecting";
  const confidence=sampleDays>=30?{level:'consolidated',label:'Mostra consolidada',note:'30 dies o més verificats'}:sampleDays>=14?{level:'growing',label:'Mostra en creixement',note:'Calen 30 dies per consolidar tendències'}:{level:'preliminary',label:'Resultat preliminar',note:'Menys de 14 dies verificats'};
  return json({ ok:true,status,requestedDays,generatedAt:new Date().toISOString(),firstIssued:firstSnapshot?.firstIssued||null,storedForecasts:Number(firstSnapshot?.total)||0,sampleDays,confidence,summary,horizons,detail,method:{ provider:"Open-Meteo · best_match",observation:"Observatori Fontanillas · D1",minimumObservedSamples:72,note:"Cada predicció es desa abans del dia verificat; no es reconstrueixen pronòstics passats. L’índex Brier de pluja va de 0 (millor) a 1 (pitjor)." } }, 200, "public, max-age=900");
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

async function socialForecast(){
  const params=new URLSearchParams({latitude:String(STATION_LATITUDE),longitude:String(STATION_LONGITUDE),timezone:TIME_ZONE,forecast_days:'4',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max'});
  const response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{headers:{Accept:'application/json'},cf:{cacheEverything:true,cacheTtl:900}});
  if(!response.ok)throw new Error(`Open-Meteo social ${response.status}`);
  const daily=(await response.json()).daily||{};
  return daily.time?.map((date,index)=>({date,weatherCode:finite(daily.weather_code?.[index]),condition:socialWeatherLabel(daily.weather_code?.[index]),max:finite(daily.temperature_2m_max?.[index]),min:finite(daily.temperature_2m_min?.[index]),rainProbability:finite(daily.precipitation_probability_max?.[index]),rain:finite(daily.precipitation_sum?.[index]),gust:finite(daily.wind_gusts_10m_max?.[index])}))||[];
}

function socialHashtags(kind='daily_observation'){
  return kind==='official_alert'
    ? '#MeteoFontanillas #SantCeloni #BaixMontseny #AvisMeteorologic #AEMET #ProteccioCivil'
    : '#MeteoFontanillas #SantCeloni #BaixMontseny #Montseny #ElTemps #MeteoCatalunya';
}

function socialSlotProfile(slot='08:00'){
  const hour=Number(String(slot).slice(0,2));
  if(hour>=19)return {period:'vespre',eyebrow:'Balanç del dia',greeting:'Bona nit',lead:'Tanquem el dia amb les dades reals de l’Observatori',forecastLead:'Demà'};
  if(hour>=12)return {period:'migdia',eyebrow:'Actualització del migdia',greeting:'Bon dia',lead:'Actualització de les dades reals de l’Observatori',forecastLead:'La resta del dia'};
  return {period:'mati',eyebrow:'Previsió del dia',greeting:'Bon dia',lead:'Dades reals de l’Observatori',forecastLead:'Avui'};
}

const SOCIAL_SCHEDULE_BLUEPRINT=[
  {time:'08:00',period:'mati',label:'Bon dia i previsió',purpose:'Dades reals, previsió d’avui i avanç de demà'},
  {time:'14:00',period:'migdia',label:'Actualització del migdia',purpose:'Evolució observada i canvis per a la resta del dia'},
  {time:'20:30',period:'vespre',label:'Balanç del dia',purpose:'Resum del dia i previsió de l’endemà'},
];

function socialSchedulePlan(env){
  const active=new Set(String(env.SOCIAL_AUTO_TIMES||'08:00').split(',').map(value=>value.trim()));
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
  return activeTimeSlot(env.SOCIAL_AUTO_TIMES || '08:00', date);
}

function localIsoDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone:TIME_ZONE }).format(date);
}

function socialAutomationEnabled(env) {
  return String(env.SOCIAL_AUTOMATION_ENABLED || 'true').toLowerCase() !== 'false';
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
    .bind(`daily:${localDate}:${slot}`, initialStatus, JSON.stringify(['facebook','instagram','bluesky','telegram','threads']), title, body, 'https://meteo.fontanillas.cat/', payload).run();
  const created = Boolean(result?.meta?.changes);
  const draft = await env.DB.prepare("SELECT * FROM social_drafts WHERE dedupe_key = ?").bind(`daily:${localDate}:${slot}`).first();
  return { created, localDate, slot, draft };
}

async function createOfficialAlertSocialDraft(entry,env){
  if(!(await ensureSocialDraftSchema(env)))return {created:false,reason:'storage_disabled'};
  const level=String(entry.level||'').toLowerCase();
  const levelLabel=level==='red'?'VERMELL':'TARONJA';
  const title=`Avís ${levelLabel} a Sant Celoni · ${entry.phenomenon||'meteorologia'}`;
  const body=`⚠️ Avís oficial ${levelLabel} per ${entry.phenomenon||'fenomen meteorològic'} a la zona del Prelitoral de Barcelona, que inclou Sant Celoni. L’avís no implica necessàriament afectació a tot el municipi. ${cleanText(entry.description||entry.title,820)} Consulta sempre el detall oficial i segueix les indicacions de Protecció Civil.\n\n${socialHashtags('official_alert')}`;
  const payload=JSON.stringify({level,levelLabel,phenomenon:entry.phenomenon||null,description:entry.description||entry.title||null,starts:entry.published||null,expires:entry.expires||null});
  const result=await env.DB.prepare(`INSERT OR IGNORE INTO social_drafts (dedupe_key,kind,status,channels,title,body,source_url,payload) VALUES (?,'official_alert','approved',?,?,?,?,?)`)
    .bind(`alert:${entry.fingerprint}`,JSON.stringify(['facebook','instagram','bluesky','telegram','threads']),title,body,AEMET_PRELITORAL_PAGE,payload).run();
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
  if (!(await ensureSchema(env))) return { enabled:false, storedReadings:0, coverageDays:0 };
  const row = await env.DB.prepare(`SELECT COUNT(*) AS storedReadings,
    MIN(observed_epoch) AS firstEpoch, MAX(observed_epoch) AS lastEpoch,
    MIN(local_time) AS firstObservation, MAX(local_time) AS lastObservation
    FROM observations`).first();
  const count = Number(row?.storedReadings) || 0;
  const coverageDays = row?.firstEpoch && row?.lastEpoch ? Math.max(0, (row.lastEpoch - row.firstEpoch) / 86400) : 0;
  return { enabled:true, storedReadings:count, coverageDays, firstObservation:row?.firstObservation || null, lastObservation:row?.lastObservation || null };
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
  const result = await quality(env);
  const payload = await result.json();
  return json({
    ok:payload.ok,
    stationId:payload.stationId,
    updated:payload.updated,
    ageMinutes:payload.ageMinutes,
    missingFields:payload.missingFields,
    latencyMs:payload.latencyMs,
    storage:payload.storage,
  });
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
  await env.DB.prepare("DELETE FROM admin_auth_attempts WHERE attempted_at < ?").bind(now - 3600).run();
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
  if (!env.DB) return { enabled:false, observations:null, alertEvents:null, contactRequests24h:null };
  const storage = await storageSummary(env).catch(() => ({ enabled:true, storedReadings:0, coverageDays:0 }));
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
  return { enabled:true, observations:storage.storedReadings, coverageDays:storage.coverageDays, firstObservation:storage.firstObservation || null, lastObservation:storage.lastObservation || null, alertEvents, latestAlertEvent, contactRequests24h };
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
    ensureOperationsSchema(env).then(ready=>ready?env.DB.prepare("SELECT status,last_checked_at,detail FROM monitor_state WHERE service_key = 'social-preflight'").first():null),
  ]);
  return {
    enabled:true,
    mode,
    schedule:String(env.SOCIAL_AUTO_TIMES || '08:00'),
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
const SOCIAL_DIAGNOSTIC_CHANNELS = new Set([...SOCIAL_CHANNELS, 'tiktok']);
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
    ? env.DB.prepare(`SELECT id,dedupe_key,kind,status,channels,title,body,source_url,payload,scheduled_for,created_at FROM social_drafts WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(status, limit, offset)
    : env.DB.prepare(`SELECT id,dedupe_key,kind,status,channels,title,body,source_url,payload,scheduled_for,created_at FROM social_drafts ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(limit, offset);
  const result = await statement.all();
  const drafts = await Promise.all((result?.results || []).map(async row => socialDraftPayload(row, await socialPublicationsForDraft(env, row.id))));
  return json({ ok:true, drafts, limit, offset, publicationMode:socialAutomationEnabled(env)?'automatic':'manual-confirmation', schedule:String(env.SOCIAL_AUTO_TIMES || '08:00') }, 200, 'no-store, private', auth.origin);
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
  return `https://fonta-meteo.marcelfonta.workers.dev/social-card/${draft.id}.${extension}?sig=${signature}&v=${WORKER_VERSION}`;
}

function socialCardHtml(draft) {
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
  const alertColor=data.level==='red'?'#ef5350':'#ffad42';
  const main=isAlert?`<p class="eyebrow" style="color:${alertColor}">AVÍS OFICIAL · ${escapeHtml(data.levelLabel||'')}</p><h1>Avís per ${escapeHtml(data.phenomenon||'fenomen meteorològic')}</h1><p class="stamp">Àrea del Prelitoral de Barcelona · Sant Celoni</p><section class="alert" style="border-color:${alertColor}"><b style="color:${alertColor}">${escapeHtml(data.levelLabel||'AVÍS')}</b><p>${escapeHtml(cleanText(data.description||draft.body,700))}</p></section><p class="advice">Consulta el detall oficial i segueix les indicacions de Protecció Civil.</p>`:`<p class="eyebrow">${escapeHtml(data.eyebrow||'El temps ara')}</p><h1>Dades reals i previsió per entendre el dia.</h1><p class="stamp">${escapeHtml(date)} · lectura de les ${escapeHtml(time)}</p>
    <section class="hero"><div><small>Temperatura</small><div class="temp">${escapeHtml(temperature)}</div></div><div class="feels">Sensació tèrmica<b>${escapeHtml(feeling)}</b></div></section>
    <section class="grid"><div class="metric"><span>Humitat</span><b>${escapeHtml(humidity)}</b></div><div class="metric"><span>Vent · ratxa</span><b>${escapeHtml(wind)} · ${escapeHtml(gust)}</b></div></section>
    ${forecast.length?`<section class="forecast"><div><span>AVUI · ${escapeHtml(today.condition||'')}</span><b>${escapeHtml(display(today.max,'°',0))} / ${escapeHtml(display(today.min,'°',0))}</b><small>${escapeHtml(display(today.rainProbability,'% pluja',0))} · ratxa ${escapeHtml(display(today.gust,' km/h',0))}</small></div><div><span>DEMÀ · ${escapeHtml(tomorrow.condition||'')}</span><b>${escapeHtml(display(tomorrow.max,'°',0))} / ${escapeHtml(display(tomorrow.min,'°',0))}</b><small>${escapeHtml(display(tomorrow.rainProbability,'% pluja',0))} · ratxa ${escapeHtml(display(tomorrow.gust,' km/h',0))}</small></div><div><span>DEMÀ PASSAT · ${escapeHtml(afterTomorrow.condition||'')}</span><b>${escapeHtml(display(afterTomorrow.max,'°',0))} / ${escapeHtml(display(afterTomorrow.min,'°',0))}</b><small>${escapeHtml(display(afterTomorrow.rainProbability,'% pluja',0))} · ratxa ${escapeHtml(display(afterTomorrow.gust,' km/h',0))}</small></div></section>`:`<section class="grid"><div class="metric"><span>Pressió</span><b>${escapeHtml(pressure)}</b></div><div class="metric"><span>Pluja acumulada avui</span><b>${escapeHtml(rain)}</b></div></section>`}`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:1080px;height:1350px;overflow:hidden;font-family:Arial,sans-serif;background:#061713;color:#f5faf7}
    body{padding:64px;background:radial-gradient(circle at 84% 10%,#286d55 0,rgba(40,109,85,.18) 28%,transparent 44%),linear-gradient(145deg,#061713,#0b241c 62%,#102e24)}
    .top{display:flex;align-items:center;justify-content:space-between}.brand{display:flex;align-items:center;gap:20px}.mark{width:92px;height:92px;border-radius:22px;object-fit:cover;border:2px solid rgba(255,255,255,.5)}.brand b{font-size:38px}.brand span{display:block;color:#a9beb5;font-size:21px;margin-top:5px}.live{padding:15px 22px;border:1px solid #5e8d79;border-radius:999px;color:#b9f0ce;font-weight:800;letter-spacing:2px;font-size:18px}
    .eyebrow{margin:94px 0 20px;color:#8fe0ad;font-weight:800;letter-spacing:4px;font-size:22px;text-transform:uppercase}h1{margin:0;font-size:70px;line-height:1.02;letter-spacing:-3px;max-width:850px}.stamp{margin-top:22px;color:#b2c5bc;font-size:26px}.hero{margin-top:62px;display:flex;align-items:flex-end;justify-content:space-between;padding:42px;border-radius:34px;border:1px solid #416d5b;background:rgba(12,43,33,.84)}.hero small{display:block;color:#9db5aa;font-size:23px;margin-bottom:12px}.temp{font-size:138px;line-height:.86;font-weight:900;letter-spacing:-8px}.feels{text-align:right;font-size:28px;color:#cfe0d8}.feels b{display:block;color:#fff;font-size:42px;margin-top:10px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px}.metric{padding:25px 30px;border-radius:25px;border:1px solid #315c4b;background:rgba(5,28,22,.74)}.metric span{display:block;color:#a8beb4;font-size:21px;margin-bottom:9px}.metric b{font-size:34px}.forecast{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}.forecast div{padding:22px 20px;border-radius:25px;border:1px solid #477764;background:rgba(7,31,24,.92)}.forecast span,.forecast small{display:block;color:#91d8ad;font-size:16px;line-height:1.25}.forecast b{display:block;font-size:31px;margin:11px 0}.alert{margin-top:70px;padding:45px;border:2px solid;border-radius:34px;background:rgba(5,28,22,.82)}.alert b{font-size:56px}.alert p{font-size:34px;line-height:1.32}.advice{font-size:29px;line-height:1.35;color:#d7e5de;margin-top:36px}.footer{position:absolute;left:64px;right:64px;bottom:58px;display:flex;justify-content:space-between;align-items:center;padding-top:24px;border-top:1px solid #315c4b;color:#aec3b9;font-size:21px}.footer strong{color:#8fe0ad}
  </style></head><body>
    <div class="top"><div class="brand"><img class="mark" src="https://meteo.fontanillas.cat/assets/icons/icon-512.png" alt=""><div><b>Meteo Fontanillas</b><span>Observatori meteorològic · Sant Celoni</span></div></div><div class="live">${isAlert?'AEMET':'DADA REAL'}</div></div>
    ${main}
    <div class="footer"><span>${isAlert?'Font oficial: AEMET':'Fonts: estació Fontanillas · Open-Meteo'}</span><strong>meteo.fontanillas.cat</strong></div>
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

async function socialCard(request, env, draftId, url, format = 'png') {
  if (!env.BROWSER) return json({ error:'La generació de targetes encara no està configurada.' }, 503);
  if (!(await ensureSocialDraftSchema(env))) return json({ error:'D1 no configurat.' }, 503);
  const expected = await socialCardSignature(draftId, env);
  if (!(await secureTokenMatch(String(url.searchParams.get('sig') || ''), expected))) return json({ error:'Signatura no vàlida.' }, 403);
  const storedDraft = await findSocialDraft(env, draftId);
  if (!storedDraft) return json({ error:'Targeta no trobada.' }, 404);
  const draft = await enrichedSocialCardDraft(storedDraft, env);
  const jpeg = format === 'jpeg';
  const rendered = await env.BROWSER.quickAction('screenshot', {
    html:socialCardHtml(draft),
    viewport:{ width:1080,height:1350 },
    ...(jpeg ? { screenshotOptions:{ type:'jpeg', quality:90 } } : {}),
  });
  if (!rendered.ok) {
    const details = cleanText(await rendered.clone().text().catch(() => ''), 500);
    console.error('Social card rendering error', JSON.stringify({ draftId, status:rendered.status, details }));
    return json({error:'No s’ha pogut generar la targeta amb dades reals.',details},502,'no-store');
  }
  const headers = new Headers(rendered.headers);
  headers.set('Content-Type',jpeg ? 'image/jpeg' : 'image/png'); headers.set('Cache-Control','public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Access-Control-Allow-Origin','https://meteo.fontanillas.cat');
  return new Response(rendered.body,{status:rendered.status,headers});
}

async function ensureSocialCardUrl(draft,env,format='png'){
  const imageUrl=await socialCardUrl(draft,env,format);
  let lastError='resposta buida';
  for(let attempt=0;attempt<6;attempt+=1){
    // The draft can take a moment to become visible through the public Worker.
    // Never cache that transient 404: it would otherwise poison the card URL for a day.
    const readinessUrl=`${imageUrl}&ready=${attempt}-${Date.now()}`;
    const response=await fetch(readinessUrl,{headers:{Accept:'image/*','Cache-Control':'no-cache'},cf:{cacheEverything:false}}).catch(error=>{lastError=error.message;return null;});
    const type=String(response?.headers.get('Content-Type')||'').toLowerCase();
    if(response?.ok&&type.startsWith('image/'))return imageUrl;
    if(response)lastError=`HTTP ${response.status} (${type||'sense tipus'})`;
    await new Promise(resolve=>setTimeout(resolve,750*(attempt+1)));
  }
  throw Object.assign(new Error(`La targeta social no està preparada: ${lastError}.`),{status:502});
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
  const slot=activeTimeSlot(env.SOCIAL_PREFLIGHT_TIME || '07:45',date);
  if(!slot || !(await ensureOperationsSchema(env)))return {checked:false,reason:slot?'storage_disabled':'outside_schedule'};
  const localDate=localIsoDate(date);
  const previous=await env.DB.prepare("SELECT last_checked_at FROM monitor_state WHERE service_key = 'social-preflight'").first();
  if(previous?.last_checked_at && localIsoDate(new Date(previous.last_checked_at))===localDate)return {checked:false,reason:'already_checked'};
  const results=await Promise.all([...SOCIAL_DIAGNOSTIC_CHANNELS].map(channel=>diagnoseSocialChannel(channel,env)));
  const failed=results.filter(item=>!item.ok);
  const now=new Date().toISOString();
  const detail=JSON.stringify(results.map(item=>({channel:item.channel,ok:item.ok,detail:cleanText(item.detail,240)})));
  await env.DB.prepare(`INSERT INTO monitor_state (service_key,status,consecutive_failures,last_checked_at,last_failure_at,last_success_at,last_notified_at,detail)
    VALUES ('social-preflight',?,?,?,?,?,?,?)
    ON CONFLICT(service_key) DO UPDATE SET status=excluded.status,consecutive_failures=excluded.consecutive_failures,
      last_checked_at=excluded.last_checked_at,last_failure_at=excluded.last_failure_at,last_success_at=excluded.last_success_at,
      last_notified_at=excluded.last_notified_at,detail=excluded.detail`)
    .bind(failed.length?'down':'healthy',failed.length?1:0,now,failed.length?now:null,failed.length?null:now,failed.length?now:null,detail).run();
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
  const channels = parseSocialChannels(draft.channels).filter(channel=>configured[channel] && !completed.has(channel) && (!retryChannels || retryChannels.has(channel)));
  const outcomes = [];
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
  await recordOperationalState(env,'social-automatic',failed.length?'down':'healthy',{
    draftId:draft.id, localDate:result.localDate || null, slot:result.slot || null,
    published:outcomes.filter(item=>item.ok).map(item=>item.channel),
    failed:failed.map(item=>({channel:item.channel,error:item.error})), skipped:channels.length===0,
  }).catch(()=>{});
  if (failed.length) await sendOperationalEmail(env, '[Observatori] Publicació automàtica incompleta', `No s’ha pogut publicar l’informe de ${result.localDate || 'avui'} a: ${failed.map(item=>item.channel).join(', ')}.\n\n${failed.map(item=>`${item.channel}: ${item.error}`).join('\n')}`, 'social_publish_failed').catch(error=>console.error('Social notification error',error));
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
  const retryChannels=pending.filter(channel=>(attempts.get(channel)||0)<4);
  if (!retryChannels.length) return null;
  return { created:false, recovered:true, localDate, slot:'recovery', retryChannels, draft };
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
    adminSocialSummary(env).catch(error => ({ enabled:false, mode:'draft', tokenConfigured:Boolean(env.META_SYSTEM_USER_TOKEN), channelCredentials:{ meta:Boolean(env.META_SYSTEM_USER_TOKEN), facebook:Boolean(env.META_SYSTEM_USER_TOKEN), instagram:Boolean(env.META_SYSTEM_USER_TOKEN), bluesky:Boolean(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD), telegram:Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID), threads:Boolean(env.THREADS_ACCESS_TOKEN) }, error:error.message, pendingDrafts:0, recent:[] })),
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
      push:Boolean(env.ONESIGNAL_APP_ID && env.ONESIGNAL_REST_API_KEY),
      admin:true,
      socialToken:Boolean(env.META_SYSTEM_USER_TOKEN),
      facebook:Boolean(env.META_SYSTEM_USER_TOKEN),
      instagram:Boolean(env.META_SYSTEM_USER_TOKEN),
      bluesky:Boolean(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD),
      telegram:Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID),
      threads:Boolean(env.THREADS_ACCESS_TOKEN),
      advancedAI:Boolean(env.AI),
    },
    schedule:{ observationMinutes:STORAGE_INTERVAL_MINUTES, alerts:"cada 5 minuts", social:String(env.SOCIAL_AUTO_TIMES || '08:00'), preflight:String(env.SOCIAL_PREFLIGHT_TIME || '07:45'), timeZone:TIME_ZONE },
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
    await env.DB.prepare("DELETE FROM ai_rate_limit WHERE asked_at < ?").bind(now - 3600).run();
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
      if (request.method === "GET" && url.pathname === "/oauth/youtube/start") return youtubeOAuthStart(request, env);
      if (request.method === "GET" && url.pathname === "/oauth/youtube/callback") return youtubeOAuthCallback(request, env, url);
      if (request.method === "GET" && url.pathname === "/oauth/tiktok/start") return tiktokOAuthStart(request, env);
      if (request.method === "GET" && url.pathname === "/oauth/tiktok/callback") return tiktokOAuthCallback(request, env, url);
      const socialCardMatch = url.pathname.match(/^\/social-card\/(\d+)\.(png|jpg)$/);
      if (request.method === "GET" && socialCardMatch) return socialCard(request, env, Number(socialCardMatch[1]), url, socialCardMatch[2] === 'jpg' ? 'jpeg' : 'png');
      if (request.method === "GET" && url.pathname === "/admin/social-drafts") return adminSocialDrafts(request, env, url);
      if (request.method === "POST" && url.pathname === "/admin/social-diagnostics") return adminSocialDiagnostics(request, env);
      const socialPublishMatch = url.pathname.match(/^\/admin\/social-drafts\/(\d+)\/publish$/);
      if (request.method === "POST" && socialPublishMatch) return adminPublishSocialDraft(request, env, Number(socialPublishMatch[1]));
      const socialWhatsAppMatch = url.pathname.match(/^\/admin\/social-drafts\/(\d+)\/prepare-whatsapp$/);
      if (request.method === "POST" && socialWhatsAppMatch) return adminPrepareWhatsApp(request, env, Number(socialWhatsAppMatch[1]));
      const socialDraftMatch = url.pathname.match(/^\/admin\/social-drafts\/(\d+)$/);
      if (request.method === "POST" && socialDraftMatch) return adminUpdateSocialDraft(request, env, Number(socialDraftMatch[1]));
      if (request.method !== "GET") return json({ error:"Mètode no permès" }, 405);
      if (url.pathname === "/" || url.pathname === "") {
        const observation = await resilientCurrentObservation(env);
        if (env.DB && !observation.degraded) ctx.waitUntil(persistObservation(observation, env).catch(error => console.error("D1 persist error", error)));
        return json(observation, 200, "public, max-age=60");
      }
      if (url.pathname === "/history") return history(url, env);
      if (url.pathname === "/quality") return quality(env);
      if (url.pathname === "/health") return health(env);
      if (url.pathname === "/alerts") return alerts(env);
      if (url.pathname === "/alert-history") return alertHistory(url, env);
      if (url.pathname === "/stations") return comparisonStations(url, env);
      if (url.pathname === "/forecast-verification") return forecastVerification(url, env);
      if (url.pathname === "/admin/status") return adminStatus(request, env);
      if (url.pathname === "/version") {
        return json({ version:WORKER_VERSION, built:WORKER_BUILT, env:(env.ENVIRONMENT || "production") }, 200, "public, max-age=300");
      }
      return json({ error:"Ruta no trobada", routes:["/", "/history?days=365", "/quality", "/health", "/alerts", "/alert-history", "/stations?period=now", "/forecast-verification?days=45", "/version", "/admin/status", "/admin/social-drafts", "POST /meteo-ai", "POST /push-test", "POST /contact"] }, 404);
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
    const observedJob=(label,promise)=>promise.catch(error=>{console.error(JSON.stringify({event:'scheduled_job_failed',job:label,error:cleanText(error.message,500)}));throw error;});
    const jobs = [
      observedJob('observation',capture),
      observedJob('forecast',captureForecastSnapshot(env)),
      observedJob('social',social),
      observedJob('alerts',checkAlertsAndNotify(env)),
      observedJob('preflight',runDailyIntegrationPreflight(env)),
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
