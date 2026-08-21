import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const [html,style,forecast,station,history,seo,sitemap,serviceWorker]=await Promise.all([
  read('index.html'),read('css/style.css'),read('src/modules/prediccio.js'),read('src/modules/estacio.js'),read('src/modules/historics.js'),read('src/features/seo.js'),read('sitemap.xml'),read('service-worker.js')
]);

for(const id of ['temp-max-time','temp-min-time'])assert.ok(html.includes(`id="${id}"`),`Portada V21.4: falta ${id}.`);
for(const token of ['maxTemperatureTime','minTemperatureTime'])assert.ok(history.includes(token)&&station.includes(token),`Extrems V21.4: falta ${token}.`);
assert.ok(station.includes("timeZone: 'Europe/Madrid'"),'Extrems V21.4: l’hora no es fixa al fus local.');
assert.ok(style.includes('width:82px;height:82px')&&style.includes('font:50px/1')&&style.includes('font:44px/1'),'Predicció V21.4: els símbols encara no tenen prou presència.');
for(const symbol of ['☀️','☁️','🌧️','⛈️'])assert.ok(forecast.includes(symbol),`Predicció V21.4: falta la variant emoji ${symbol}.`);
assert.ok(html.includes('apple-touch-icon-v21.png?v=22.0.0'),'PWA V21.4: la icona iOS no té una URL renovada.');
assert.ok(serviceWorker.includes("'/assets/icons/apple-touch-icon-v21.png'"),'PWA V21.4: la nova icona iOS no és a la memòria cau.');
assert.ok(!seo.includes("setAttribute('href',url)"),'SEO V21.4: el JavaScript encara canvia la canònica.');
assert.ok(!sitemap.includes('?page='),'SEO V21.4: el sitemap encara conté vistes internes duplicades.');
assert.equal((html.match(/<link rel="canonical"/g)||[]).length,1,'SEO V21.4: cal una única canònica a l’HTML font.');

console.log('Test V21.4: llegibilitat, extrems, icona i SEO correctes');
