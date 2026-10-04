import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeCivilProtectionPlans } from '../worker/index.js';

const sample=[
  {plaacronim:'INUNCAT',planom:'Pla especial d’emergències per inundacions',plaactivat:'SI',plafase:'EMERGÈNCIA',fasedatahora:'03/10/2026 12:59',descripcio:'Pas a ALERTA',comunicatpdf:{url:'https://documents.dadesobertes.gencat.cat/cecat/docs/prova.pdf'}},
  {plaacronim:'INFOCAT',plaactivat:'NO',plafase:'ALERTA'},
  {plaacronim:'VENTCAT',plaactivat:'SI',plafase:'PREALERTA',comunicatpdf:{url:'https://example.com/no.pdf'}},
];
const plans=normalizeCivilProtectionPlans(sample);
assert.equal(plans.length,2);
assert.equal(plans[0].phaseKey,'emergency');
assert.equal(plans[0].scope.localImpact,'unverified');
assert.equal(plans[1].phaseKey,'prealert');
assert.equal(plans[1].documentUrl,null);

const [html,module,css,worker,sw]=await Promise.all(['../index.html','../src/modules/civil-protection.js','../css/style.css','../worker/index.js','../service-worker.js'].map(path=>readFile(new URL(path,import.meta.url),'utf8')));
for(const id of ['civil-protection-plans','civil-protection-status','civil-protection-list'])assert.ok(html.includes(`id="${id}"`));
assert.ok(module.includes('/civil-protection-plans'));
assert.ok(module.includes('El registre general no confirma per si sol afectació a Sant Celoni.'));
assert.ok(css.includes('.civil-protection-card'));
assert.ok(worker.includes("localImpact:'confirmed'"));
assert.ok(sw.includes('/src/modules/civil-protection.js'));
console.log('Plans de Protecció Civil: contracte correcte.');
