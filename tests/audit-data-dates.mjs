import assert from 'node:assert/strict';
import { finiteNumber } from '../src/core/numeric.js';
import { renderDataCenter } from '../src/features/data-center.js';
import { normalizeObservation, initialCondition, initialSchema } from '../functions/_middleware.js';
import { ASTRONOMICAL_EVENTS, SEASON_TRANSITIONS, astronomyVisibilitySummary, astronomyObservationDateLabel, shiftCalendarDate } from '../src/data/astronomical-calendar.js';
import { createAstronomicalEventSocialDraft, createSeasonChangeSocialDraft, socialCardHtml, socialDraftTemporalEligibility, publishAutomaticSocialDraft } from '../worker/index.js';

for(const value of [null,undefined,'','  ',false,true,[],{},NaN,Infinity,'sense dades'])assert.equal(finiteNumber(value),null);
for(const value of [0,'0',' 0 '])assert.equal(finiteNumber(value),0);
assert.equal(finiteNumber('-2.5'),-2.5);
const now=new Date('2026-09-12T10:00:00Z');
const reading={temperature:0,updatedUtc:'2026-09-12T09:59:00Z',rainToday:0,humidity:null,pressure:null};
const observed=normalizeObservation(reading,now);
assert.equal(observed.temperature,0);
assert.equal(observed.rainToday,0);
assert.equal(observed.humidity,null);
assert.equal(observed.pressure,null);
assert.equal(initialCondition(observed),'Observació en directe');
assert.equal(initialSchema(observed)['@graph'].at(-1).measuredProperty.some(p=>p.name==='Pressió atmosfèrica'),false);
for(const value of [null,'',false])assert.equal(normalizeObservation({...reading,temperature:value},now),null);
for(const updatedUtc of [null,'','invalid','2026-09-12 11:59:00','2026-09-13T00:00:00Z'])assert.equal(normalizeObservation({...reading,updatedUtc},now),null);
assert.equal(normalizeObservation({...reading,updatedUtc:'2026-09-12T09:00:00Z'},now).stale,true);
assert.equal(normalizeObservation({...reading,stale:true},now).stale,true);
const originalDocument=globalThis.document;
const summaryNode={textContent:''};
try {
  globalThis.document={getElementById:id=>id==='data-summary-temp-mean'?summaryNode:null};
  renderDataCenter([{t:Date.now()-60000,temperature:20},{t:Date.now(),temperature:null}]);
  assert.equal(summaryNode.textContent,'20,0','Missing temperature must not halve the mean');
  renderDataCenter([{t:Date.now(),temperature:null}]);
  assert.equal(summaryNode.textContent,'—');
  renderDataCenter([{t:Date.now(),temperature:0}]);
  assert.equal(summaryNode.textContent,'0,0');
} finally {if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;}

function forecast(event,cloud=25) {
  const first=Math.floor(Date.parse(event.forecastStart)/3600000)*3600000;
  const last=Math.ceil(Date.parse(event.forecastEnd)/3600000)*3600000;
  const time=Array.from({length:(last-first)/3600000+1},(_,i)=>new Date(first+i*3600000).toISOString().slice(0,16));
  return {time,cloud_cover:time.map(()=>cloud),precipitation_probability:time.map(()=>0),precipitation:time.map(()=>0)};
}
const orionids=ASTRONOMICAL_EVENTS[0];
const good=forecast(orionids,0);
assert.equal(astronomyVisibilitySummary(good,orionids).reasonable,true);
for(const key of ['cloud_cover','precipitation_probability','precipitation']) {
  for(const value of [null,'',false,-1]) {
    const bad=structuredClone(good);bad[key][2]=value;
    assert.equal(astronomyVisibilitySummary(bad,orionids),null,`${key}: ${value}`);
  }
}
assert.equal(astronomyVisibilitySummary({...good,cloud_cover:good.time.map(()=>null)},orionids),null);
assert.equal(astronomyVisibilitySummary({...good,cloud_cover:good.time.map(()=>101)},orionids),null);
assert.equal(astronomyVisibilitySummary({...good,time:good.time.slice(0,2)},orionids),null);
assert.equal(astronomyVisibilitySummary({...good,time:good.time.map(()=>good.time[0])},orionids),null);
assert.equal(astronomyVisibilitySummary(forecast(orionids,70.4),orionids).reasonable,false,'Do not round before applying limits');
assert.equal(astronomyVisibilitySummary(good,{forecastStart:'bad',forecastEnd:'bad'}),null);
const dst={forecastStart:'2026-10-25T00:00:00+02:00',forecastEnd:'2026-10-25T06:00:00+01:00'};
assert.equal(astronomyVisibilitySummary(forecast(dst),dst).hours,8,'Both repeated local hours have distinct UTC instants');
assert.match(astronomyObservationDateLabel(orionids),/Nit del 20 al 21 d’octubre del? 2026/);
assert.match(astronomyObservationDateLabel({reminderDate:'2026-12-31',forecastEnd:'2027-01-01T06:00:00+01:00'}),/2026 al .*2027/);

