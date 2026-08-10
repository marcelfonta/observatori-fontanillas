import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFile(resolve(root,file),'utf8');
const [html,css,dataCenter,push,worker,privacy,admin,sitemap,config,headers]=await Promise.all([
  read('index.html'),read('css/portal.css'),read('src/features/data-center.js'),read('src/features/push.js'),read('worker/index.js'),read('privacitat.html'),read('administracio.html'),read('sitemap.xml'),read('src/core/config.js'),read('_headers')
]);
assert.match(css,/data-center-grid--calendar \{ grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
assert.match(css,/@media \(max-width: 1200px\)/);
assert.ok(!dataCenter.includes('°C de mitjana'));
assert.match(html,/data-portal-page="aprendre"/);
assert.match(html,/data-learning-answer="correct"/);
assert.match(privacy,/control antiabús/);
assert.match(worker,/contact-ip:/);
assert.match(worker,/contact-email:/);
assert.ok(!html.includes('cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'));
assert.match(push,/loadOneSignalSdk/);
assert.match(config,/oneSignalAppId: '108a857e-d115-4fc9-85b4-0a84fb0936f4'/);
assert.match(headers,/script-src[^;]*https:\/\/api\.onesignal\.com/);
assert.match(push,/sdkReadyTimer/);
assert.match(push,/Esperant el permís del navegador/);
assert.match(push,/waitUntil/);
assert.match(push,/permission-not-granted/);
assert.match(push,/setPushActionState/);
assert.match(admin,/admin-publication-pill/);
assert.match(sitemap,/page=aprendre/);
assert.match(sitemap,/privacitat\.html/);
console.log('Test V19 de disseny, privacitat i publicació: correcte');
