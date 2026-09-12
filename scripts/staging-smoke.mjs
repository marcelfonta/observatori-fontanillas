const defaultBaseUrl = 'https://fonta-meteo-staging.marcelfonta.workers.dev';
const baseUrl = (process.env.STAGING_URL || defaultBaseUrl).replace(/\/$/, '');

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${path}: resposta HTTP ${response.status}.`);
  try {
    return await response.json();
  } catch {
    throw new Error(`${path}: la resposta no és JSON.`);
  }
}

const version = await getJson('/version');
if (version.env !== 'staging' || !version.version) {
  throw new Error('/version: no identifica l’entorn de proves.');
}

const health = await getJson('/health');
const healthy = health.ok === true && health.status === 'healthy';
const expectedDegraded = health.ok === false
  && health.status === 'degraded'
  && health.reason === 'weather_source_not_configured';
if (!healthy && !expectedDegraded) {
  throw new Error('/health: estat inesperat; cal revisar l’entorn de proves.');
}

const history = await getJson('/alert-history?limit=1');
if (history.ok !== true || !Array.isArray(history.items) || !history.pagination) {
  throw new Error('/alert-history: contracte de dades invàlid.');
}

const alerts = await getJson('/alerts?fresh=0');
if (alerts.ok !== true || !Array.isArray(alerts.alerts) || !alerts.source?.name) {
  throw new Error('/alerts: contracte d’avisos invàlid.');
}

async function validateWeatherHistory(resolution, days) {
  const payload = await getJson(`/history?days=${days}&resolution=${resolution}`);
  if (payload.ok !== true || payload.interval !== resolution || !Array.isArray(payload.observations)) {
    throw new Error(`/history (${resolution}): contracte de dades invàlid.`);
  }
  let previousEpoch = 0;
  for (const observation of payload.observations) {
    const epoch = Number(observation?.epoch);
    if (!Number.isFinite(epoch) || epoch <= 0 || epoch < previousEpoch) {
      throw new Error(`/history (${resolution}): ordre temporal o marca de temps invàlids.`);
    }
    if (Number(observation.samples) < 1 || Number(observation.coverageMinutes) < 1) {
      throw new Error(`/history (${resolution}): mostres o cobertura invàlides.`);
    }
    previousEpoch = epoch;
  }
}

await Promise.all([
  validateWeatherHistory('raw', 1),
  validateWeatherHistory('hourly', 7),
  validateWeatherHistory('daily', 30),
]);

console.log(`Staging correcte (${version.version}): salut ${health.status}, avisos i històric raw/hourly/daily disponibles.`);
