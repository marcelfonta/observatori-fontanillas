import assert from 'node:assert/strict';
import { answerMeteoQuestion } from '../src/features/meteo-ai.js';

// Exercise the public init/update functions, real renderer and AI consumer offline.
const originals=Object.fromEntries(['document','window','fetch','CustomEvent'].map(k=>[k,globalThis[k]]));
const fields=['european_aqi','european_aqi_pm10','european_aqi_pm2_5','european_aqi_nitrogen_dioxide','european_aqi_ozone','european_aqi_sulphur_dioxide','pm10','pm2_5','nitrogen_dioxide','ozone','carbon_monoxide','sulphur_dioxide','uv_index','grass_pollen','olive_pollen','birch_pollen','mugwort_pollen','ragweed_pollen'];
let sequence=0;
const realNow=Date.now;
Date.now=()=>Date.parse('2026-09-20T08:10:00Z');
async function fixture(current,{offline=false}={}){
 const nodes=new Map(),events=[];
 globalThis.document={getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:false,style:{},classList:{remove(){}},removeAttribute(){}});return nodes.get(id);},querySelectorAll(){return [];},dispatchEvent(e){events.push(e.detail);}};
 globalThis.window={setTimeout,clearTimeout};
 globalThis.CustomEvent=class {constructor(type,init){this.type=type;this.detail=init.detail;}};
 globalThis.fetch=async()=>{if(offline)throw Error('Synthetic provider outage');return {ok:true,json:async()=>({current})};};
 const module=await import(`../src/features/environment.js?regression=${sequence++}`);
 await module.initEnvironment();
 return {module,nodes,events,text:id=>nodes.get(id)?.textContent};
}
const all=value=>Object.fromEntries(fields.map(key=>[key,value]));
const answer=environment=>answerMeteoQuestion('Com està la qualitat de l’aire?',{environment},{});
try{
 for(const absent of [null,undefined,'','  ',false,true,[],{},NaN,Infinity,-1,'-1','invalid']){
  const f=await fixture({...all(absent),time:null});
  for(const id of ['environment-aqi','environment-pm25','environment-pm10','environment-uv','pollen-grass'])assert.equal(f.text(id),'—',`${id}: ${String(absent)}`);
  assert.equal(f.text('environment-aqi-label'),'No disponible');
  assert.equal(f.text('environment-pm25-level'),'No disponible');
  assert.equal(f.text('pollen-grass-level'),'No disponible');
  assert.equal(f.text('environment-pollen-main'),'No disponible');
  assert.equal(f.text('pollen-summary-title'),'Sense lectura disponible');
  assert.equal(f.text('environment-uv-source'),'No disponible');
  assert.equal(f.text('environment-updated'),'Hora del model no disponible');
  assert.equal(f.nodes.get('environment-aqi-marker').hidden,true);
  assert.equal(f.nodes.get('environment-pm25-meter').hidden,true);
  assert.equal(f.nodes.get('pollen-grass-meter').hidden,true);
  assert.equal(f.events.at(-1).time,null);
  assert.equal(f.events.at(-1).european_aqi,null);
  assert.equal(f.events.at(-1).uv,null);
  const result=await answer(f.events.at(-1));
  assert.equal(result.level,'info');assert.match(result.body,/no disponible/);
  f.module.updateEnvironmentStation({uv:absent});assert.equal(f.text('environment-uv'),'—');
 }
 for(const zero of [0,'0',' 0 ']){
  const f=await fixture({...all(zero),time:'2026-09-20T10:00'});
  assert.equal(f.text('environment-aqi'),'0');assert.equal(f.text('environment-aqi-label'),'Bona');
  assert.equal(f.text('environment-uv'),'0,0');assert.equal(f.text('environment-uv-source'),'Estimació CAMS');
  assert.equal(f.text('pollen-grass-level'),'Nul o residual');
  assert.equal(f.nodes.get('environment-aqi-marker').hidden,false);
  assert.equal(f.nodes.get('environment-pm25-meter').hidden,false);
  assert.equal(f.events.at(-1).uv,0);assert.equal((await answer(f.events.at(-1))).level,'safe');
 }
 const f=await fixture({...all(null),uv_index:4,olive_pollen:30,time:'2026-09-20T10:00'});
 assert.equal(f.text('environment-uv'),'4,0');assert.equal(f.text('environment-pollen-main'),'Olivera · Moderat');
 assert.equal((await answer(f.events.at(-1))).level,'info');
 f.module.updateEnvironmentStation({uv:0,updatedUtc:'2026-09-20T08:05:00Z'});assert.equal(f.text('environment-uv'),'0,0');assert.equal(f.text('environment-uv-source'),'Sensor Fontanillas');
 f.module.updateEnvironmentStation({uv:null});assert.equal(f.text('environment-uv'),'4,0');assert.equal(f.text('environment-uv-source'),'Estimació CAMS');
 for(const time of [null,undefined,'','invalid',0,false,'2026-02-30T10:00','2026-09-20T25:00']){
  const f=await fixture({...all(0),time});assert.equal(f.events.at(-1).time,null);assert.equal(f.text('environment-updated'),'Hora del model no disponible');
 }
 const previousZone=process.env.TZ;
 try{
  for(const zone of ['UTC','America/Los_Angeles','Asia/Tokyo']){
   process.env.TZ=zone;
   const f=await fixture({...all(0),time:'2026-09-20T10:00'});
   assert.equal(f.text('environment-updated'),'Validesa del model: 20/09/2026 · 10:00 · hora local');
  }
 }finally{if(previousZone===undefined)delete process.env.TZ;else process.env.TZ=previousZone;}
 const utc=await fixture({...all(0),time:'2026-09-20T08:00:00Z'});assert.match(utc.text('environment-updated'),/10:00/);
 const offline=await fixture(null,{offline:true});
 assert.equal(offline.text('environment-aqi'),'—');assert.equal(offline.text('environment-uv'),'—');
 assert.equal(offline.nodes.get('environment-aqi-marker').hidden,true);
 assert.equal(offline.events.at(-1).time,null);
 for(const [aqi,uv,level] of [[null,null,'info'],[0,null,'info'],[null,0,'info'],[70,null,'warning'],[null,8,'warning'],[50,null,'caution'],[null,6,'caution'],[0,0,'safe']])assert.equal((await answer({european_aqi:aqi,uv})).level,level);
 for(const value of [false,' ',[],{},-1])assert.equal((await answer({european_aqi:value,uv:value})).level,'info');
 console.log('Medi ambient: absències, zeros reals, pol·len, UV, marcadors, hores i Meteo IA verificats sense xarxa.');
}finally{
 Date.now=realNow;
 for(const [key,value]of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
}
