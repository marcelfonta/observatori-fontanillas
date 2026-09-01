import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [i18n,dom,station,style,project,serviceWorker]=await Promise.all([
  read('src/core/i18n.js'),read('src/core/dom.js'),read('src/modules/estacio.js'),read('css/style.css'),read('project.json'),read('service-worker.js')
]);

assert.equal(JSON.parse(project).version,'22.30.1');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-30-1-traduccio-mobil'));
assert.ok(i18n.includes("'Sense avisos oficials actius':{es:'Sin avisos oficiales activos',en:'No active official alerts'}"));
assert.ok(i18n.includes("'Lectura ràpida':{es:'Lectura rápida',en:'Quick view'}"));
assert.ok(i18n.includes('DYNAMIC_REPLACEMENTS')&&i18n.includes('Comprovat a les'));
assert.ok(dom.includes("translateDocument(node)")&&dom.includes("toLocaleString(getLocale()"));
assert.ok(station.includes("getLocale()==='es-ES'?'a las':getLocale()==='en-GB'?'at':'a les'"));
assert.ok(style.includes('.has-portal-shell .site-header>.live-pill b{display:none}'));
assert.ok(style.includes('.has-portal-shell .site-header>.live-pill time{display:inline;padding-left:0;border-left:0'));
assert.doesNotMatch(style,/content:'EN DIRECTE'/);
assert.doesNotMatch(style,/temperature-range small::before/);

globalThis.document={documentElement:{lang:'ca'},body:null,dispatchEvent(){}};
globalThis.localStorage={getItem(){return null;},setItem(){}};
globalThis.CustomEvent=class CustomEvent{constructor(type,options){this.type=type;this.detail=options?.detail;}};
const translations=await import('../src/core/i18n.js');
translations.setLanguage('es',{persist:false});
assert.equal(translations.t('Lectura ràpida'),'Lectura rápida');
assert.equal(translations.t('Sense avisos oficials actius'),'Sin avisos oficiales activos');
assert.equal(translations.t('Comprovat a les 18:42'),'Comprobado a las 18:42');
translations.setLanguage('en',{persist:false});
assert.equal(translations.t('Observació en directe'),'Live observation');
assert.equal(translations.t('fa 8 min'),'8 min ago');

console.log('Test V22.30.1: traducció dinàmica i capçalera mòbil compacta');
