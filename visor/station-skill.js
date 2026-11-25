const sources=[
 ['ECMWF IFS','ecmwf_ifs'],['GFS','gfs_global'],['ICON EU','icon_eu'],
 ['AROME HD','meteofrance_arome_france_hd'],['ARPEGE Europa','meteofrance_arpege_europe'],
 ['GEM global','gem_global'],['UKMO global','ukmo_global_deterministic_10km']
];
const fields=['temperature_2m','precipitation','wind_speed_10m'];
const hour=3600000;
const iso=ms=>new Date(ms).toISOString().slice(0,16);
export function observedAt(rows,target) {
  const sec=target/1000;
  const near=rows.filter(r=>Math.abs(r.epoch-sec)<=300).sort((a,b)=>Math.abs(a.epoch-sec)-Math.abs(b.epoch-sec))[0];
  const rain=rows.filter(r=>r.epoch>sec-3600 && r.epoch<=sec && Number.isFinite(r.rainIncrement)).sort((a,b)=>a.epoch-b.epoch);
  const covered=rain.length>=6 && rain[0].epoch<=sec-3000 && rain.at(-1).epoch>=sec-600 &&
    rain.every((r,i)=>!i || r.epoch-rain[i-1].epoch<=600);
  return [near?.temperature,covered?rain.reduce((sum,r)=>sum+r.rainIncrement,0):null,near?.windSpeed];
}
export function stationSkill() {
  const dialog=document.querySelector('#station-skill'),section=dialog.querySelector('section'),lead=dialog.querySelector('select');
  let rows=[],pairs=[],controller;
  function draw() {
    const table=document.createElement('table'),head=table.createTHead().insertRow();
    for(const title of ['Model','Temp. °C','Pluja mm','Vent km/h']){const th=document.createElement('th');th.textContent=title;head.append(th);}
    const body=table.createTBody();let any=false;
    for(const [name,key] of sources){
      const tr=body.insertRow();tr.insertCell().textContent=name;
      const errors=fields.map(()=>[]);
      for(const run of pairs.filter(r=>r.key===key)){
        const target=run.start+Number(lead.value)*hour, actual=observedAt(rows,target);
        const i=run.data?.time?.indexOf(iso(target));
        fields.forEach((f,j)=>{
          const prediction=run.data?.[f]?.[i];
          if(Number.isFinite(prediction)&&Number.isFinite(actual[j]))errors[j].push(Math.abs(prediction-actual[j]));
        });
      }
      for(const values of errors){
        any ||= values.length>0;
        tr.insertCell().textContent=values.length?(values.reduce((a,b)=>a+b,0)/values.length).toLocaleString('ca-ES',{maximumFractionDigits:2})+' (n='+values.length+')':'—';
      }
    }
    const note=document.createElement('p');note.textContent=any?'Temperatura i vent a menys de 5 min de l’hora. Pluja acumulada durant l’hora anterior. Mostra curta; cada cel·la indica el seu nombre de casos.':'Encara no hi ha parelles vàlides per a aquest termini.';
    section.replaceChildren(note,table);
  }
  lead.onchange=draw;
  dialog.addEventListener('close',()=>controller?.abort());
  document.querySelector('#verify-station').onclick=async()=>{
    controller?.abort();const current=new AbortController();controller=current;
    dialog.showModal();section.textContent='Consultant l’estació i les passades arxivades…';rows=[];pairs=[];lead.disabled=true;
    const get=async url=>{
      const r=await fetch(url,{signal:AbortSignal.any([current.signal,AbortSignal.timeout(12000)])});
      if(!r.ok)throw Error('Font indisponible');return r.json();
    };
    try{
      const history=await get('https://fonta-meteo.marcelfonta.workers.dev/history?days=5&resolution=raw');
      if(current.signal.aborted)return;
      rows=(Array.isArray(history)?history:history.observations||history.rows||history.data||[]).filter(r=>Number.isFinite(r.epoch));
      if(!rows.length)throw Error('Sense observacions');
      const midnight=Date.parse(new Date().toISOString().slice(0,10)+'T00:00Z');
      const tasks=[];
      for(let day=1;day<=3;day++)for(const [,key] of sources)tasks.push({key,start:midnight-day*24*hour});
      const output=[];
      async function drain(){
        while(tasks.length&&!current.signal.aborted){
          const {key,start}=tasks.shift();
          const params=new URLSearchParams({latitude:'41.6906',longitude:'2.489',models:key,run:iso(start),hourly:fields.join(','),timezone:'GMT',start_date:iso(start).slice(0,10),end_date:iso(start+24*hour).slice(0,10)});
          try{const d=await get('https://single-runs-api.open-meteo.com/v1/forecast?'+params);if(d.hourly)output.push({key,start,data:d.hourly});}catch{/* Missing runs are excluded. */}
        }
      }
      await Promise.all([drain(),drain(),drain()]);
      if(current.signal.aborted)return;
      pairs=output;lead.disabled=false;draw();
    }catch{if(!current.signal.aborted)section.textContent='L’històric de l’estació no està disponible. Torna a obrir la verificació per reintentar-ho.';}
  };
}