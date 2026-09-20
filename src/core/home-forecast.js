import {summarizeForecastDayparts} from './forecast-dayparts.js';
export function homeForecast(data,now=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const date=`${parts.year}-${parts.month}-${parts.day}`;
  const fromHour=Number(parts.hour)+Number(parts.minute)/60;
  if(!data?.hourly?.time?.some(time=>time.startsWith(date+'T')&&Number(time.slice(11,13))>=Math.floor(fromHour)))return {date,periods:[],available:false};
  const periods=summarizeForecastDayparts(data.hourly,date,{fromHour}).map(period=>{
    const light=data.hourly.time.flatMap((time,i)=>time.startsWith(date+'T')&&Number(time.slice(11,13))>=period.startHour&&Number(time.slice(11,13))<period.endHour?[data.hourly.is_day?.[i]]:[]);
    const complete=light.length===period.hours&&light.every(n=>n===0||n===1);
    const illumination=!complete?'unknown':light.every(n=>n===0)?'night':light.every(n=>n===1)?'day':'twilight';
    return {...period,illumination};
  });
  return {date,available:true,periods};
}
