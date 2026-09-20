// Read-only, opt-in pilot. Not imported by production or any workflow.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {normalizeSocialForecast,summarizeForecastDayparts,DAYPART_HOURLY_VARIABLES} from '../../src/core/forecast-dayparts.js';
import {rainMapGrid,projectRainPoint} from '../youtube-rain-map.mjs';
import {CATALONIA_COUNTY_PATHS} from '../../worker/catalonia-counties.js';
import {summarizeEnvironment,chooseEnvironmentScene,environmentalCaption,stationUvReading} from './environment.mjs';
const out=resolve(process.argv[2]||'build/social-pilot');
await mkdir(out,{recursive:true});
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Read failed ${r.status}: ${new URL(url).hostname}`);return r.json();}
const api='https://fonta-meteo.marcelfonta.workers.dev';
const p=new URLSearchParams({latitude:'41.6906',longitude:'2.4890',timezone:'Europe/Madrid',forecast_days:'6',hourly:DAYPART_HOURLY_VARIABLES+',precipitation',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max'});
const forecastUrl='https://api.open-meteo.com/v1/forecast?'+p;
const [forecast,current,trend]=await Promise.all([json(forecastUrl),json(api),json(api+'/temperature-trend')]);
if(current.degraded)throw Error('Station degraded: stop pilot rather than invent observations.');
const days=normalizeSocialForecast(forecast);
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=days.find(x=>x.date===date);
if(!day||!day.dayparts.every(x=>x.complete))throw Error('Missing dayparts: do not label a partial forecast as complete.');
const points=rainMapGrid();
const gridParams=new URLSearchParams({latitude:points.map(p=>p.latitude).join(','),longitude:points.map(p=>p.longitude).join(','),hourly:'precipitation',timezone:'Europe/Madrid',forecast_days:'3',models:'meteofrance_arome_france_hd'});
const gridUrl='https://api.open-meteo.com/v1/meteofrance?'+gridParams;
let rain={available:false,source:'AROME France HD',frames:[]};
try{
 const grid=await json(gridUrl);
 if(!Array.isArray(grid)||grid.length!==points.length)throw Error('Unexpected grid size');
 const forDate=d=>[9,13,17,21].map(h=>{const time=d+'T'+String(h).padStart(2,'0')+':00';return {time,values:grid.map(g=>{const i=g.hourly.time.indexOf(time),v=i<0?null:g.hourly.precipitation[i];return typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;})};});
 const frames=forDate(date);
 rain={available:frames.some(f=>f.values.some(v=>v!==null)),source:'AROME France HD',frames,byDate:Object.fromEntries(days.slice(0,3).map(d=>[d.date,forDate(d.date)])),points:points.map(p=>({...p,...projectRainPoint(p)})),counties:CATALONIA_COUNTY_PATHS};
}catch(e){console.warn('No territorial rain: '+e.message);}
const capturedAt=new Date().toISOString();
const data={pilot:true,capturedAt,date,day,days,current,trend:trend.trend,rain,forecast,sources:{forecast:forecastUrl,observation:api,trend:api+'/temperature-trend',rain:gridUrl,contract:'https://open-meteo.com/en/docs'}};
if(process.argv.includes('--environment')){
 const airUrl='https://air-quality-api.open-meteo.com/v1/air-quality?'+new URLSearchParams({latitude:'41.6906',longitude:'2.4890',timezone:'Europe/Madrid',forecast_days:'3',domains:'cams_europe',hourly:'uv_index,european_aqi,grass_pollen,olive_pollen,birch_pollen,mugwort_pollen,ragweed_pollen'});
 const readSafe=async url=>{try{return await json(url);}catch(error){console.warn(error.message);return null;}};
 const uvUrl=airUrl.replace('domains=cams_europe','domains=cams_global').replace(/hourly=[^&]+/,'hourly=uv_index');
 const [air,uv,alerts]=await Promise.all([readSafe(airUrl),readSafe(uvUrl),readSafe(api+'/alerts')]);
 const retrievedAt=new Date().toISOString(),now=Date.parse(retrievedAt);
 const summary=summarizeEnvironment(air,{date,now,retrievedAt});
 summary.uv=summarizeEnvironment(uv,{date,now,retrievedAt}).uv;
 const selection=chooseEnvironmentScene({summary,forecast,alerts,now,retrievedAt});
 const midday=summarizeEnvironment(air,{date,startHour:14,now,retrievedAt});
 midday.uv=summarizeEnvironment(uv,{date,startHour:14,now,retrievedAt}).uv;
 data.environmentEnabled=true;
 data.middayParts=summarizeForecastDayparts(forecast.hourly,date,{fromHour:14});
 data.environment={summary,selection,midday,caption:environmentalCaption(summary,selection),stationUv:stationUvReading(current,now),retrievedAt,raw:air,uvRaw:uv,alerts};
 data.sources.environment=airUrl;
 data.sources.uv=uvUrl;
 await writeFile(resolve(out,'environment.json'),JSON.stringify(data.environment,null,2));
 console.log(JSON.stringify({environment:selection.kind,reason:selection.reason,uv:summary.uv?.value,air:summary.air?.value}));
}
await writeFile(resolve(out,'data.json'),JSON.stringify(data,null,2));
// Bundle the genuine brand asset; never approximate the logo.
await writeFile(resolve(out,'logo.png'),await readFile(new URL('../../assets/icons/icon-512.png',import.meta.url)));
for(const family of ['Manrope','DM Sans']){
 const css=await (await fetch('https://fonts.googleapis.com/css2?family='+family.replaceAll(' ','+')+':wght@'+(family==='Manrope'?'800':'400')+'&display=swap')).text();
 const urls=[...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(m=>m[1]);
 if(!urls.length)throw Error('Missing font '+family);
 // Legacy CSS response supplies full glyph-set TTF, last requested weight.
 const r=await fetch(urls.at(-1));if(!r.ok)throw Error('Font download failed');
 await writeFile(resolve(out,family.replaceAll(' ','-')+'.ttf'),Buffer.from(await r.arrayBuffer()));
}
console.log(JSON.stringify({out,capturedAt,date,parts:day.dayparts,observation:current.updated,rain:rain.available,trendPoints:trend.trend?.points?.length},null,2));
