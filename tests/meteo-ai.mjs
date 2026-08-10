import assert from 'node:assert/strict';
import { answerMeteoQuestion } from '../src/features/meteo-ai.js';

const now=Date.now();
const context={
  current:{temperature:24.2,feelsLike:24.8,humidity:58,windSpeed:5.1,windGust:12.4,pressure:1016.2,rainToday:0,rainRate:0,updated:new Date(now).toISOString()},
  history:[{t:now-23*3600000,temperature:19.1},{t:now,temperature:24.2}],
  forecast:{daily:{time:['2026-08-10','2026-08-11'],weather_code:[1,61],temperature_2m_max:[28,25],temperature_2m_min:[18,17],precipitation_probability_max:[15,75],precipitation_sum:[0,6.2],wind_gusts_10m_max:[18,32],uv_index_max:[6,5]}},
  alerts:{ok:true,active:0,maxLevel:'none',alerts:[],checkedAt:new Date(now).toISOString()},
  environment:{european_aqi:18,pm25:7.2,pm10:13.4,uv:4,uvSource:'Sensor Fontanillas',pollenMain:'Gramínies · 2,0',time:new Date(now).toISOString()}
};
const services={
  fetchNearbyStations:async()=>({stations:[{id:'fontanillas',name:'Fontanillas',status:'online',temperature:24.2,rainToday:0},{id:'nearby',name:'Vallgorguina',status:'online',temperature:26.1,rainToday:1.4}],sourcePolicy:{note:'Mostra de prova'}}),
  fetchLocalityWeather:async()=>({location:{name:'Girona',admin1:'Catalunya',country:'Espanya'},weather:{current:{time:new Date(now).toISOString(),weather_code:1,temperature_2m:27.2,apparent_temperature:27.8,relative_humidity_2m:50,wind_speed_10m:8,wind_gusts_10m:17},daily:{temperature_2m_max:[30],temperature_2m_min:[19],precipitation_probability_max:[10]}}})
};

const current=await answerMeteoQuestion('Quina temperatura fa ara?',context,services);
assert.match(current.body,/24,2 °C/);
assert.equal(current.sources[0].label,'Sensor Fontanillas');

const forecast=await answerMeteoQuestion('Plourà demà?',context,services);
assert.match(forecast.body,/75%/);
assert.equal(forecast.level,'caution');

const alerts=await answerMeteoQuestion('Hi ha avisos actius?',context,services);
assert.equal(alerts.level,'safe');

const activity=await answerMeteoQuestion('Puc sortir a córrer?',context,services);
assert.ok(['safe','caution'].includes(activity.level));

const environment=await answerMeteoQuestion('Com està el pol·len i l’UV?',context,services);
assert.match(environment.body,/qualitat de l’aire/i);

const comparison=await answerMeteoQuestion('On fa més calor al Baix Montseny?',context,services);
assert.match(comparison.body,/Vallgorguina/);

const locality=await answerMeteoQuestion('Quin temps fa a Girona?',context,services);
assert.match(locality.title,/Girona/);
assert.match(locality.body,/27,2 °C/);

const externalAlerts=await answerMeteoQuestion('Hi ha avisos a Girona?',context,services);
assert.equal(externalAlerts.level,'warning');
assert.match(externalAlerts.body,/no disposa/i);

const montseny=await answerMeteoQuestion('És bon moment per anar al Montseny?',context,services);
assert.ok(['safe','caution','warning'].includes(montseny.level));

const unknown=await answerMeteoQuestion('Explica’m alguna cosa',context,services);
assert.match(unknown.body,/situació actual/i);

console.log('Test Meteo IA V13: correcte');
