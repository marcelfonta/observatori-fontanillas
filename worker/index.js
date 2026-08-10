const STATION_ID = "ISANTC198";
const WORKER_VERSION = "19.0.4";
const WORKER_BUILT = "2026-08-10";
const TIME_ZONE = "Europe/Madrid";
const STORAGE_INTERVAL_MINUTES = 5;
const WEBCAM_URL = "https://www.alvar.cat/WebCam/Imatge-Camera.jpg";
const BACKGROUND_URL = "https://santceloni.cat/ARXIUS/agenda/2011/made_in_montseny.jpg";
const DEFAULT_CONTACT_FROM = "Observatori Fontanillas <formulari@fontanillas.cat>";
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
let schemaReady = false;
let contactSchemaReady = false;
let alertSchemaReady = false;
let adminAuthSchemaReady = false;

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
  if(!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_REST_API_KEY)return {sent:false,reason:'not_configured'};
  const category=notificationCategory(entry);
  const normalizedLevel=['yellow','orange','red'].includes(String(entry.level||'').toLowerCase())?String(entry.level).toLowerCase():'unknown';
  const level=entry.levelLabel || entry.level || 'Avís';
  const heading=`${level}: ${entry.phenomenon || 'avís meteorològic'}`;
  const body=String(entry.description || entry.title || 'Consulta el detall oficial.').slice(0,180);
  const filters=[
    {field:'tag',key:'alert_all',relation:'=',value:'1'},
    {operator:'AND'},
    {field:'tag',key:`alert_level_${normalizedLevel}`,relation:'=',value:'1'},
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
  if(!response.ok){ console.error('OneSignal API error',response.status,await response.text()); return {sent:false,status:response.status}; }
  return {sent:true};
}

