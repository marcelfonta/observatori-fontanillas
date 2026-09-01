import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,header,shell,worker,sitemap,project,emails]=await Promise.all([
  read('colaboracions.html'),read('src/features/header-tools.js'),read('src/features/portal-shell.js'),
  read('service-worker.js'),read('sitemap.xml'),read('project.json'),read('docs/patrocini/correus-personalitzats.md')
]);

assert.equal(JSON.parse(project).version,'22.31.0');
assert.ok(header.includes('<option value="fr">FR</option>'));
assert.ok(shell.includes("['collaboracions','Col·laboracions','./colaboracions.html']"));
assert.ok(worker.includes('observatori-fontanillas-v22-31-0-frances-colaboracions'));
assert.ok(worker.includes("'/colaboracions.html'")&&worker.includes("'/src/core/i18n-fr.js'"));
assert.ok(sitemap.includes('https://meteo.fontanillas.cat/colaboracions.html'));
assert.ok(page.includes('data-portal-static="collaboracions"'));
assert.ok(page.includes('Actualment no hi ha cap patrocini comercial actiu'));
assert.ok(page.includes('independència editorial')&&page.includes('Atribució visible'));
assert.ok(page.includes('Instagram, Facebook, TikTok, YouTube i X'));
assert.ok(page.includes('Publicacions periòdiques')&&page.includes('Patrocini identificat'));
assert.ok(emails.includes('## 1. Bresser Iberia')&&emails.includes('## 6. Netatmo'));
assert.ok(emails.includes('publicaciones periódicas acordadas')&&emails.includes('agreed periodic'));

await Promise.all([
  access(new URL('../docs/patrocini/dossiers/Dossier-colaboracion-Observatorio-Fontanillas-ES.docx',import.meta.url)),
  access(new URL('../docs/patrocini/dossiers/Collaboration-dossier-Fontanillas-Weather-Observatory-EN.docx',import.meta.url)),
  access(new URL('../output/pdf/Dossier-colaboracion-Observatorio-Fontanillas-ES.pdf',import.meta.url)),
  access(new URL('../output/pdf/Collaboration-dossier-Fontanillas-Weather-Observatory-EN.pdf',import.meta.url))
]);

globalThis.document={documentElement:{lang:'ca'},body:null,dispatchEvent(){}};
globalThis.localStorage={getItem(){return null;},setItem(){}};
globalThis.CustomEvent=class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail;}};
const translations=await import('../src/core/i18n.js');
assert.deepEqual(translations.SUPPORTED_LANGUAGES,['ca','es','en','fr']);
assert.deepEqual(translations.getTranslationCoverage().missing,{es:[],en:[],fr:[]});
translations.setLanguage('fr',{persist:false});
assert.equal(translations.getLocale(),'fr-FR');
assert.equal(translations.t('Col·laboracions'),'Collaborations');
assert.equal(translations.t('Material, no finançament'),'Du matériel, pas un financement');

console.log('Test V22.31.0: francès, col·laboracions i dossiers');
