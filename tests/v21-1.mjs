import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const [worker,schema,adminPage,adminFeature,portalCss,serviceWorker,project]=await Promise.all([
  read('worker/index.js'),read('worker/schema.sql'),read('administracio.html'),read('src/features/admin.js'),read('css/portal.css'),read('service-worker.js'),read('project.json')
]);

assert.equal(JSON.parse(project).version,'22.5.2','La versió web del projecte no és V22.5.2.');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-5-2'),'La memòria cau PWA no és V22.5.2.');
assert.ok(worker.includes('socialCardHtml')&&worker.includes("env.BROWSER.quickAction('screenshot'"),'Falta la targeta social dinàmica amb dades reals.');

for(const source of [worker,schema]){
  assert.ok(source.includes('CREATE TABLE IF NOT EXISTS social_publications'),'Falta el registre de publicacions socials.');
  assert.ok(source.includes('idx_social_publications_draft_created'),'Falta l’índex del registre social.');
  assert.ok(!source.includes('UNIQUE(draft_id, channel)'),'Cada intent ha de conservar-se, no sobreescriure el precedent.');
}
for(const token of ['adminSocialDrafts','adminUpdateSocialDraft','adminPublishSocialDraft','adminSocialDiagnostics','diagnoseSocialChannel','publishFacebook','publishInstagram','publishTelegram','publishBluesky','recordSocialPublication','/admin/social-drafts','/admin/social-diagnostics','manual-confirmation','partially_published']){
  assert.ok(worker.includes(token),`Worker V21.2: falta ${token}.`);
}
assert.ok(worker.includes('Després de publicar només pots afegir canals pendents; el text queda protegit.'),'Falta protegir el text publicat tot permetent completar canals pendents.');
assert.ok(worker.includes('Aquest contingut ja s’ha publicat en aquest canal'),'Falta impedir una publicació duplicada.');
assert.ok(worker.includes('published:false'),'Aprovar ha d’informar que no publica.');
for(const required of ['graph.facebook.com','media_publish','META_FACEBOOK_PAGE_ID','META_INSTAGRAM_ACCOUNT_ID'])assert.ok(worker.includes(required),`La prova controlada de Meta necessita ${required}.`);

const scheduled=worker.slice(worker.indexOf('async scheduled('));
assert.ok(scheduled.includes('createDailySocialDraft'),'El cron ha de poder crear esborranys.');
for(const publisher of ['publishFacebook(','publishInstagram(','publishTelegram(','publishBluesky('])assert.ok(!scheduled.includes(publisher),`El cron no pot executar ${publisher}.`);

for(const id of ['admin-social-list','admin-social-feedback','admin-social-mode','admin-social-drafts','admin-social-diagnose','admin-social-diagnostic-list','admin-social-facebook','admin-social-instagram'])assert.ok(adminPage.includes(`id="${id}"`),`Panell editorial: falta ${id}.`);
for(const text of ['Publicació automàtica i control','Una publicació diària amb dades reals'])assert.ok(adminPage.includes(text),`Panell editorial: falta l’avís «${text}».`);
for(const token of ['/admin/social-drafts','/admin/social-diagnostics','runSocialDiagnostics','window.confirm','socialEditorDirty','textContent','socialPublicationRows',"facebook:'Facebook'","instagram:'Instagram'","telegram:'Telegram'","bluesky:'Bluesky'",'Publicar a ${label}'])assert.ok(adminFeature.includes(token),`Editor social: falta ${token}.`);
for(const token of ['.admin-social-card','.admin-social-publications','.admin-social-actions','@media'])assert.ok(portalCss.includes(token),`Estils editorials: falta ${token}.`);

console.log('Test V21.2: diagnòstic segur, quatre canals manuals, registre i anti-duplicats correctes');
