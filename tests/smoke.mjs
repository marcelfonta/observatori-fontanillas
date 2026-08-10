import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=await readFile(resolve(root,'index.html'),'utf8');
const pages=['inici','estacio','prediccio','avisos','radar','webcams','centre-dades','medi-ambient','contacte'];
for(const page of pages){if(!html.includes(`data-page-link="${page}"`))throw new Error(`Falta l’enllaç de pàgina: ${page}`);}
for(const id of ['quick-alert-link','official-alert-list','push-alert-button','alert-history-list','radar-map','contact-form']){if(!html.includes(`id="${id}"`))throw new Error(`Falta el selector crític: ${id}`);}
for(const file of ['comparativa.html','metodologia.html','service-worker.js','site.webmanifest','worker/index.js','src/features/share.js','src/features/portal-router.js','css/portal.css','PROJECT.md','ROADMAP.md','CHANGELOG.md'])await access(resolve(root,file));
const app=await readFile(resolve(root,'src/app.js'),'utf8');
if(!app.includes("initPortal();")||!app.includes("initShare();"))throw new Error('El portal o la compartició no s’inicialitzen.');
const worker=await readFile(resolve(root,'service-worker.js'),'utf8');
if(!worker.includes("'/css/portal.css'")||!worker.includes("'/src/features/portal-router.js'"))throw new Error('La PWA no inclou els nous recursos.');
console.log('Smoke test V8: correcte');
