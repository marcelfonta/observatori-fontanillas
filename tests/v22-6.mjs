import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(new URL('..',import.meta.url).pathname);
const read=path=>readFile(resolve(root,path),'utf8');
const [project,worker,push,verification,alerts,ai,html,css,serviceWorker,roadmap]=await Promise.all([
  read('project.json'),read('worker/index.js'),read('src/features/push.js'),read('src/features/forecast-verification.js'),read('src/modules/avisos.js'),read('src/features/meteo-ai.js'),read('index.html'),read('css/style.css'),read('service-worker.js'),read('ROADMAP.md')
]);

assert.equal(JSON.parse(project).version,'22.14.0');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-14-0'));
for(const token of ['async function pushTest','include_subscription_ids','url.pathname === "/push-test"'])assert.ok(worker.includes(token),`Prova push real: falta ${token}`);
for(const token of ['rainBrier','sampleDays>=30','confidence'])assert.ok(worker.includes(token),`Verificació madura: falta ${token}`);
assert.ok(push.includes('Enviant una prova real')&&push.includes("e.key!=='Tab'"),'La diagnosi push real o el focus del diàleg no estan protegits.');
assert.ok(html.includes('Enviar prova real'),'El botó de prova push no és explícit.');
assert.ok(verification.includes('Probabilitat de pluja')&&verification.includes('Brier'),'Falta la mètrica probabilística de pluja.');
assert.ok(worker.includes('const primaryRows = rows.filter(row=>Number(row.horizon_day)===1)'),'El resum principal ha de comparar només pronòstics de demà.');
assert.ok(worker.includes('summaryScope:"tomorrow"')&&worker.includes('wetDays:')&&worker.includes('dryDays:'),'Falta descriure l’abast o la composició de la mostra.');
assert.ok(verification.includes('pronòstics de demà')&&verification.includes('rainProbabilityThreshold'),'La interfície no explica la mostra comparable o el llindar de pluja.');
assert.ok(verification.includes('verification-scroll-hint')&&css.includes('.verification-scroll-hint{display:block}'),'Falta orientar el desplaçament de la taula en mòbil.');
assert.ok(css.includes('repeat(auto-fit,minmax(210px,1fr))'),'Les quatre mètriques no tenen una graella adaptable.');
assert.ok(alerts.includes('Abast zonal')&&alerts.includes('la intensitat exacta a Sant Celoni pot variar'),'Falta transparència territorial als avisos.');
assert.ok(ai.includes('currentDetailAnswer')&&ai.includes('sunAnswer'),'La IA no cobreix les consultes senzilles noves.');
assert.ok(roadmap.includes('V22.6.0 — Prioritat alta'));

console.log('Test V22.6.0: IA, avisos, push real i predicció vs realitat');
