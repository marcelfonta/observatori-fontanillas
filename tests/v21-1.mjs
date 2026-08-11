import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const [worker,schema,adminPage,adminFeature,portalCss,serviceWorker,project]=await Promise.all([
  read('worker/index.js'),read('worker/schema.sql'),read('administracio.html'),read('src/features/admin.js'),read('css/portal.css'),read('service-worker.js'),read('project.json')
]);

assert.equal(JSON.parse(project).version,'21.1.0','La versió del projecte no és V21.1.0.');
assert.ok(serviceWorker.includes('observatori-fontanillas-v21-1-0'),'La memòria cau PWA no és V21.1.0.');

for(const source of [worker,schema]){
  assert.ok(source.includes('CREATE TABLE IF NOT EXISTS social_publications'),'Falta el registre de publicacions socials.');
  assert.ok(source.includes('idx_social_publications_draft_created'),'Falta l’índex del registre social.');
  assert.ok(!source.includes('UNIQUE(draft_id, channel)'),'Cada intent ha de conservar-se, no sobreescriure el precedent.');
}
for(const token of ['adminSocialDrafts','adminUpdateSocialDraft','adminPublishSocialDraft','publishTelegram','publishBluesky','recordSocialPublication','/admin/social-drafts','manual-confirmation','partially_published']){
  assert.ok(worker.includes(token),`Worker V21.1: falta ${token}.`);
}
assert.ok(worker.includes('Una publicació completada es conserva com a registre i no es pot editar.'),'Falta la immutabilitat dels continguts publicats.');
assert.ok(worker.includes('Aquest contingut ja s’ha publicat en aquest canal'),'Falta impedir una publicació duplicada.');
assert.ok(worker.includes('published:false'),'Aprovar ha d’informar que no publica.');
for(const forbidden of ['graph.facebook.com','media_publish','/me/feed'])assert.ok(!worker.includes(forbidden),`Meta no pot publicar en V21.1 (${forbidden}).`);

const scheduled=worker.slice(worker.indexOf('async scheduled('));
assert.ok(scheduled.includes('createDailySocialDraft'),'El cron ha de poder crear esborranys.');
assert.ok(!scheduled.includes('publishTelegram(')&&!scheduled.includes('publishBluesky('),'El cron no pot publicar.');

for(const id of ['admin-social-list','admin-social-feedback','admin-social-mode','admin-social-drafts'])assert.ok(adminPage.includes(`id="${id}"`),`Panell editorial: falta ${id}.`);
for(const text of ['Aprovar mai no publica','Publicació automàtica desactivada'])assert.ok(adminPage.includes(text),`Panell editorial: falta l’avís «${text}».`);
for(const token of ['/admin/social-drafts','window.confirm','socialEditorDirty','textContent','socialPublicationRows','Telegram · publicat','Bluesky · publicat'])assert.ok(adminFeature.includes(token),`Editor social: falta ${token}.`);
for(const token of ['.admin-social-card','.admin-social-publications','.admin-social-actions','@media'])assert.ok(portalCss.includes(token),`Estils editorials: falta ${token}.`);

console.log('Test V21.1: editor protegit, publicació manual, registre i anti-duplicats correctes');
