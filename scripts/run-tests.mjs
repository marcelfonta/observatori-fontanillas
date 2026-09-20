import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const quick = process.argv.includes('--quick');
const all = (await readdir(resolve(root, 'tests')))
  .filter(name => name.endsWith('.mjs'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric:true }));
const selected = quick
  ? all.filter(name => ['smoke.mjs', 'admin.mjs', 'astronomy-social.mjs', 'extrems-dia.mjs', 'fiabilitat-bloc1.mjs', 'forecast-episodes.mjs', 'forecast-videos.mjs', 'meteocat-severe-alerts.mjs', 'mobile-audit-fixes.mjs', 'morning-schedule.mjs', 'social-periodic.mjs', 'social-publication-quality.mjs', 'station-records.mjs', 'youtube-short.mjs', 'v22-2.mjs', 'v22-12.mjs', 'v22-30-1.mjs', 'v22-31.mjs', 'v22-32.mjs'].includes(name))
  : all;

if (quick && !selected.includes('audit-data-dates.mjs')) selected.push('audit-data-dates.mjs');
if (quick && !selected.includes('audit-social-delivery.mjs')) selected.push('audit-social-delivery.mjs');
if (quick && !selected.includes('audit-rain-coverage.mjs')) selected.push('audit-rain-coverage.mjs');
if (quick && !selected.includes('audit-history-charts.mjs')) selected.push('audit-history-charts.mjs');
if (quick && !selected.includes('audit-seo-video.mjs')) selected.push('audit-seo-video.mjs');
if (quick && !selected.includes('forecast-dayparts.mjs')) selected.push('forecast-dayparts.mjs');
if (quick && !selected.includes('fonta-model.mjs')) selected.push('fonta-model.mjs');
if (quick && !selected.includes('fonta-foundations.mjs')) selected.push('fonta-foundations.mjs');
if (quick && !selected.includes('fonta-independent.mjs')) selected.push('fonta-independent.mjs');
if (quick && !selected.includes('environment-missing-values.mjs')) selected.push('environment-missing-values.mjs');
if (quick && !selected.includes('environment-freshness.mjs')) selected.push('environment-freshness.mjs');
if (quick && !selected.includes('social-production.mjs')) selected.push('social-production.mjs');
if (quick) for(const name of ['publication-state.mjs','youtube-recovery.mjs','home-forecast.mjs','forecast-bias-experiment.mjs']) if(!selected.includes(name))selected.push(name);

for (const file of selected) {
  const result = spawnSync(process.execPath, [resolve(root, 'tests', file)], { cwd:root, stdio:'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Comprovacions completades: ${selected.length} fitxers.`);
