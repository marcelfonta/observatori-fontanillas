import assert from 'node:assert/strict';
import { recentStationContext } from '../src/core/recent-station-context.js';
import { MONTHLY_SUMMARIES } from '../src/data/monthly-summaries.js';
import { chart } from '../src/features/monthly-summaries.js';

const hour=60*60*1000;
const now=Date.parse('2026-10-26T12:00:00Z');
const history=Array.from({length:48},(_,i)=>({t:now-(48-i)*hour,interval:'hourly',samples:12,temperature:i<24?14:16}));
const comparison=recentStationContext(history,now);
assert.equal(comparison?.difference,2);
assert.equal(comparison?.currentCoverage,100);
assert.equal(recentStationContext(history.slice(12),now),null,'no comparison with an incomplete earlier day');
assert.equal(recentStationContext(history.map(row=>({...row,temperature:null})),now),null,'missing values are not zero');
assert.equal(recentStationContext([{t:now-hour,interval:'daily',temperature:40,samples:288}],now),null,'daily aggregates do not fill an hourly comparison');

const september=chart(MONTHLY_SUMMARIES[0]);
assert.match(september,/Setembre de 2026/);
assert.match(september,/tabindex="0"/);
assert.match(september,/cobertura/);
const cold=chart({...MONTHLY_SUMMARIES[0],label:'Gener de prova',daily:[[1,-6,3,2,0,100]]});
assert.match(cold,/Escala de temperatura -10–5 °C/,'temperature scale adapts to a colder month');
assert.match(cold,/Gener de prova/);
console.log('Context recent i gràfic mensual: OK');
