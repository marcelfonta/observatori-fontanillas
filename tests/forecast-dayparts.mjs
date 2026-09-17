import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { summarizeForecastDayparts, normalizeSocialForecast, daypartWeatherLabel, daypartCaption } from '../src/core/forecast-dayparts.js';
import { buildDaypartSlides, forecastDaypartContent, editionLabel, weatherGlyph } from '../scripts/youtube-short.mjs';
import { socialCardHtml, dailyDaypartsCardMarkup, socialForecastSummary, bufferXCaption, xWeightedLength, createDailySocialDraft, socialPostText } from '../worker/index.js';

function fixture(date='2026-09-17') {
  const next=new Date(`${date}T12:00Z`);next.setUTCDate(next.getUTCDate()+1);
  const time=Array.from({length:24},(_,h)=>`${date}T${String(h).padStart(2,'0')}:00`).concat(`${next.toISOString().slice(0,10)}T00:00`);
  return {time,weather_code:time.map((_,h)=>h<12?0:h<19?61:3),temperature_2m:time.map((_,h)=>h),precipitation_probability:time.map((_,h)=>h<13?0:h<20?70:10),wind_gusts_10m:time.map((_,h)=>h)};
}
const hourly=fixture();
const parts=summarizeForecastDayparts(hourly,'2026-09-17');
assert.deepEqual(parts.map(p=>p.timeLabel),['06:00–12:00','12:00–19:00','19:00–24:00']);
assert.deepEqual(parts.map(p=>p.weatherCode),[0,61,3]);
assert.deepEqual(parts.map(p=>[p.min,p.max]),[[6,11],[12,18],[19,23]]);
assert.deepEqual(parts.map(p=>p.rainProbability),[0,70,10]);
assert.deepEqual(parts.map(p=>p.gust),[12,19,24]);
assert.ok(parts.every(p=>p.complete));
assert.deepEqual(summarizeForecastDayparts(hourly,'2026-09-17',{fromHour:14}).map(p=>p.timeLabel),['14:00–19:00','19:00–24:00']);
assert.equal(summarizeForecastDayparts(hourly,'2026-09-17',{fromHour:24}).length,0);
for(const date of ['',null,'2026-02-31','2026-09-17T00:00'])assert.deepEqual(summarizeForecastDayparts(hourly,date),[]);
for(const value of [null,undefined,'',false,Infinity,999])assert.equal(daypartWeatherLabel(value),'Previsió no disponible');
assert.equal(daypartWeatherLabel(57),'Precipitació engelant');

const showers=structuredClone(hourly);showers.weather_code[15]=95;
assert.equal(summarizeForecastDayparts(showers,'2026-09-17')[1].weatherCode,95);
showers.weather_code[16]=0;
assert.match(summarizeForecastDayparts(showers,'2026-09-17')[1].condition,/Possibilitat de tempesta/);
const clear=structuredClone(hourly);clear.weather_code.fill(0);clear.weather_code[6]=3;
assert.equal(summarizeForecastDayparts(clear,'2026-09-17')[0].weatherCode,0,'Dry sky follows predominant condition, not maximum numeric code');
const reversed={};for(const [key,values]of Object.entries(hourly))reversed[key]=[...values].reverse();
assert.deepEqual(summarizeForecastDayparts(reversed,'2026-09-17'),parts);

for(const field of ['temperature_2m','precipitation_probability','wind_gusts_10m','weather_code']){
  for(const value of [null,'',false,NaN]){
    const incomplete=structuredClone(hourly);incomplete[field][8]=value;
    const part=summarizeForecastDayparts(incomplete,'2026-09-17')[0];
    assert.equal(part.complete,false);
    if(field==='temperature_2m')assert.equal(part.min,null);
    if(field==='precipitation_probability')assert.equal(part.rainProbability,null);
    if(field==='wind_gusts_10m')assert.equal(part.gust,null);
    if(field==='weather_code')assert.equal(part.weatherCode,null);
  }
}
const noMidnight=structuredClone(hourly);for(const values of Object.values(noMidnight))values.pop();
const last=summarizeForecastDayparts(noMidnight,'2026-09-17')[2];
assert.equal(last.rainProbability,null);assert.equal(last.gust,null);assert.equal(last.max,23);
const absent=summarizeForecastDayparts({},'2026-09-17');
assert.equal(absent.length,3);assert.ok(absent.every(p=>p.weatherCode===null&&p.min===null&&p.rainProbability===null));

