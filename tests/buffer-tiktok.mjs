import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');
const admin = await readFile(new URL('../administracio.html', import.meta.url), 'utf8');

assert.match(worker, /BUFFER_API_KEY/);
assert.match(worker, /BUFFER_TIKTOK_AUTOMATION_ENABLED/);
assert.match(worker, /buffer-video/);
assert.match(worker, /admin\/buffer-tiktok\/test/);
assert.match(worker, /buffer-tiktok/);
assert.match(worker, /saveToDraft:true/);
assert.match(workflow, /Deixa el TikTok preparat a Buffer/);
assert.match(workflow, /buffer-tiktok/);
assert.match(admin, /Prova segura de TikTok amb Buffer/);

console.log('Cua segura de TikTok amb Buffer: correcta');
