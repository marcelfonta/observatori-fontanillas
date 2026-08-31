import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bufferXRecoverySlot, truncateBufferXText, xWeightedLength } from '../worker/index.js';

const worker = await readFile(new URL('../worker/index.js', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');
const admin = await readFile(new URL('../administracio.html', import.meta.url), 'utf8');
const adminJs = await readFile(new URL('../src/features/admin.js', import.meta.url), 'utf8');

assert.match(worker, /bufferChannel\(env, 'twitter', 'X'\)/);
assert.match(worker, /buffer-x:\$\{localDate\}:\$\{safeSlot\}/);
assert.match(worker, /BUFFER_X_MAX_ATTEMPTS = 4/);
assert.match(worker, /observedJob\('buffer-x-recovery'/);
assert.match(worker, /remote\?\.status === 'sent'/);
assert.match(worker, /attempts >= BUFFER_X_MAX_ATTEMPTS/);
assert.match(worker, /assets = \[\{ video:\{ url:await bufferVideoUrl\(key, env\) \} \}\]/);
assert.doesNotMatch(worker, /assets = \[\{ video:\{ url:await bufferVideoUrl\(key, env\), metadata/);
assert.match(worker, /text:bufferXSpecialCaption\(draft\)/);
assert.match(worker, /pendingSocialRetryChannels\(draft,publications\)/);
assert.match(worker, /skipped:'max_attempts'/);
assert.match(workflow, /Deixa el vídeo d’X preparat a Buffer/);
assert.match(workflow, /admin\/buffer-x\/schedule/);
assert.match(admin, /id="admin-social-x"/);
assert.match(admin, /id="admin-buffer-x-operation"/);
assert.match(adminJs, /x:'X'/);

// Europe/Madrid és UTC+2 el 29 d’agost: recuperació abans i fins a 90 minuts després.
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T04:20:00.000Z')), 'morning');
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T06:29:59.000Z')), 'morning');
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T06:30:00.000Z')), null);
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T12:00:00.000Z')), 'midday');
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T13:29:59.000Z')), 'midday');
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T17:45:00.000Z')), 'evening');
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T19:59:59.000Z')), 'evening');
assert.equal(bufferXRecoverySlot(new Date('2026-08-29T20:00:00.000Z')), null);

// X aplica longitud ponderada: els enllaços valen 23 i un emoji complet val 2.
assert.equal(xWeightedLength('café'), 4);
assert.equal(xWeightedLength('Hola 👋 https://example.com/una-ruta-molt-llarga'), 31);
assert.equal(xWeightedLength('👨‍👩‍👧‍👦'), 2);
const shortened=truncateBufferXText(`${'Bon dia! '.repeat(40)}https://meteo.fontanillas.cat/`);
assert.ok(xWeightedLength(shortened)<=240);
assert.ok(shortened.endsWith('…'));

console.log('Automatització X amb Buffer: correcta');
