import {MODELS} from './models.js';
import {summarize} from './consensus.js';
import {forecastRequest} from './forecast-request.js';

const station = [41.6906,2.489];
const clock = new Intl.DateTimeFormat('ca-ES',{timeZone:'Europe/Madrid',day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'});
const degrees = v => v.toLocaleString('ca-ES',{maximumFractionDigits:1})+' °C';
const memo = new Map();

export function matchedObservation(rows, now) {
  const target = Math.floor(now/3600000)*3600000;
  for (let lag=0;lag<=2;lag++) {
    const hour=target-lag*3600000;
    const near=rows.filter(r=>Number.isFinite(r.temperature) && Number.isFinite(r.epoch) && r.epoch*1000<=now && Math.abs(r.epoch*1000-hour)<=300000)
      .sort((a,b)=>Math.abs(a.epoch*1000-hour)-Math.abs(b.epoch*1000-hour))[0];
    if (near) return {row:near,hour};
  }
}

export function nearStation(location) {return location.distanceTo(station)<=2500;}

async function stationPair(choice) {
  const response=await fetch('https://fonta-meteo.marcelfonta.workers.dev/history?days=1&resolution=raw',{signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw Error('Històric no disponible');
  const history=await response.json();
  const match=matchedObservation(Array.isArray(history)?history:history.observations||history.rows||history.data||[],Date.now());
  if (!match) return 'Sense observació recent a menys de cinc minuts de l’hora.';
  const iso=new Date(match.hour).toISOString().slice(0,16);
  const models=MODELS.filter(m=>choice==='combined'?m.family:m.name===choice);
  const results=await Promise.allSettled(models.map(async model=>{
    const q=new URLSearchParams({latitude:String(station[0]),longitude:String(station[1]),hourly:'temperature_2m',past_days:'1',forecast_days:'1',timezone:'GMT'});
    if(model.model) q.set('models',model.model);
    const res=await forecastRequest('https://api.open-meteo.com'+(model.model?'/v1/forecast':model.path)+'?'+q);
    if(!res.ok) throw Error('Model no disponible');
    const {hourly}=await res.json();
    return {model,temperature:hourly?.temperature_2m?.[hourly.time.indexOf(iso)]};
  }));
  const rows=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  const combined=choice==='combined', summary=summarize(rows,'temperature');
  const value=combined?summary.median:rows[0]?.temperature;
  return 'Estació '+clock.format(match.row.epoch*1000)+' · '+degrees(match.row.temperature)+' | '+(combined?'Consens ('+summary.count+' famílies)':choice)+' '+clock.format(match.hour)+' · '+(Number.isFinite(value)?degrees(value):'sense dada');
}

export function stationButton(choice) {
  const box=document.createElement('div'),button=document.createElement('button'),output=document.createElement('p');
  button.type='button';button.textContent='Temperatura observada i prevista · Sant Celoni';output.setAttribute('role','status');
  const key=choice+'|'+Math.floor(Date.now()/300000);
  function display(promise){button.disabled=true;output.textContent='Consultant l’estació…';
    promise.then(s=>{output.textContent=s;}).catch(()=>{output.textContent='Comparació temporalment no disponible.';memo.delete(key);}).finally(()=>{button.disabled=false;});
  }
  button.onclick=()=>{memo.clear();const task=stationPair(choice);memo.set(key,task);display(task);};
  box.append(button,output);
  if(memo.has(key))display(memo.get(key));
  return box;
}
