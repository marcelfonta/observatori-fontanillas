import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dueMetaVideoSlots, metaVideoAutomationEnabled } from '../worker/index.js';

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const admin = await readFile(new URL('../src/features/admin.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../administracio.html', import.meta.url), 'utf8');
const exampleConfig = await readFile(new URL('../ops/wrangler.example.jsonc', import.meta.url), 'utf8');

for (const token of [
  'publishInstagramStory', 'publishFacebookStory', "media_type:'STORIES'",
  '/video_stories', 'social-stories:', 'adminSocialStoryTest',
  '/admin/social-stories/test', 'checkInstagramStory', 'storyContainerId',
  'facebookStoryVideoId', 'facebookStoryUploadUrl', 'facebookStoryStage',
  'runAutomaticMetaVideos', 'META_VIDEO_AUTOMATION_ENABLED',
  "observedJob('meta-video',runAutomaticMetaVideos(env))",
  'publishSocialReelsForSlot', 'publishSocialStoriesForSlot',
]) assert.ok(worker.includes(token), `Falta la protecció o el flux de Stories: ${token}`);

assert.match(worker, /upload_phase:'start'/, 'Facebook Stories ha d’inicialitzar una sessió de pujada.');
assert.match(worker, /upload_phase:'finish'/, 'Facebook Stories ha de finalitzar explícitament la publicació.');
assert.match(worker, /if\(!reels\.ok\)\{results\.push\(\{slot,stage:'reels'/, 'Les Stories no poden començar fins que els dos Reels siguin correctes.');
assert.match(worker, /previous\?\.status === 'healthy'.*alreadyCompleted:true/, 'Els reintents han de reutilitzar una franja ja completada.');
assert.match(worker, /META_VIDEO_AUTOMATIC_MAX_ATTEMPTS=4/, 'L’automatització ha de limitar els errors definitius.');
assert.match(worker, /META_VIDEO_AUTOMATIC_WINDOW_MINUTES=90/, 'L’automatització no ha de recuperar franges obsoletes moltes hores tard.');
assert.match(admin, /runSocialStoryTest/, 'El panell ha de demanar una prova explícita de Stories.');
assert.match(admin, /window\.confirm\(`Vols publicar ara el Short/, 'La prova de Stories ha de requerir confirmació humana.');
assert.match(page, /admin-social-stories-morning/, 'Falta el botó de Stories del matí.');
assert.match(page, /admin-social-stories-evening/, 'Falta el botó de Stories del vespre.');
assert.match(page, /admin-meta-video-operation/, 'El panell ha de mostrar el resultat de l’automatització de Meta.');
assert.match(exampleConfig, /"META_VIDEO_AUTOMATION_ENABLED": "false"/, 'La configuració d’exemple ha de continuar sent segura per defecte.');

assert.equal(metaVideoAutomationEnabled({ META_VIDEO_AUTOMATION_ENABLED:'true' }), true);
assert.equal(metaVideoAutomationEnabled({ META_VIDEO_AUTOMATION_ENABLED:'false' }), false);
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-29T05:59:00Z')), [], 'Abans de les 08:00 locals no s’ha de publicar cap vídeo de Meta.');
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-29T06:00:00Z')), ['morning'], 'A les 08:00 locals ha de quedar disponible la franja del matí.');
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-29T18:30:00Z')), ['evening'], 'A les 20:30 locals ha de quedar disponible només la franja vigent del vespre.');
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-29T19:31:00Z')), ['evening'], 'La franja del matí no s’ha de recuperar moltes hores tard.');
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-29T20:01:00Z')), [], 'Cap franja no s’ha de publicar quan la finestra segura ja ha passat.');
assert.deepEqual(dueMetaVideoSlots({ META_VIDEO_AUTO_TIMES:'20:30' }, new Date('2026-08-29T18:30:00Z')), ['evening'], 'La configuració ha de poder desactivar una franja concreta.');

console.log('Flux de Reels i Stories automàtic, ordenat i protegit: correcte');
