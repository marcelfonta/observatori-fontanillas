// Read-only collector. Upload/coordination remain in the existing workflow.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DAYPART_HOURLY_VARIABLES,normalizeSocialForecast,daypartCaption} from '../src/core/forecast-dayparts.js';
import {environmentalTimestamp,isFresh,STATION_MAX_AGE_MS} from '../src/core/environment-freshness.js';
import {fetchSocialEnvironment,secondaryUv,chooseEnvironmentScene} from '../src/core/social-environment.js';
import {fetchRainEvolution,projectRainPoint} from './youtube-rain-map.mjs';
import {CATALONIA_COUNTY_PATHS} from '../worker/catalonia-counties.js';
import {madridOffset,normalizeMoon} from './social-pilot/lunar.mjs';

export const localDate=now=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(new Date(now));
export function targetDate(slot,now){
 if(!['mati','vespre'].includes(slot))throw Error('Invalid production slot');
 const day=new Date(localDate(now)+'T12:00Z');if(slot==='vespre')day.setUTCDate(day.getUTCDate()+1);
 return day.toISOString().slice(0,10);
}
export function assertProductionSnapshot(data,now=Date.now()){
 if(data?.pilot!==false||data.format!=='cinematic-v5')throw Error('Pilot snapshots cannot be published');
 if(!isFresh(Date.parse(data.capturedAt),now,30*60_000))throw Error('Expired production snapshot');
 if(data.publicationDate!==localDate(now)||data.date!==targetDate(data.slot,now))throw Error('Publication date changed');
 const observationTime=environmentalTimestamp(data.current?.updatedUtc,true);
 const time=Number.isFinite(observationTime)?observationTime:environmentalTimestamp(data.current?.updated);
 if(data.current?.stale||data.current?.degraded||!isFresh(time,now,STATION_MAX_AGE_MS)||typeof data.current.temperature!=='number'||!Number.isFinite(data.current.temperature))throw Error('Station observation unavailable or stale');
 if(data.forecast?.timezone!=='Europe/Madrid'||data.day?.date!==data.date||data.day?.dayparts?.length!==3||!data.day.dayparts.every(p=>p.complete)||!Array.isArray(data.days)||data.days.length<4)throw Error('Incomplete dated forecast');
 return data;
}
export async function collectProductionData({slot,now=Date.now(),fetcher=fetch,rainFetcher=fetchRainEvolution}={}){
 const date=targetDate(slot,now),publicationDate=localDate(now),api='https://fonta-meteo.marcelfonta.workers.dev';
 const json=async url=>{const r=await fetcher(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Provider HTTP ${r.status}`);return r.json();};
 const params=new URLSearchParams({latitude:'41.6906',longitude:'2.4890',timezone:'Europe/Madrid',forecast_days:'6',hourly:DAYPART_HOURLY_VARIABLES+',precipitation',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max'});
 const [current,forecast,trend,summary]=await Promise.all([
  json(api),json('https://api.open-meteo.com/v1/forecast?'+params),json(api+'/temperature-trend').catch(()=>({trend:null})),fetchSocialEnvironment({date,now,fetcher}),
 ]);
 const days=normalizeSocialForecast(forecast).filter(day=>day.date>=date),day=days[0];
 const data={pilot:false,format:'cinematic-v5',capturedAt:new Date(now).toISOString(),publicationDate,slot,edition:slot==='vespre'?'evening':'morning',date,current,forecast,days,day,trend:trend.trend,environmentEnabled:true,lunarEnabled:true,environment:{summary,selection:chooseEnvironmentScene(),secondaryUv:secondaryUv(summary,{date,now})},moon:null};
 assertProductionSnapshot(data,now);
 const moonUrl='https://aa.usno.navy.mil/api/rstt/oneday?'+new URLSearchParams({date,coords:'41.6906,2.4890',tz:String(madridOffset(date)),ID:'FONTAMET'});
 const [rain,moon]=await Promise.all([rainFetcher({slot,targetDate:date,hourlyFallback:forecast.hourly}),json(moonUrl).catch(()=>null)]);
 data.moon=normalizeMoon(moon,date);
 data.rain={...rain,available:rain.frames?.length===4&&rain.frames.some(f=>f.values.some(v=>typeof v==='number'&&Number.isFinite(v))),points:rain.points.map(p=>({...p,...projectRainPoint(p)})),counties:CATALONIA_COUNTY_PATHS};
 return data;
}
export function productionMetadata(data){
 const when=data.slot==='vespre'?'Demà':'Avui';
 return {title:`${when} a Sant Celoni · ${data.date} #Shorts`,description:`Previsió per ${when.toLowerCase()}, ${data.date}: ${daypartCaption(data.day.dayparts)}.\nObservació de l’estació: ${data.current.updated}. Model meteorològic Open-Meteo; mapa de pluja ${data.rain.source}. ${data.moon?'Fase lunar USNO de les 12 h locals.':'Fase lunar no disponible.'} ${data.environment.secondaryUv?'UV previst CAMS, no sensor.':''}\n\nhttps://meteo.fontanillas.cat/\n#MeteoFontanillas #SantCeloni #ElTemps #Shorts`,tags:['Meteo Fontanillas','Sant Celoni','meteorologia','Shorts']};
}
async function main(){
 const root=resolve('build/youtube-short');await mkdir(root,{recursive:true});
 const data=await collectProductionData({slot:process.env.SHORT_SLOT||'mati'});
 assertProductionSnapshot(data);
 await writeFile(resolve(root,'data.json'),JSON.stringify(data));
 await writeFile(resolve(root,'metadata.json'),JSON.stringify(productionMetadata(data)));
 await writeFile(resolve(root,'logo.png'),await readFile(new URL('../assets/icons/icon-512.png',import.meta.url)));
 for(const family of ['Manrope','DM Sans']){
  const r=await fetch('https://fonts.googleapis.com/css2?family='+family.replaceAll(' ','+')+':wght@'+(family==='Manrope'?'800':'400')+'&display=swap',{signal:AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('Font manifest unavailable');
  const urls=[...(await r.text()).matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)];
  if(!urls.length)throw Error('Font missing');
  const font=await fetch(urls.at(-1)[1],{signal:AbortSignal.timeout(12000)});if(!font.ok)throw Error('Font unavailable');
  await writeFile(resolve(root,family.replaceAll(' ','-')+'.ttf'),Buffer.from(await font.arrayBuffer()));
 }
 console.log(JSON.stringify({format:data.format,slot:data.slot,date:data.date,capturedAt:data.capturedAt,moon:!!data.moon,uv:data.environment.secondaryUv?.value,rainSource:data.rain.source}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
