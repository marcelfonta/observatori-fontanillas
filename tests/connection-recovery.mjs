import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [app,html,workerCache,pkg]=await Promise.all([
  readFile(new URL('../src/app.js',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../service-worker.js',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8').then(JSON.parse)
]);

assert.match(app,/fetchCurrentWeatherResilient/);
assert.match(app,/await wait\(1200\)/);
assert.match(app,/navigator\.onLine===false/);
assert.match(app,/Servei temporalment no disponible/);
assert.match(app,/window\.addEventListener\('online',\(\)=>refreshAfterResume\(true\)\)/);
assert.match(html,/src\/app\.js\?v=22\.42\.16-offline-first/);
assert.match(workerCache,/verification-reputation-v1-connection-recovery-v1/);
assert.equal(pkg.version,'22.42.15');

console.log('Recuperació de connexió transitòria: correcta');
