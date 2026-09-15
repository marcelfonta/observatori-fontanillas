import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  bufferTikTokRecoverySlot,
  bufferXRecoverySlot,
  dueMetaVideoSlots,
  youtubeShortFallbackSlot,
} from '../worker/index.js';
import { shouldRunScheduledBackup } from '../scripts/youtube-backup-window.mjs';
import { plannedPublishAt } from '../scripts/youtube-publish-at.mjs';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [worker, example, staging, workflow, adminPage, adminFeature] = await Promise.all([
  read('worker/index.js'),
  read('ops/wrangler.example.jsonc'),
  read('ops/wrangler.staging.template.jsonc'),
  read('.github/workflows/youtube-short-private.yml'),
  read('administracio.html'),
  read('src/features/admin.js'),
]);

for (const source of [worker, example]) {
  assert.match(source, /06:45,14:00,20:30/, 'L’horari diari ha de començar a les 06:45.');
  assert.match(source, /06:30,13:45,20:15/, 'La comprovació preventiva ha de començar a les 06:30.');
}
for (const source of [worker, example, staging]) {
  assert.match(source, /06:45,20:30/, 'Els vídeos de Meta han de conservar les franges 06:45 i 20:30.');
}
assert.match(workflow, /cron: '20 4 \* \* \*'/);
assert.match(workflow, /cron: '20 5 \* \* \*'/);
assert.match(adminPage, /Reel \+ Story a les 06:45 i 20:30/);
assert.match(adminFeature, /schedule\.youtube\|\|'06:05,19:45'/);

// Europe/Madrid és UTC+2 a l’estiu i UTC+1 a l’hivern.
assert.equal(plannedPublishAt('mati', new Date('2026-08-26T04:20:00Z')).toISOString(), '2026-08-26T04:45:00.000Z');
assert.equal(plannedPublishAt('mati', new Date('2026-12-10T05:00:00Z')).toISOString(), '2026-12-10T05:45:00.000Z');
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-26T04:45:00Z')), ['morning']);
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-26T04:05:00Z')), 'mati');
assert.equal(shouldRunScheduledBackup('mati', new Date('2026-08-26T04:20:00Z')), true);
assert.equal(bufferTikTokRecoverySlot(new Date('2026-08-26T04:05:00Z')), 'morning');
assert.equal(bufferXRecoverySlot(new Date('2026-08-26T04:05:00Z')), 'morning');

// Les franges de migdia i vespre es mantenen intactes.
assert.deepEqual(dueMetaVideoSlots({}, new Date('2026-08-26T18:30:00Z')), ['evening']);
assert.equal(plannedPublishAt('vespre', new Date('2026-08-26T16:00:00Z')).toISOString(), '2026-08-26T18:30:00.000Z');

console.log('Horari matinal 06:45 i sistemes de reserva: correctes');
