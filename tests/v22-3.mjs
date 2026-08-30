import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const [worker,push,index,admin,adminFeature,serviceWorker,project]=await Promise.all([
  read('worker/index.js'),read('src/features/push.js'),read('index.html'),read('administracio.html'),
  read('src/features/admin.js'),read('service-worker.js'),read('project.json')
]);

assert.equal(JSON.parse(project).version,'22.24.0');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-24-0-xarxes'));
for(const token of ['socialSlotProfile','Balanç del dia','Actualització del migdia','MeteoCatalunya','afterTomorrow'])assert.ok(worker.includes(token),`Falta la millora social ${token}`);
assert.ok(index.includes('id="push-device-diagnostic"')&&push.includes('renderDeviceDiagnostic'),'Falta la diagnosi push per dispositiu.');
assert.ok(index.includes('Enviar prova real')&&push.includes('/push-test'),'La prova ha d’explicar que usa el servei real.');
assert.ok(admin.includes('YouTube Shorts · flux separat')&&admin.includes('Veure automatitzacions'),'YouTube no és visible al panell.');
assert.ok(adminFeature.includes('Credencials preparades'),'El panell no interpreta l’estat de YouTube.');

console.log('Test V22.3: diagnosi push, publicacions contextuals i YouTube visibles');
