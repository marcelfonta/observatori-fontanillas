import { CONFIG } from '../core/config.js';
import { getLanguage } from '../core/i18n.js';
import { searchMunicipalities } from '../services/weather-api.js';

const DEFAULT_PLACE={name:'Sant Celoni',latitude:CONFIG.station.latitude,longitude:CONFIG.station.longitude,elevation:CONFIG.station.elevation||153};
const DIRECTIONS={north:0,east:90,south:180,west:270,zenith:0};
const escapeHtml=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));

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
    const date=value?new Date(value):new Date();
    return Number.isNaN(date.getTime())?new Date():date;
  };
  const setStatus=(message,state='')=>{status.textContent=message;status.dataset.state=state;};
  const updatePlaceCopy=()=>{
    root.querySelector('#night-sky-place-label').textContent=place.name;
    root.querySelector('#night-sky-coordinates').textContent=`${Number(place.latitude).toFixed(4)}° N · ${Number(place.longitude).toFixed(4)}° E`;
  };
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
  timeInput.value=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
  launch.addEventListener('click',loadViewer);
  frame.addEventListener('load',()=>setStatus(`Cel de ${place.name} · hora local seleccionada`,'ready'));
  root.querySelector('#night-sky-now').addEventListener('click',()=>{
    const current=new Date();timeInput.value=new Date(current.getTime()-current.getTimezoneOffset()*60000).toISOString().slice(0,16);refreshViewer();
  });
  timeInput.addEventListener('change',refreshViewer);
  root.querySelector('#night-sky-reset').addEventListener('click',()=>{
    place={...DEFAULT_PLACE};orientation='south';placeInput.value='';updatePlaceCopy();
    const current=new Date();timeInput.value=new Date(current.getTime()-current.getTimezoneOffset()*60000).toISOString().slice(0,16);refreshViewer();
  });
  root.querySelectorAll('[data-sky-direction]').forEach(button=>button.addEventListener('click',()=>{
    orientation=button.dataset.skyDirection||'south';
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
  updatePlaceCopy();
}
