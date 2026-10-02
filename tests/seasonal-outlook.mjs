import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import { seasonalPublicationState } from '../src/features/seasonal-outlook.js';

const beforeOctober=seasonalPublicationState(new Date('2026-10-02T06:00:00Z'),'ca-ES');
assert.equal(beforeOctober.key,'2026-09');
assert.equal(beforeOctober.sourceOffset,1);
assert.match(beforeOctober.available,/octubre del? 2026/i);
assert.match(beforeOctober.pending,/edició de setembre/i);
assert.match(beforeOctober.pending,/5 d’octubre/i);

const afterOctober=seasonalPublicationState(new Date('2026-10-05T17:00:00Z'),'ca-ES');
assert.equal(afterOctober.key,'2026-10');
assert.equal(afterOctober.sourceOffset,0);
assert.match(afterOctober.available,/octubre del? 2026/i);

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/data-seasonal-lead="0"/);
assert.equal((html.match(/data-seasonal-product=/g)||[]).length,8);

console.log('Edició mensual de Meteocat: correcta');
