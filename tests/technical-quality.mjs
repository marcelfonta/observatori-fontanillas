import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [html,fonts,headers,worker,app,style]=await Promise.all([
  read('index.html'),read('css/fonts.css'),read('_headers'),read('service-worker.js'),read('src/app.js'),read('css/style.css')
]);

assert.ok(html.includes('href="/css/fonts.css?v=1.0"'), 'La pàgina ha de carregar el full de tipografies local també en rutes profundes.');
assert.ok(!html.includes('fonts.googleapis.com')&&!html.includes('fonts.gstatic.com'), 'L’HTML no ha de contactar Google Fonts.');
for(const page of ['metodologia.html','municipis.html','comparativa.html','colaboracions.html','historial-avisos.html']){
  const pageHtml=await read(page);
  assert.ok(pageHtml.includes('css/fonts.css?v=1.0'), `${page} ha de carregar les fonts locals.`);
  assert.ok(!pageHtml.includes('fonts.googleapis.com')&&!pageHtml.includes('fonts.gstatic.com'), `${page} no ha de contactar Google Fonts.`);
}
assert.ok(!headers.includes('fonts.googleapis.com')&&!headers.includes('fonts.gstatic.com'), 'La CSP no ha de conservar excepcions per a Google Fonts.');
assert.ok(headers.includes("font-src 'self' data:"), 'La CSP ha de permetre les tipografies pròpies.');
assert.ok(fonts.includes('font-weight: 400 700')&&fonts.includes('font-weight: 500 800'), 'Els dos tipus han de declarar només els pesos variables utilitzats.');
assert.equal((fonts.match(/font-display: swap/g)||[]).length,4, 'Tots els subconjunts han d’evitar bloquejar el text.');

const fontFiles=[
  'assets/fonts/dm-sans-latin.woff2','assets/fonts/dm-sans-latin-ext.woff2',
  'assets/fonts/manrope-latin.woff2','assets/fonts/manrope-latin-ext.woff2'
];
for(const file of fontFiles){
  await access(new URL(file,root));
  assert.ok((await stat(new URL(file,root))).size>10000, `${file} ha de contenir una font WOFF2 real.`);
  assert.ok(worker.includes(`'/${file}'`), `${file} ha d’estar disponible dins l’app shell.`);
}
for(const license of ['assets/fonts/LICENSE-DM-SANS.txt','assets/fonts/LICENSE-MANROPE.txt']){
  const text=await read(license);
  assert.ok(text.includes('SIL OPEN FONT LICENSE'), `Falta preservar la llicència a ${license}.`);
}

assert.ok(html.includes('id="offline-message"')&&html.includes('id="offline-retry"'), 'L’estat offline ha de mostrar context i una acció de reintent.');
assert.ok(html.includes('role="status" aria-live="polite" aria-atomic="true"'), 'L’estat offline s’ha d’anunciar sense interrompre ni saturar.');
assert.ok(app.includes("document.getElementById('offline-message')")&&app.includes("refreshAfterResume(true)"), 'El reintent ha de conservar l’estructura del banner i tornar a consultar les dades.');
assert.ok(style.includes('.offline-banner button:focus-visible'), 'El reintent offline ha de mostrar el focus del teclat.');
assert.ok(worker.includes('technical-quality-v1'), 'El canvi ha de renovar la memòria cau existent.');

console.log('Qualitat tècnica: fonts locals, CSP, llicències i recuperació offline');
