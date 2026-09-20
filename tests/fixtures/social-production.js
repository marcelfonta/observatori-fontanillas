import {normalizeSocialForecast,summarizeForecastDayparts} from '../../src/core/forecast-dayparts.js';
import {summarizeEnvironment} from '../../src/core/social-environment.js';
export function productionFixture(period='mati'){
 const date='2026-09-20',now=Date.parse(date+'T12:00Z');
 const dates=Array.from({length:6},(_,i)=>`2026-09-${20+i}`);
 const time=dates.flatMap(d=>Array.from({length:24},(_,h)=>`${d}T${String(h).padStart(2,'0')}:00`));
 const hourly={time,weather_code:time.map(()=>61),temperature_2m:time.map((_,i)=>18+i%8),precipitation_probability:time.map(()=>70),wind_gusts_10m:time.map(()=>30),precipitation:time.map(()=>.5),uv_index:time.map(()=>3),european_aqi:time.map(()=>25)};
 const forecast={timezone:'Europe/Madrid',hourly,daily:{time:dates,weather_code:dates.map(()=>61),temperature_2m_max:dates.map(()=>25),temperature_2m_min:dates.map(()=>18),precipitation_probability_max:dates.map(()=>70),wind_gusts_10m_max:dates.map(()=>30)}};
 const days=normalizeSocialForecast(forecast);
 if(period==='migdia')days[0].dayparts=summarizeForecastDayparts(hourly,date,{fromHour:14});
 const target=period==='vespre'?dates[1]:date;
 const environment=summarizeEnvironment(forecast,{date:target,startHour:period==='migdia'?14:6,now,retrievedAt:new Date(now).toISOString()});
 const card={socialFormat:'cinematic-v5',localDate:date,period,temperature:23.2,observationUpdated:date+'T14:00:00',forecast:days,environment,temperatureTrend:{hours:24,minimum:16,maximum:25,points:[{epoch:now/1000-86400,temperature:16},{epoch:now/1000,temperature:23.2}]}};
 const snapshot={pilot:false,format:'cinematic-v5',capturedAt:new Date(now).toISOString(),publicationDate:date,slot:period==='vespre'?'vespre':'mati',date:target,current:{temperature:23.2,updated:date+'T14:00:00',updatedUtc:new Date(now).toISOString()},forecast,days:days.filter(d=>d.date>=target),day:days.find(d=>d.date===target)};
 return {now,date,forecast,card,snapshot};
}
