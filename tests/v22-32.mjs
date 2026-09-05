import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [html,router,shell,alerts,forecast,social,seo,sitemap,i18n,french]=await Promise.all([
  read('index.html'),read('src/features/portal-router.js'),read('src/features/portal-shell.js'),
  read('src/modules/avisos.js'),read('src/modules/prediccio.js'),read('src/features/footer-social.js'),
  read('src/features/seo.js'),read('sitemap.xml'),read('src/core/i18n.js'),read('src/core/i18n-fr.js')
]);

assert.ok(html.includes('data-portal-page="llarg-termini"'));
assert.ok(router.includes("'llarg-termini':'Predicció a llarg termini'"));
assert.ok(shell.includes("['llarg-termini','Llarg termini','./?page=llarg-termini']"));
assert.ok(html.includes('href="./?page=llarg-termini"')&&html.includes('href="./?page=prediccio"'));
assert.ok(html.includes('<section id="long-range"')&&html.includes('<section id="seasonal-outlook"'));
assert.ok(html.includes('class="hero-alert-row"')&&html.includes('id="quick-alert-meta"')&&alerts.includes("setText('quick-alert-meta',copy)"));
assert.ok(!forecast.includes('amb temps tranquil')&&forecast.includes('amb poca precipitació prevista'));
assert.ok(forecast.includes("document.addEventListener('observatori:alerts-updated'")&&html.includes('id="forecast-risk-context"'));
assert.ok(html.includes('home-personalization')&&html.includes('thermal-index-guide'));
assert.ok(social.includes("['instagram','youtube','tiktok']")&&social.includes('Segueix-nos'));
assert.ok(seo.includes("'llarg-termini':{title:"));
assert.ok(!sitemap.includes('?page='));
assert.ok(i18n.includes("'Predicció a llarg termini'")&&french.includes("'Predicció a llarg termini':'Prévisions à long terme'"));

console.log('Test V22.32: portada, risc i predicció a llarg termini');
