import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const originalFetch=globalThis.fetch;
const originalError=console.error;
let prompt='';
const now=new Date().toISOString();
globalThis.fetch=async input=>{
  const url=String(input);
  if(url.startsWith('https://api.weather.com/'))return new Response(JSON.stringify({observations:[{obsTimeLocal:now,obsTimeUtc:now,epoch:Math.floor(Date.now()/1000),metric:{temp:18.3,heatIndex:18.3,pressure:1012,windSpeed:4,windGust:8,precipTotal:0,precipRate:0},humidity:65}]}));
  if(url.startsWith('https://api.open-meteo.com/'))return new Response(JSON.stringify({daily:{time:['2026-10-31'],temperature_2m_max:[20],precipitation_probability_max:[30]},hourly:{time:['2026-10-31T15:00'],precipitation_probability:[30]}}));
  return new Response('unavailable',{status:503});
};
console.error=()=>{};
try{
  const env={WU_API_KEY:'test-only',AI:{run:async(model,payload)=>{assert.equal(model,'@cf/meta/llama-3.3-70b-instruct-fp8-fast');prompt=payload.messages.map(message=>message.content).join('\n');return {response:'Resposta basada en les dades disponibles.'};}}};
  const request=new Request('https://fonta-meteo.marcelfonta.workers.dev/meteo-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'Plourà i farà vent a Sant Celoni?',locale:'es',context:{current:{temperature:999},alerts:{active:0}}})});
  const response=await worker.fetch(request,env,{});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.match(prompt,/18\.3/);
  assert.match(prompt,/idioma es/);
  assert.doesNotMatch(prompt,/999/);
  assert.ok(body.sources.some(source=>source.label==='AEMET · Meteocat'&&source.detail==='Avisos no verificats'));
  assert.ok(body.sources.some(source=>source.label==='Sensor Fontanillas'));
}finally{globalThis.fetch=originalFetch;console.error=originalError;}

console.log('Meteo IA Worker: fonts del servidor i avisos no verificats correctes');
