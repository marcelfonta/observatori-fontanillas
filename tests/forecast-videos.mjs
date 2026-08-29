import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,feature,weather,router,shell,seo,worker,style,serviceWorker,privacy]=await Promise.all([
  read('index.html'),read('src/features/forecast-videos.js'),read('src/services/weather-api.js'),read('src/features/portal-router.js'),read('src/features/portal-shell.js'),read('src/features/seo.js'),read('worker/index.js'),read('css/portal.css'),read('service-worker.js'),read('privacitat.html')
]);

assert.match(page,/data-portal-page="videos"/);
assert.match(page,/data-video-source="meteocat"/);
assert.match(page,/data-video-source="aemet"/);
assert.match(page,/id="forecast-video-3cat" hidden/);
assert.doesNotMatch(page,/id="forecast-video-frame"[^>]+src=/,'El reproductor extern no s’ha de carregar abans del clic.');
assert.match(router,/'videos'/);
assert.match(shell,/\['videos','Predicció en vídeo'/);
assert.match(seo,/videos:\{title:'Predicció del temps en vídeo/);
assert.match(feature,/youtube-nocookie\.com\/embed\/videoseries/);
assert.match(feature,/www\.aemet\.es\/es\/eltiempo\/widgets\/video/);
assert.match(feature,/button\.addEventListener\('click'/);
assert.match(weather,/export async function fetchForecastVideos/);
assert.match(worker,/async function boundedResponseText/);
assert.match(worker,/async function latestThreeCatForecastVideo/);
assert.match(worker,/AbortSignal\.timeout\(8000\)/);
assert.match(worker,/ctx\.waitUntil\(cache\.put/);
assert.match(worker,/url\.pathname === "\/forecast-videos"/);
assert.match(style,/\.forecast-videos__layout/);
assert.match(serviceWorker,/src\/features\/forecast-videos\.js/);
assert.match(privacy,/Els vídeos de Meteocat, AEMET i 3Cat només es connecten/);

console.log('Predicció audiovisual: fonts oficials, privacitat i degradació segura');
