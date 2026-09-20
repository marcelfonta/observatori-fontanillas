import {finiteNumber} from './numeric.js';
const mean=values=>values.reduce((sum,v)=>sum+v,0)/values.length;
const round=n=>Number.isFinite(n)?Number(n.toFixed(3)):null;
const localDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T12:00Z'))&&new Date(value+'T12:00Z').toISOString().slice(0,10)===value;
const metrics=errors=>({mae:round(mean(errors.map(Math.abs))),bias:round(mean(errors)),rmse:round(Math.sqrt(mean(errors.map(e=>e*e))))});
/** Offline only: chronological holdout with availability embargo.
 * No endpoint, live prediction or social publisher imports this module.
 */
export function evaluateTemperatureBias(input,{now=new Date()}={}){
  if(!Array.isArray(input))throw new Error('Cal una llista de registres exportats.');
  const days=new Map(),today=localDate(now);let excluded=0;
  for(const row of input){
    const date=row?.target_date,issued=new Date(row?.issued_at);
    const values=['temperature_max','temperature_min','observed_max','observed_min'].map(k=>finiteNumber(row?.[k]));
    const available=new Date(row?.observed_available_at);
    if(!validDate(date)||date>=today||typeof row?.issued_at!=='string'||typeof row?.observed_available_at!=='string'||!Number.isFinite(issued.getTime())||!Number.isFinite(available.getTime())||available>now||
      row.provider!=='Open-Meteo'||row.model!=='best_match'||Number(row.horizon_day)!==1||
      !(Number(row.observed_samples)>=260)||!(Number(row.observed_hours)>=24)||
      values.some(v=>v===null||v < -60||v > 60)||values[0]<values[1]||values[2]<values[3]){
      excluded++;continue;
    }
    const previous=new Date(date+'T12:00Z');previous.setUTCDate(previous.getUTCDate()-1);
    if(localDate(issued)!==previous.toISOString().slice(0,10)){excluded++;continue;}
    const availableAt=Math.max(available.getTime(),Date.parse(date+'T23:59:59Z'));
    const normalized={date,issuedAt:issued.getTime(),availableAt,max:values[0],min:values[1],observedMax:values[2],observedMin:values[3]};
    if(!days.has(date)||days.get(date).issuedAt<normalized.issuedAt)days.set(date,normalized);
  }
  const rows=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
  const split=Math.floor(rows.length*.7),holdout=rows.slice(split);
  const firstIssue=holdout.length?Math.min(...holdout.map(r=>r.issuedAt)):0;
  const training=rows.slice(0,split).filter(r=>r.availableAt<firstIssue);
  const report={mode:'offline-shadow',productionEnabled:false,provider:'Open-Meteo',model:'best_match',horizonDays:1,
    sampleDays:rows.length,excludedRows:excluded,duplicateRows:input.length-excluded-rows.length,
    trainingDays:training.length,holdoutDays:holdout.length,embargoedDays:split-training.length,
    trainingRange:training.length?[training[0].date,training.at(-1).date]:null,
    holdoutRange:holdout.length?[holdout[0].date,holdout.at(-1).date]:null,
    note:'Experiment exploratori de temperatura diària. No demostra superioritat general ni modifica cap previsió pública.'};
  if(training.length<30||holdout.length<14)return {...report,status:'collecting',required:{trainingDays:30,holdoutDays:14}};
  const correction=key=>Math.max(-3,Math.min(3,mean(training.map(r=>r['observed'+(key==='max'?'Max':'Min')]-r[key]))));
  const maxCorrection=correction('max'),minCorrection=correction('min');
  let inversions=0;
  const corrected=holdout.map(r=>{
    const max=r.max+maxCorrection,min=r.min+minCorrection;
    if(min>max){inversions++;return {...r,correctedMax:r.max,correctedMin:r.min};}
    return {...r,correctedMax:max,correctedMin:min};
  });
  return {...report,status:'evaluated',correctionC:{max:round(maxCorrection),min:round(minCorrection)},capC:3,inversionsSkipped:inversions,
    max:{baseline:metrics(holdout.map(r=>r.max-r.observedMax)),corrected:metrics(corrected.map(r=>r.correctedMax-r.observedMax))},
    min:{baseline:metrics(holdout.map(r=>r.min-r.observedMin)),corrected:metrics(corrected.map(r=>r.correctedMin-r.observedMin))}};
}
