import assert from 'node:assert/strict';
import {operaAuthHeaders,probeOperaCatalog,summarizeOperaCatalog} from '../scripts/opera-private-probe.mjs';

const summary=summarizeOperaCatalog([
  {id:'ESABC',country:'ES',date:'2018-01-01/current'},
  {product:'REFLECTIVITY',date:'2010-12-15/current',format:['HDF5','BUFR']},
]);
assert.deepEqual(summary.countries,['ES']);
assert.deepEqual(summary.products,['REFLECTIVITY']);
assert.deepEqual(summary.formats,['BUFR','HDF5']);
assert.equal(summary.entries,2);

assert.deepEqual(operaAuthHeaders('secret','apikey'),{Accept:'application/json',apikey:'secret'});
assert.deepEqual(operaAuthHeaders('secret','oauth2'),{Accept:'application/json',Authorization:'Bearer secret'});
assert.throws(()=>operaAuthHeaders('','oauth2'),/Falta OPERA_ACCESS_TOKEN/);

let receivedHeaders;
const ok=await probeOperaCatalog({token:'private-token',fetchImpl:async(_url,options)=>{
  receivedHeaders=options.headers;
  return new Response(JSON.stringify([{country:'FR',id:'FRABC',date:'2020-01-01/current'}]),{status:200,headers:{'content-type':'application/json'}});
}});
assert.equal(ok.status,'ok');
assert.equal(ok.catalog.entries,1);
assert.equal(receivedHeaders.Authorization,'Bearer private-token');
assert.doesNotMatch(JSON.stringify(ok),/private-token/);

const blocked=await probeOperaCatalog({token:'private-token',mode:'apikey',fetchImpl:async()=>new Response(JSON.stringify({code:'900908',message:'Resource forbidden'}),{status:403,headers:{'content-type':'application/json'}})});
assert.equal(blocked.status,'authorization-blocked');
assert.equal(blocked.error.code,'900908');
assert.doesNotMatch(JSON.stringify(blocked),/private-token/);

console.log('OPERA: sonda privada, resum segur i bloquejos d’autorització verificats.');
