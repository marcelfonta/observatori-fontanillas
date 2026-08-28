import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const admin = await readFile(new URL('../src/features/admin.js', import.meta.url), 'utf8');
const page = await readFile(new URL('../administracio.html', import.meta.url), 'utf8');

for (const token of [
  'publishInstagramStory', 'publishFacebookStory', "media_type:'STORIES'",
  '/video_stories', 'social-stories:', 'adminSocialStoryTest',
  '/admin/social-stories/test', 'checkInstagramStory', 'storyContainerId',
  'facebookStoryVideoId', 'facebookStoryUploadUrl', 'facebookStoryStage',
]) assert.ok(worker.includes(token), `Falta la protecció o el flux de Stories: ${token}`);

assert.match(worker, /upload_phase:'start'/, 'Facebook Stories ha d’inicialitzar una sessió de pujada.');
assert.match(worker, /upload_phase:'finish'/, 'Facebook Stories ha de finalitzar explícitament la publicació.');
assert.match(admin, /runSocialStoryTest/, 'El panell ha de demanar una prova explícita de Stories.');
assert.match(admin, /window\.confirm\(`Vols publicar ara el Short/, 'La prova de Stories ha de requerir confirmació humana.');
assert.match(page, /admin-social-stories-morning/, 'Falta el botó de Stories del matí.');
assert.match(page, /admin-social-stories-evening/, 'Falta el botó de Stories del vespre.');

console.log('Flux de Stories manual, independent i protegit: correcte');
