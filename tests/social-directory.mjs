import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = file => readFile(resolve(root, file), 'utf8');
const [page, config, sitemap, serviceWorker, artwork] = await Promise.all([
  read('xarxes.html'),
  read('src/core/config.js'),
  read('sitemap.xml'),
  read('service-worker.js'),
  read('assets/social/publicacio-xarxes-v22-24.svg')
]);

const profiles = [
  'https://www.instagram.com/meteo_fontanillas/',
  'https://www.youtube.com/@MeteoFontanillas',
  'https://www.tiktok.com/@meteo_fontanillas',
  'https://www.facebook.com/meteofontanillas',
  'https://x.com/meteo_fonta',
  'https://whatsapp.com/channel/0029VbD9jmL4CrfajJnZIi25',
  'https://www.threads.com/@meteo_fontanillas',
  'https://t.me/meteofontanillas',
  'https://bsky.app/profile/meteofontanillas.bsky.social'
];

for (const profile of profiles) {
  assert.ok(page.includes(profile), `Falta el perfil ${profile} al directori.`);
  assert.ok(config.includes(profile), `El directori i la configuració discrepen per ${profile}.`);
}

assert.ok(page.includes('target="_blank"') && page.includes('rel="noopener noreferrer"'));
assert.equal((page.match(/<span class="mark"><svg/g) || []).length, 9, 'Cada xarxa ha de mostrar el seu logotip.');
assert.ok(!page.includes('Observatori Meteorològic Fontanillas · V'), 'El peu públic no ha de mostrar la versió tècnica.');
assert.ok(sitemap.includes('https://meteo.fontanillas.cat/xarxes.html'));
assert.ok(serviceWorker.includes("'/xarxes.html'") && serviceWorker.includes("'/assets/social/publicacio-xarxes-v22-24.png'"));
assert.ok(artwork.includes('width="1080" height="1350"') && artwork.includes('meteo.fontanillas.cat/xarxes.html'));

const png = await readFile(resolve(root, 'assets/social/publicacio-xarxes-v22-24.png'));
assert.equal(png.readUInt32BE(16), 1080);
assert.equal(png.readUInt32BE(20), 1350);

console.log('Test V22.26.0: directori i creativitat de les nou xarxes');
