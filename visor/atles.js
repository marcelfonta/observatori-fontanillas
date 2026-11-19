import { paintField, palettes } from './color-field.js';
import { MODELS, MODEL_VARIABLES } from './models.js';
import { readingAt, summarize } from './consensus.js';

const el = id => document.getElementById(id);
const coordinates = [];
for (const latitude of [41.57, 41.65, 41.73, 41.81, 41.89]) {
  for (const longitude of [2.27, 2.38, 2.49, 2.60, 2.71]) coordinates.push([latitude, longitude]);
}
const datasets = new Map();
const firstHour = Math.ceil(Date.now()/3600000)*3600000;
const clock = new Intl.DateTimeFormat('ca-ES',{timeZone:'Europe/Madrid',weekday:'short',hour:'2-digit',minute:'2-digit'});
const numbers = [0,1].map(digits => new Intl.NumberFormat('ca-ES',{maximumFractionDigits:digits}));
let variable = 'temperature';
let index = 0;
let timer;
let pending = 0;
let map;
let markers = [];
let selectedPoint = null;
const raster = document.createElement('canvas');
raster.width = raster.height = 161;
const context = raster.getContext('2d');
const frame = context.createImageData(raster.width,raster.height);
let overlay;


function setExtent() {
  map.fitBounds(L.latLngBounds(coordinates),{paddingTopLeft:[30,60],paddingBottomRight:[30,64],animate:false});
}
function stop() {
  clearInterval(timer);
  timer = undefined;
  el('play').textContent = '▶';
  el('play').setAttribute('aria-pressed','false');
  el('play').setAttribute('aria-label','Reprodueix la previsió');
}
function pointReading(point, hour, selected) {
  const readings = MODELS.map(model => readingAt(datasets.get(model.name)?.[point],model,hour)).filter(Boolean);
  if (selected === 'combined') {
    const summary = summarize(readings,variable);
    return {value:summary.median, detail:summary.count ? summary.count+' famílies · interval '+format(summary.min)+' – '+format(summary.max):'Sense dades comparables'};
  }
  const value = readings.find(reading => reading.model.name === selected)?.[variable];
  return {value,detail:selected};
}
function format(value) {
  return numbers[MODEL_VARIABLES[variable].digits].format(value);
}
function legend() {
  const options = palettes[variable];
  el('legend-title').textContent = MODEL_VARIABLES[variable].label+' · '+MODEL_VARIABLES[variable].unit;
  el('scale').style.setProperty('--gradient','linear-gradient(90deg,'+options.map(([v,c])=>c+' '+((v-options[0][0])*100/(options.at(-1)[0]-options[0][0]))+'%').join(',')+')');
  el('scale').replaceChildren(...[options[0],options.at(-1)].map(([bound]) => {
    const span = document.createElement('span');
    span.textContent = format(bound);
    return span;
  }));
}
function popupContent(point, reading) {
  const content = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = Number.isFinite(reading.value) ? format(reading.value)+' '+MODEL_VARIABLES[variable].unit : 'Sense dada';
  content.append(heading,document.createElement('br'),reading.detail,document.createElement('br'),coordinates[point].join('°, ')+'° · '+el('valid').textContent);
  return content;
}
function draw() {
  const valid = new Date(firstHour+index*3600000);
  const hour = valid.toISOString().slice(0,16);
  const model = el('model').value;
  el('valid').textContent = clock.format(valid);
  el('hour').value = index;
  el('hour').setAttribute('aria-valuetext',el('valid').textContent);
  let coverage = 0;
  const values = [];
  markers.forEach((marker,point) => {
    const reading = pointReading(point,hour,model);
    const available = Number.isFinite(reading.value);
    const value = available ? format(reading.value) : '—';
    const node = marker.getElement();
    const badge = node.firstElementChild;
    node.classList.toggle('missing',!available);
    badge.textContent = value;
    values.push(reading.value);
    node.setAttribute('aria-label',coordinates[point].join(', ')+', '+(available ? value+' '+MODEL_VARIABLES[variable].unit : 'sense dada'));
    if (selectedPoint === point && marker.isPopupOpen()) marker.setPopupContent(popupContent(point,reading));
    if (available) coverage++;
  });
  paintField(frame.data,raster.width,values,variable);
  context.putImageData(frame,0,0);
  overlay.setUrl(raster.toDataURL());
  const label = model==='combined' ? 'Consens' : model;
  el('status').textContent = pending ? 'Carregant · '+(MODELS.length-pending)+'/'+MODELS.length+' models' : label+' · '+(variable==='rain'?'per cel·les':'interpolació visual')+' · '+coverage+'/'+coordinates.length+' punts amb dades';
  el('retry').hidden = pending > 0 || datasets.size===MODELS.length;
  el('play').disabled = el('hour').disabled = datasets.size===0;
  el('prev').disabled = !index || !datasets.size;
  el('next').disabled = index===24 || !datasets.size;
}
async function fetchModel(model) {
  const params = new URLSearchParams({
    latitude:coordinates.map(p=>p[0]).join(','),longitude:coordinates.map(p=>p[1]).join(','),
    hourly:'temperature_2m,precipitation,wind_speed_10m,cloud_cover',timezone:'GMT',forecast_days:String(Math.min(3,model.horizon))
  });
  if (model.model) params.set('models',model.model);
  const response = await fetch('https://api.open-meteo.com'+model.path+'?'+params,{signal:AbortSignal.timeout(18000)});
  if (!response.ok) throw new Error('Font no disponible');
  const data = await response.json();
  if (!Array.isArray(data) || data.length!==coordinates.length || !data.some(item=>item?.hourly?.time?.length)) throw new Error('Cobertura incompleta');
  datasets.set(model.name,data);
}
async function load() {
  if (pending) return;
  const missing = MODELS.filter(model=>!datasets.has(model.name));
  pending = missing.length;
  draw();
  await Promise.allSettled(missing.map(async model=>{
    try { await fetchModel(model); }
    finally { pending--; draw(); }
  }));
}
function start() {
  if (!window.L) { el('status').textContent='No s’ha pogut carregar el mapa. Torna a carregar la pàgina.'; return; }
  map = L.map('map',{zoomControl:false,zoomSnap:0.25,maxZoom:15,minZoom:6});
  L.control.zoom({position:'topright'}).addTo(map);
  setExtent();
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  overlay = L.imageOverlay(raster.toDataURL(),L.latLngBounds(coordinates),{className:'forecast-field',opacity:0.74,interactive:false}).addTo(map);
  markers = coordinates.map((point,i)=>{
    const icon = L.divIcon({className:'sample missing',html:'<span>—</span>',iconSize:[39,26],iconAnchor:[19,13]});
    const marker = L.marker(point,{icon}).addTo(map);
    marker.bindPopup(()=>popupContent(i,pointReading(i,new Date(firstHour+index*3600000).toISOString().slice(0,16),el('model').value)));
    marker.on('popupopen',()=>{selectedPoint=i;});
    return marker;
  });
  map.on('click',event=>{
    if (!overlay.getBounds().contains(event.latlng)) return;
    let nearest=0;
    coordinates.forEach((point,i)=>{
      if (event.latlng.distanceTo(point)<event.latlng.distanceTo(coordinates[nearest])) nearest=i;
    });
    markers[nearest].openPopup();
  });
  MODELS.forEach(model=>el('model').add(new Option(model.name,model.name)));
  el('model').addEventListener('change',draw);
  el('variables').addEventListener('click',event=>{
    const button = event.target.closest('[data-variable]');
    if (!button) return;
    variable = button.dataset.variable;
    for(const b of el('variables').children) b.setAttribute('aria-pressed',String(b===button));
    legend(); draw();
  });
  el('play').onclick=()=>{
    if(timer){stop();return;}
    el('play').textContent='Ⅱ';el('play').setAttribute('aria-pressed','true');el('play').setAttribute('aria-label','Atura la previsió');
    timer=setInterval(()=>{index=(index+1)%25;draw();},1000);
  };
  el('hour').oninput=()=>{stop();index=Number(el('hour').value);draw();};
  el('prev').onclick=()=>{stop();index=Math.max(0,index-1);draw();};
  el('next').onclick=()=>{stop();index=Math.min(24,index+1);draw();};
  el('center').onclick=setExtent;
  el('retry').onclick=load;
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  legend();void load();
}
el('info').onclick=()=>el('method').showModal();
start();
