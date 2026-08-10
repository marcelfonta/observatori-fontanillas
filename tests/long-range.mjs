import assert from 'node:assert/strict';

const nodes=new Map();
const makeNode=()=>({children:[],textContent:'',innerHTML:'',className:'',append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];}});
global.document={
  getElementById(id){if(!nodes.has(id))nodes.set(id,makeNode());return nodes.get(id);},
  createElement(){return makeNode();}
};
const {renderLongRangeForecast}=await import('../src/features/long-range.js');
renderLongRangeForecast({weekly_units:{temperature_2m_mean:'°C',temperature_2m_anomaly:'°C',precipitation_mean:'mm',precipitation_anomaly:'mm'},weekly:{time:['2026-08-10','2026-08-17'],temperature_2m_mean:[24,22],temperature_2m_anomaly:[1.4,-.8],precipitation_mean:[2,7],precipitation_anomaly:[-3,4]}});
assert.equal(nodes.get('long-range-weeks').children.length,2);
assert.match(nodes.get('long-range-weeks').children[0].innerHTML,/Més càlida/);
assert.match(nodes.get('long-range-weeks').children[0].innerHTML,/Més seca/);
assert.match(nodes.get('long-range-weeks').children[1].innerHTML,/Més freda/);
assert.match(nodes.get('long-range-weeks').children[1].innerHTML,/Més humida/);
assert.match(nodes.get('long-range-status').textContent,/ECMWF EC46/);
console.log('Test de tendència V15: correcte');
