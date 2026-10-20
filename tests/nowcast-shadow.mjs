import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeNowcastRadar,nowcastShadowCoverage} from '../worker/index.js';

const now=1_800_000_000;
const radar=normalizeNowcastRadar({host:'https://tile.example',radar:{past:[{time:now-1200},{time:now-600},{time:now}],nowcast:[{time:now+600},{time:now+1200},{time:now+9000}]}},now);
assert.deepEqual(radar,{ok:true,observedFrames:3,projectedFrames:2,latestObservedAt:new Date(now*1000).toISOString(),freshnessMinutes:0,cadenceMinutes:10,horizonMinutes:20});
assert.equal(normalizeNowcastRadar({radar:{}},now).ok,false);

const rows=Array.from({length:288},(_,index)=>({radar_ok:1,satellite_ok:index%10?1:0,lightning_ok:1,high_resolution_model_ok:1,freshness_minutes:5,cadence_minutes:10,projected_frames:index%2}));
const report=nowcastShadowCoverage(rows);
assert.equal(report.samples,288);
assert.equal(report.coverage.radar,100);
assert.equal(report.coverage.satellite,89.9);
assert.equal(report.usableRadarPercent,100);
assert.equal(report.projectedSamples,144);
assert.equal(report.readiness.ready,true);
assert.match(report.method,/No calcula trajectòries/);

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
for(const contract of ['CREATE_NOWCAST_SHADOW_SAMPLES','captureNowcastShadowSample','/admin/nowcast-shadow',"mode:'shadow'","public:false","alerts:false"])assert.match(worker,new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.doesNotMatch(worker,/nowcast.*sendPush|nowcast.*publishAutomaticSocialDraft/i);

const admin=await readFile(new URL('../src/features/admin.js',import.meta.url),'utf8');
const adminPage=await readFile(new URL('../administracio.html',import.meta.url),'utf8');
assert.match(admin,/fetchNowcastShadow/);
assert.match(admin,/fetchSocialDrafts\(\),fetchCameraTimelapses\(\),fetchNowcastShadow\(\)/);
assert.match(adminPage,/id="admin-nowcast-shadow"/);

console.log('Nowcasting d’ombra: mostreig prospectiu, cobertura i límits no operatius correctes.');
