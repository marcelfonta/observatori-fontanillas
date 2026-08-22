import assert from 'node:assert/strict';
import { answerMeteoQuestion } from '../src/features/meteo-ai.js';

const now=Date.now();
const dates=Array.from({length:14},(_,index)=>`2026-08-${String(10+index).padStart(2,'0')}`);
const daily={time:dates,weather_code:[1,61,2,3,1,80,2,1,2,61,3,1,80,2],temperature_2m_max:[28,25,27,26,29,24,27,28,29,25,24,27,23,26],temperature_2m_min:[18,17,18,17,19,16,17,18,19,17,16,18,15,17],precipitation_probability_max:[15,75,20,30,10,65,25,20,30,70,40,20,80,30],precipitation_sum:[0,6.2,0,0.3,0,4.5,0,0,0.2,5,1,0,8,0],wind_gusts_10m_max:[18,32,20,22,17,35,20,18,21,33,24,19,38,20],uv_index_max:[6,5,6,5,6,4,5,5,6,4,4,5,3,5]};
const hourly={time:Array.from({length:48},(_,index)=>`2026-08-${index<24?'10':'11'}T${String(index%24).padStart(2,'0')}:00`),precipitation_probability:Array.from({length:48},(_,index)=>index>=17&&index<=20?65:10),precipitation:Array.from({length:48},(_,index)=>index>=18&&index<=19?0.4:0),temperature_2m:Array(48).fill(23),wind_gusts_10m:Array(48).fill(20)};
const context={
  current:{temperature:24.2,feelsLike:24.8,humidity:58,windSpeed:5.1,windGust:12.4,pressure:1016.2,rainToday:0,rainRate:0,updated:new Date(now).toISOString()},
  history:[{t:now-23*3600000,temperature:19.1},{t:now,temperature:24.2}],
  forecast:{daily:Object.fromEntries(Object.entries(daily).map(([key,value])=>[key,value.slice(0,7)])),hourly},
  alerts:{ok:true,active:0,maxLevel:'none',alerts:[],checkedAt:new Date(now).toISOString()},
  environment:{european_aqi:18,pm25:7.2,pm10:13.4,uv:4,uvSource:'Sensor Fontanillas',pollenMain:'Gramínies · 2,0',time:new Date(now).toISOString()}
};
const services={
  fetchNearbyStations:async()=>({stations:[{id:'fontanillas',name:'Fontanillas',status:'online',temperature:24.2,rainToday:0},{id:'nearby',name:'Vallgorguina',status:'online',temperature:26.1,rainToday:1.4}],sourcePolicy:{note:'Mostra de prova'}}),
  fetchAlertHistory:async filters=>({items:[{level:filters.level||'orange',phenomenon:'Vent',source:'AEMET',started_at:'2026-08-07T18:50:00Z',expires_at:'2026-08-08T00:00:00Z'}],pagination:{total:6},stats:{total:filters.level==='red'?1:6,alertDays:4,severe:3,red:1,topPhenomenon:'Vent'}}),
  fetchLocalityWeather:async name=>({location:{name,admin1:name==='Girona'?'Catalunya':'Regió de prova',country:name==='Sant Celoni'?'Espanya':'País de prova'},weather:{current:{time:new Date(now).toISOString(),weather_code:1,temperature_2m:27.2,apparent_temperature:27.8,relative_humidity_2m:50,wind_speed_10m:8,wind_gusts_10m:17},daily}})
};

const current=await answerMeteoQuestion('Quina temperatura fa ara?',context,services);
assert.match(current.body,/24,2 °C/);
assert.equal(current.sources[0].label,'Sensor Fontanillas');
assert.equal(current.sources[0].href,'./?page=estacio');

const forecast=await answerMeteoQuestion('Plourà demà?',context,services);
assert.match(forecast.body,/75%/);
assert.equal(forecast.level,'caution');

const guide=await answerMeteoQuestion('Què pots fer?',context,services);
assert.match(guide.body,/paraigua|jaqueta/i);

