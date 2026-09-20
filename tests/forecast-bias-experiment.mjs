import assert from 'node:assert/strict';
import {evaluateTemperatureBias as evaluate} from '../src/core/forecast-bias-experiment.js';
const rows=Array.from({length:70},(_,i)=>{
  const d=new Date(Date.UTC(2026,0,2+i)),date=d.toISOString().slice(0,10),previous=new Date(d-86400000).toISOString().slice(0,10);
  return {target_date:date,issued_at:previous+'T12:00:00Z',horizon_day:1,provider:'Open-Meteo',model:'best_match',
    temperature_max:22,temperature_min:12,observed_max:20,observed_min:10,observed_samples:288,observed_hours:24,observed_available_at:date+'T23:59:59Z'};
});
const now=new Date('2026-09-20T12:00Z'),result=evaluate(rows,{now});
assert.equal(result.status,'evaluated');assert.equal(result.productionEnabled,false);
assert.equal(result.correctionC.max,-2);assert.equal(result.max.baseline.mae,2);assert.equal(result.max.corrected.mae,0);
assert.equal(result.embargoedDays,1);
assert.equal(evaluate(rows.slice(0,20),{now}).status,'collecting');
assert.equal(evaluate([...rows,...rows],{now}).sampleDays,70);
const changed=rows.map((r,i)=>i>=49?{...r,observed_max:30,observed_min:20}:r);
const bad=evaluate(changed,{now});
assert.deepEqual(bad.correctionC,result.correctionC);
assert.ok(bad.max.corrected.mae>bad.max.baseline.mae);
for(const patch of [{temperature_max:null},{observed_samples:20},{observed_hours:5},{horizon_day:0},{model:'another'},{issued_at:rows[0].target_date+'T06:00Z'},{observed_available_at:'2027-01-01T00:00Z'}])assert.equal(evaluate([{...rows[0],...patch}],{now}).sampleDays,0);
assert.equal(evaluate(rows.map(r=>({...r,observed_available_at:'2026-08-01T00:00Z'})),{now}).status,'collecting');
console.log('Correcció experimental: holdout independent, cobertura, duplicats i retard de dades correctes');
