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

console.log(`Staging correcte (${version.version}): salut ${health.status}, historial i avisos disponibles.`);