async function checkAlertsAndNotify(env){
  const response=await fetch(AEMET_PRELITORAL_FEED,{headers:{Accept:'application/rss+xml, application/xml, text/xml;q=0.9'},cf:{cacheEverything:false}});
  if(!response.ok)throw new Error(`AEMET RSS ${response.status}`);
  const xml=await response.text();
  const parsed=parseAemetFeed(xml);
  const payload={ok:true,alerts:parsed.activeAlerts,maxLevel:parsed.maxLevel};
  const fresh=await recordAlertEvents(payload,env);
  for(const entry of fresh){ await sendOneSignalAlert(entry,env); }
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

async function discoverComparisonStations(env) {
  if(!env.WU_API_KEY)return COMPARISON_STATIONS;
  try {
    const query=new URLSearchParams({geocode:"41.6906,2.489",product:"pws",format:"json",apiKey:env.WU_API_KEY});
    const response=await fetch(`https://api.weather.com/v3/location/near?${query}`,{cf:{cacheEverything:true,cacheTtl:3600}});
    if(!response.ok)throw new Error(`Weather location near ha respost ${response.status}`);
    const payload=await response.json();
    const location=payload.location||payload;
    const ids=Array.isArray(location.stationId)?location.stationId:[];
    const names=Array.isArray(location.stationName)?location.stationName:[];
    const latitudes=Array.isArray(location.latitude)?location.latitude:[];
    const longitudes=Array.isArray(location.longitude)?location.longitude:[];
    const distances=Array.isArray(location.distanceKm)?location.distanceKm:[];
    const selected=new Map(COMPARISON_STATIONS.map(station=>[station.stationId,station]));
    ids.forEach((stationId,index)=>{
      if(!stationId||selected.has(stationId)||selected.size>=6)return;
      const latitude=finite(latitudes[index]);const longitude=finite(longitudes[index]);
      const distance=finite(distances[index])??distanceKm(41.6906,2.489,latitude,longitude);
      if(!Number.isFinite(distance)||distance>20)return;
      selected.set(stationId,{
        id:`nearby-${String(stationId).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
        name:cleanText(names[index]||stationId,80),
        municipality:"Entorn del Baix Montseny",
        source:"Weather Underground · estació propera",
        stationId,
        latitude,
        longitude,
        distanceKm:Number(distance.toFixed(1)),
      });
    });
    return [...selected.values()].slice(0,6);
  } catch(error) {
    console.warn("Descobriment d’estacions properes:",error.message);
    return COMPARISON_STATIONS;
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
  const period = ["now","today","24h"].includes(url.searchParams.get("period")) ? url.searchParams.get("period") : "now";
  const nearbyStations=await discoverComparisonStations(env);
  const results = await Promise.all(nearbyStations.map(async station => {
    try {
      const current = await comparisonCurrentStation(station, env);
      if (!current) throw new Error("Sense observació actual");
      let history = [];
      if (period !== "now") history = await comparisonHistoryStation(station, period, env);
      return { ...current, status:"online", history };
    } catch (error) {
      console.warn(`Comparativa ${station.stationId}:`, error.message);
      return { ...station, status:"offline", error:"Dades temporalment no disponibles", history:[] };
    }
  }));
  return json({
    ok:true,
    period,
    generatedAt:new Date().toISOString(),
    stations:results,
    sourcePolicy:{
      mode:"smart-fallback",
      note:"Fontanillas es manté com a referència i el Worker descobreix automàticament fins a cinc estacions PWS properes en un radi màxim de 20 km. Totes les lectures es normalitzen amb les mateixes unitats."
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
  const [qualityResult, alertsResult, database] = await Promise.all([
    quality(env).then(response => response.json()).catch(error => ({ ok:false, status:"unavailable", error:error.message })),
    alerts(env).then(response => response.json()).catch(error => ({ ok:false, status:"unavailable", error:error.message })),
    adminDatabaseSummary(env),
  ]);
  return json({
    ok:true,
    generatedAt:new Date().toISOString(),
    latencyMs:Date.now() - started,
    worker:{ version:WORKER_VERSION, built:WORKER_BUILT, environment:env.ENVIRONMENT || "production" },
    station:{ ok:Boolean(qualityResult.ok), status:qualityResult.status || (qualityResult.ok ? "healthy" : "unavailable"), updated:qualityResult.updated || null, ageMinutes:qualityResult.ageMinutes ?? null, latencyMs:qualityResult.latencyMs ?? null, missingFields:qualityResult.missingFields || [], storage:qualityResult.storage || null, sensors:qualityResult.sensors || null },
    alerts:{ ok:Boolean(alertsResult.ok), status:alertsResult.status || "unavailable", active:alertsResult.active ?? null, maxLevel:alertsResult.maxLevel || "unknown", checkedAt:alertsResult.checkedAt || null, latencyMs:alertsResult.latencyMs ?? null },
    database,
    integrations:{
      weatherUnderground:Boolean(env.WU_API_KEY),
      database:Boolean(env.DB),
      contact:Boolean(env.RESEND_API_KEY && env.CONTACT_TO),
      push:Boolean(env.ONESIGNAL_APP_ID && env.ONESIGNAL_REST_API_KEY),
      admin:true,
    },
    schedule:{ observationMinutes:STORAGE_INTERVAL_MINUTES, alerts:"comprovació programada" },
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
      if (request.method !== "GET") return json({ error:"Mètode no permès" }, 405);
      if (url.pathname === "/" || url.pathname === "") {
        const observation = await currentObservation(env);
        if (env.DB) ctx.waitUntil(persistObservation(observation, env).catch(error => console.error("D1 persist error", error)));
        return json(observation, 200, "public, max-age=60");
      }
      if (url.pathname === "/history") return history(url, env);
      if (url.pathname === "/quality") return quality(env);
      if (url.pathname === "/health") return health(env);
      if (url.pathname === "/alerts") return alerts(env);
      if (url.pathname === "/alert-history") return alertHistory(url, env);
      if (url.pathname === "/stations") return comparisonStations(url, env);
      if (url.pathname === "/admin/status") return adminStatus(request, env);
      if (url.pathname === "/version") {
        return json({ version:WORKER_VERSION, built:WORKER_BUILT, env:(env.ENVIRONMENT || "production") }, 200, "public, max-age=300");
      }
      return json({ error:"Ruta no trobada", routes:["/", "/history?days=365", "/quality", "/health", "/alerts", "/alert-history", "/stations?period=now", "/version", "POST /contact"] }, 404);
    } catch (error) {
      console.error("Worker error", error);
      return json({ error:error.message || "Error intern" }, error.status || 500);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(Promise.all([
      captureObservation(env).catch(error => console.error("Captura programada fallida", error)),
      checkAlertsAndNotify(env).catch(error => console.error("Comprovació d’avisos fallida", error)),
    ]));
  },
};
