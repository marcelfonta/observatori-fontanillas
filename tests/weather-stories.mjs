import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildWeatherStories, formatStoryLongDate } from '../src/features/weather-stories.js';

const base=new Date('2026-10-17T00:00:00+02:00');
const history=Array.from({length:24},(_,index)=>({
  t:base.getTime()+index*3600000,
  temperature:12+index*.35,
  windGust:index===15?47:12,
  rainIncrement:[11,12,13].includes(index)?1.2:0,
  rainRate:index===12?8.4:0
}));
const date='2026-10-17';
const alerts=[{started_at:new Date(base.getTime()+10*3600000).toISOString(),expires_at:new Date(base.getTime()+18*3600000).toISOString(),phenomenon:'Pluja intensa',level:'groc',source:'Meteocat'}];
const options={now:new Date('2026-10-18T12:00:00+02:00').getTime()};

const stories=buildWeatherStories(history,alerts,options);
assert.equal(stories.length,1);
assert.equal(stories[0].date,date);
assert.equal(stories[0].kind,'rain');
assert.equal(stories[0].items.length,24);
assert.equal(stories[0].coverage,100);
assert.ok(Math.abs(stories[0].rain-3.6)<1e-9);
assert.equal(stories[0].official.length,1);
assert.equal(stories[0].official[0].source,'Meteocat');
assert.match(formatStoryLongDate('2026-10-17T12:00:00','ca-ES'),/2026/);
assert.equal(formatStoryLongDate('data-invàlida','ca-ES'),'Data no disponible');

const missing=buildWeatherStories([{t:base.getTime(),temperature:null,windGust:null,rainIncrement:null}],[],options);
assert.deepEqual(missing,[],'Les absències no poden crear un episodi artificial.');
const incomplete=buildWeatherStories(history.slice(0,12),alerts,options);
assert.deepEqual(incomplete,[],'Una jornada incompleta no pot semblar una història tancada.');

const [html,app,worker,shell,headers]=await Promise.all(['index.html','src/app.js','service-worker.js','src/features/portal-shell.js','_headers'].map(file=>readFile(new URL(`../${file}`,import.meta.url),'utf8')));
for(const id of ['stories-page-title','weather-stories','weather-stories-list','weather-story-detail','weather-stories-method-title'])assert.ok(html.includes(`id="${id}"`),`Falta ${id}.`);
assert.match(app,/initWeatherStories\(\)/);
assert.match(app,/updateWeatherStoriesSafely\(\{history:latestHistory\}\)/);
assert.match(worker,/src\/features\/weather-stories\.js/);
assert.match(shell,/Històries meteo/);
assert.match(headers,/media-src 'self' blob: https:\/\/fonta-meteo\.marcelfonta\.workers\.dev/);

console.log('Històries meteorològiques: llindars, cronologia, cobertura i avisos verificats');
