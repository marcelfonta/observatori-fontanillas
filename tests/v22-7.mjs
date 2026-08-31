import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html,css,dom,navigation,app,project,serviceWorker,roadmap]=await Promise.all([
  readFile('index.html','utf8'), readFile('css/style.css','utf8'), readFile('src/core/dom.js','utf8'),
  readFile('src/modules/navigation.js','utf8'), readFile('src/app.js','utf8'), readFile('project.json','utf8'),
  readFile('service-worker.js','utf8'), readFile('ROADMAP.md','utf8')
]);

assert.equal(JSON.parse(project).version,'22.28.1');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-28-1-xarxes'));
assert.ok(html.includes('is-placeholder is-placeholder--value')&&css.includes('@keyframes placeholder-shimmer'));
assert.ok(dom.includes("classList.remove('is-placeholder')")&&dom.includes("removeAttribute('aria-busy')"));
assert.ok(html.includes('iframe data-src="https://static-m.meteo.cat/ginys/mapaAvisos'));
assert.ok(navigation.includes('export function loadDeferredAssets')&&app.includes("loadDeferredAssets('#avisos')"));
assert.ok(html.includes('1. Fenòmens')&&html.includes('2. Intensitat de l’avís'));
assert.ok(css.includes('position:sticky')&&css.includes('grid-template-columns:repeat(3,1fr)!important'));
assert.ok(roadmap.includes('V22.7.0 — Experiència mòbil i rendiment percebut'));

console.log('Test V22.7.0: càrrega visual, avisos mòbils i ginys diferits');