// Exercise the real draft builders. Only the storage/provider boundary is replaced.
const drafts=new Map();let inserted=0;
const DB={batch:async()=>[],prepare(sql){return {
  bind(...values){this.values=values;return this;},
  async run(){
    if(sql.includes('INSERT OR IGNORE INTO social_drafts')) {
      const [dedupe_key,kind,channels,title,body,source_url,payload]=this.values;
      if(drafts.has(dedupe_key))return {meta:{changes:0}};
      drafts.set(dedupe_key,{id:++inserted,dedupe_key,kind,channels,title,body,source_url,payload});
    }
    return {meta:{changes:1}};
  },
  async first(){return drafts.get(this.values?.[0])||null;},
}}};
const env={DB,SOCIAL_ASTRONOMY_ENABLED:'true'};
const originalFetch=globalThis.fetch;
try {
  globalThis.fetch=async()=>{throw new Error('Unexpected network request in a local regression test');};
  for(const event of ASTRONOMICAL_EVENTS.filter(e=>e.social)) {
    const day=shiftCalendarDate(event.reminderDate,-2);
    const summer=Number(day.slice(5,7))>=4&&Number(day.slice(5,7))<=10;
    const advance=new Date(`${day}T18:00:00${summer?'+02:00':'+01:00'}`);
    const result=await createAstronomicalEventSocialDraft(env,advance,'advance');
    assert.equal(result.created,true);
    const data=JSON.parse(result.draft.payload);
    assert.ok(result.draft.title.includes(data.dateLabel));
    assert.ok(socialCardHtml(result.draft).includes(data.dateLabel));
    assert.equal(socialDraftTemporalEligibility(result.draft,advance),true);
    assert.equal(socialDraftTemporalEligibility(result.draft,new Date(advance.getTime()+86400000)),false);
    if(event.observationPeriod==='day')assert.doesNotMatch(result.draft.title+result.draft.body,/nit/i);
    else assert.match(data.dateLabel,/Nit del/);
    assert.equal((await createAstronomicalEventSocialDraft(env,advance,'advance')).created,false);

    const reminder=new Date(`${event.reminderDate}T${event.reminderTime||'17:00'}:00${summer?'+02:00':'+01:00'}`);
    globalThis.fetch=async url=>{assert.match(String(url),/^https:\/\/api.open-meteo.com\/v1\/forecast\?/);return Response.json({hourly:forecast(event)});};
    const reminderResult=await createAstronomicalEventSocialDraft(env,reminder,'reminder');
    assert.equal(reminderResult.created,true);
    assert.equal(socialDraftTemporalEligibility(reminderResult.draft,reminder),true);
    if(event.observationPeriod==='day') {
      assert.match(reminderResult.draft.title,/Avui, de dia/);
      assert.doesNotMatch(reminderResult.draft.body,/nit/i);
      assert.match(socialCardHtml(reminderResult.draft),/protecció solar homologada/);
    }
    const missing=forecast(event);missing.cloud_cover.fill(null);
    globalThis.fetch=async()=>Response.json({hourly:missing});
    assert.equal((await createAstronomicalEventSocialDraft(env,reminder,'reminder')).reason,'forecast_unavailable');
    globalThis.fetch=async()=>Response.json({hourly:forecast(event,95)});
    assert.equal((await createAstronomicalEventSocialDraft(env,reminder,'reminder')).reason,'unfavorable_forecast');
  }
  for(const season of SEASON_TRANSITIONS.filter(s=>s.id.endsWith('2026'))) {
    const offset=season.date.slice(-6);
    const date=new Date(`${season.date.slice(0,10)}T09:00:00${offset}`);
    const result=await createSeasonChangeSocialDraft(env,date);
    assert.ok(result?.draft);
    assert.doesNotMatch(result.draft.title+result.draft.body,/la (hivern|estiu)/);
    assert.equal(socialDraftTemporalEligibility(result.draft,date),true);
  }
  globalThis.fetch=async()=>{throw new Error('Publishing an expired draft must not contact a provider');};
  const expired={kind:'astronomical_event',payload:JSON.stringify({localDate:'2020-01-01'})};
  assert.equal((await publishAutomaticSocialDraft({draft:expired},{})).reason,'editorial_validity_expired_or_unknown');
  let held=false;
  const holdDB={prepare(sql){assert.match(sql,/SET status = 'draft'/);return {bind(id){assert.equal(id,77);return this;},async run(){held=true;return {meta:{changes:1}};}};}};
  await publishAutomaticSocialDraft({draft:{...expired,id:77}},{DB:holdDB});
  assert.equal(held,true,'Expired drafts leave automatic recovery without deleting publication history');
} finally {globalThis.fetch=originalFetch;}

