import assert from 'node:assert/strict';
import { shouldRunScheduledBackup } from '../scripts/youtube-backup-window.mjs';

assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T04:14:59.000Z')),false);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T04:15:00.000Z')),true);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T04:34:59.000Z')),true);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T04:35:00.000Z')),false);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-12-10T05:20:00.000Z')),true);
assert.equal(shouldRunScheduledBackup('vespre',new Date('2026-08-28T18:00:00.000Z')),true);
assert.equal(shouldRunScheduledBackup('vespre',new Date('2026-08-28T18:15:00.000Z')),false);
assert.equal(shouldRunScheduledBackup('vespre',new Date('2026-12-10T19:00:00.000Z')),true);

console.log('Finestra de reserva dels Shorts: correcta');
