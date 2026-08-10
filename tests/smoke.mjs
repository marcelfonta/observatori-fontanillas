import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=await readFile(resolve(root,'index.html'),'utf8');
const portalShell=await readFile(resolve(root,'src/features/portal-shell.js'),'utf8');
const pages=['inici','estacio','prediccio','avisos','radar','webcams','centre-dades','medi-ambient','contacte'];
for(const page of pages){if(!portalShell.includes(`'${page}'`))throw new Error(`Falta l’enllaç de pàgina: ${page}`);}
for(const id of ['quick-alert-link','official-alert-list','push-alert-button','alert-history-list','radar-map','contact-form','hero-webcam-image','centre-dades-overview','data-summary-samples','data-export-status']){if(!html.includes(`id="${id}"`))throw new Error(`Falta el selector crític: ${id}`);}
for(const file of ['comparativa.html','metodologia.html','service-worker.js','site.webmanifest','worker/index.js','src/features/share.js','src/features/portal-router.js','src/features/portal-shell.js','src/features/portal-static.js','src/features/data-center.js','css/portal.css','PROJECT.md','ROADMAP.md','CHANGELOG.md'])await access(resolve(root,file));
const app=await readFile(resolve(root,'src/app.js'),'utf8');
if(!app.includes("initPortal();")||!app.includes("initShare();")||!app.includes("initDataCenter();")||!app.includes("renderDataCenter(latestHistory,latest)"))throw new Error('El portal, la compartició o el Centre de Dades no s’inicialitzen.');
const worker=await readFile(resolve(root,'service-worker.js'),'utf8');
if(!worker.includes("'/css/portal.css'")||!worker.includes("'/src/features/portal-router.js'")||!worker.includes("'/src/features/portal-shell.js'")||!worker.includes("'/src/features/data-center.js'"))throw new Error('La PWA no inclou els nous recursos.');
for(const file of ['index.html','comparativa.html','metodologia.html']){
  const page=await readFile(resolve(root,file),'utf8');
  const ids=[...page.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
  const duplicates=[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];
  if(duplicates.length)throw new Error(`${file}: IDs duplicats: ${duplicates.join(', ')}.`);
  const missingTargets=[...new Set([...page.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]).filter(target=>target&&!ids.includes(target)))];
  if(missingTargets.length)throw new Error(`${file}: enllaços interns sense destí: ${missingTargets.join(', ')}.`);
  const topLinks=page.match(/Torna(?:r)? amunt/gi)||[];
  if(topLinks.length!==1)throw new Error(`${file}: s’esperava un únic «Tornar amunt» i n’hi ha ${topLinks.length}.`);
  const footer=page.match(/<footer class="shell">[\s\S]*?<\/footer>/)?.[0]||'';
  if(/>Metodologia<|>Comparar</.test(footer))throw new Error(`${file}: el peu encara duplica Comparar o Metodologia.`);
}
for(const file of ['comparativa.html','metodologia.html']){
  const page=await readFile(resolve(root,file),'utf8');
  if(!page.includes('css/portal.css')||!page.includes('src/features/portal-static.js'))throw new Error(`${file}: falta la navegació compartida del portal.`);
}
if(html.includes('class="mobile-nav"')||html.includes('id="mobile-more-menu"'))throw new Error('Encara hi ha navegació mòbil antiga duplicada.');
console.log('Smoke test V9: correcte');
