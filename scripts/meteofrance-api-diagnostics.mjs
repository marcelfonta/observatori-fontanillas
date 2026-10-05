import { mkdir, writeFile } from 'node:fs/promises';

const PORTAL_API = 'https://portail-api.meteofrance.fr/api/am/devportal/v3';
const DATA_API = 'https://public-api.meteofrance.fr';
const OUTPUT = 'build/meteofrance-api-diagnostics.json';

const checks = [
  {
    label: 'AROME',
    secretName: 'METEOFRANCE_AROME_API_KEY',
    envName: 'METEOFRANCE_AROME_API_KEY',
    apiId: '68b02250-382e-46b7-916d-87743b1c08cc',
    apiName: 'AROME',
    context: '/public/arome',
    version: '1.0',
  },
  {
    label: 'AROME previsió immediata',
    secretName: 'METEOFRANCE_AROME_NOWCAST_API_KEY',
    envName: 'METEOFRANCE_AROME_NOWCAST_API_KEY',
    apiId: '5b715300-4f8e-46a0-9e45-feceece08280',
    apiName: 'AROME-PI',
    context: '/public/aromepi',
    version: '1.0',
  },
  {
    label: 'AROME conjunt',
    secretName: 'METEOFRANCE_AROME_ENSEMBLE_API_KEY',
    envName: 'METEOFRANCE_AROME_ENSEMBLE_API_KEY',
    apiId: '435d98d5-173c-4e0f-ba75-6fa28c7de868',
    apiName: 'PE-AROME',
    context: '/public/pearome',
    version: '1.0',
  },
  {
    label: 'ARPEGE',
    secretName: 'METEOFRANCE_ARPEGE_API_KEY',
    envName: 'METEOFRANCE_ARPEGE_API_KEY',
    apiId: 'c1f60973-310f-4ec0-961d-f15fa66372c4',
    apiName: 'ARPEGE',
    context: '/public/arpege',
    version: '1.0',
  },
  {
    label: 'ARPEGE conjunt',
    secretName: 'METEOFRANCE_ARPEGE_ENSEMBLE_API_KEY',
    envName: 'METEOFRANCE_ARPEGE_ENSEMBLE_API_KEY',
    apiId: 'b3f3f4c9-5289-4c02-97d0-29c7570e83b1',
    apiName: 'PE-ARPEGE',
    context: '/public/pearpege',
    version: '1.0',
  },
  {
    label: 'PIAF',
    secretName: 'METEOFRANCE_PIAF_API_KEY',
    envName: 'METEOFRANCE_PIAF_API_KEY',
    apiId: 'aa174208-b051-4c95-af8f-dd52241a4d06',
    apiName: 'PrevisionImmediatePrecipitations',
    context: '/pro/piaf',
    version: '1.0',
  },
];

