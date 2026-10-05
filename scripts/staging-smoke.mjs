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

async function getMeteofranceCatalog() {
  let latest = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    latest = await getJson(`/meteofrance/models?fresh=${Date.now()}-${attempt}`);
    const ensemblesReady = latest.products?.some(product =>
      ['pe-arome', 'pe-arpege'].includes(product.id) && product.available && Number(product.coverages) > 0
    );
    if (ensemblesReady) return latest;
    if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 7_000));
  }
  return latest;
}

const meteofrance = await getMeteofranceCatalog();
if (meteofrance.ok !== true || !Array.isArray(meteofrance.products) || meteofrance.products.length !== 6) {
  throw new Error('/meteofrance/models: no retorna els sis productes esperats.');
}
const missingMeteofrance = meteofrance.products.filter(product => product.configured !== true);
if (missingMeteofrance.length) {
  throw new Error(`/meteofrance/models: credencials no configurades per ${missingMeteofrance.map(product => product.id).join(', ')}.`);
}
const directMeteofrance = meteofrance.products.filter(product => ['arome', 'arome-pi', 'arpege'].includes(product.id));
if (directMeteofrance.some(product => product.available !== true)) {
  throw new Error('/meteofrance/models: almenys un dels tres productes directes principals no respon.');
}
const ensembles = meteofrance.products.filter(product => ['pe-arome', 'pe-arpege'].includes(product.id));
if (!ensembles.some(product => product.available && Number(product.coverages) > 0)) {
  throw new Error('/meteofrance/models: cap ensemble no retorna encara un catàleg WCS real.');
}

async function validateMeteofranceMap(model, layer) {
  const params = new URLSearchParams({ model, layer, width:'600', height:'400' });
  const response = await fetch(`${baseUrl}/meteofrance/map?${params}`, { signal:AbortSignal.timeout(30_000) });
  if (!response.ok || !/^image\/png/i.test(response.headers.get('content-type') || '')) {
    throw new Error(`/meteofrance/map (${model}/${layer}): no retorna una imatge PNG.`);
  }
  const bytes = (await response.arrayBuffer()).byteLength;
  if (bytes < 250) throw new Error(`/meteofrance/map (${model}/${layer}): imatge inesperadament buida.`);
}

await Promise.all([
  validateMeteofranceMap('arome', 'temperature'),
  validateMeteofranceMap('arome-pi', 'precipitation'),
  validateMeteofranceMap('arpege', 'precipitation'),
]);

async function validateWeatherHistory(resolution, days) {
  const payload = await getJson(`/history?days=${days}&resolution=${resolution}`);
  const validEnvelope = payload.interval === resolution
    && Number.isInteger(payload.count)
    && payload.count >= 0
    && Array.isArray(payload.observations)
    && payload.count === payload.observations.length
    && payload.storage?.enabled === true;
  if (!validEnvelope) {
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
