import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [html,routes,shell,seo,security,roadmap]=await Promise.all([
  read('index.html'),read('src/core/portal-routes.js'),read('src/features/portal-shell.js'),read('src/features/seo.js'),read('.well-known/security.txt'),read('ROADMAP.md')
]);

assert.match(routes,/'observatori'/);
assert.match(shell,/Sobre l’Observatori/);
assert.match(seo,/observatori:\{ca:/);
assert.match(html,/Marcel Fontanillas/);
assert.match(html,/VEVOR YT60234/);
assert.match(html,/no disposa encara d’un certificat de calibratge independent/);
assert.match(html,/No es publica l’adreça exacta/);
assert.match(html,/Meteo Fontanillas[^]*Fonta/);
assert.match(html,/value="Seguretat">Seguretat o vulnerabilitat/);
assert.match(security,/^Contact: https:\/\/meteo\.fontanillas\.cat\/contacte$/m);
assert.match(security,/^Expires: 2027-10-22T23:59:59Z$/m);
assert.doesNotMatch(security,/mailto:|@fontanillas/i);
assert.match(roadmap,/fotografies públiques revisades/);

console.log('Confiança: autoria, equipament, límits i canal de seguretat verificats.');
