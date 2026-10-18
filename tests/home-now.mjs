import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildHomeNowModel,homeModelConfidence} from '../src/features/home-now.js';

const model=(max,rain)=>({daily:{time:['2026-10-18'],temperature_2m_max:[max],precipitation_sum:[rain]}});
const high={ecmwf:model(21,0),gfs:model(22,0),icon:model(21.5,0),arome:model(20.5,0)};
assert.deepEqual(homeModelConfidence(high),{level:'good',label:'Alta',detail:'4 models · diferència màxima 1,5 °C'});
assert.equal(homeModelConfidence({...high,gfs:model(25,2)}).level,'watch');
assert.equal(homeModelConfidence({...high,gfs:model(28,2)}).level,'warning');
assert.equal(homeModelConfidence({ecmwf:model(21,0),gfs:model(22,0)}).level,'pending');

const cards=buildHomeNowModel({
  current:{temperature:18.6,humidity:72,windGust:15,ageMinutes:2},
  forecast:{daily:{time:['2026-10-18'],temperature_2m_min:[12],temperature_2m_max:[21],precipitation_probability_max:[75],precipitation_sum:[8.4],wind_gusts_10m_max:[32]}},
  alerts:{ok:true,active:1,windows:{now:[{event:'Pluja intensa'}]}},
  models:high
});
assert.equal(cards.length,4);
assert.equal(cards[0].state,'good');
assert.equal(cards[1].state,'warning');
assert.equal(cards[2].title,'1 avís actiu');
assert.equal(cards[3].title,'Alta');
assert.ok(buildHomeNowModel().every(card=>card.state==='pending'));

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="home-now-grid"/);
assert.match(html,/Què cal saber ara a Sant Celoni\?/);
console.log('Portada intel·ligent: confiança, degradació i estructura correctes');
