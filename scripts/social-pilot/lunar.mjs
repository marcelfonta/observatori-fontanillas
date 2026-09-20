// USNO one-day service: phase and illumination at LOCAL NOON, not publication time.
export const phases = {
 'New Moon':['Lluna nova',true], 'Waxing Crescent':['Lluna creixent',true],
 'First Quarter':['Quart creixent',true], 'Waxing Gibbous':['Gibosa creixent',true],
 'Full Moon':['Lluna plena',true], 'Waning Gibbous':['Gibosa minvant',false],
 'Last Quarter':['Quart minvant',false], 'Waning Crescent':['Lluna minvant',false],
};
export function madridOffset(date){
 const offset=new Intl.DateTimeFormat('en',{timeZone:'Europe/Madrid',timeZoneName:'longOffset'}).formatToParts(new Date(date+'T12:00:00Z')).find(p=>p.type==='timeZoneName').value;
 const m=offset.match(/^GMT([+-])(\d{2}):(\d{2})$/);
 if(!m)throw Error('Unknown Madrid offset');
 return (m[1]==='-'?-1:1)*(Number(m[2])+Number(m[3])/60);
}
export function normalizeMoon(payload,date){
 const d=payload?.properties?.data;
 if(payload?.error||!d)return null;
 const returned=[d.year,String(d.month).padStart(2,'0'),String(d.day).padStart(2,'0')].join('-');
 if(returned!==date||d.tz!==madridOffset(date)||d.isdst!==false)return null;
 const phase=phases[d.curphase],match=typeof d.fracillum==='string'&&d.fracillum.match(/^(\d+(?:\.\d+)?)%$/);
 if(!phase||!match)return null;
 const percent=Number(match[1]);if(percent<0||percent>100)return null;
 return {date,label:phase[0],waxing:phase[1],percent,reference:'12:00',timezone:'Europe/Madrid',source:'USNO'};
}
// Orthographic, north-up SCHEMATIC. Does not predict sky orientation or visibility.
export function moonSpan(y,r,fraction,waxing){
 const edge=Math.sqrt(Math.max(0,r*r-y*y));
 const terminator=(1-2*fraction)*edge;
 return waxing?[terminator,edge]:[-edge,-terminator];
}
