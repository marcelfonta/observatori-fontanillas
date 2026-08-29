import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [page,feature,weather,router,shell,seo,worker,style,serviceWorker,privacy]=await Promise.all([
  read('index.html'),read('src/features/forecast-videos.js'),read('src/services/weather-api.js'),read('src/features/portal-router.js'),read('src/features/portal-shell.js'),read('src/features/seo.js'),read('worker/index.js'),read('css/portal.css'),read('service-worker.js'),read('privacitat.html')
]);

assert.match(page,/data-portal-page="videos"/);
assert.match(page,/data-video-source="meteocat"/);
assert.doesNotMatch(page,/data-video-source="aemet"/);
assert.match(page,/<button type="button" data-video-source="3cat"[^>]+hidden/);
assert.match(page,/AEMET continua disponible als apartats de previsió i avisos/);
for(const source of ['worldweather.wmo.int','www.yr.no','weather.metoffice.gov.uk\\/world','charts.ecmwf.int','www.windy.com','www.meteoblue.com'])assert.match(page,new RegExp(source),`Falta la font mundial ${source}.`);
assert.match(page,/Cap model és sempre el millor a tot arreu/);
assert.match(page,/Per avisos i decisions de seguretat, consulta sempre el servei meteorològic oficial/);
assert.doesNotMatch(page,/id="forecast-video-frame"[^>]+src=/,'El reproductor extern no s’ha de carregar abans del clic.');
assert.match(router,/'videos'/);
assert.match(shell,/\['videos','Predicció en vídeo'/);
assert.match(seo,/videos:\{title:'Predicció del temps en vídeo/);
assert.match(feature,/youtube-nocookie\.com\/embed\/videoseries/);
assert.doesNotMatch(feature,/UUd-ceYPisAtCmmoZa26I-5g/);
assert.match(feature,/frame\.onload=/);
assert.match(feature,/control\.addEventListener\('click'/);
assert.match(weather,/export async function fetchForecastVideos/);
assert.match(worker,/async function boundedResponseText/);
assert.match(worker,/async function latestThreeCatForecastVideo/);
assert.match(worker,/AbortSignal\.timeout\(8000\)/);
assert.match(worker,/ctx\.waitUntil\(cache\.put/);
assert.match(worker,/url\.pathname === "\/forecast-videos"/);
assert.doesNotMatch(worker,/sources:\['meteocat','aemet'/);
assert.match(style,/\.forecast-videos__layout/);
assert.match(style,/\.global-forecast-directory__grid/);
assert.match(serviceWorker,/src\/features\/forecast-videos\.js/);
assert.match(privacy,/Els vídeos de Meteocat i 3Cat només es connecten/);

console.log('Predicció audiovisual: fonts oficials, privacitat i degradació segura');
