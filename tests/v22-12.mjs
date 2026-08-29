import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const worker = await readFile(resolve(root, 'worker/index.js'), 'utf8');
const schema = await readFile(resolve(root, 'worker/schema.sql'), 'utf8');
const project = JSON.parse(await readFile(resolve(root, 'project.json'), 'utf8'));

assert.equal(project.version, '22.22.2');
assert.match(worker, /WORKER_VERSION = "22\.22\.2"/);
assert.match(worker, /publicWorkerBaseUrl/);
assert.match(worker, /Meta must receive a stable image response/);
assert.match(worker, /materializeSocialCard/);
assert.match(worker, /social-cards\//);
assert.match(worker, /SOCIAL_VIDEO_BUCKET\.put\(key, image/);
assert.match(worker, /cleanupSocialCards/);
assert.doesNotMatch(worker, /fetch\(readinessUrl/);
assert.doesNotMatch(worker, /Worker públic no coincideix/);
assert.match(worker, /ONESIGNAL_API_KEY \|\| env\.ONESIGNAL_REST_API_KEY/);
assert.match(worker, /runDatabaseMaintenance/);
assert.match(worker, /PERSIST_ON_REQUEST/);
assert.match(worker, /ON CONFLICT\(observed_epoch\) DO NOTHING/);
assert.match(worker, /El canal no té les credencials necessàries configurades a Cloudflare/);
assert.match(worker, /oneSignalConfigurationMessage/);
assert.match(schema, /idx_contact_rate_limit_ip_time/);
assert.match(schema, /idx_ai_rate_limit_ip_time/);
console.log('Test V22.22.2: protecció D1 i diagnòstic operatiu');