// Civil local boundaries remain stable in winter, DST transitions and year rollover.
for(const date of ['2026-10-25','2026-03-29','2026-12-31'])assert.deepEqual(summarizeForecastDayparts(fixture(date),date).map(p=>p.gust),[12,19,24]);
const daily={time:['2026-09-17','2026-09-18'],weather_code:[61,3],temperature_2m_max:[23,null],temperature_2m_min:[16,null],precipitation_probability_max:[93,null],wind_gusts_10m_max:[40,null]};
const forecast=normalizeSocialForecast({hourly,daily});
assert.equal(forecast[1].max,null);assert.equal(forecast[1].dayparts[0].max,null);
assert.equal(forecast[0].dayparts[0].rainProbability,0,'Daily 93% must not leak into the dry morning');

for(const slot of ['mati','vespre']){
  const day={...forecast[0],date:slot==='vespre'?'2026-09-18':'2026-09-17'};
  const slides=buildDaypartSlides({day,when:slot==='vespre'?'Demà':'Avui',edition:editionLabel(slot,new Date('2026-09-17T04:45Z')),logoData:'test'});
  assert.equal(slides.length,3);
  for(const [i,slide]of slides.entries()){
    assert.match(slide,new RegExp(`>${parts[i].label}</text>`));
    assert.match(slide,new RegExp(parts[i].timeLabel));
    assert.match(slide,slot==='vespre'?/DEMÀ · DV 18 DE SETEMBRE/:/AVUI · DJ 17 DE SETEMBRE/);
    assert.match(slide,/Temperatura de la franja/);
    assert.match(slide,/Pluja · màx\. horària/);
    assert.doesNotMatch(slide,/>93<tspan/);
  }
}
assert.match(forecastDaypartContent(absent[0]),/Dades incompletes/);
assert.match(forecastDaypartContent(absent[0]),/—° \/ —°/);
assert.doesNotMatch(weatherGlyph(0,0,0,1,true),/<circle r="52"/);
assert.match(weatherGlyph(0,0,0,1,true),/A76 76/);
assert.match(daypartCaption(parts),/Matí.*Tarda.*Vespre/);

