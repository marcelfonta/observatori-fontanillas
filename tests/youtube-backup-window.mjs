import assert from 'node:assert/strict';
import { shouldRunScheduledBackup } from '../scripts/youtube-backup-window.mjs';

assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T05:29:59.000Z')),false);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T05:30:00.000Z')),true);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T05:49:59.000Z')),true);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-08-28T05:50:00.000Z')),false);
assert.equal(shouldRunScheduledBackup('mati',new Date('2026-12-10T06:35:00.000Z')),true);
assert.equal(shouldRunScheduledBackup('vespre',new Date('2026-08-28T18:00:00.000Z')),true);
assert.equal(shouldRunScheduledBackup('vespre',new Date('2026-08-28T18:15:00.000Z')),false);
assert.equal(shouldRunScheduledBackup('vespre',new Date('2026-12-10T19:00:00.000Z')),true);

console.log('Finestra de reserva dels Shorts: correcta');
