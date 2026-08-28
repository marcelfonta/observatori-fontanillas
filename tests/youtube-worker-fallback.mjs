import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { youtubeShortFallbackSlot } from '../worker/index.js';

assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T05:20:00.000Z')),'mati');
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T05:39:59.000Z')),'mati');
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T05:40:00.000Z')),null);
assert.equal(youtubeShortFallbackSlot(new Date('2026-08-28T17:45:00.000Z')),'vespre');
assert.equal(youtubeShortFallbackSlot(new Date('2026-12-10T18:45:00.000Z')),'vespre');

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');

assert.match(worker,/GITHUB_SHORTS_DISPATCH_TOKEN/);
assert.match(worker,/actions\/workflows\/youtube-short-private\.yml\/dispatches/);
assert.match(worker,/youtube-short-runs/);
assert.match(worker,/youtube-shorts-fallback/);
assert.match(worker,/youtube-shorts-scheduler/);
assert.match(worker,/No s’ha pogut preparar el YouTube Short/);
assert.match(worker,/YOUTUBE_SHORT_DISPATCH_ACK_MS=8\*60\*1000/);
assert.match(worker,/skipped:'awaiting_github'/);
assert.match(workflow,/Coordina una sola execució per franja/);
assert.match(workflow,/YOUTUBE_SHORT_SHOULD_RUN/);
assert.match(workflow,/Confirma la franja completada/);

console.log('Recuperació alternativa dels Shorts: correcta');
