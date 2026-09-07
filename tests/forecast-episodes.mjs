import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { detectForecastEpisode, forecastEpisodeCopy } from '../src/core/forecast-episodes.js';
import { episodeColor, episodeFrameTimes, episodeVariable, fetchEpisodeGrid } from '../scripts/forecast-episode-video.mjs';

const model=(name,temperatures,rain=[0,0,0],probability=[5,5,5],gust=[20,20,20])=>({name,days:temperatures.map(([min,max],index)=>({date:`2026-09-0${7+index}`,min,max,rain:rain[index],rainProbability:probability[index],gust:gust[index],weatherCode:rain[index]>8?63:1}))});
const cooling=[model('ecmwf',[[20,31],[13,27],[12,26]]),model('gfs',[[20,32],[14,27],[13,26]]),model('icon',[[20,31],[19,30],[18,29]])];
const episode=detectForecastEpisode(cooling,{issuedAt:'2026-09-07T08:00:00Z'});
assert.equal(episode.kind,'cooling');
assert.equal(episode.agreement,2);
assert.equal(episode.totalModels,3);
assert.equal(episode.episodeKey,'cooling:2026-09-08');
assert.ok(episode.metrics.temperatureDelta<=-5);
const copy=forecastEpisodeCopy(episode);
assert.match(copy.body,/2 de 3 models/);
assert.match(copy.body,/no avís oficial/);
assert.ok(copy.lead&&copy.detail);
assert.equal(detectForecastEpisode([cooling[0]],{}),null);
assert.equal(detectForecastEpisode([model('ecmwf',[[null,null],[null,null],[null,null]]),model('gfs',[[null,null],[null,null],[null,null]])],{}),null);
assert.equal(episodeVariable('rain').api,'precipitation');
assert.equal(episodeVariable('cooling').api,'temperature_2m');
assert.deepEqual(episodeFrameTimes('2026-09-09'),['2026-09-09T06:00','2026-09-09T12:00','2026-09-09T18:00','2026-09-09T23:00']);
assert.equal(episodeColor('warming',11).color,'#dd3f42');
assert.equal(episodeColor('rain',0).opacity,0);

const times=['2026-09-08T06:00','2026-09-08T12:00','2026-09-08T18:00','2026-09-08T23:00','2026-09-09T06:00','2026-09-09T12:00','2026-09-09T18:00','2026-09-09T23:00'];
const mocked=await fetchEpisodeGrid({...episode,kind:'rain',targetDate:'2026-09-09',agreeingModels:['ecmwf']},async url=>{
  assert.match(url,/\/v1\/ecmwf/);
  return {ok:true,json:async()=>Array.from({length:64},()=>({hourly:{time:times,precipitation:[0,0,0,0,1,2,3,4]}}))};
});
assert.equal(mocked.frames.length,4);
assert.equal(mocked.frames[3].values[0],4);

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
assert.match(worker,/SOCIAL_FORECAST_EPISODES_ENABLED/);
assert.match(worker,/FORECAST_EPISODE_MAX_PER_WEEK = 2/);
assert.match(worker,/forecast-episode-video\.yml/);
assert.match(worker,/\/admin\\\/forecast-episodes/);
assert.match(worker,/observedJob\('forecast-episodes'/);
assert.match(worker,/if\(previous\?\.status==='dispatching'\)return \{dispatched:false,reason:'already_dispatched'\}/);
const workflow=await readFile(new URL('../.github/workflows/forecast-episode-video.yml',import.meta.url),'utf8');
assert.match(workflow,/workflow_dispatch:/);
assert.match(workflow,/episodes\/\$\{\{ inputs\.draft_id \}\}\.mp4/);
assert.match(workflow,/if: inputs\.auto_publish == true/);
assert.match(workflow,/actions\/upload-artifact@v4/);
const generator=await readFile(new URL('../scripts/forecast-episode-video.mjs',import.meta.url),'utf8');
assert.match(generator,/Cap model coincident ha retornat una graella real/);
assert.match(generator,/no és un avís oficial/);
assert.doesNotMatch(generator,/wxcharts|metdesk/i);

console.log('Episodis automàtics de models: correcte');
