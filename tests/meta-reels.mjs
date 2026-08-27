import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const admin = await readFile(new URL('../src/features/admin.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../administracio.html', import.meta.url), 'utf8');

for (const token of [
  'publishInstagramReel', 'publishFacebookReel', 'media_type:\'REELS\'',
  '/video_reels', 'social-reels:', 'adminSocialReelTest',
  '/admin/social-reels/test', 'SOCIAL_REEL_SLOT', 'socialVideoUrl(key, env, 3600)',
]) assert.ok(worker.includes(token), `Falta la protecció o el flux de Reels: ${token}`);

assert.match(worker, /request\.method === 'HEAD'/, 'La URL temporal ha d’acceptar comprovacions HEAD de Meta.');
assert.match(worker, /Content-Length/, 'La URL temporal ha de facilitar la mida del vídeo quan R2 la coneix.');
assert.match(admin, /runSocialReelTest/, 'El panell ha de demanar una prova explícita.');
assert.match(admin, /window\.confirm\(`Vols publicar ara el Short/, 'La prova ha de requerir confirmació humana.');
assert.match(page, /admin-social-reels-morning/, 'Falta el botó de prova del matí.');
assert.match(page, /admin-social-reels-evening/, 'Falta el botó de prova del vespre.');

console.log('Flux de Reels manual i protegit: correcte');
