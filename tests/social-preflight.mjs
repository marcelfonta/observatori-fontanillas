import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { socialPreflightChannels, socialPreflightFailureSignature, shouldNotifySocialPreflightFailure } from '../worker/index.js';

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');

assert.deepEqual(socialPreflightChannels({}),[],'Els canals sense credencials no han de generar incidències.');
assert.deepEqual(socialPreflightChannels({TELEGRAM_BOT_TOKEN:'bot',TELEGRAM_CHANNEL_ID:'canal'}),['telegram']);
assert.deepEqual(socialPreflightChannels({BLUESKY_HANDLE:'meteo.test',BLUESKY_APP_PASSWORD:'secret'}),['bluesky']);
assert.deepEqual(socialPreflightChannels({
  BUFFER_API_KEY:'x'.repeat(24),BUFFER_TIKTOK_AUTOMATION_ENABLED:'true',BUFFER_X_AUTOMATION_ENABLED:'true',
}),['tiktok','x']);
assert.match(worker,/diagnoseBufferPreflight\(bufferChannels,env\)/,'X i TikTok han de compartir una sola comprovació de Buffer.');
const now=Date.parse('2026-10-27T06:30:00Z');
const previous={detail:'same',last_notified_at:'2026-10-26T20:30:00Z'};
assert.equal(shouldNotifySocialPreflightFailure(previous,'same',now,'2026-10-27T10:31:00Z'),false,'No s’han de repetir correus durant una pausa de Buffer coneguda.');
assert.equal(shouldNotifySocialPreflightFailure(previous,'same',now,'2026-10-27T05:00:00Z'),true,'Després del desbloqueig es pot avisar si persisteix la fallada.');
assert.equal(shouldNotifySocialPreflightFailure(previous,'new',now,'2026-10-27T10:31:00Z'),true,'Una fallada diferent es notifica.');
assert.equal(shouldNotifySocialPreflightFailure({detail:'same',last_notified_at:'2026-10-27T04:30:00Z'},'same',now),false,'Els avisos idèntics conserven la pausa normal de sis hores.');

const a=socialPreflightFailureSignature([{channel:'x',detail:'429',rateLimited:true},{channel:'tiktok',detail:'429',rateLimited:true}]);
const b=socialPreflightFailureSignature([{channel:'tiktok',detail:'429',rateLimited:true},{channel:'x',detail:'429',rateLimited:true}]);
assert.equal(a,b,'La signatura ha de ser estable encara que canviï l’ordre.');

console.log('Comprovació social preventiva: correcta');
