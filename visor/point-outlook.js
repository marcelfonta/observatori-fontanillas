import {forecastRequest} from './forecast-request.js';
import {hourlyComparison, independentModels} from './consensus.js';
import {MODELS, MODEL_VARIABLES} from './models.js';

const hourLabel = new Intl.DateTimeFormat('ca-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'});
const format = value => Number.isFinite(value) ? value.toLocaleString('ca-ES',{maximumFractionDigits:1}) : '—';
const label = hour => hourLabel.format(new Date(hour+'Z'));
const ns = 'http://www.w3.org/2000/svg';
function element(name,text) {const node=document.createElement(name);node.textContent=text;return node;}
function shape(name,attributes) {
  const node=document.createElementNS(ns,name);
  for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
  return node;
}
export function rainWindow(series) {
  const families=new Map();
  for (const step of series) {
    for(const reading of independentModels(step.readings,'rain')){
      if(!Number.isFinite(reading.rain))continue;
      const family=reading.model.family;
      if(!families.has(family))families.set(family,[]);
      families.get(family).push({hour:step.time,mm:reading.rain});
    }
  }
  const complete=[...families.values()].filter(rows=>rows.length===series.length);
  const onsets=complete.map(rows=>rows.find(r=>r.mm>=.2)?.hour).filter(Boolean).sort();
  const totals=complete.map(rows=>rows.reduce((sum,r)=>sum+r.mm,0)).sort((a,b)=>a-b);
  const n=totals.length;
  if(!n)return 'Pluja en 24 h · sense sèries completes';
  const median=(totals[Math.floor((n-1)/2)]+totals[Math.floor(n/2)])/2;
  return 'Pluja en 24 h · '+format(median)+' mm de mediana · '+onsets.length+'/'+n+' famílies arriben a 0,2 mm/h'+
    (onsets.length?' · primera hora humida entre '+label(onsets[0])+' i '+label(onsets.at(-1)):'');
}
function chart(series, model, unit) {
  const svg=shape('svg',{viewBox:'0 0 420 120',role:'img','aria-label':'Mediana, mínim i màxim horaris en '+unit});
  const selected=step=>step.readings.find(r=>r.model.name===model.name)?.[model.variable];
  const values=series.flatMap(s=>[s.summary.min,s.summary.max,selected(s)]).filter(Number.isFinite);
  if(!values.length)return element('p','Sense dades per a aquest punt.');
  const low=Math.min(...values),high=Math.max(...values);
  const x=i=>8+i*404/(series.length-1),y=v=>103-(v-low)*91/(high-low||1);
  for(let i=1;i<series.length;i++){
      const a=series[i-1].summary,b=series[i].summary;
      if(!a.count || !b.count)continue;
      svg.append(shape('polygon',{points:[[i-1,a.min],[i,b.min],[i,b.max],[i-1,a.max]].map(([j,v])=>x(j)+','+y(v)).join(' '),fill:'#527666'}));
      svg.append(shape('line',{x1:x(i-1),x2:x(i),y1:y(a.median),y2:y(b.median),stroke:'#c0f2a0','stroke-width':3}));
  }
  for(let i=1;i<series.length;i++){
    const a=selected(series[i-1]),b=selected(series[i]);
    if(Number.isFinite(a)&&Number.isFinite(b))svg.append(shape('line',{x1:x(i-1),x2:x(i),y1:y(a),y2:y(b),stroke:'#ffc870','stroke-width':2,'stroke-dasharray':'4 2'}));
  }
  const box=element('div','');box.append(svg,element('small',label(series[0].time)+' – '+label(series.at(-1).time)+' · '+format(low)+' a '+format(high)+' '+unit));return box;
}
export function pointOutlook() {
  const dialog=document.querySelector('#outlook'), output=dialog.querySelector('section'), variable=dialog.querySelector('[name=variable]'), model=dialog.querySelector('[name=model]');
  for(const [key,meta] of Object.entries(MODEL_VARIABLES))variable.add(new Option(meta.label,key));
  for(const m of MODELS)model.add(new Option(m.name,m.name));
  let controller, datasets=[], hours=[];
  function draw(){
    const key=variable.value, unit=MODEL_VARIABLES[key].unit;
    const series=hourlyComparison(datasets,MODELS,hours,key);
    const rain=key==='rain'?series:hourlyComparison(datasets,MODELS,hours,'rain');
    const table=element('table',''),head=table.createTHead().insertRow();
    for(const title of ['Hora','Mediana','Interval',model.value||'Famílies'])head.append(element('th',title));
    const body=table.createTBody();
    for(const s of series){
      const row=body.insertRow();
      for(const v of [label(s.time),format(s.summary.median),format(s.summary.min)+' – '+format(s.summary.max),model.value?format(s.readings.find(r=>r.model.name===model.value)?.[key]):String(s.summary.count)])row.insertCell().textContent=v;
    }
    const details=element('details','');details.append(element('summary','Taula horària · '+unit),table);
    output.replaceChildren(element('p',rainWindow(rain)),chart(series,{name:model.value,variable:key},unit),element('small','Verd · consens i rang de famílies'+(model.value?'　Groc · '+model.value:'')),details);
  }
  variable.onchange=model.onchange=draw;
  dialog.addEventListener('close',()=>controller?.abort());
  return async function open(location,initial,firstHour,grid) {
    controller?.abort();const current=new AbortController();controller=current;
    variable.value=initial;model.value='';
    dialog.querySelector('h2').textContent='Previsió al punt';
    dialog.querySelector('.location').textContent=location.lat.toFixed(3)+'°, '+location.lng.toFixed(3)+'° · 24 hores locals';
    hours=Array.from({length:24},(_,i)=>new Date(firstHour+i*3600000).toISOString().slice(0,16));
    datasets=[];output.textContent='Consultant els models al punt…';dialog.showModal();
    if(grid?.some(Boolean)){
      datasets=grid;
      dialog.querySelector('.location').textContent+=' · mostra carregada del mapa';
      draw();
      return;
    }
    const queue=MODELS.map((model,index)=>({model,index}));
    async function drain(){
      while(queue.length && !current.signal.aborted){
        const {model:m,index}=queue.shift();
      const params=new URLSearchParams({latitude:location.lat.toFixed(4),longitude:location.lng.toFixed(4),hourly:'temperature_2m,precipitation,wind_speed_10m,cloud_cover',timezone:'GMT',forecast_days:'3'});
      if(m.model)params.set('models',m.model);
        const url='https://api.open-meteo.com'+(m.model?'/v1/forecast':m.path)+'?'+params;
        try{
          const response=await forecastRequest(url,{signal:current.signal,onWait:active=>{
            if(active && !datasets.some(Boolean) && !current.signal.aborted)output.textContent='Esperant el reintent que indica la font…';
          }});
          if(response.ok){
            const data=await response.json();
            if(!current.signal.aborted){datasets[index]=data;draw();}
          }
        }catch{/* Each available model can still contribute independently. */}
      }
    }
    await Promise.all([drain(),drain()]);
    if(!current.signal.aborted)draw();
  };
}