// NOAA GML Mauna Loa daily means. This is a reference station, not a global mean.
export const NOAA_CO2_URL = 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv';
export const NOAA_CO2_SOURCE = 'https://gml.noaa.gov/ccgg/trends/data.html';
export const NOAA_CO2_KEY = 'climate/noaa-co2-mlo.json';
const DAY = 86400000;
const MAX_AGE = 7 * DAY;

export function parseNoaaCo2(csv, now = Date.now()) {
  const rows = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(\d{4}),(\d{1,2}),(\d{1,2}),[\d.]+,(-?[\d.]+)\s*$/);
    if (!match) continue;
    const [, yy, mm, dd, raw] = match;
    const date = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const epoch = Date.parse(`${date}T00:00:00Z`);
    const ppm = Number(raw);
    if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== date ||
      epoch > now || ppm < 250 || ppm > 650) continue;
    rows.push({ date, epoch, ppm });
  }
  rows.sort((a, b) => a.epoch - b.epoch);
  const latest = rows.at(-1);
  if (!latest || now - latest.epoch > MAX_AGE) throw new Error('NOAA CO₂: no hi ha cap lectura recent vàlida.');
  const target = Date.UTC(Number(latest.date.slice(0, 4)) - 1, Number(latest.date.slice(5, 7)) - 1, Number(latest.date.slice(8, 10)));
  const previous = rows.filter(row => Math.abs(row.epoch - target) <= 3 * DAY)
    .sort((a, b) => Math.abs(a.epoch - target) - Math.abs(b.epoch - target))[0];
  return {
    ppm: latest.ppm, date: latest.date,
    yearAgoPpm: previous?.ppm ?? null, yearAgoDate: previous?.date ?? null,
    yearChangePpm: previous ? Math.round((latest.ppm - previous.ppm) * 100) / 100 : null,
    source: 'NOAA Global Monitoring Laboratory', station: 'Mauna Loa',
    sourceUrl: NOAA_CO2_SOURCE, seriesUrl: NOAA_CO2_URL,
    provisional: true, unit: 'ppm',
  };
}

export function publicNoaaCo2(snapshot, now = Date.now()) {
  if (!snapshot || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) ||
    !Number.isFinite(snapshot.ppm) || snapshot.ppm < 250 || snapshot.ppm > 650) return null;
  const ageDays = Math.floor((now - Date.parse(`${snapshot.date}T00:00:00Z`)) / DAY);
  if (ageDays < 0 || ageDays > 7) return null;
  return { ...snapshot, ageDays, fresh: ageDays <= 3 };
}

export async function readNoaaCo2(env, now = Date.now()) {
  if (!env.CAMERA_BUCKET) return null;
  const object = await env.CAMERA_BUCKET.get(NOAA_CO2_KEY);
  if (!object) return null;
  try { return publicNoaaCo2(await object.json(), now); } catch { return null; }
}

export async function refreshNoaaCo2(env, now = Date.now(), fetcher = fetch) {
  if (!env.CAMERA_BUCKET) return { updated: false, reason: 'storage_disabled' };
  const existing = await env.CAMERA_BUCKET.get(NOAA_CO2_KEY);
  if (existing && now - Date.parse(existing.customMetadata?.checkedAt || '') < 23 * 3600000)
    return { updated: false, reason: 'checked_today' };
  const response = await fetcher(NOAA_CO2_URL, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`NOAA CO₂ HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length'));
  if (declared > 2_000_000) throw new Error('NOAA CO₂: fitxer massa gran.');
  const csv = await response.text();
  if (csv.length > 2_000_000) throw new Error('NOAA CO₂: fitxer massa gran.');
  const snapshot = parseNoaaCo2(csv, now);
  await env.CAMERA_BUCKET.put(NOAA_CO2_KEY, JSON.stringify(snapshot), {
    httpMetadata: { contentType: 'application/json' },
    customMetadata: { checkedAt: new Date(now).toISOString(), effectiveDate: snapshot.date },
  });
  return { updated: true, date: snapshot.date };
}
