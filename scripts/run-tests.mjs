import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const quick = process.argv.includes('--quick');
const all = (await readdir(resolve(root, 'tests')))
  .filter(name => name.endsWith('.mjs'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric:true }));
const selected = quick
  ? all.filter(name => ['smoke.mjs', 'admin.mjs', 'astronomy-social.mjs', 'extrems-dia.mjs', 'fiabilitat-bloc1.mjs', 'forecast-episodes.mjs', 'forecast-videos.mjs', 'meteocat-severe-alerts.mjs', 'mobile-audit-fixes.mjs', 'social-periodic.mjs', 'social-publication-quality.mjs', 'station-records.mjs', 'youtube-short.mjs', 'v22-2.mjs', 'v22-12.mjs', 'v22-30-1.mjs', 'v22-31.mjs', 'v22-32.mjs'].includes(name))
  : all;

if (quick && !selected.includes('audit-data-dates.mjs')) selected.push('audit-data-dates.mjs');
if (quick && !selected.includes('audit-social-delivery.mjs')) selected.push('audit-social-delivery.mjs');
if (quick && !selected.includes('audit-rain-coverage.mjs')) selected.push('audit-rain-coverage.mjs');
if (quick && !selected.includes('audit-history-charts.mjs')) selected.push('audit-history-charts.mjs');
if (quick && !selected.includes('audit-seo-video.mjs')) selected.push('audit-seo-video.mjs');

for (const file of selected) {
  const result = spawnSync(process.execPath, [resolve(root, 'tests', file)], { cwd:root, stdio:'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Comprovacions completades: ${selected.length} fitxers.`);
