import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');

const [html,environment,config,footerSocial,portalShell,portalCss,styleCss,logo,backend,adminPage,adminFeature,serviceWorker]=await Promise.all([
  read('index.html'),read('src/features/environment.js'),read('src/core/config.js'),read('src/features/footer-social.js'),read('src/features/portal-shell.js'),read('css/portal.css'),read('css/style.css'),read('assets/logos/observatori-symbol.svg'),read('worker/index.js'),read('administracio.html'),read('src/features/admin.js'),read('service-worker.js')
]);

for(const token of ['POLLEN_LIMITS','grass:[1,10,50,150]','birch:[1,10,80,200]','olive:[1,10,100,200]','renderPollenSummary','Nul o residual','Moderat','Molt alt'])assert.ok(environment.includes(token),`Pol·len V21: falta ${token}.`);
for(const species of ['grass','olive','birch','mugwort','ragweed']){
  assert.ok(html.includes(`id="pollen-${species}-level"`),`Pol·len V21: falta el nivell de ${species}.`);
  assert.ok(html.includes(`id="pollen-${species}-meter"`),`Pol·len V21: falta el mesurador de ${species}.`);
}
assert.ok(html.includes('id="pollen-summary-title"')&&html.includes('https://aerobiologia.cat/pia/ca/nivells'),'Pol·len V21: falta el resum o la font XAC.');
assert.ok(portalCss.includes('.pollen-summary')&&portalCss.includes('.environment-level.is-extreme'),'Pol·len V21: falten els estils interpretatius.');

for(const url of ['https://www.instagram.com/meteo_fontanillas/','https://www.facebook.com/meteofontanillas','https://bsky.app/profile/meteofontanillas.bsky.social','https://t.me/meteo_fontanillas'])assert.ok(config.includes(url),`Xarxes V21.0.1: falta ${url}.`);
for(const token of ['header-social','sidebar-social','footer-social','noopener noreferrer',"['instagram','Instagram']","['facebook','Facebook']","['bluesky','Bluesky']","['telegram','Telegram']",'Meteo Fontanillas (s’obre en una pestanya nova)'])assert.ok(footerSocial.includes(token),`Xarxes V21.0.1: falta ${token}.`);
for(const token of ['portal-sidebar__intro','portal-sidebar__footer','© 2026 Fontanillas'])assert.ok(portalShell.includes(token),`Menú lateral V21.0.1: falta ${token}.`);
for(const token of ['.header-social','.sidebar-social','.footer-social','.footer-copyright{display:none','.brand__mark--avatar'])assert.ok(styleCss.includes(token),`Estils V21.0.1: falta ${token}.`);
for(const page of ['index.html','comparativa.html','metodologia.html','historial-avisos.html','privacitat.html','administracio.html'])assert.ok((await read(page)).includes('© 2026'),`${page}: falta el copyright.`);

assert.ok(logo.includes('linearGradient')&&logo.includes('#FFD37A')&&logo.includes('#D9F7DE')&&logo.includes('#A9ECF4'),'Marca V21: el símbol no incorpora la nova paleta lluminosa.');

for(const token of ['CREATE TABLE IF NOT EXISTS social_drafts','INSERT OR IGNORE INTO social_drafts','META_SYSTEM_USER_TOKEN','BLUESKY_HANDLE','BLUESKY_APP_PASSWORD','TELEGRAM_BOT_TOKEN','TELEGRAM_CHANNEL_ID',"const mode = 'draft'",'daily_observation','facebook','instagram','bluesky','telegram'])assert.ok(backend.includes(token),`Cua social V21.0.1: falta ${token}.`);
for(const forbidden of ['graph.facebook.com','media_publish','/me/feed'])assert.ok(!backend.includes(forbidden),`Cua social V21: no s’ha de publicar automàticament (${forbidden}).`);
for(const id of ['admin-social-pill','admin-social-mode','admin-social-token','admin-social-bluesky','admin-social-telegram','admin-social-drafts','admin-social-last','admin-social-list'])assert.ok(adminPage.includes(`id="${id}"`),`Administració V21.0.1: falta ${id}.`);
for(const token of ['renderSocialQueue','socialToken','channelCredentials','draft-queue'])assert.ok(adminFeature.includes(token),`Administració V21.0.1: falta ${token}.`);

assert.ok(serviceWorker.includes("observatori-fontanillas-v21-0-1")&&serviceWorker.includes("'/src/features/footer-social.js'")&&serviceWorker.includes("'/assets/images/observatori-fontanillas-avatar-v21.png'"),'PWA V21.0.1: versió, mòdul social o avatar absents.');
const avatar=await readFile(resolve(root,'assets/images/observatori-fontanillas-avatar-v21.png'));
assert.equal(avatar.toString('ascii',1,4),'PNG','Marca V21.0.1: l’avatar no és PNG.');
assert.deepEqual([avatar.readUInt32BE(16),avatar.readUInt32BE(20)],[1024,1024],'Marca V21.0.1: l’avatar no és quadrat a 1024 px.');
assert.equal(JSON.parse(await read('project.json')).version,'21.0.1');

console.log('Test V21: pol·len, marca, xarxes i cua segura correctes');
