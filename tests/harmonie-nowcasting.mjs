import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [html,models,radar,style,sw]=await Promise.all([read('index.html'),read('src/modules/models.js'),read('src/modules/radar.js'),read('css/style.css'),read('service-worker.js')]);

assert.match(html,/data-viewer-model="harmonie"/);
assert.match(html,/HARMONIE-AROME es consulta al visor oficial d’AEMET/);
assert.match(models,/HARMONIE_URL='https:\/\/www\.aemet\.es\/ca\/eltiempo\/prediccion\/modelosnumericos\/harmonie_arome/);
assert.match(models,/resolució 2,5 km · horitzó màxim 48 h/);
assert.match(html,/id="nowcast-shadow-title"/);
assert.match(html,/Si no hi ha fotogrames futurs, no se’n genera cap d’inventat/);
assert.match(radar,/payload\?\.radar\?\.nowcast/);
assert.match(radar,/latestObserved\+120\*60/);
assert.match(radar,/kind:'projected'/);
assert.match(radar,/No disponible ara/);
assert.match(style,/\.nowcast-shadow/);
assert.match(sw,/harmonie-nowcast-v1/);

console.log('HARMONIE oficial i nowcasting experimental amb absències explícites.');
