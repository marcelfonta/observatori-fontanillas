import assert from 'node:assert/strict';

const nodes=new Map();
global.document={getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:''});return nodes.get(id);}};
const {renderDataCenter}=await import('../src/features/data-center.js');
const atNoon=daysAgo=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()-daysAgo);return date.getTime();};
const history=[
  {t:atNoon(4),temperature:21,rainIncrement:0,windGust:9,samples:24},
  {t:atNoon(3),temperature:20,rainIncrement:12,windGust:18,samples:24},
  {t:atNoon(2),temperature:22,rainIncrement:0,windGust:11,samples:24},
  {t:atNoon(1),temperature:23,rainIncrement:2,windGust:14,samples:24},
  {t:atNoon(0),temperature:24,rainIncrement:.4,windGust:12,samples:12}
];
renderDataCenter(history,{rainRate:1.2,rainToday:.4});
assert.equal(nodes.get('data-rain-now').textContent,'1,2 mm/h');
assert.equal(nodes.get('data-rain-today').textContent,'0,4 mm');
assert.equal(nodes.get('data-rain-yesterday').textContent,'2,0 mm');
assert.equal(nodes.get('data-rain-dry-days').textContent,'0');
assert.equal(nodes.get('data-rain-since-10').textContent,'3');
assert.match(nodes.get('data-rain-wettest').textContent,/12,0 mm/);
console.log('Test de pluviometria V16: correcte');
