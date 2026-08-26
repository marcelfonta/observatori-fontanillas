import assert from 'node:assert/strict';
import { plannedPublishAt } from '../scripts/youtube-publish-at.mjs';

assert.equal(plannedPublishAt('mati',new Date('2026-08-26T04:30:00.000Z')).toISOString(),'2026-08-26T06:00:00.000Z');
assert.equal(plannedPublishAt('vespre',new Date('2026-08-26T16:00:00.000Z')).toISOString(),'2026-08-26T18:30:00.000Z');
assert.equal(plannedPublishAt('mati',new Date('2026-12-10T05:00:00.000Z')).toISOString(),'2026-12-10T07:00:00.000Z');
assert.equal(plannedPublishAt('mati',new Date('2026-10-25T04:30:00.000Z')).toISOString(),'2026-10-25T07:00:00.000Z');
assert.throws(()=>plannedPublishAt('mati',new Date('2026-08-26T05:50:00.000Z')),/No queda marge/);

console.log('Test de la programació exacta de Shorts: correcte');
