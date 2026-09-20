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
