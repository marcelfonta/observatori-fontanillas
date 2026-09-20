import {FONTA,dayBounds,nextDay} from './fonta-model.js';

// Separate research contract: HOURLY sample extrema, not v1 daily extrema.
export const SINGLE_RUN_MODELS=FONTA.models.filter(m=>m!=='best_match');
const isTime=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
function checkRun(run){
  if(!/^\d{4}-\d{2}-\d{2}T00:00$/.test(run)||!isTime(run+'Z')||new Date(run+'Z').toISOString().slice(0,16)!==run)throw new Error('Run UTC de les 00:00 requis');
}
export function singleRunRequest(model,run){
  checkRun(run);if(!SINGLE_RUN_MODELS.includes(model))throw new Error('Model explícit requis');
  return 'https://single-runs-api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:String(FONTA.latitude),longitude:String(FONTA.longitude),
    models:model,run,timezone:'Europe/Madrid',timeformat:'unixtime',forecast_days:'3',hourly:'temperature_2m'});
}
export function normalizeSingleRun(raw,{model,run,receivedAt,targetDate,url}){
  if(url!==singleRunRequest(model,run)||!isTime(receivedAt)||Date.parse(run+'Z')>Date.parse(receivedAt))throw new Error('Provenance Single Runs invàlida');
  if(raw?.timezone!=='Europe/Madrid'||raw?.hourly_units?.time!=='unixtime'||raw?.hourly_units?.temperature_2m!=='°C'||
    !Array.isArray(raw.hourly?.time)||!Array.isArray(raw.hourly?.temperature_2m)||raw.hourly.time.length!==raw.hourly.temperature_2m.length||raw.hourly.time.length>96)throw new Error('Sèrie hora/unitats invàlida');
  const bounds=dayBounds(targetDate),times=raw.hourly.time,values=raw.hourly.temperature_2m;
  if(times.some((t,i)=>!Number.isSafeInteger(t)||t<=0||t%3600!==0||(i&&t<=times[i-1])))throw new Error('Hores duplicades, desordenades o no senceres');
  const points=new Map(times.map((t,i)=>[t*1000,typeof values[i]==='number'&&Number.isFinite(values[i])&&values[i]>=-40&&values[i]<=55?values[i]:null]));
  const missing=[],samples=[];
  for(let at=bounds.start;at<bounds.end;at+=3600000){const value=points.get(at);if(value===null||value===undefined)missing.push(new Date(at).toISOString());else samples.push({validAt:new Date(at).toISOString(),temperature:value});}
  const complete=missing.length===0;
  return {schema:2,contract:'single-run-hourly-temperature-v1',model,modelRunAt:run+'Z',runIdentity:'explicit-request',
    receivedAt,publiclyAvailableAt:null,availableNoLaterThan:receivedAt,
    prospective:Date.parse(receivedAt)<bounds.start,targetDate,targetDefinition:'extrema-of-hourly-samples-Europe/Madrid',
    expectedHours:bounds.hours,validHours:samples.length,missing,complete,
    max:complete?Math.max(...samples.map(p=>p.temperature)):null,min:complete?Math.min(...samples.map(p=>p.temperature)):null,
    grid:{latitude:raw.latitude??null,longitude:raw.longitude??null,elevation:raw.elevation??null},samples,
    compatibleWithDailyV1:false};
}
// Deliberately simple preregistered probe policy, never hunt for a better run.
export function probePolicy(receivedAt){
  if(!isTime(receivedAt))throw new Error('Data invàlida');
  const day=receivedAt.slice(0,10);
  return {run:day+'T00:00',targetDate:nextDay(day),maxRequests:3,retries:0};
}
