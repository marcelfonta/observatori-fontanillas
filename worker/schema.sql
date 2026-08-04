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
