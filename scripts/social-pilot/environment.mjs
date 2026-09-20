// Pure editorial contract. Local pilot only; never dispatches publications.
import {nonNegative,environmentalTimestamp,isFresh,stationUvReading} from '../../src/core/environment-freshness.js';
export const POLLEN_SPECIES=['grass','olive','birch','mugwort','ragweed'];
const hourLabel=h=>String(h).padStart(2,'0')+':00';
export function summarizeEnvironment(payload,{date,startHour=6,endHour=24,now=Date.now(),retrievedAt}={}){
 const empty={date,startHour,endHour,uv:null,air:null,pollen:{eligible:false,reason:'incomplete-local-species-and-unverified-levels'},source:'CAMS vía Open-Meteo',retrievedAt};
 // Retrieval freshness is not model issuance. Both retrieval and validity range
 // are retained; dates cannot be relabelled as today's measurements.
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||!Number.isInteger(startHour)||!Number.isInteger(endHour)||startHour<0||endHour>24||startHour>=endHour||payload?.timezone!=='Europe/Madrid'||!isFresh(Date.parse(retrievedAt),now,90*60_000))return empty;
 const hourly=payload.hourly;
 if(!Array.isArray(hourly?.time))return empty;
 function series(key){
  const rows=[];
  for(let hour=startHour;hour<endHour;hour++){
   const time=`${date}T${hourLabel(hour)}`,indexes=hourly.time.flatMap((s,i)=>s===time?[i]:[]);
   if(indexes.length!==1||!Number.isFinite(environmentalTimestamp(time)))return null;
   const value=nonNegative(hourly[key]?.[indexes[0]]);if(value===null)return null;
   rows.push({time,hour,value});
  }
  const peak=rows.reduce((a,b)=>b.value>a.value?b:a);
  return {value:peak.value,peakTime:peak.time,rows,coverage:`${rows.length}/${endHour-startHour}`,period:`${hourLabel(startHour)}–${hourLabel(endHour-1)} h`,date};
 }
 return {...empty,uv:series('uv_index'),air:series('european_aqi')};
}
export function chooseEnvironmentScene({summary,forecast,alerts,now=Date.now(),retrievedAt}){
 const map=reason=>({kind:'rain',reason});
 if(!summary||!isFresh(Date.parse(retrievedAt),now,90*60_000))return map('snapshot-stale');
 // Existing public alerts endpoint is today-scoped. Never infer tomorrow clear.
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid'}).format(new Date(now));
 if(summary.date!==today||alerts?.ok!==true||alerts?.status!=='clear'||!Array.isArray(alerts.alerts)||alerts.alerts.length||!isFresh(Date.parse(alerts.checkedAt),now,30*60_000))return map('official-alerts-or-unknown');
 const times=forecast?.hourly?.time;
 if(!Array.isArray(times))return map('forecast-missing');
 for(let h=summary.startHour;h<summary.endHour;h++){
  // Precipitation is an accumulation of the preceding hour: inspect endpoints
  // h+1, including next-day midnight, not just the four map snapshots.
  const next=new Date(`${summary.date}T00:00:00Z`);next.setUTCHours(h+1);
  const time=next.toISOString().slice(0,16),indexes=times.flatMap((s,i)=>s===time?[i]:[]);
  if(indexes.length!==1)return map('forecast-incomplete');
  const i=indexes[0],rain=nonNegative(forecast.hourly.precipitation?.[i]),prob=nonNegative(forecast.hourly.precipitation_probability?.[i]),code=nonNegative(forecast.hourly.weather_code?.[i]);
  if(rain===null||prob===null||prob>100||code===null)return map('forecast-incomplete');
  if(rain>0||prob>=30||code>=51)return map('precipitation-priority');
 }
 if(summary.air?.value>60)return {kind:'air',reason:'air-poor',metric:summary.air};
 if(summary.uv?.value>=3)return {kind:'uv',reason:'uv-protection',metric:summary.uv};
 if(summary.air?.value>40)return {kind:'air',reason:'air-moderate',metric:summary.air};
 return map('no-relevant-complete-environmental-indicator');
}
export function environmentalCaption(summary,selection){
 if(selection.kind==='rain')return null;
 const m=selection.metric;
 return `${summary.date} · ${m.period}, hora de Sant Celoni. ${selection.kind==='uv'?'UV':'Índex europeu de qualitat de l’aire'}: màxim horari previst ${m.value.toLocaleString('ca-ES',{maximumFractionDigits:1})}, a les ${m.peakTime.slice(11,16)}. Model CAMS via Open-Meteo; no és una mesura de l’estació. ${selection.kind==='uv'?'Protecció solar a partir d’UV 3 (OMS).':'Consulta les recomanacions oficials de qualitat de l’aire.'}`;
}
export {stationUvReading};
