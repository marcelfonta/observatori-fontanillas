import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=await readFile(resolve(root,'index.html'),'utf8');
const portalShell=await readFile(resolve(root,'src/features/portal-shell.js'),'utf8');
const pages=['inici','meteo-ia','estacio','prediccio','cel','avisos','radar','webcams','centre-dades','medi-ambient','contacte'];
for(const page of pages){if(!portalShell.includes(`'${page}'`))throw new Error(`Falta l’enllaç de pàgina: ${page}`);}
for(const id of ['quick-alert-link','official-alert-list','push-alert-button','alertInviteModal','alert-history-list','radar-map','radar-panel-lightning','contact-form','hero-webcam-image','station-page-title','cel-nocturn','nearby-webcams-title','centre-dades-overview','data-summary-samples','data-export-status','environment-aqi','environment-pm25','environment-pm25-level','environment-viewers-title','environment-uv-source','pollen-grass','meteo-ai-page-title','meteo-ia','meteo-ai-messages','meteo-ai-form','meteo-ai-input','meteo-ai-submit','meteo-ai-data-status']){if(!html.includes(`id="${id}"`))throw new Error(`Falta el selector crític: ${id}`);}
for(const file of ['comparativa.html','metodologia.html','historial-avisos.html','service-worker.js','site.webmanifest','worker/index.js','src/features/share.js','src/features/portal-router.js','src/features/portal-shell.js','src/features/portal-static.js','src/features/data-center.js','src/features/environment.js','src/features/meteo-ai.js','src/features/alert-history-page.js','css/portal.css','assets/logos/BRAND-GUIDE.md','assets/logos/observatori-symbol.svg','assets/logos/observatori-lockup.svg','assets/icons/favicon-16.png','assets/icons/favicon-32.png','assets/icons/apple-touch-icon.png','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-192.png','assets/icons/icon-maskable-512.png','assets/images/observatori-fontanillas-social-v12-2.png','scripts/build-brand-assets.py','tests/meteo-ai.mjs','PROJECT.md','ROADMAP.md','CHANGELOG.md'])await access(resolve(root,file));
const app=await readFile(resolve(root,'src/app.js'),'utf8');
if(!app.includes("initPortal();")||!app.includes("initShare();")||!app.includes("initDataCenter();")||!app.includes("renderDataCenter(latestHistory,latest)")||!app.includes("initEnvironment")||!app.includes("updateEnvironmentStation(latest)")||!app.includes("initMeteoAI();")||!app.includes("updateMeteoAIContext"))throw new Error('El portal, la compartició, el Centre de Dades, Medi Ambient o Meteo IA no s’inicialitzen.');
const worker=await readFile(resolve(root,'service-worker.js'),'utf8');
if(!worker.includes("'/css/portal.css'")||!worker.includes("'/src/features/portal-router.js'")||!worker.includes("'/src/features/portal-shell.js'")||!worker.includes("'/src/features/data-center.js'")||!worker.includes("'/src/features/environment.js'")||!worker.includes("'/src/features/meteo-ai.js'")||!worker.includes("'/historial-avisos.html'")||!worker.includes("'/src/features/alert-history-page.js'"))throw new Error('La PWA no inclou els nous recursos.');
for(const file of ['index.html','comparativa.html','metodologia.html','historial-avisos.html']){
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
const comparison=await readFile(resolve(root,'comparativa.html'),'utf8');
for(const id of ['comparison-map','comparison-map-list','compare-variable-chart'])if(!comparison.includes(`id="${id}"`))throw new Error(`Comparativa: falta ${id}.`);
for(const metric of ['temperature','humidity','pressure','wind','rain'])if(!comparison.includes(`data-compare-metric="${metric}"`))throw new Error(`Comparativa: falta la variable ${metric}.`);
const comparisonFeature=await readFile(resolve(root,'src/features/stations-comparison.js'),'utf8');
for(const feature of ['ensureLeaflet','renderMap','historySeries','compare-variable-chart'])if(!comparisonFeature.includes(feature))throw new Error(`Comparativa: falta la funció ${feature}.`);
if(!html.includes('data-portal-page="cel"')||html.match(/id="cel-nocturn"[^>]*data-mobile-advanced/))throw new Error('La pàgina del cel no és independent o pot quedar oculta en mòbil.');
if((html.match(/class="portal-view-header panel"/g)||[]).length!==10)throw new Error('Les deu subpàgines principals no comparteixen capçalera.');
if(!html.includes('data-history-limit="5"')||!html.includes('historial-avisos.html'))throw new Error('La vista principal no limita l’historial o no enllaça amb l’arxiu complet.');
for(const viewer of ['fire','drought','jellyfish'])if(!html.includes(`data-environment-viewer="${viewer}"`))throw new Error(`Medi Ambient: falta el visor ${viewer}.`);
if(!html.includes('https://meduseo.com/es/')||!html.includes('https://www.medusapp.net/mapa/mapa-portada.php'))throw new Error('Medi Ambient: falten MedusApp o Meduseo.');
if(html.includes('https://www.meteo.cat/observacions/radarLlamps'))throw new Error('Encara queda el visor de llamps de Meteocat que es retallava.');
if(html.includes('https://www.aemet.es/es/eltiempo/observacion/rayos.html?w=0'))throw new Error('Encara queda el visor de llamps d’AEMET que no convencia.');
if(!html.includes('https://maps.blitzortung.org/')||!html.includes('Blitzortung · xarxa col·laborativa'))throw new Error('Falta el mapa en directe de Blitzortung o la seva atribució.');
if(!html.includes('https://www.gencat.cat/medinatural/incendis/mapes/pla_alfa.gif')||html.includes('https://experience.arcgis.com/experience/'))throw new Error('El Pla Alfa no utilitza la imatge oficial lleugera.');
const push=await readFile(resolve(root,'src/features/push.js'),'utf8');
if(!push.includes('fontanillas-alert-invite-v1')||!push.includes("closeInvite('declined')")||!push.includes("closeInvite('accepted')"))throw new Error('La invitació única d’avisos no recorda les dues respostes.');
const portalCss=await readFile(resolve(root,'css/portal.css'),'utf8');
if(!portalCss.includes('#shareModal > [role="dialog"]')||!portalCss.includes('background: #091813 !important'))throw new Error('La finestra de compartir no té un fons sòlid.');
if(!portalCss.includes('min-height: 0; padding: 30px 34px')||!portalCss.includes('.environment-level'))throw new Error('Falta la capçalera compacta o els indicadors ambientals.');
if(!portalCss.includes('.station-metrics { grid-template-columns: repeat(3')||!portalCss.includes('.station-card { min-height: 230px'))throw new Error('Les targetes del comparador no són compactes.');
if(!portalShell.includes('<svg viewBox="0 0 24 24"')||/[⌂◉☁☾◎▣⌁⇄♧]/.test(portalShell))throw new Error('Els pictogrames laterals no s’han migrat completament a SVG.');
if(!portalShell.includes("['meteo-ia','Meteo IA'")||!html.includes('data-portal-page="meteo-ia"'))throw new Error('Meteo IA no està connectada al menú i al router.');
const methodology=await readFile(resolve(root,'metodologia.html'),'utf8');
if(!methodology.includes('portal-view-header portal-view-header--static'))throw new Error('Metodologia no té la capçalera compartida.');
const backend=await readFile(resolve(root,'worker/index.js'),'utf8');
if(!backend.includes('/v3/location/near')||!backend.includes('discoverComparisonStations')||!backend.includes('WORKER_VERSION = "12.0.0"'))throw new Error('El Worker no amplia les estacions properes de forma compatible.');
if(!comparison.includes('Com canvia el temps al Baix Montseny?'))throw new Error('El títol del comparador no s’ha aclarit.');
const manifest=JSON.parse(await readFile(resolve(root,'site.webmanifest'),'utf8'));
if(manifest.short_name!=='Observatori')throw new Error('El nom curt de la PWA no segueix la guia de marca.');
if(manifest.theme_color!=='#286d55'||manifest.background_color!=='#205846')throw new Error('La PWA no utilitza la paleta lluminosa de marca.');
const anyIcons=manifest.icons.filter(icon=>icon.purpose==='any').map(icon=>icon.src);
const maskableIcons=manifest.icons.filter(icon=>icon.purpose==='maskable').map(icon=>icon.src);
if(anyIcons.length!==2||maskableIcons.length!==2||maskableIcons.some(icon=>anyIcons.includes(icon)))throw new Error('Les icones maskable no estan separades correctament de les normals.');
if(!['Pregunta a Meteo IA','Estació en directe','Avisos oficials','Radar i llamps'].every(name=>manifest.shortcuts?.some(shortcut=>shortcut.name===name)))throw new Error('Falten accessos ràpids de la PWA.');
const pngDimensions=async file=>{const data=await readFile(resolve(root,file));if(data.toString('ascii',1,4)!=='PNG')throw new Error(`${file}: no és un PNG.`);return [data.readUInt32BE(16),data.readUInt32BE(20)];};
for(const [file,size] of [['assets/icons/favicon-16.png',16],['assets/icons/favicon-32.png',32],['assets/icons/apple-touch-icon.png',180],['assets/icons/icon-192.png',192],['assets/icons/icon-512.png',512],['assets/icons/icon-maskable-192.png',192],['assets/icons/icon-maskable-512.png',512]]){const [width,height]=await pngDimensions(file);if(width!==size||height!==size)throw new Error(`${file}: mida ${width}×${height}, esperada ${size}×${size}.`);}
const [socialWidth,socialHeight]=await pngDimensions('assets/images/observatori-fontanillas-social-v12-2.png');
if(socialWidth!==1200||socialHeight!==630)throw new Error('La targeta social no fa 1200 × 630 px.');
for(const file of ['index.html','comparativa.html','metodologia.html','historial-avisos.html']){const page=await readFile(resolve(root,file),'utf8');if(!page.includes('observatori-fontanillas-social-v12-2.png')||!page.includes('assets/icons/favicon-16.png')||!page.includes('apple-mobile-web-app-title'))throw new Error(`${file}: metadades de marca incompletes.`);}
if(!worker.includes("'/assets/icons/icon-maskable-512.png'")||!worker.includes("'/assets/images/observatori-fontanillas-social-v12-2.png'"))throw new Error('La PWA no desa els nous recursos de marca.');
const headers=await readFile(resolve(root,'_headers'),'utf8');
if(!headers.includes('https://maps.blitzortung.org'))throw new Error('La política de seguretat bloquejaria Blitzortung.');
if(!headers.includes('https://geocoding-api.open-meteo.com'))throw new Error('La política de seguretat bloquejaria la consulta d’altres poblacions.');
const meteoAi=await readFile(resolve(root,'src/features/meteo-ai.js'),'utf8');
for(const capability of ['answerMeteoQuestion','fetchLocalityWeather','fetchNearbyStations','observatori:environment-updated','observatori:alerts-updated'])if(!meteoAi.includes(capability))throw new Error(`Meteo IA: falta ${capability}.`);
console.log('Smoke test V13: correcte');
