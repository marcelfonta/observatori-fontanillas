import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const worker = await readFile(resolve(root, 'worker/index.js'), 'utf8');
const schema = await readFile(resolve(root, 'worker/schema.sql'), 'utf8');
const project = JSON.parse(await readFile(resolve(root, 'project.json'), 'utf8'));

assert.equal(project.version, '22.13.0');
assert.match(worker, /WORKER_VERSION = "22\.13\.0"/);
assert.match(worker, /publicWorkerBaseUrl/);
assert.match(worker, /El Worker públic no coincideix/);
assert.match(worker, /ONESIGNAL_API_KEY \|\| env\.ONESIGNAL_REST_API_KEY/);
assert.match(worker, /runDatabaseMaintenance/);
assert.match(schema, /idx_contact_rate_limit_ip_time/);
assert.match(schema, /idx_ai_rate_limit_ip_time/);
console.log('Test V22.13.0: fiabilitat de publicacions, push i manteniment D1');
