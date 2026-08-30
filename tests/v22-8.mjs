import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [html,environment,alerts,portal,style,project,serviceWorker,roadmap]=await Promise.all([
  read('index.html'),read('src/features/environment.js'),read('src/modules/avisos.js'),read('css/portal.css'),read('css/style.css'),read('project.json'),read('service-worker.js'),read('ROADMAP.md')
]);

assert.equal(JSON.parse(project).version,'22.26.0');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-26-0-xarxes'));
assert.ok(html.includes('role="tabpanel"')&&html.includes('aria-controls="environment-panel-jellyfish"'));
assert.ok(html.includes('environment-viewer-mobile-launch__icon')&&html.includes('millor control tàctil'));
assert.ok(html.includes('id="environment-aqi" class="is-placeholder" aria-busy="true"'));
assert.ok(environment.includes("compactViewer=window.matchMedia('(max-width: 700px)')"));
assert.ok(environment.includes('skipEmbeddedJellyfish')&&environment.includes("event.key==='ArrowRight'"));
assert.ok(environment.includes("node.classList.remove('is-placeholder')")&&environment.includes("node.removeAttribute('aria-busy')"));
assert.ok(alerts.includes('official-alert-scope')&&alerts.includes('Abast municipal')&&alerts.includes('Abast zonal'));
assert.ok(style.includes('.official-alert-scope')&&portal.includes('.environment-viewer-mobile-launch__icon'));
assert.ok(roadmap.includes('V22.8.0 — Visors mòbils, abast dels avisos i accessibilitat'));

console.log('Test V22.10.0: visors mòbils, avisos territorials i càrrega ambiental');
