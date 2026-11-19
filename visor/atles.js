import { synoptic } from './synoptic.js';
import { regionalLayer } from './regional.js';
import { paintField, palettes } from './color-field.js';
import { MODELS, MODEL_VARIABLES } from './models.js';
import { readingAt, summarize } from './consensus.js';

const el = id => document.getElementById(id);
const coordinates = [];
const local = new URLSearchParams(location.search).get('zona')==='montseny';
const latitudes = local ? [41.57,41.65,41.73,41.81,41.89] : [40.5,40.9,41.3,41.7,42.1,42.5,42.9];
const longitudes = local ? [2.27,2.38,2.49,2.60,2.71] : [0,0.6,1.2,1.8,2.4,3,3.6];
for(const latitude of latitudes){
  for(const longitude of longitudes)coordinates.push([latitude,longitude]);
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


let synopticLayer, regional, nativeKey='', loadingImage=false;
const native = () => el('model').value.startsWith('native-');
const agreement = () => el('model').value==='agreement';
const palette = () => agreement() ? ({temperature:'spreadTemperature',wind:'spreadWind',rain:'wetFraction',clouds:'spreadClouds'})[variable] : variable;
const unit = () => agreement() && variable==='rain' ? '%' : MODEL_VARIABLES[variable].unit;
function setExtent() {
  if(!local){map.fitBounds([[41.0,0.9],[42.55,3.0]],{animate:false});return;}
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
  if (selected === 'agreement') {
    const group=summarize(readings,variable);
    if(group.count<2)return {detail:'Calen dues famílies amb dades'};
    const detail=variable==='rain' ? group.wet+' de '+group.count+' famílies amb ≥0,2 mm/h' : 'Rang entre '+group.count+' famílies';
    return {value:variable==='rain' ? 100*group.wet/group.count : group.max-group.min,detail};
  }
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
  if(native() && variable !== 'temperature'){
    el('legend-title').textContent=MODEL_VARIABLES[variable].label+' · Météo-France';
    el('scale').hidden=true;
    return;
  }
  el('scale').hidden=false;
  const options = palettes[palette()];
  el('legend-title').textContent = (agreement()?(variable==='rain'?'Famílies amb pluja':'Diferència màx.–mín.') : MODEL_VARIABLES[variable].label)+' · '+unit();
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
  heading.textContent = Number.isFinite(reading.value) ? format(reading.value)+' '+unit() : 'Sense dada';
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
  if(native()){
    const key=[model,variable,hour].join('|');
    if(key===nativeKey)return;
    nativeKey=key;loadingImage=true;
    el('retry').hidden=true;
    const name=model==='native-compare'?'AROME i ARPEGE':model.slice(7).toUpperCase();
    el('status').textContent='Carregant '+name+' · '+clock.format(valid)+'…';
    el('play').disabled=el('hour').disabled=false;
    el('prev').disabled=index===0;el('next').disabled=index===24;
    regional.show(model.slice(7),variable,valid.toISOString()).then(shown=>{
      if(shown && nativeKey===key){
        synopticLayer.show(hour);
        el('frame-time').textContent=clock.format(valid);
        el('frame-time').hidden=false;
        el('curtain').hidden=model!=='native-compare';
        el('status').textContent=name+' · '+MODEL_VARIABLES[variable].label+(variable==='temperature'?' · mostreig interpolat':'');
      }
    }).catch(()=>{
      if(nativeKey!==key)return;
      synopticLayer.show(null);
      el('curtain').hidden=true;el('frame-time').hidden=true;stop();el('retry').hidden=false;el('status').textContent='Capa no disponible per a aquesta hora.';
    }).finally(()=>{if(nativeKey===key)loadingImage=false;});
    return;
  }
  el('frame-time').textContent=clock.format(valid);el('frame-time').hidden=false;
  synopticLayer.show(hour);
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
    node.setAttribute('aria-label',coordinates[point].join(', ')+', '+(available ? value+' '+unit() : 'sense dada'));
    if (selectedPoint === point && marker.isPopupOpen()) marker.setPopupContent(popupContent(point,reading));
    if (available) coverage++;
  });
  paintField(frame.data,raster.width,values,palette());
  context.putImageData(frame,0,0);
  overlay.setUrl(raster.toDataURL());
  const label = model==='combined' ? 'Consens' : agreement() ? 'Coincidència' : model;
  el('status').textContent = pending ? 'Carregant · '+(MODELS.length-pending)+'/'+MODELS.length+' models' : label+' · '+(variable==='rain'?'per cel·les':'interpolació visual')+' · '+coverage+'/'+coordinates.length+' punts amb dades';
  el('retry').hidden = pending > 0 || datasets.size===MODELS.length;
  el('play').disabled = el('hour').disabled = datasets.size===0;
  el('prev').disabled = !index || !datasets.size;
  el('next').disabled = index===24 || !datasets.size;
}
const requests = new Map();
function fetchModel(model) {
  if (datasets.has(model.name)) return Promise.resolve();
  if (!requests.has(model.name)) {
    requests.set(model.name, readModel(model).finally(()=>requests.delete(model.name)));
  }
  return requests.get(model.name);
}
async function temperatureFrame(name,time) {
  const model = MODELS.find(item=>item.name === (name==='arome'?'AROME HD':'ARPEGE Europa'));
  await fetchModel(model);
  const hour = time.slice(0,16);
  const values = datasets.get(model.name).map(row=>readingAt(row,model,hour)?.temperature);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 161;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(canvas.width,canvas.height);
  paintField(pixels.data,canvas.width,values,'temperature');
  if (!pixels.data.some((value,i)=>i%4===3 && value)) throw new Error('Sense temperatura a 2 m');
  ctx.putImageData(pixels,0,0);
  return canvas;
}
async function readModel(model) {
  const params = new URLSearchParams({
    latitude:coordinates.map(p=>p[0]).join(','),longitude:coordinates.map(p=>p[1]).join(','),
    hourly:'temperature_2m,precipitation,wind_speed_10m,cloud_cover',timezone:'GMT',forecast_days:String(Math.min(3,model.horizon))
  });
  if (model.model) params.set('models',model.model);
  const response = await fetch('https://api.open-meteo.com'+(model.model ? '/v1/forecast' : model.path)+'?'+params,{signal:AbortSignal.timeout(18000)});
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
  if(local)el('model').value='combined';
  el('zone').textContent=local?'Obre Catalunya':'Detall del Baix Montseny';
  el('zone').href=local?'./':'?zona=montseny';
  regional=regionalLayer(map,temperatureFrame,[coordinates[0],coordinates.at(-1)]);
  synopticLayer=synoptic(map,coordinates,longitudes.length);
  L.control.zoom({position:'topright'}).addTo(map);
  setExtent();
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  const labels=map.createPane('placeLabels');labels.style.zIndex=450;labels.style.pointerEvents='none';
  const cities=[
    ['Barcelona',41.388,2.17],['Girona',41.979,2.821],['Lleida',41.617,.62],
    ['Tarragona',41.118,1.245],['Tortosa',40.812,.521],['Manresa',41.728,1.826],
    ['Sant Celoni',41.69,2.489],['Vic',41.93,2.254],['Puigcerdà',42.432,1.929],
    ['Vielha',42.702,.795],['La Seu d’Urgell',42.358,1.461]
  ];
  for(const [name,lat,lon] of cities){
    L.marker([lat,lon],{pane:'placeLabels',keyboard:false,interactive:false,
      icon:L.divIcon({className:'city-label',html:name,iconSize:null,iconAnchor:[0,8]})
    }).addTo(map);
  }
  overlay = L.imageOverlay(raster.toDataURL(),L.latLngBounds(coordinates),{className:'forecast-field',opacity:0.74,interactive:false}).addTo(map);
  markers = coordinates.map((point,i)=>{
    const icon = L.divIcon({className:'sample missing',html:'<span>—</span>',iconSize:[39,26],iconAnchor:[19,13]});
    const marker = L.marker(point,{icon}).addTo(map);
    marker.bindPopup(()=>popupContent(i,pointReading(i,new Date(firstHour+index*3600000).toISOString().slice(0,16),el('model').value)));
    marker.on('popupopen',()=>{selectedPoint=i;});
    return marker;
  });
  map.on('click',event=>{
    if (native() || !overlay.getBounds().contains(event.latlng)) return;
    let nearest=0;
    coordinates.forEach((point,i)=>{
      if (event.latlng.distanceTo(point)<event.latlng.distanceTo(coordinates[nearest])) nearest=i;
    });
    markers[nearest].openPopup();
  });
  MODELS.forEach(model=>el('local-models').append(new Option(model.name,model.name)));
  const samples=L.layerGroup([overlay,...markers]);
  let wasNative=false;
  function switchModel(){
    synopticLayer.show(null);
    el('curtain').hidden=true;el('frame-time').hidden=true;
    stop();regional.clear();nativeKey='';loadingImage=false;
    if(native()!==wasNative){
      if(native()){for(const layer of samples.getLayers())map.removeLayer(layer);map.removeLayer(samples);}
      else samples.addTo(map);
    }
    wasNative=native();
    legend();
    if(!wasNative && datasets.size<MODELS.length && !pending)void load();
    else draw();
  }
  el('model').addEventListener('change',switchModel);
  el('variables').addEventListener('click',event=>{
    const button = event.target.closest('[data-variable]');
    if (!button) return;
    if(variable===button.dataset.variable)return;
    if(native()){synopticLayer.show(null);regional.clear();nativeKey='';el('curtain').hidden=true;el('frame-time').hidden=true;}
    variable = button.dataset.variable;
    for(const b of el('variables').children) b.setAttribute('aria-pressed',String(b===button));
    legend(); draw();
  });
  el('play').onclick=()=>{
    if(timer){stop();return;}
    el('play').textContent='Ⅱ';el('play').setAttribute('aria-pressed','true');el('play').setAttribute('aria-label','Atura la previsió');
    timer=setInterval(()=>{if(loadingImage)return;index=(index+1)%25;draw();},1000);
  };
  el('hour').oninput=()=>{stop();index=Number(el('hour').value);draw();};
  el('prev').onclick=()=>{stop();index=Math.max(0,index-1);draw();};
  el('next').onclick=()=>{stop();index=Math.min(24,index+1);draw();};
  el('divider').oninput=event=>{
    const value=Number(event.target.value);
    regional.setSplit(value);
    el('curtain').style.setProperty('--split',value+'%');
    event.target.setAttribute('aria-valuetext','AROME '+value+' %, ARPEGE '+(100-value)+' %');
  };
  el('center').onclick=setExtent;
  el('retry').onclick=()=>{if(native()){nativeKey='';draw();}else void load();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  switchModel();
}
el('info').onclick=()=>el('method').showModal();
start();
