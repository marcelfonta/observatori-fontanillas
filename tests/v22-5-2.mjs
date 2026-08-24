import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [index,style,portal,footer,admin,alerts,worker,config,roadmap]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../css/style.css',import.meta.url),'utf8'),
  readFile(new URL('../css/portal.css',import.meta.url),'utf8'),
  readFile(new URL('../src/features/footer-social.js',import.meta.url),'utf8'),
  readFile(new URL('../src/features/admin.js',import.meta.url),'utf8'),
  readFile(new URL('../src/modules/avisos.js',import.meta.url),'utf8'),
  readFile(new URL('../worker/index.js',import.meta.url),'utf8'),
  readFile(new URL('../ops/wrangler.example.jsonc',import.meta.url),'utf8'),
  readFile(new URL('../ROADMAP.md',import.meta.url),'utf8'),
]);

for(const token of ['BLUESKY_HANDLE','TELEGRAM_CHANNEL_ID','CONTACT_FROM','ONESIGNAL_APP_ID'])assert.ok(config.includes(token),`Falta el paràmetre persistent ${token}`);
assert.ok(footer.includes('header-social-more')&&style.includes('.header-social-more__panel'),'Falta l’accés mòbil a totes les xarxes.');
assert.ok(style.includes('background:#0b211a')&&style.includes('.social-link--more>span{position:static;width:auto;height:auto;overflow:visible'),'El menú mòbil de xarxes ha de tenir un fons opac i etiquetes llegibles.');
assert.ok(index.includes('environment-viewer-mobile-launch')&&portal.includes('environment-viewer-frame--jellyfish iframe { display: none; }'),'Falta l’alternativa mòbil del mapa de meduses.');
assert.ok(index.includes('no implica necessàriament afectació a tot el municipi')&&alerts.includes('que inclou Sant Celoni')&&worker.includes('no implica necessàriament afectació a tot el municipi'),'L’abast territorial dels avisos no queda explicat.');
assert.ok(admin.includes('publicació pendent d’aprovació'),'TikTok no diferencia connexió i aprovació de publicació.');
assert.ok(index.includes('<title>Observatori Meteorològic Fontanillas · Sant Celoni</title>'),'El títol principal i social no estan unificats.');
assert.ok(roadmap.includes('V22.5.2 — Mòbil, transparència i configuració resilient'));

console.log('Test V22.5.2: configuració resilient, transparència TikTok i millores mòbils');
