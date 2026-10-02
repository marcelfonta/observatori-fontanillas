import assert from 'node:assert/strict';
import { seasonalPublicationState } from '../src/features/seasonal-outlook.js';

const beforeOctober=seasonalPublicationState(new Date('2026-10-02T06:00:00Z'),'ca-ES');
assert.equal(beforeOctober.key,'2026-09');
assert.match(beforeOctober.available,/setembre del? 2026/i);
assert.match(beforeOctober.pending,/5 d’octubre/i);

const afterOctober=seasonalPublicationState(new Date('2026-10-05T17:00:00Z'),'ca-ES');
assert.equal(afterOctober.key,'2026-10');
assert.match(afterOctober.available,/octubre del? 2026/i);

console.log('Edició mensual de Meteocat: correcta');
