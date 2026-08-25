import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const worker = await readFile(resolve(root, 'worker/index.js'), 'utf8');

assert.match(worker, /function oneSignalMessageAccepted\(payload\)/);
assert.match(worker, /if\(!oneSignalMessageAccepted\(payload\)\)/);
assert.match(worker, /deliveryPending:recipients===0/);
assert.match(worker, /delivered:Boolean\(result\.sent\)/);
console.log('Test V22.16: OneSignal confirma la creació pel message ID');
