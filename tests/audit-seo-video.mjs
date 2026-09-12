import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { buildSeoStructuredGraph, seoPageUrl } from '../src/features/seo.js';
import { claimMetaVideoRun } from '../worker/index.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [sitemap,worker,staging,index,...staticPages]=await Promise.all([
  read('sitemap.xml'),read('worker/index.js'),read('scripts/staging-smoke.mjs'),read('index.html'),
  ...['condicions.html','privacitat.html','metodologia.html','municipis.html','xarxes.html'].map(read),
]);

assert.equal(seoPageUrl('inici','ca'),'https://meteo.fontanillas.cat/');
assert.equal(seoPageUrl('avisos','fr'),'https://meteo.fontanillas.cat/?page=avisos&lang=fr');
for(const language of ['ca','es','en','fr']){
  const graph=buildSeoStructuredGraph('prediccio',null,language)['@graph'];
  const page=graph.find(item=>item['@type']==='WebPage');
  const dataset=graph.find(item=>item['@type']==='Dataset');
  assert.equal(page.inLanguage,language);
  assert.match(page.url,/\?page=prediccio/);
  assert.equal(dataset.temporalCoverage,'2026-08-04/..');
}
assert.match(index,/"temporalCoverage":"2026-08-04\/\.\."/);
for(const page of ['meteo-ia','estacio','prediccio','llarg-termini','videos','verificacio','cel','avisos','radar','webcams','centre-dades','medi-ambient','aprendre','contacte']){
  assert.ok(sitemap.includes(`?page=${page}`),`Falta ${page} al sitemap.`);
  assert.ok(sitemap.includes(`?page=${page}&amp;lang=fr`),`Falta la variant francesa de ${page}.`);
}
for(const html of staticPages){
  assert.match(html,/hreflang="fr"/);assert.match(html,/property="og:title"/);assert.match(html,/name="twitter:card"/);
}
for(const resolution of ['raw','hourly','daily'])assert.ok(staging.includes(`validateWeatherHistory('${resolution}'`));

const sqlite=new DatabaseSync(':memory:');
sqlite.exec(`CREATE TABLE monitor_state (
  service_key TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'unknown',consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,last_failure_at TEXT,last_success_at TEXT,last_notified_at TEXT,detail TEXT
)`);
const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this;},async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}};}};
const env={DB};const key='social-reels:2026-09-12:morning';
assert.equal(await claimMetaVideoRun(env,key,'2026-09-12','morning',[]),true);
assert.equal(await claimMetaVideoRun(env,key,'2026-09-12','morning',[]),false,'Dues execucions simultànies no poden reservar la mateixa franja.');
sqlite.prepare("UPDATE monitor_state SET status='degraded' WHERE service_key=?").run(key);
assert.equal(await claimMetaVideoRun(env,key,'2026-09-12','morning',[]),true,'Una represa segura ha de poder reutilitzar la franja degradada.');
sqlite.close();

for(const token of ['facebookReelVideoId','facebookReelUploadUrl','facebookReelStage',"reelStage!=='finish_pending'"])assert.ok(worker.includes(token));
console.log('Auditoria G: SEO multilingüe, contractes d’històric i reserva de vídeo verificats.');
