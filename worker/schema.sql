CREATE TABLE IF NOT EXISTS observations (
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
);

CREATE INDEX IF NOT EXISTS idx_observations_local_date_epoch
ON observations(local_date, observed_epoch DESC);

PRAGMA optimize;


CREATE TABLE IF NOT EXISTS alert_events (
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
);
CREATE INDEX IF NOT EXISTS idx_alert_events_started ON alert_events(started_at DESC);

CREATE TABLE IF NOT EXISTS alert_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_auth_attempts (
  ip TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_auth_attempts_ip_time
ON admin_auth_attempts(ip, attempted_at DESC);
