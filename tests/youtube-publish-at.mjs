import assert from 'node:assert/strict';
import { plannedPublishAt, youtubePublicationPlan } from '../scripts/youtube-publish-at.mjs';

assert.equal(plannedPublishAt('mati',new Date('2026-08-26T04:30:00.000Z')).toISOString(),'2026-08-26T05:00:00.000Z');
assert.equal(plannedPublishAt('vespre',new Date('2026-08-26T16:00:00.000Z')).toISOString(),'2026-08-26T18:30:00.000Z');
assert.equal(plannedPublishAt('mati',new Date('2026-12-10T05:00:00.000Z')).toISOString(),'2026-12-10T06:00:00.000Z');
assert.equal(plannedPublishAt('mati',new Date('2026-10-25T04:30:00.000Z')).toISOString(),'2026-10-25T06:00:00.000Z');
assert.equal(plannedPublishAt('vespre',new Date('2026-08-26T18:24:41.000Z')).toISOString(),'2026-08-26T18:30:00.000Z');
assert.throws(()=>plannedPublishAt('mati',new Date('2026-08-26T04:56:00.000Z')),/No queda marge/);
assert.deepEqual(youtubePublicationPlan('mati',new Date('2026-08-26T04:30:00.000Z')),{publishAt:new Date('2026-08-26T05:00:00.000Z'),privacy:'private',delaySeconds:0,late:false});
assert.deepEqual(youtubePublicationPlan('mati',new Date('2026-08-26T04:56:00.000Z')),{publishAt:null,privacy:'public',delaySeconds:240,late:false});
assert.deepEqual(youtubePublicationPlan('mati',new Date('2026-08-26T05:20:00.000Z')),{publishAt:null,privacy:'public',delaySeconds:0,late:true});
assert.throws(()=>youtubePublicationPlan('mati',new Date('2026-08-26T06:31:00.000Z')),/ha caducat/);

console.log('Test de la programació exacta de Shorts: correcte');