const umbrella=await answerMeteoQuestion('Necessito paraigua demà?',context,services);
assert.match(umbrella.title,/recomanable/i);
assert.match(umbrella.body,/75%/);

const clothes=await answerMeteoQuestion('Com m’he de vestir?',context,services);
assert.match(clothes.title,/convé/i);

const laundry=await answerMeteoQuestion('Puc estendre roba avui?',context,services);
assert.equal(laundry.level,'safe');

const rainTime=await answerMeteoQuestion('A quina hora pot ploure avui?',context,services);
assert.match(rainTime.title,/17:00.*20:00/);
assert.match(rainTime.body,/65%/);

const alerts=await answerMeteoQuestion('Hi ha avisos actius?',context,services);
assert.equal(alerts.level,'safe');

const alertHistory=await answerMeteoQuestion('Quants avisos hi ha hagut aquest any?',context,services);
assert.match(alertHistory.title,/6 episodis/);
assert.ok(alertHistory.sources.some(item=>item.href==='./historial-avisos.html'));

const redHistory=await answerMeteoQuestion('Quants avisos vermells hi ha hagut aquest any?',context,services);
assert.match(redHistory.body,/nivell vermell/);

const latestAlert=await answerMeteoQuestion('Quan va ser l’últim avís?',context,services);
assert.match(latestAlert.title,/Darrer episodi/);

const activity=await answerMeteoQuestion('Puc sortir a córrer?',context,services);
assert.ok(['safe','caution'].includes(activity.level));

const environment=await answerMeteoQuestion('Com està el pol·len i l’UV?',context,services);
assert.match(environment.body,/qualitat de l’aire/i);

const comparison=await answerMeteoQuestion('On fa més calor al Baix Montseny?',context,services);
assert.match(comparison.body,/Vallgorguina/);

const locality=await answerMeteoQuestion('Quin temps fa a Girona?',context,services);
assert.match(locality.title,/Girona/);
assert.match(locality.body,/27,2 °C/);

const friday=await answerMeteoQuestion('Quin temps farà divendres a Sant Celoni?',context,services);
assert.match(friday.title,/divendres.*14 d’agost/i);
assert.match(friday.body,/Sant Celoni/);

const foreignWeek=await answerMeteoQuestion('Quin temps farà la setmana que ve a Londres?',context,services);
assert.match(foreignWeek.title,/setmana que ve/i);
assert.match(foreignWeek.body,/Londres/);
assert.match(foreignWeek.body,/incertesa és més alta/i);
assert.equal(foreignWeek.facts.length,7);
assert.equal(foreignWeek.sources[0].href,'https://open-meteo.com/');

const parisConversation={location:null,period:null,activity:null};
await answerMeteoQuestion('Quin temps farà la setmana que ve a París?',context,services,parisConversation);
const rainiestFollowup=await answerMeteoQuestion('Quin dia plourà més?',context,services,parisConversation);
assert.match(rainiestFollowup.title,/dia amb més pluja prevista/i);
assert.match(rainiestFollowup.body,/París/i);
assert.match(rainiestFollowup.body,/8,0 mm/);
assert.equal(rainiestFollowup.facts.length,7);

const windyFollowup=await answerMeteoQuestion('I quin dia farà més vent?',context,services,parisConversation);
assert.match(windyFollowup.title,/dia més ventós/i);
assert.match(windyFollowup.body,/París/i);

const fridayFollowup=await answerMeteoQuestion('I divendres concretament?',context,services,parisConversation);
assert.match(fridayFollowup.title,/divendres/i);
assert.match(fridayFollowup.body,/París/i);
assert.doesNotMatch(fridayFollowup.body,/Sant Celoni/);

const bestDay=await answerMeteoQuestion('Quin dia farà millor la setmana que ve?',context,services);
assert.match(bestDay.title,/dia més favorable/i);
assert.match(bestDay.body,/Sant Celoni/i);

const lowerForeign=await answerMeteoQuestion('temps per divendres a londres',context,services);
assert.match(lowerForeign.body,/londres/i);
assert.match(lowerForeign.title,/divendres/i);

