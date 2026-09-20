-- Read-only, bounded to 180 days. Prefer a local export/backup.
WITH observed AS (
  SELECT local_date AS target_date, MAX(temperature) AS observed_max,
    MIN(temperature) AS observed_min,
    COUNT(DISTINCT CAST(observed_epoch/300 AS INTEGER)) AS observed_samples,
    COUNT(DISTINCT substr(local_time,12,2)) AS observed_hours,
    MAX(inserted_at) || 'Z' AS observed_available_at
  FROM observations
  WHERE local_date >= date('now','-180 days')
    AND station_id='ISANTC198' AND temperature BETWEEN -60 AND 60
  GROUP BY local_date
)
SELECT f.target_date,f.issued_at,f.horizon_day,f.provider,f.model,
  f.temperature_max,f.temperature_min,o.observed_max,o.observed_min,
  o.observed_samples,o.observed_hours,o.observed_available_at
FROM forecast_snapshots f JOIN observed o ON o.target_date=f.target_date
WHERE f.target_date >= date('now','-180 days') AND f.target_date < date('now')
  AND f.horizon_day=1 AND f.provider='Open-Meteo' AND f.model='best_match'
ORDER BY f.target_date,f.issued_epoch;
