import {summarizeForecastDayparts} from './forecast-dayparts.js';
export function homeForecast(data,now=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const date=`${parts.year}-${parts.month}-${parts.day}`;
  const fromHour=Number(parts.hour)+Number(parts.minute)/60;
  if(!data?.hourly?.time?.some(time=>time.startsWith(date+'T')&&Number(time.slice(11,13))>=Math.floor(fromHour)))return {date,periods:[],available:false};
  return {date,available:true,periods:summarizeForecastDayparts(data.hourly,date,{fromHour})};
}
