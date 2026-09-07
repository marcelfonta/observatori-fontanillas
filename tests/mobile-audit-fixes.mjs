import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [html,layout,portal,header,seasonal,longRange,i18n,french,worker,headers]=await Promise.all([
  read('index.html'),read('css/layout.css'),read('css/portal.css'),
  read('src/features/header-tools.js'),read('src/features/seasonal-outlook.js'),read('src/features/long-range.js'),
  read('src/core/i18n.js'),read('src/core/i18n-fr.js'),read('service-worker.js'),read('_headers')
]);

assert.ok(html.includes('src/core/page-bootstrap.js'), 'La selecció inicial de pàgina ha de carregar-se des d’un fitxer propi.');
assert.ok(!/<script>(?:.|\n)*?document\.documentElement\.dataset\.portalPage(?:.|\n)*?<\/script>/.test(html), 'No pot quedar l’inicialitzador executable bloquejat per la CSP.');
assert.ok(!headers.match(/script-src[^;]*'unsafe-inline'/), 'La correcció CSP no ha de relaxar la política de scripts.');
assert.ok(layout.includes('.seasonal-outlook__more[hidden] { display:none; }'), 'Els mesos tancats han de quedar realment ocults.');
assert.ok(layout.includes('.seasonal-outlook figure { min-width:0;'), 'Els mapes no poden imposar la seva amplada intrínseca.');
assert.ok(portal.includes('.long-term-section > *')&&portal.includes('.seasonal-outlook__month { min-width: 0; }'), 'La vista de llarg termini ha de poder encongir-se en mòbil.');
assert.ok(header.includes('data-i18n-source-placeholder="Cerca el teu municipi"'), 'El cercador ha de conservar una font de traducció estable.');
assert.ok(header.includes('data-i18n-source-label="Idioma"'), 'El selector ha de conservar una font de traducció estable.');
assert.ok(seasonal.includes("t(next?'Amagar els mesos següents':'Veure els mesos següents')"), 'El botó estacional ha de respectar l’idioma després de clicar-lo.');
assert.ok(longRange.includes('getLocale()')&&longRange.includes("typeof Node!=='undefined')translateDocument(article)"), 'Les dades subestacionals generades han de respectar l’idioma actiu.');
for(const phrase of ['Com poden ser les pròximes sis setmanes?','A partir de la segona setmana la incertesa augmenta molt.','Veure la predicció mensual oficial ↗']){
  assert.ok(i18n.includes(phrase)&&french.includes(phrase), `Falta traduir el text de llarg termini: ${phrase}`);
}
for(const network of ['instagram','youtube','tiktok']){
  assert.ok(portal.includes(`.header-social > .social-link--${network}`), `${network} ha de continuar visible directament en mòbil.`);
}
assert.ok(portal.includes(':root { --portal-header: 76px; }'), 'La capçalera mòbil ha de tornar a ocupar una sola fila.');
assert.ok(portal.includes('.live-pill :is(b,time) { display: none; }'), 'El text i l’hora de l’estat en directe s’han d’ocultar en mòbil.');
assert.ok(portal.includes('width: 44px; min-width: 44px; height: 44px;'), 'Els controls de capçalera han de tenir una zona tàctil suficient.');
assert.ok(worker.includes("'/src/core/page-bootstrap.js'"), 'La PWA ha de conservar l’inicialitzador fora de línia.');
assert.ok(worker.includes("'/src/features/seasonal-outlook.js'"), 'La PWA ha de conservar el desplegable estacional fora de línia.');
assert.ok(worker.includes('mobile-audit-v3-single-row'), 'La PWA ha de renovar la memòria cau perquè la capçalera d’una fila arribi als mòbils existents.');

console.log('Auditoria mòbil: llarg termini, idiomes, controls tàctils i CSP');
