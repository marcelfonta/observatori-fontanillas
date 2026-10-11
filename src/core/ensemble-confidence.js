const finite=value=>{const number=Number(value);return Number.isFinite(number)?number:null;};
const percentile=(values,p)=>{const sorted=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!sorted.length)return null;return sorted[Math.min(sorted.length-1,Math.max(0,Math.round((sorted.length-1)*p)))];};
const memberKeys=(hourly,prefix)=>Object.keys(hourly||{}).filter(key=>key===prefix||key.startsWith(`${prefix}_member`));

export function ensembleDayConfidence(payload,date){
  const hourly=payload?.hourly||{};const times=hourly.time||[];
  const indexes=times.map((time,index)=>String(time).startsWith(String(date).slice(0,10))?index:-1).filter(index=>index>=0);
  if(!indexes.length)return null;
  const dailyValues=(prefix,reducer)=>memberKeys(hourly,prefix).map(key=>indexes.map(index=>finite(hourly[key]?.[index])).filter(Number.isFinite)).filter(values=>values.length).map(reducer).filter(Number.isFinite);
  const maxima=dailyValues('temperature_2m',values=>Math.max(...values));
  const rain=dailyValues('precipitation',values=>values.reduce((sum,value)=>sum+value,0));
  const gusts=dailyValues('wind_gusts_10m',values=>Math.max(...values));
  if(Math.max(maxima.length,rain.length,gusts.length)<5)return null;
  const temperatureSpread=percentile(maxima,.9)-percentile(maxima,.1);
  const rainWetShare=rain.length?rain.filter(value=>value>=.2).length/rain.length:null;
  const gustSpread=percentile(gusts,.9)-percentile(gusts,.1);
  const scores=[temperatureSpread<=3?3:temperatureSpread<=5?2:1,rainWetShare===null?null:(rainWetShare<=.2||rainWetShare>=.8)?3:(rainWetShare<=.35||rainWetShare>=.65)?2:1,gustSpread<=12?3:gustSpread<=22?2:1].filter(Number.isFinite);
  const mean=scores.reduce((sum,value)=>sum+value,0)/scores.length;
  const level=mean>=2.5?'high':mean>=1.75?'moderate':'low';
  return {level,label:{high:'Alta',moderate:'Moderada',low:'Baixa'}[level],members:Math.max(maxima.length,rain.length,gusts.length),temperatureSpread,rainWetShare,gustSpread,ranges:{temperature:[percentile(maxima,.1),percentile(maxima,.9)],rain:[percentile(rain,.1),percentile(rain,.9)],gust:[percentile(gusts,.1),percentile(gusts,.9)]}};
}
