import assert from 'node:assert/strict';
import {searchMunicipalities} from '../src/services/weather-api.js';

const originalFetch=globalThis.fetch;
const place={name:'Chamonix',latitude:45.92375,longitude:6.86933,admin1:'Alpes',country_code:'FR'};
const ok=()=>Response.json({results:[place,{...place},{name:'Invalid',latitude:null,longitude:1}]});
try{
  let calls=0;
  globalThis.fetch=async()=>{calls++;if(calls===1)throw new TypeError('Network failure');return ok();};
  assert.deepEqual(await searchMunicipalities('Chamonix'),[place]);
  assert.equal(calls,2,'A transport failure gets exactly one retry');
  calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status:503});};
  await assert.rejects(searchMunicipalities('Chamonix'),/503/);assert.equal(calls,2);
  for(const status of [400,401,403,429]){
    calls=0;globalThis.fetch=async()=>{calls++;return new Response('',{status});};
    await assert.rejects(searchMunicipalities('Chamonix'),new RegExp(String(status)));assert.equal(calls,1,'Do not retry client errors or rate limits');
  }
  calls=0;let resolve;
  globalThis.fetch=()=>{calls++;return new Promise(r=>{resolve=r;});};
  const first=searchMunicipalities('Chamonix','fr'),second=searchMunicipalities('Chamonix','fr');
  assert.equal(calls,1,'Submit and autocomplete share an in-flight request');
  resolve(ok());await Promise.all([first,second]);
  globalThis.fetch=async url=>{calls++;assert.equal(new URL(url).searchParams.get('language'),'fr');return ok();};
  await searchMunicipalities('Chamonix','fr');assert.equal(calls,2,'Completed searches are not retained');
  calls=0;globalThis.fetch=async()=>{calls++;return calls===1?new Response('{'):ok();};
  assert.equal((await searchMunicipalities('Girona')).length,1);assert.equal(calls,2,'Truncated JSON gets one retry');
  globalThis.fetch=async()=>Response.json({results:[]});assert.deepEqual(await searchMunicipalities('zzzzzzz'),[]);
  calls=0;globalThis.fetch=async()=>{calls++;return ok();};
  await assert.rejects(searchMunicipalities(' '),/LOCALITY_REQUIRED/);assert.equal(calls,0);
}finally{globalThis.fetch=originalFetch;}
console.log('Cerca municipal: reintent limitat, deduplicació, errors i francès correctes');
