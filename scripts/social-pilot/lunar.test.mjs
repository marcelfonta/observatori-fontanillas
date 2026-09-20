import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMoon,moonSpan,madridOffset,phases} from './lunar.mjs';
const date='2026-09-20';
const fixture=(patch={})=>({properties:{data:{year:2026,month:9,day:20,tz:2,isdst:false,curphase:'Waxing Gibbous',fracillum:'65%',...patch}}});
test('official daily data, explicitly noon and correct local date',()=>{
 const m=normalizeMoon(fixture(),date);assert.equal(m.percent,65);assert.equal(m.label,'Gibosa creixent');assert.equal(m.reference,'12:00');
 for(const curphase of Object.keys(phases))assert.ok(normalizeMoon(fixture({curphase}),date));
});
test('missing, stale, unknown or invalid inputs never become new moon',()=>{
 for(const fracillum of [null,undefined,'',0,'101%','-1%','65','NaN%'])assert.equal(normalizeMoon(fixture({fracillum}),date),null);
 for(const patch of [{day:21},{tz:1},{isdst:true},{curphase:'unknown'}])assert.equal(normalizeMoon(fixture(patch),date),null);
 assert.equal(normalizeMoon(null,date),null);
 assert.equal(normalizeMoon(fixture({fracillum:'0%',curphase:'New Moon'}),date).percent,0);
});
test('Madrid seasonal offset and DST boundary',()=>{
 assert.equal(madridOffset('2026-01-20'),1);assert.equal(madridOffset(date),2);
 assert.equal(madridOffset('2026-10-25'),1);assert.equal(madridOffset('2026-03-29'),2);
});
test('projected illuminated area and waxing/waning mirror',()=>{
 for(const f of [0,.1,.25,.5,.65,.9,1]){
  let area=0;for(let i=0;i<2000;i++){const y=-1+(i+.5)/1000;const [a,b]=moonSpan(y,1,f,true);const [c,d]=moonSpan(y,1,f,false);assert.ok(Math.abs(a+d)<1e-12&&Math.abs(b+c)<1e-12);area+=(b-a)/1000;}
  assert.ok(Math.abs(area/Math.PI-f)<.0001);
 }
});