function decodeJwtExpiry(token) {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return Number.isFinite(payload.exp) ? new Date(payload.exp * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

function valueFor(parameter) {
  const schema = parameter.schema || {};
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (parameter.example !== undefined) return parameter.example;
  if (schema.example !== undefined) return schema.example;
  return undefined;
}

function resolveParameter(swagger, parameter) {
  if (!parameter?.$ref) return parameter;
  const name = parameter.$ref.split('/').pop();
  return swagger.components?.parameters?.[name] || parameter;
}

function operationCandidates(swagger) {
  const candidates = [];
  for (const [path, pathItem] of Object.entries(swagger.paths || {})) {
    const operation = pathItem.get;
    if (!operation) continue;
    const parameters = [...(pathItem.parameters || []), ...(operation.parameters || [])]
      .map(parameter => resolveParameter(swagger, parameter));
    const query = new URLSearchParams();
    let resolvedPath = path;
    let usable = true;
    for (const parameter of parameters) {
      if (!parameter.required) continue;
      const value = valueFor(parameter);
      if (value === undefined) {
        usable = false;
        break;
      }
      if (parameter.in === 'path') resolvedPath = resolvedPath.replace(`{${parameter.name}}`, encodeURIComponent(String(value)));
      if (parameter.in === 'query') query.set(parameter.name, String(value));
    }
    if (!usable) continue;
    const score = /GetCapabilities/i.test(path) ? 0 : parameters.some((item) => item.required) ? 2 : 1;
    candidates.push({ path:resolvedPath, query, score });
  }
  return candidates.sort((a, b) => a.score - b.score || a.path.localeCompare(b.path));
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function diagnose(check) {
  const token = process.env[check.envName]?.trim();
  if (!token) {
    return { ...check, status: 'missing', detail: 'El secret no existeix o és buit.' };
  }

  const expiresAt = decodeJwtExpiry(token);
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    return { ...check, status: 'expired', expiresAt, detail: 'La clau ha caducat.' };
  }

  try {
    const swagger = await fetchJson(`${PORTAL_API}/apis/${check.apiId}/swagger`);
    const candidate = operationCandidates(swagger)[0];
    if (!candidate) {
      return { ...check, status: 'inconclusive', expiresAt, detail: 'No s’ha trobat una consulta lleugera al catàleg oficial.' };
    }

    const url = new URL(`${DATA_API}${check.context}/${check.version}${candidate.path}`);
    for (const [name, value] of candidate.query) url.searchParams.set(name, value);
    // Les claus creades amb l'opció «API Key» del portal WSO2 s'envien
    // mitjançant la capçalera `apikey`. `Authorization: Bearer` només és per
    // als tokens OAuth2, encara que totes dues credencials tinguin forma JWT.
    const response = await fetch(url, {
      headers: { Accept: '*/*', apikey: token },
      // Alguns serveis retornen una redirecció signada cap al fitxer final.
      // No cal seguir-la per comprovar l'autorització i així evitem dependre
      // del servidor d'emmagatzematge durant aquest diagnòstic.
      redirect: 'manual',
      signal: AbortSignal.timeout(45_000),
    });

    if (response.ok) {
      await response.body?.cancel();
      return {
        ...check,
        status: 'ok',
        expiresAt,
        httpStatus: response.status,
        detail: 'Clau acceptada per l’API esperada.',
      };
    }

    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      return {
        ...check,
        status: 'ok',
        expiresAt,
        httpStatus: response.status,
        detail: 'Clau acceptada; l’API ha retornat la redirecció de descàrrega esperada.',
      };
    }

    await response.body?.cancel();
    if (response.status === 401 || response.status === 403) {
      return {
        ...check,
        status: 'wrong-key',
        expiresAt,
        httpStatus: response.status,
        detail: 'La clau no autoritza aquesta API; pot estar intercanviada o no subscrita.',
      };
    }

    if (response.status === 400) {
      return {
        ...check,
        status: 'inconclusive',
        expiresAt,
        httpStatus: response.status,
        detail: 'La passarel·la ha rebut la consulta però l’ha rebutjada per paràmetres; cal revisar el contracte abans d’usar-la.',
      };
    }

    return {
      ...check,
      status: 'api-error',
      expiresAt,
      httpStatus: response.status,
      detail: `L’API ha respost HTTP ${response.status}; autenticació no concloent.`,
    };
  } catch (error) {
    return {
      ...check,
      status: 'network-error',
      expiresAt,
      detail: `No s’ha pogut completar la consulta: ${error.message}`,
    };
  }
}

function icon(status) {
  if (status === 'ok') return '✅';
  if (status === 'inconclusive' || status === 'api-error' || status === 'network-error') return '⚠️';
  return '❌';
}

function publicResult(result) {
  return {
    api: result.apiName,
    label: result.label,
    secret: result.secretName,
    status: result.status,
    expiresAt: result.expiresAt || null,
    httpStatus: result.httpStatus || null,
    detail: result.detail,
  };
}

const results = [];
for (const check of checks) results.push(await diagnose(check));

const safeResults = results.map(publicResult);
await mkdir('build', { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), results: safeResults }, null, 2)}\n`);

const lines = [
  '# Diagnòstic de les API de Météo-France',
  '',
  '| API | Secret | Estat | Caducitat | Detall |',
  '| --- | --- | --- | --- | --- |',
  ...safeResults.map((result) =>
    `| ${icon(result.status)} ${result.label} | \`${result.secret}\` | ${result.status} | ${result.expiresAt || 'no indicada'} | ${result.detail} |`,
  ),
  '',
  'Les claus no s’han imprès ni s’han inclòs a l’artefacte.',
];

console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, { flag: 'a' });

const definitiveFailures = safeResults.filter((result) => ['missing', 'expired', 'wrong-key'].includes(result.status));
if (definitiveFailures.length) process.exitCode = 1;
