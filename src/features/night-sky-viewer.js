import { CONFIG } from '../core/config.js';
import { getLanguage } from '../core/i18n.js';
import { searchMunicipalities } from '../services/weather-api.js';

const DEFAULT_PLACE={name:'Sant Celoni',latitude:CONFIG.station.latitude,longitude:CONFIG.station.longitude,elevation:CONFIG.station.elevation||153};
const DIRECTIONS={north:0,east:90,south:180,west:270,zenith:0};
const MADRID_TIME_ZONE='Europe/Madrid';
const escapeHtml=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));

function madridParts(date){
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:MADRID_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
}

export function formatMadridDateTime(date){
  const parts=madridParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function madridDateTimeToDate(value){
  const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if(!match)return new Date(Number.NaN);
  const [,year,month,day,hour,minute]=match.map(Number);
  const wallClock=Date.UTC(year,month-1,day,hour,minute);
  let instant=wallClock;
  for(let iteration=0;iteration<3;iteration+=1){
    const parts=madridParts(new Date(instant));
    const represented=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
    instant=wallClock-(represented-instant);
  }
  return new Date(instant);
}

function solarAltitude(date,latitude,longitude){
  const dayMs=86400000;
  const julian=date.getTime()/dayMs+2440587.5;
  const n=julian-2451545;
  const meanLongitude=(280.46+0.9856474*n)%360;
  const meanAnomaly=(357.528+0.9856003*n)%360;
  const toRad=Math.PI/180;
  const eclipticLongitude=(meanLongitude+1.915*Math.sin(meanAnomaly*toRad)+0.02*Math.sin(2*meanAnomaly*toRad))*toRad;
  const obliquity=(23.439-0.0000004*n)*toRad;
  const declination=Math.asin(Math.sin(obliquity)*Math.sin(eclipticLongitude));
  const rightAscension=Math.atan2(Math.cos(obliquity)*Math.sin(eclipticLongitude),Math.cos(eclipticLongitude));
  const sidereal=(280.46061837+360.98564736629*(julian-2451545)+longitude)*toRad;
  const hourAngle=sidereal-rightAscension;
  const latitudeRad=latitude*toRad;
  return Math.asin(Math.sin(latitudeRad)*Math.sin(declination)+Math.cos(latitudeRad)*Math.cos(declination)*Math.cos(hourAngle))/toRad;
}

export function eveningSolarEvent(value,place=DEFAULT_PLACE,type='sunset'){
  const day=String(value||formatMadridDateTime(new Date())).slice(0,10);
  const start=madridDateTimeToDate(`${day}T12:00`);
  if(Number.isNaN(start.getTime()))return null;
  const target=type==='astronomical'?-18:-0.833;
  let previous=start;
  let previousAltitude=solarAltitude(previous,Number(place.latitude),Number(place.longitude));
  for(let minutes=10;minutes<=1080;minutes+=10){
    const current=new Date(start.getTime()+minutes*60000);
    const altitude=solarAltitude(current,Number(place.latitude),Number(place.longitude));
    if(previousAltitude>target&&altitude<=target){
      let low=previous.getTime();let high=current.getTime();
      for(let iteration=0;iteration<12;iteration+=1){
        const middle=(low+high)/2;
        if(solarAltitude(new Date(middle),Number(place.latitude),Number(place.longitude))>target)low=middle;else high=middle;
      }
      return new Date((low+high)/2);
    }
    previous=current;previousAltitude=altitude;
  }
  return null;
}

export function stellariumUrl(place=DEFAULT_PLACE,date=new Date(),orientation='south'){
  const url=new URL('https://stellarium-web.org/');
  url.searchParams.set('lat',Number(place.latitude).toFixed(6));
  url.searchParams.set('lng',Number(place.longitude).toFixed(6));
  url.searchParams.set('elev',String(Math.round(Number(place.elevation)||0)));
  url.searchParams.set('date',date.toISOString());
  url.searchParams.set('az',String(DIRECTIONS[orientation]??180));
  url.searchParams.set('alt',orientation==='zenith'?'90':'25');
  url.searchParams.set('fov',orientation==='zenith'?'110':'90');
  return url.href;
}

export function nightSkyCapability(){
  if(typeof WebAssembly!=='object')return {ok:false,message:'Aquest navegador no admet WebAssembly.'};
  const canvas=document.createElement('canvas');
  const webgl=canvas.getContext('webgl2')||canvas.getContext('webgl');
  if(!webgl)return {ok:false,message:'Aquest dispositiu no ha pogut iniciar WebGL.'};
  return {ok:true,message:'El dispositiu és compatible amb el planetari.'};
}

export function initNightSkyViewer(){
  const root=document.getElementById('night-sky-viewer');
  if(!root||root.dataset.initialized)return;
  root.dataset.initialized='true';
  const frame=root.querySelector('#night-sky-frame');
  const launch=root.querySelector('#night-sky-launch');
  const status=root.querySelector('#night-sky-status');
  const shell=root.querySelector('.night-sky-viewer__stage');
  const timeInput=root.querySelector('#night-sky-time');
  const placeInput=root.querySelector('#night-sky-place');
  const suggestions=root.querySelector('#night-sky-suggestions');
  let place={...DEFAULT_PLACE};
  let loaded=false;
  let orientation='south';
  let searchTimer;
  let candidates=[];

  const dateFromInput=()=>{
    const value=timeInput.value;
    const date=value?madridDateTimeToDate(value):new Date();
    return Number.isNaN(date.getTime())?new Date():date;
  };
  const setStatus=(message,state='')=>{status.textContent=message;status.dataset.state=state;};
  const updatePlaceCopy=()=>{
    root.querySelector('#night-sky-place-label').textContent=place.name;
    root.querySelector('#night-sky-coordinates').textContent=`${Number(place.latitude).toFixed(4)}° N · ${Number(place.longitude).toFixed(4)}° E`;
  };
  const updateOrientation=()=>root.querySelectorAll('[data-sky-direction]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.skyDirection===orientation)));
  const loadViewer=()=>{
    const capability=nightSkyCapability();
    if(!capability.ok){setStatus(`${capability.message} Pots continuar consultant la informació textual d’aquesta pàgina.`,'error');return;}
    frame.src=stellariumUrl(place,dateFromInput(),orientation);
    frame.hidden=false;shell.classList.add('is-loaded');loaded=true;
    launch.textContent='Planetari carregat';launch.disabled=true;
    setStatus('Carregant Stellarium i els catàlegs del cel…','loading');
  };
  const refreshViewer=()=>{if(loaded)loadViewer();};

  const now=new Date();
  timeInput.value=formatMadridDateTime(now);
  launch.addEventListener('click',loadViewer);
  frame.addEventListener('load',()=>setStatus(`Cel de ${place.name} · hora local seleccionada`,'ready'));
  root.querySelector('#night-sky-now').addEventListener('click',()=>{
    timeInput.value=formatMadridDateTime(new Date());refreshViewer();
  });
  root.querySelectorAll('[data-sky-time-preset]').forEach(button=>button.addEventListener('click',()=>{
    const type=button.dataset.skyTimePreset;
    const event=eveningSolarEvent(timeInput.value,place,type);
    if(!event){setStatus('No s’ha pogut calcular aquesta hora solar per a la localitat i la data seleccionades.','warning');return;}
    timeInput.value=formatMadridDateTime(event);
    setStatus(type==='astronomical'?'Seleccionat l’inici de la nit astronòmica.':'Seleccionada la posta de sol.','ready');
    refreshViewer();
  }));
  timeInput.addEventListener('change',refreshViewer);
  root.querySelector('#night-sky-reset').addEventListener('click',()=>{
    place={...DEFAULT_PLACE};orientation='south';placeInput.value='';updatePlaceCopy();
    timeInput.value=formatMadridDateTime(new Date());updateOrientation();refreshViewer();
  });
  root.querySelectorAll('[data-sky-direction]').forEach(button=>button.addEventListener('click',()=>{
    orientation=button.dataset.skyDirection||'south';
    updateOrientation();
    loadViewer();
    frame.focus();
  }));
  root.querySelector('#night-sky-fullscreen').addEventListener('click',async()=>{
    if(!loaded)loadViewer();
    try{await shell.requestFullscreen();}catch{setStatus('La pantalla completa no està disponible en aquest navegador.','warning');}
  });
  const renderSuggestions=items=>{
    candidates=items.slice(0,6);
    suggestions.innerHTML=candidates.map((item,index)=>`<button type="button" role="option" data-sky-place="${index}"><b>${escapeHtml(item.name)}</b><small>${escapeHtml([item.admin2||item.admin1,item.country].filter(Boolean).join(' · '))}</small></button>`).join('');
    suggestions.hidden=!candidates.length;
    placeInput.setAttribute('aria-expanded',String(Boolean(candidates.length)));
  };
  placeInput.addEventListener('input',()=>{
    clearTimeout(searchTimer);renderSuggestions([]);const query=placeInput.value.trim();if(query.length<2)return;
    searchTimer=setTimeout(async()=>{try{renderSuggestions(await searchMunicipalities(query,getLanguage()));}catch{renderSuggestions([]);}},280);
  });
  suggestions.addEventListener('click',event=>{
    const button=event.target.closest('[data-sky-place]');if(!button)return;
    const selected=candidates[Number(button.dataset.skyPlace)];if(!selected)return;
    place={name:selected.name,latitude:selected.latitude,longitude:selected.longitude,elevation:selected.elevation||0};
    placeInput.value=selected.name;renderSuggestions([]);updatePlaceCopy();refreshViewer();
  });
  updatePlaceCopy();updateOrientation();
}
