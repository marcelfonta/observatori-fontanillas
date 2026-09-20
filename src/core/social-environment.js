// Shared editorial contract; never dispatches publications.
import {nonNegative,environmentalTimestamp,isFresh,stationUvReading} from './environment-freshness.js';
export const POLLEN_SPECIES=['grass','olive','birch','mugwort','ragweed'];
const hourLabel=h=>String(h).padStart(2,'0')+':00';
export function summarizeEnvironment(payload,{date,startHour=6,endHour=24,now=Date.now(),retrievedAt}={}){
 const empty={date,startHour,endHour,period:`${hourLabel(startHour)}–${hourLabel(endHour-1)} h`,uv:null,air:null,pollen:{eligible:false,reason:'incomplete-local-species-and-unverified-levels'},source:'CAMS via Open-Meteo',retrievedAt};
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
export function chooseEnvironmentScene(){
 // Editorial choice: environmental indicators never displace the rain map.
 // Missing map data remains explicitly unavailable, never a dry forecast.
 return {kind:'rain',reason:'rain-map-always-primary'};
}
export function secondaryUv(summary,{date=summary?.date,now=Date.now()}={}){
 const m=summary?.uv;
 if(!m||summary.date!==date||m.date!==date||!isFresh(Date.parse(summary.retrievedAt),now,90*60_000)||nonNegative(m.value)===null||!m.peakTime?.startsWith(date+'T')||!Array.isArray(m.rows)||m.rows.length!==summary.endHour-summary.startHour||m.rows.some(r=>nonNegative(r.value)===null))return null;
 return m;
}
export function environmentalCaption(summary,selection,options){
 const m=secondaryUv(summary,options);
 if(!m)return null;
 return `${summary.date} · ${m.period}, hora de Sant Celoni. UV com a dada secundària: màxim horari previst ${m.value.toLocaleString('ca-ES',{maximumFractionDigits:1})}, a les ${m.peakTime.slice(11,16)}. Model CAMS via Open-Meteo; no és una mesura de l’estació. El mapa de pluja manté l’escena final.`;
}
export {stationUvReading};

export async function fetchSocialEnvironment({date,startHour=6,now=Date.now(),fetcher=fetch}={}){
 const get=async(domain,hourly)=>{
  const params=new URLSearchParams({latitude:'41.6906',longitude:'2.4890',timezone:'Europe/Madrid',forecast_days:'3',domains:domain,hourly});
  try{
   const r=await fetcher('https://air-quality-api.open-meteo.com/v1/air-quality?'+params,{signal:AbortSignal.timeout(12000)});
   if(!r.ok)return null;
   return await r.json();
  }catch{return null;}
 };
 const [air,uv]=await Promise.all([get('cams_europe','european_aqi'),get('cams_global','uv_index')]);
 const options={date,startHour,now,retrievedAt:new Date(now).toISOString()};
 const summary=summarizeEnvironment(air,options);
 summary.uv=summarizeEnvironment(uv,options).uv;
 return summary;
}