const payload={localDate:'2026-09-17',period:'mati',temperature:20,forecast};
const markup=dailyDaypartsCardMarkup(payload);
assert.match(markup,/AVUI · 2026-09-17/);assert.match(markup,/Matí/);assert.match(markup,/Tarda/);assert.match(markup,/Vespre/);
assert.doesNotMatch(dailyDaypartsCardMarkup({...payload,period:'migdia'}),/>Matí</);
assert.match(dailyDaypartsCardMarkup({...payload,period:'vespre'}),/DEMÀ · 2026-09-18/);
const html=socialCardHtml({kind:'daily_observation',payload:JSON.stringify(payload)});
assert.match(html,/<body class="daily-dayparts-card">/);assert.doesNotMatch(html,/<div class="forecast-symbol">/);
const legacy=socialCardHtml({kind:'daily_observation',payload:JSON.stringify({...payload,forecast:[{date:'2026-09-17',weatherCode:61,condition:'Pluja',max:23,min:16}]})});
assert.match(legacy,/<div class="forecast-symbol">/);assert.doesNotMatch(legacy,/<section class="dayparts">/);
assert.match(socialForecastSummary(forecast[0],'morning'),/Avui, 2026-09-17.*Matí:.*Tarda:.*Vespre:/);
assert.match(socialForecastSummary(forecast[1],'evening'),/Demà, 2026-09-18/);
const x=bufferXCaption('2026-09-17','morning',null,forecast[0]);
assert.match(x,/Matí:.*\nTarda:.*\nVespre:/);assert.ok(xWeightedLength(x)<=240);assert.match(x,/https:\/\/meteo\.fontanillas\.cat\//);
const longDay={...forecast[0],dayparts:parts.map(part=>({...part,condition:'Possibilitat de precipitació engelant i ruixats de neu'}))};
const longX=bufferXCaption('2026-09-17','morning',null,longDay);
assert.ok(xWeightedLength(longX)<=240);assert.match(longX,/Matí:.*\nTarda:.*\nVespre:/);assert.match(longX,/https:\/\/meteo\.fontanillas\.cat\/$/);
const shortPost=socialPostText({kind:'daily_observation',title:'Actualització',body:'Text extens. '.repeat(100),payload:JSON.stringify({...payload,forecast:[longDay]})},300);
assert.ok(Array.from(shortPost).length<=300);assert.match(shortPost,/2026-09-17/);assert.match(shortPost,/Matí:.*\nTarda:.*\nVespre:/);assert.match(shortPost,/https:\/\/meteo\.fontanillas\.cat\/$/);
assert.match(html,/body\.daily-dayparts-card\{position:relative\}/);

// Real daily builder with only provider/storage boundaries mocked; never publishes.
const originalFetch=globalThis.fetch;const stored=new Map();let calls=0;
const env={SOCIAL_AUTOMATION_ENABLED:'false',DB:{batch:async()=>[],prepare(sql){return {
  bind(...values){this.values=values;return this;},
  async all(){return {results:[]};},
  async run(){if(sql.includes('INSERT OR IGNORE INTO social_drafts')){
    const [key,status,channels,title,body,source_url,payload]=this.values;
    stored.set(key,{id:stored.size+1,kind:'daily_observation',status,channels,title,body,source_url,payload});return {meta:{changes:1}};
  }return {meta:{changes:0}};},
  async first(){return sql.includes('SELECT * FROM social_drafts')?stored.get(this.values[0]):null;},
};}}};
try{
  globalThis.fetch=async url=>{const params=new URL(url).searchParams;assert.match(params.get('hourly'),/weather_code,temperature_2m,precipitation_probability,wind_gusts_10m/);calls++;return Response.json({hourly,daily});};
  const observation={updated:'2026-09-17T14:00:00',epoch:1790000000,temperature:20};
  const midday=await createDailySocialDraft(observation,env,'14:00');
  assert.equal(midday.draft.status,'draft');assert.match(midday.draft.body,/Tarda \(14:00–19:00 h\)/);assert.doesNotMatch(midday.draft.body,/Matí \(/);
  assert.deepEqual(JSON.parse(midday.draft.payload).forecast[0].dayparts.map(p=>p.timeLabel),['14:00–19:00','19:00–24:00']);
  const evening=await createDailySocialDraft(observation,env,'20:30');
  assert.match(evening.draft.body,/Demà, 2026-09-18/);assert.doesNotMatch(evening.draft.body,/Demà, 2026-09-17/);
  assert.equal(calls,2);
}finally{globalThis.fetch=originalFetch;}

const workflow=await readFile(new URL('../.github/workflows/youtube-short-private.yml',import.meta.url),'utf8');
assert.match(workflow,/\[v0\]\[v2\]xfade/);assert.match(workflow,/\[v01\]\[v3\]xfade/);assert.match(workflow,/\[v02\]\[temp\]xfade/);
assert.match(workflow,/-i build\/youtube-short\/slide-2\.png/);
assert.match(workflow,/-t 30 build\/youtube-short\/short\.mp4/);
console.log('Previsió per franges: límits horaris, dades absents, vídeos, migdia, textos i compatibilitat correctes');
