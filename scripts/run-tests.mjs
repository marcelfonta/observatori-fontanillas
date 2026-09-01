import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const quick = process.argv.includes('--quick');
const all = (await readdir(resolve(root, 'tests')))
  .filter(name => name.endsWith('.mjs'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric:true }));
const selected = quick
  ? all.filter(name => ['smoke.mjs', 'admin.mjs', 'forecast-videos.mjs', 'meteocat-severe-alerts.mjs', 'social-periodic.mjs', 'social-publication-quality.mjs', 'youtube-short.mjs', 'v22-2.mjs', 'v22-12.mjs', 'v22-30-1.mjs'].includes(name))
  : all;

for (const file of selected) {
  const result = spawnSync(process.execPath, [resolve(root, 'tests', file)], { cwd:root, stdio:'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Comprovacions completades: ${selected.length} fitxers.`);
