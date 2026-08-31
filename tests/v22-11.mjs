import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,worker,style,project,serviceWorker]=await Promise.all([
  read('index.html'),read('worker/index.js'),read('css/style.css'),read('project.json'),read('service-worker.js')
]);

assert.equal(JSON.parse(project).version,'22.28.0');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-28-0-xarxes'));
assert.ok(page.includes('ESTOFEX: vigilància de tempestes severes')&&page.includes('No és un avís oficial')&&page.includes('AEMET, Meteocat, Protecció Civil i 112 prevalen sempre'));
assert.ok(style.includes('.estofex-card'));
assert.ok(worker.includes("function alertPushStateKey")&&worker.includes("reason:'no_recipients'")&&worker.includes('canRetryAlertPush'));
assert.ok(!worker.includes("key:'alert_all',relation:'=',value:'1'"));
assert.ok(worker.includes('oneSignalMessageAccepted'));

console.log('Test V22.28.0: avisos push fiables i ESTOFEX complementari');
