// USNO reports the phase and illuminated fraction at local noon, not at publication time.
export const MOON_SOURCE = 'https://aa.usno.navy.mil/data/api';
const phases = {
  'New Moon':['Lluna nova',true], 'Waxing Crescent':['Lluna creixent',true],
  'First Quarter':['Quart creixent',true], 'Waxing Gibbous':['Gibosa creixent',true],
  'Full Moon':['Lluna plena',true], 'Waning Gibbous':['Gibosa minvant',false],
  'Last Quarter':['Quart minvant',false], 'Waning Crescent':['Lluna minvant',false],
};

export function madridOffset(date){
  const value=new Intl.DateTimeFormat('en',{timeZone:'Europe/Madrid',timeZoneName:'longOffset'})
    .formatToParts(new Date(`${date}T12:00:00Z`)).find(part=>part.type==='timeZoneName')?.value;
  const match=value?.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if(!match)throw new Error('Desplaçament horari de Madrid desconegut.');
  return (match[1]==='-'?-1:1)*(Number(match[2])+Number(match[3])/60);
}

export function normalizeMoon(payload,date){
  const data=payload?.properties?.data;
  if(payload?.error||!data||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const returned=[data.year,String(data.month).padStart(2,'0'),String(data.day).padStart(2,'0')].join('-');
  if(returned!==date||data.tz!==madridOffset(date)||data.isdst!==false)return null;
  const phase=phases[data.curphase];
  const match=typeof data.fracillum==='string'&&data.fracillum.match(/^(\d+(?:\.\d+)?)%$/);
  if(!phase||!match)return null;
  const percent=Number(match[1]);
  if(!Number.isFinite(percent)||percent<0||percent>100)return null;
  return {date,label:phase[0],waxing:phase[1],percent,reference:'12:00',timezone:'Europe/Madrid',source:'USNO',sourceUrl:MOON_SOURCE};
}

export async function fetchMoon(date,fetcher=fetch){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
  const url=new URL('https://aa.usno.navy.mil/api/rstt/oneday');
  url.search=new URLSearchParams({date,coords:'41.6906,2.4890',tz:String(madridOffset(date)),ID:'FONTAMET'});
  const response=await fetcher(url,{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error(`USNO ${response.status}`);
  return normalizeMoon(await response.json(),date);
}

// Schematic, north-up illumination. It does not predict visibility or orientation in the sky.
export function moonSpan(y,r,fraction,waxing){
  const edge=Math.sqrt(Math.max(0,r*r-y*y));
  const terminator=(1-2*fraction)*edge;
  return waxing?[terminator,edge]:[-edge,-terminator];
}
