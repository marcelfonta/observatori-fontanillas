import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sha256} from '../scripts/fonta/io.mjs';
import {readRegionalCaptures,uploadRegionalEvidence} from '../scripts/fonta/regional-archive.mjs';
import {XEMA_DAILY_MODELS,XEMA_DAILY_STATIONS,evaluateRegionalDaily,normalizeRegionalForecast,normalizeXemaDaily,normalizeXemaStations,regionalCapture,regionalForecastRequest,xemaDailyRequest,xemaStationMetadataRequest} from '../src/core/fonta-xema-daily.js';

const metadata=XEMA_DAILY_STATIONS.map((code,index)=>({codi_estacio:code,nom_estacio:'Estació '+code,nom_estat_ema:'Operativa',latitud:String(41.6+index/100),longitud:String(2.4+index/100),altitud:String(100+index*200)}));
const stations=normalizeXemaStations(metadata);
assert.deepEqual(stations.map(s=>s.code),XEMA_DAILY_STATIONS);
assert.equal(new URL(xemaStationMetadataRequest()).searchParams.get('$limit'),'7');
assert.equal(new URL(xemaDailyRequest('2026-09-10','2026-09-20')).searchParams.get('$limit'),'501');
assert.throws(()=>xemaDailyRequest('2026-09-20','2026-09-20'));

function rows(date){
  return XEMA_DAILY_STATIONS.flatMap(code=>[
    ...(code==='KX'?[]:[{codi_estacio:code,codi_variable:'1001',data_lectura:date+'T00:00:00.000',valor:'25',unitat:'°C',hora_tu:'13:00',estat:'Representatiu'},
      {codi_estacio:code,codi_variable:'1002',data_lectura:date+'T00:00:00.000',valor:'10',unitat:'°C',hora_tu:'05:00',estat:'Representatiu'}]),
    {codi_estacio:code,codi_variable:'1300',data_lectura:date+'T00:00:00.000',valor:'0',unitat:'mm',estat:'Representatiu'}
  ]);
}
const normalized=normalizeXemaDaily(rows('2026-09-21'),{receivedAt:'2026-09-22T08:30:00Z'});
assert.equal(normalized.observations.length,6);assert.equal(normalized.observations.find(x=>x.station==='KX').temperatureComplete,false);
assert.equal(normalized.observations.find(x=>x.station==='KX').rain,0);
assert.equal(normalizeXemaDaily([{...rows('2026-09-21')[0],estat:'No representatiu'}],{receivedAt:'2026-09-22T08:30:00Z'}).observations.length,0);
assert.equal(normalizeXemaDaily([...rows('2026-09-21'),rows('2026-09-21')[0]],{receivedAt:'2026-09-22T08:30:00Z'}).observations.find(x=>x.station==='UQ').temperatureComplete,false);
assert.throws(()=>normalizeXemaDaily(rows('2026-09-21').map(x=>({...x,unitat:x.codi_variable==='1300'?'l':'°C'})),{receivedAt:'bad'}));

function forecastRaw(target,offset=0){
  const epoch=Date.parse(target+'T00:00:00+02:00')/1000;
  return stations.map((station,index)=>({latitude:station.latitude,longitude:station.longitude,elevation:station.elevation,timezone:'Europe/Madrid',
    daily_units:{time:'unixtime',temperature_2m_max:'°C',temperature_2m_min:'°C',precipitation_sum:'mm'},
    daily:{time:[epoch],temperature_2m_max:[25+offset+index/10],temperature_2m_min:[10+offset+index/10],precipitation_sum:[offset]}}));
}
for(const model of XEMA_DAILY_MODELS){
  assert(regionalForecastRequest(model,stations).includes('precipitation_sum'));
  const f=normalizeRegionalForecast(forecastRaw('2026-09-21'),{model,capturedAt:'2026-09-20T08:35:00Z',stations});
  assert.equal(f.length,6);assert.equal(f[0].daily[0].date,'2026-09-21');assert(f[0].daily[0].complete);
}
assert.throws(()=>normalizeRegionalForecast(forecastRaw('2026-09-21').slice(1),{model:XEMA_DAILY_MODELS[0],capturedAt:'2026-09-20T08:35:00Z',stations}));

const source=(raw,receivedAt,extra={})=>({...extra,url:'https://example.test/data',receivedAt,hashFormat:'JSON.stringify',sha256:sha256(JSON.stringify(raw)),raw});
function capture(capturedAt,target,observations=[]){
  return regionalCapture({capturedAt,sources:{stations:source(metadata,capturedAt),daily:source(observations,capturedAt),
    forecasts:XEMA_DAILY_MODELS.map((model,index)=>source(forecastRaw(target,index),capturedAt,{model}))}});
}
const issue=capture('2026-09-20T08:35:00Z','2026-09-21');
const verification=capture('2026-09-22T08:35:00Z','2026-09-23',rows('2026-09-21'));
const report=evaluateRegionalDaily([issue,verification],{now:'2026-09-22T09:00:00Z'});
assert.equal(report.productionEnabled,false);assert.equal(report.promotion.allowed,false);assert.equal(report.pairedStationDays,6);
assert.equal(report.metrics.max.best_match.samples,5);assert.equal(report.metrics.rain.best_match.samples,6);
assert.equal(report.metrics.rain.best_match.events.rain.correctNegatives,6);
assert.equal(report.coverage.KX.temperature,0);assert.equal(report.coverage.KX.rain,1);
const tampered=structuredClone(issue);tampered.sources.daily.raw.push({bad:true});assert.throws(()=>evaluateRegionalDaily([tampered]));

const objects=new Map(),writes=[];
const transport={inventory:async()=>[...objects].map(([key,value])=>({key,size:value.length})),get:async key=>objects.get(key),put:async(key,value)=>{writes.push(key);objects.set(key,Buffer.from(value));}};
const plan=await uploadRegionalEvidence(issue,report,transport);assert.equal(plan.committed,false);assert.equal(writes.length,0);
const uploaded=await uploadRegionalEvidence(issue,report,transport,{commit:true});assert.equal(uploaded.uploaded,2);assert(writes[0].startsWith('regional/captures/'));
assert.equal((await uploadRegionalEvidence(issue,report,transport,{commit:true})).uploaded,0);
assert.equal((await readRegionalCaptures(transport)).captures.length,1);
const key=writes[0],valid=objects.get(key);objects.set(key,Buffer.from('bad'));await assert.rejects(()=>readRegionalCaptures(transport),/Integritat|Mida/);objects.set(key,valid);

const workflow=await readFile('.github/workflows/fonta-xema-daily.yml','utf8');
for(const required of ["cron: '35 8 * * *'","vars.FONTA_XEMA_DAILY_ENABLED == 'true'",'contents: read','group: fonta-r2-archive','persist-credentials: false','default: plan','retention-days: 30'])assert(workflow.includes(required),required);
for(const forbidden of ['contents: write','git push','wrangler deploy','CLOUDFLARE_API_TOKEN'])assert(!workflow.includes(forbidden),forbidden);
assert((await readFile('.github/workflows/fonta-r2-backup.yml','utf8')).includes('group: fonta-r2-archive'));

console.log('Fonta XEMA diari: dates, representativitat, zeros, mostres aparellades, R2 immutable i workflow opt-in correctes.');
