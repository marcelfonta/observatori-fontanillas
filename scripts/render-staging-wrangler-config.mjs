import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseId = String(process.env.STAGING_D1_DATABASE_ID || '');
const output = process.argv[2] || '/tmp/wrangler.staging.jsonc';
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(databaseId)) {
  throw new Error('STAGING_D1_DATABASE_ID no té un format vàlid.');
}
const template = await readFile(new URL('../ops/wrangler.staging.template.jsonc', import.meta.url), 'utf8');
const config = JSON.parse(template.replace('__STAGING_D1_DATABASE_ID__', databaseId));
const workerFile = fileURLToPath(new URL('../worker/index.js', import.meta.url));
config.main = relative(dirname(output), workerFile);
await writeFile(output, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Configuració de staging preparada a ${output}.`);
