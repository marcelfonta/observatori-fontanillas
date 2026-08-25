import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const worker = await readFile(resolve(root, 'worker/index.js'), 'utf8');

assert.match(worker, /async function health\(env\)/);
assert.match(worker, /ENVIRONMENT\|\|''\)\.toLowerCase\(\)==='staging'/);
assert.match(worker, /weather_source_not_configured/);
assert.match(worker, /status:payload\.status/);
console.log('Test V22.18: salut de staging degradada sense credencial externa');
