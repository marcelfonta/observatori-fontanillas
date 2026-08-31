import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const [worker,push,adminPage,adminFeature,serviceWorker,project]=await Promise.all([
  read('worker/index.js'),read('src/features/push.js'),read('administracio.html'),
  read('src/features/admin.js'),read('service-worker.js'),read('project.json')
]);

assert.equal(JSON.parse(project).version,'22.29.0');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-29-0-xarxes'));
assert.ok(push.includes('const INVITE_DELAY_MS = 10000;'),'La invitació push ha d’esperar deu segons.');
assert.ok(push.includes("document.visibilityState==='visible'"),'La invitació no ha d’obrir-se sobre una pestanya amagada.');
assert.ok(worker.includes('runDailyIntegrationPreflight'),'Falta la comprovació preventiva diària.');
assert.ok(worker.includes("DEFAULT_SOCIAL_PREFLIGHT_TIMES='06:45,13:45,20:15'"),'Falten comprovacions preventives abans de cada franja social.');
assert.ok(worker.includes('const serviceKey=`social-preflight:${localDate}:${slot}`')&&worker.includes('.bind(serviceKey'),'Falta persistir el resultat preventiu per franja.');
assert.ok(worker.includes("'[Observatori] Connexió social no preparada'"),'Falta l’avís operatiu de connexions socials.');
assert.ok(adminPage.includes('id="admin-social-preflight"')&&adminFeature.includes("text('admin-social-preflight'"),'El panell no mostra la comprovació preventiva.');

console.log('Test V22.2: invitació respectuosa i comprovació social preventiva correctes');