const alert={source:'Meteocat',issuedAt:'2026-09-12T07:00Z',targetDate:'2026-09-12',expires:'2026-09-14T00:00Z',periods:['12/09 08:00–12/09 14:00 h']};
const eligible=(data,date=now)=>socialDraftTemporalEligibility({kind:'official_alert',payload:JSON.stringify(data)},date);
assert.equal(eligible(alert),true);
assert.equal(eligible(alert,new Date('2026-09-12T12:00:00Z')),false,'County window ended even though episode continues');
assert.equal(eligible({...alert,expires:'2026-09-12T10:00Z'}),false);
assert.equal(eligible({...alert,expires:null}),false);
assert.equal(eligible({...alert,periods:['12/09 08:00–31/99 14:00 h']}),false);
assert.equal(eligible({...alert,issuedAt:'2026-09-11T07:00Z'}),false,'Do not replay yesterday’s relative date copy');
assert.equal(eligible({...alert,targetDate:'2026-09-13',periods:['13/09 08:00–13/09 14:00 h']}),true,'Advance alerts remain allowed');
assert.equal(eligible({...alert,issuedAt:'2026-12-31T15:00Z',targetDate:'2026-12-31',expires:'2027-01-01T02:00Z',periods:['31/12 20:00–01/01 02:00 h']},new Date('2026-12-31T22:30Z')),true);
assert.equal(socialDraftTemporalEligibility({kind:'official_alert',payload:'bad'},now),false);
for(const kind of ['weekly_summary','monthly_summary','seasonal_summary','annual_summary','station_event','environmental_event','meteorological_ephemeris']){
  const dated={kind,payload:JSON.stringify({localDate:'2026-09-12'})};
  assert.equal(socialDraftTemporalEligibility(dated,now),true,`${kind}: same-day retries remain available`);
  assert.equal(socialDraftTemporalEligibility(dated,new Date('2026-09-13T10:00:00Z')),false,`${kind}: stale recovery is blocked`);
  assert.equal(socialDraftTemporalEligibility({kind,payload:'bad'},now),false,`${kind}: unknown dates are blocked`);
}
assert.equal(socialDraftTemporalEligibility({kind:'daily'},now),true);
console.log('Auditoria paquet A: dades absents, cobertura astronòmica, esborranys reals i caducitat editorial correctes');
