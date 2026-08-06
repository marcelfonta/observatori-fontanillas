import { setText } from '../core/dom.js';

const layerNames = {
  rain:'precipitació',
  temp:'temperatura a 2 metres',
  wind:'vent a 10 metres',
  clouds:'nuvolositat',
  pressure:'pressió atmosfèrica'
};

const modelNames = { ecmwf:'ECMWF', gfs:'GFS', iconEu:'ICON-EU' };
let model = 'ecmwf';
let layer = 'rain';
let loadTimer;

function windyUrl() {
  const query=new URLSearchParams({
    lat:'41.691',lon:'2.489',detailLat:'41.691',detailLon:'2.489',width:'1200',height:'560',zoom:'6',
    level:'surface',overlay:layer,product:model,menu:'true',message:'true',marker:'true',calendar:'now',pressure:'true',
    type:'map',location:'coordinates',detail:'',metricWind:'km/h',metricTemp:'°C',radarRange:'-1'
  });
  return `https://embed.windy.com/embed2.html?${query}`;
}

function markLoading() {
  const shell=document.getElementById('model-viewer-shell');
  const fallback=document.getElementById('model-viewer-fallback');
  shell?.classList.add('is-loading'); shell?.classList.remove('is-ready','has-error');
  if(fallback)fallback.hidden=true;
  setText('model-viewer-state','Carregant el visor temporal de Windy…');
  clearTimeout(loadTimer);
  loadTimer=setTimeout(()=>{
    if(shell?.classList.contains('is-ready'))return;
    shell?.classList.remove('is-loading'); shell?.classList.add('has-error');
    if(fallback)fallback.hidden=false;
    setText('model-viewer-state','El mapa extern no ha respost; utilitza l’accés directe.');
  },15000);
}

function updateViewer() {
  const frame=document.getElementById('model-viewer-frame');
  markLoading();
  if(frame)frame.src=windyUrl();
  setText('model-viewer-caption',`${modelNames[model]} · ${layerNames[layer]}`);
}

export function initModelViewer() {
  const frame=document.getElementById('model-viewer-frame');
  const shell=document.getElementById('model-viewer-shell');
  frame?.addEventListener('load',()=>{
    clearTimeout(loadTimer);
    shell?.classList.remove('is-loading','has-error'); shell?.classList.add('is-ready');
    const fallback=document.getElementById('model-viewer-fallback'); if(fallback)fallback.hidden=true;
    setText('model-viewer-state','Visor temporal de Windy centrat a Sant Celoni.');
  });
  if(frame&&!frame.getAttribute('src')&&frame.dataset.src){ markLoading(); frame.src=frame.dataset.src; }
  document.querySelectorAll('[data-viewer-model]').forEach(button=>button.addEventListener('click',()=>{
    model=button.dataset.viewerModel;
    document.querySelectorAll('[data-viewer-model]').forEach(item=>item.classList.toggle('is-active',item===button));
    updateViewer();
  }));
  document.querySelectorAll('[data-viewer-layer]').forEach(button=>button.addEventListener('click',()=>{
    layer=button.dataset.viewerLayer;
    document.querySelectorAll('[data-viewer-layer]').forEach(item=>item.classList.toggle('is-active',item===button));
    updateViewer();
  }));
}
