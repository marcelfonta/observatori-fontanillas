import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { socialPreflightChannels, socialPreflightFailureSignature } from '../worker/index.js';

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');

assert.deepEqual(socialPreflightChannels({}),[],'Els canals sense credencials no han de generar incidències.');
assert.deepEqual(socialPreflightChannels({TELEGRAM_BOT_TOKEN:'bot',TELEGRAM_CHANNEL_ID:'canal'}),['telegram']);
assert.deepEqual(socialPreflightChannels({BLUESKY_HANDLE:'meteo.test',BLUESKY_APP_PASSWORD:'secret'}),['bluesky']);
assert.deepEqual(socialPreflightChannels({
  BUFFER_API_KEY:'x'.repeat(24),BUFFER_TIKTOK_AUTOMATION_ENABLED:'true',BUFFER_X_AUTOMATION_ENABLED:'true',
}),['tiktok','x']);
assert.match(worker,/diagnoseBufferPreflight\(bufferChannels,env\)/,'X i TikTok han de compartir una sola comprovació de Buffer.');
assert.match(worker,/date\.getTime\(\)-notifiedAt<6\*60\*60_000/,'Els avisos idèntics han de tenir una pausa de sis hores.');

const a=socialPreflightFailureSignature([{channel:'x',detail:'429',rateLimited:true},{channel:'tiktok',detail:'429',rateLimited:true}]);
const b=socialPreflightFailureSignature([{channel:'tiktok',detail:'429',rateLimited:true},{channel:'x',detail:'429',rateLimited:true}]);
assert.equal(a,b,'La signatura ha de ser estable encara que canviï l’ordre.');

console.log('Comprovació social preventiva: correcta');
