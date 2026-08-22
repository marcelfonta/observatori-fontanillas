import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const emptyDatabase = {
  batch: async () => [],
  prepare: () => ({
    first: async () => null,
  }),
};

const response = await worker.fetch(
  new Request('https://fonta-meteo.example/health'),
  { DB:emptyDatabase, ENVIRONMENT:'staging' },
  { waitUntil:() => {} },
);
const payload = await response.json();

assert.equal(response.status, 503);
assert.equal(payload.ok, false);
assert.equal(payload.status, 'not_configured');
assert.deepEqual(payload.missingConfiguration, ['WU_API_KEY']);

console.log('Worker health test: correcte');
