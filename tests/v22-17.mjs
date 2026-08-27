import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const [worker,push,privacy] = await Promise.all([
  readFile(resolve(root, 'worker/index.js'), 'utf8'),
  readFile(resolve(root, 'src/features/push.js'), 'utf8'),
  readFile(resolve(root, 'privacitat.html'), 'utf8'),
]);

assert.match(worker, /CREATE_PUSH_SUBSCRIPTIONS/);
assert.match(worker, /async function savePushPreferences/);
assert.match(worker, /url\.pathname === "\/push-preferences"/);
assert.match(worker, /async function registeredPushRecipients/);
assert.match(worker, /include_subscription_ids:registeredRecipients/);
assert.match(push, /async function syncPushPreferences/);
assert.match(push, /\/push-preferences/);
assert.match(privacy, /identificador tècnic de subscripció/);

console.log('Test V22.17: preferències push verificables i destinataris persistents');
