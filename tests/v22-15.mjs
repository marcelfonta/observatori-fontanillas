import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const push = await readFile(resolve(root, 'src/features/push.js'), 'utf8');

assert.match(push, /async function requestOneSignalPermission/);
assert.match(push, /notifications\.requestPermission\(\)/);
assert.doesNotMatch(push, /Notification\.requestPermission\(\)/);
assert.match(push, /async function waitForPushSubscription/);
assert.match(push, /pushSubscriptionApi\(\)\.optIn\(\)/);
assert.match(push, /OneSignal no ha creat la subscripció remota/);
console.log('Test V22.15: registre remot de OneSignal governat per l’SDK');
