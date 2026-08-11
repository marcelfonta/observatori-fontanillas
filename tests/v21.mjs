import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');

const [html,environment,config,footerSocial,portalCss,logo,backend,adminPage,adminFeature,serviceWorker]=await Promise.all([
  read('index.html'),read('src/features/environment.js'),read('src/core/config.js'),read('src/features/footer-social.js'),read('css/portal.css'),read('assets/logos/observatori-symbol.svg'),read('worker/index.js'),read('administracio.html'),read('src/features/admin.js'),read('service-worker.js')
]);

for(const token of ['POLLEN_LIMITS','grass:[1,10,50,150]','birch:[1,10,80,200]','olive:[1,10,100,200]','renderPollenSummary','Nul o residual','Moderat','Molt alt'])assert.ok(environment.includes(token),`Pol·len V21: falta ${token}.`);
for(const species of ['grass','olive','birch','mugwort','ragweed']){
  assert.ok(html.includes(`id="pollen-${species}-level"`),`Pol·len V21: falta el nivell de ${species}.`);
  assert.ok(html.includes(`id="pollen-${species}-meter"`),`Pol·len V21: falta el mesurador de ${species}.`);
}
assert.ok(html.includes('id="pollen-summary-title"')&&html.includes('https://aerobiologia.cat/pia/ca/nivells'),'Pol·len V21: falta el resum o la font XAC.');
assert.ok(portalCss.includes('.pollen-summary')&&portalCss.includes('.environment-level.is-extreme'),'Pol·len V21: falten els estils interpretatius.');

assert.ok(config.includes('https://www.instagram.com/meteo_fontanillas/')&&config.includes('https://www.facebook.com/meteo_fontanillas'),'Xarxes V21: falten els perfils configurats.');
for(const token of ['footer-social','noopener noreferrer',"['instagram','Instagram']", "['facebook','Facebook']",'Meteo Fontanillas (s’obre en una pestanya nova)'])assert.ok(footerSocial.includes(token),`Xarxes V21: falta ${token}.`);
for(const page of ['index.html','comparativa.html','metodologia.html','historial-avisos.html','privacitat.html','administracio.html'])assert.ok((await read(page)).includes('© 2026'),`${page}: falta el copyright.`);

assert.ok(logo.includes('linearGradient')&&logo.includes('#FFD37A')&&logo.includes('#D9F7DE')&&logo.includes('#A9ECF4'),'Marca V21: el símbol no incorpora la nova paleta lluminosa.');

for(const token of ['CREATE TABLE IF NOT EXISTS social_drafts','INSERT OR IGNORE INTO social_drafts','META_SYSTEM_USER_TOKEN',"const mode = 'draft'",'daily_observation'])assert.ok(backend.includes(token),`Cua social V21: falta ${token}.`);
for(const forbidden of ['graph.facebook.com','media_publish','/me/feed'])assert.ok(!backend.includes(forbidden),`Cua social V21: no s’ha de publicar automàticament (${forbidden}).`);
for(const id of ['admin-social-pill','admin-social-mode','admin-social-token','admin-social-drafts','admin-social-last','admin-social-list'])assert.ok(adminPage.includes(`id="${id}"`),`Administració V21: falta ${id}.`);
for(const token of ['renderSocialQueue','socialToken','draft-queue'])assert.ok(adminFeature.includes(token),`Administració V21: falta ${token}.`);

assert.ok(serviceWorker.includes("observatori-fontanillas-v21-0-0")&&serviceWorker.includes("'/src/features/footer-social.js'"),'PWA V21: versió o mòdul social absents.');
assert.equal(JSON.parse(await read('project.json')).version,'21.0.0');

console.log('Test V21: pol·len, marca, xarxes i cua segura correctes');