const fromFriday=await answerMeteoQuestion('Previsió a partir de divendres',context,services);
assert.match(fromFriday.body,/Sant Celoni/);

const externalAlerts=await answerMeteoQuestion('Hi ha avisos a Girona?',context,services);
assert.equal(externalAlerts.level,'warning');
assert.match(externalAlerts.body,/no disposa/i);

const montseny=await answerMeteoQuestion('És bon moment per anar al Montseny?',context,services);
assert.ok(['safe','caution','warning'].includes(montseny.level));

const conversation={location:null,period:null,activity:null};
const aranBike=await answerMeteoQuestion('Quin temps farà per anar amb bici a la Vall d’Aran aquest cap de setmana?',context,services,conversation);
assert.match(aranBike.body,/Vall d’Aran/i);
assert.match(aranBike.body,/anar amb bicicleta/i);
assert.match(aranBike.body,/ferm mullat/i);
assert.equal(conversation.location.query,'Vall d’Aran');
assert.equal(conversation.period.query,'aquest cap de setmana');
assert.equal(conversation.activity.key,'bike');

const aranFollowup=await answerMeteoQuestion('I quin temps hi farà?',context,services,conversation);
assert.match(aranFollowup.body,/Vall d’Aran/i);
assert.match(aranFollowup.title,/cap de setmana/i);
assert.doesNotMatch(aranFollowup.body,/Fontanillas/);

const explicitVielha=await answerMeteoQuestion('Quin temps farà aquest cap de setmana per Vielha per anar amb bici?',context,services,{location:null,period:null,activity:null});
assert.match(explicitVielha.body,/Vielha/i);
assert.match(explicitVielha.body,/bicicleta/i);

const futureRun=await answerMeteoQuestion('Puc sortir a córrer dimarts?',context,services,{location:null,period:null,activity:null});
assert.match(futureRun.title,/dimarts|precaucions/i);
assert.match(futureRun.facts.join(' '),/pluja 75%/i);

const screenshotCase=await answerMeteoQuestion('quin temps fara per anar amb bici a la vall daran aquest cap de setmana?',context,services,{location:null,period:null,activity:null});
assert.match(screenshotCase.body,/Vall d’Aran/i);
assert.match(screenshotCase.body,/cap de setmana/i);
assert.doesNotMatch(screenshotCase.sources.map(item=>item.label).join(' '),/Sensor Fontanillas/);

const dana=await answerMeteoQuestion('Què és una DANA?',context,services);
assert.match(dana.body,/depressió aïllada/i);
assert.equal(dana.sources[0].label,'AEMET · MeteoGlosario');

const sourceGuide=await answerMeteoQuestion('On puc consultar dades meteorològiques oficials?',context,services);
assert.ok(sourceGuide.sources.some(item=>item.label==='AEMET OpenData'));
assert.ok(sourceGuide.sources.some(item=>item.label==='Meteocat · Dades obertes'));

const curatedEphemeris=await answerMeteoQuestion('Explica’m una curiositat meteorològica',context,services);
assert.match(curatedEphemeris.body,/Meteocat|OMM/);
assert.ok(curatedEphemeris.facts.length>=3);
assert.ok(curatedEphemeris.sources.every(item=>item.href));

const previousDate=new Date(now);previousDate.setFullYear(previousDate.getFullYear()-1);
const ephemeris=await answerMeteoQuestion('Efemèrides de l’estació',{...context,history:[...context.history,{t:previousDate.getTime(),temperatureMax:31.4,temperatureMin:18.2,rainIncrement:2.6}]},services);
assert.match(ephemeris.title,/Un dia com avui/);
assert.match(ephemeris.facts.join(' '),/31,4 °C/);

const unknown=await answerMeteoQuestion('Explica’m alguna cosa',context,services);
assert.equal(unknown.needsAI,true);
assert.match(unknown.body,/model avançat/i);

console.log('Test Meteo IA V18: correcte');
