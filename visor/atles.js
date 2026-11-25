import {pointOutlook} from './point-outlook.js';
import {stationSkill} from './station-skill.js';
import { radarHistory } from './radar.js';
import { synoptic } from './synoptic.js';
import { regionalLayer } from './regional.js';
import { paintField, palettes } from './color-field.js';
import { MODELS, MODEL_VARIABLES } from './models.js';
import { independentModels, readingAt, summarize } from './consensus.js';

const el = id => document.getElementById(id);
const coordinates = [];
const query=new URLSearchParams(location.search);
const local=query.get('zona')==='montseny';
const detailStep={arome:.01,arpege:.1}[query.get('malla')];
const detail=Boolean(detailStep && query.has('lat') && query.has('lon') && +query.get('lat')>=40.5 && +query.get('lat')<=42.9 && +query.get('lon')>=0 && +query.get('lon')<=3.6);
function gridAxis(key) {
  const middle=Math.round(Number(query.get(key))/detailStep);
  return Array.from({length:9},(_,i)=>Number(((middle+i-4)*detailStep).toFixed(2)));
}
const openOutlook=pointOutlook();
stationSkill();
const latitudes = detail?gridAxis('lat'):local ? [41.57,41.65,41.73,41.81,41.89] : [40.5,40.9,41.3,41.7,42.1,42.5,42.9];
const longitudes = detail?gridAxis('lon'):local ? [2.27,2.38,2.49,2.60,2.71] : [0,0.6,1.2,1.8,2.4,3,3.6];
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
let map, radar;
let radarActive = false, radarLength = 0, radarRequest = 0, forecastIndex = 0;
let joined=false, priorVariable;
let lastIndividual = 'ECMWF IFS';
let markers = [];

const raster = document.createElement('canvas');
raster.width = raster.height = 161;
const context = raster.getContext('2d');
const frame = context.createImageData(raster.width,raster.height);
let overlay;
const cityMarkers = [];
let displayedCityHour = null;
let snowLayer, pin, pointPopup, pick=null;
function sourceAt(location) {
  const choice=el('model').value;
  if(!native()) return choice;
  const left=map.latLngToContainerPoint(location).x<map.getSize().x*Number(el('divider').value)/100;
  return choice==='native-arome' || (choice==='native-compare' && left) ? 'AROME HD' : 'ARPEGE Europa';
}
function snowAt(point,hour,choice) {
  const readings=MODELS.map(model=>readingAt(datasets.get(model.name)?.[point],model,hour)).filter(Boolean);
  const grouped=choice==='combined' || choice==='agreement';
  const available=(grouped?independentModels(readings,'snow'):readings.filter(r=>r.model.name===choice)).filter(r=>Number.isFinite(r.snow));
  if(!available.length) return {symbol:'?',text:'Fase de precipitació desconeguda'};
  const snow=available.filter(r=>r.snow>0);
  if(!snow.length)return {symbol:'●',text:'Sense neu prevista a la mostra'};
  return {symbol:'❄',text:grouped ? 'Neu prevista per '+snow.length+'/'+available.length+' famílies amb dades' : 'Neu prevista · '+numbers[1].format(snow[0].snow)+' cm en una hora'};
}
function refreshSnow(hour) {
  snowLayer.clearLayers();
  el('phase-key').hidden=variable!=='rain' || radarActive;
  if(!hour || variable!=='rain' || radarActive)return;
  coordinates.forEach((coords,i)=>{
    const choice=sourceAt(coords);
    const phase=snowAt(i,hour,choice);
    if(phase.symbol!=='❄'){
      const precipitation=pointReading(i,hour,choice==='agreement'?'combined':choice).value;
      if(!(precipitation>0))return;
    }
    L.marker(coords,{interactive:false,keyboard:false,pane:'placeLabels',icon:L.divIcon({
      className:'phase-symbol '+(phase.symbol==='❄'?'phase-snow':phase.symbol==='●'?'phase-rain':'phase-unknown'),html:phase.symbol,iconSize:[17,17],iconAnchor:[8,8]
    })}).addTo(snowLayer);
  });
}
function clearPick() {
  if(pointPopup) map.closePopup(pointPopup);
  pin?.remove();pin=null;pick=null;pointPopup=null;
}
function updatePick() {
  if(!pick || !pointPopup)return;
  const heading=document.createElement('strong');
  heading.textContent='Punt seleccionat · '+pick.location.lat.toFixed(3)+'°, '+pick.location.lng.toFixed(3)+'°';
  const body=document.createElement('div');body.append(heading);
  if(radarActive || native() || !pick.inside) {
    const note=document.createElement('p');
    note.textContent=!pick.inside && !radarActive && !native() ? 'Fora de la graella de previsió' :
      radarActive?'Radar observat · '+el('valid').textContent:
      sourceAt(pick.location)+' · '+el('frame-time').textContent;
    body.append(note);
  }
  if(pick.inside && !radarActive && displayedCityHour && (!native() || ['temperature','rain'].includes(variable))) {
    const choice=sourceAt(pick.location);
    body.append(document.createElement('hr'), 'Mostra de la graella més propera',popupContent(pick.nearest,pointReading(pick.nearest,displayedCityHour,choice)));
    if(variable==='rain')body.append(snowAt(pick.nearest,displayedCityHour,choice).text);
  }
  const outlook=document.createElement('button');
  outlook.textContent='Meteograma · 24 h';outlook.className='outlook-action';
  outlook.onclick=()=>{stop();openOutlook(pick.location,variable,firstHour);};
  body.append(outlook);
  if(pick.location.lat>=40.5 && pick.location.lat<=42.9 && pick.location.lng>=0 && pick.location.lng<=3.6){
    const links=document.createElement('div');links.className='grid-links';
    for(const [key,name] of [['arome','Malla AROME · 0,01°'],['arpege','Malla ARPEGE · 0,1°']]){
      const link=document.createElement('a');link.textContent=name;
      link.href='?'+new URLSearchParams({malla:key,lat:pick.location.lat.toFixed(4),lon:pick.location.lng.toFixed(4)});links.append(link);
    }
    body.append(links);
  }
  pointPopup.setContent(body);
}
function selectPoint(location) {
  clearPick();
  let nearest=0;
  coordinates.forEach((point,i)=>{if(location.distanceTo(point)<location.distanceTo(coordinates[nearest]))nearest=i;});
  pick={location,nearest,inside:overlay.getBounds().contains(location)};
  pin=L.marker(location,{interactive:false,keyboard:false,zIndexOffset:1500,icon:L.divIcon({
    className:'selected-location',iconSize:[22,22],iconAnchor:[11,11]
  })}).addTo(map);
  pointPopup=L.popup({offset:[0,-14],autoPan:true,maxHeight:Math.max(160,Math.min(340,map.getSize().y-80))}).setLatLng(location);
  updatePick();
  pointPopup.openOn(map);
}
function showCityTemperatures(hour) {
  displayedCityHour = hour;
  refreshSnow(hour);
  updatePick();
  const selection = el('model').value;
  const divider = map.getSize().x * Number(el('divider').value) / 100;
  for (const marker of cityMarkers) {
    const label = marker.getElement().querySelector('.city-temperature');
    label.textContent = '';
    if (!hour || variable !== 'temperature') continue;
    const location = marker.getLatLng();
    const row = latitudes.findIndex((v,i)=>v<=location.lat && location.lat<=latitudes[i+1]);
    const col = longitudes.findIndex((v,i)=>v<=location.lng && location.lng<=longitudes[i+1]);
    if (row<0 || col<0) continue;
    let model = selection;
    if (native()) {
      const left = map.latLngToContainerPoint(location).x < divider;
      model = selection==='native-arome' || (selection==='native-compare' && left) ? 'AROME HD' : 'ARPEGE Europa';
    }
    const width = longitudes.length, pos = row*width+col;
    const values = [pos,pos+1,pos+width,pos+width+1].map(i=>pointReading(i,hour,model).value);
    if (!values.every(Number.isFinite)) continue;
    const dx=(location.lng-longitudes[col])/(longitudes[col+1]-longitudes[col]);
    const dy=(location.lat-latitudes[row])/(latitudes[row+1]-latitudes[row]);
    const [a,b,c,d]=values;
    const value=(1-dy)*(a*(1-dx)+b*dx)+dy*(c*(1-dx)+d*dx);
    label.textContent = (agreement()?'Δ ':'')+format(value)+' °C';
  }
}


let synopticLayer, regional, nativeKey='', loadingImage=false;
const native = () => el('model').value.startsWith('native-');
const agreement = () => el('model').value==='agreement';
const palette = () => agreement() ? ({temperature:'spreadTemperature',wind:'spreadWind',rain:'wetFraction',clouds:'spreadClouds'})[variable] : variable;
const unit = () => agreement() && variable==='rain' ? '%' : MODEL_VARIABLES[variable].unit;
function setExtent() {
  if(!local && !detail){map.fitBounds([[41.0,0.9],[42.55,3.0]],{animate:false});return;}
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
  const ticks=[options[0],options[Math.floor(options.length/2)],options.at(-1)];
  el('scale').replaceChildren(...ticks.map(([bound],i) => {
    const span = document.createElement('span');
    span.textContent = format(bound);
    if(i===1)span.style.left=((bound-options[0][0])*100/(options.at(-1)[0]-options[0][0]))+'%';
    return span;
  }));
}
function popupContent(point, reading) {
  const content = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = Number.isFinite(reading.value) ? format(reading.value)+' '+unit() : 'Sense dada';
  content.append(heading,document.createElement('br'),reading.detail,document.createElement('br'),coordinates[point].join('°, ')+'° · '+clock.format(new Date(displayedCityHour+'Z')));
  if (['combined','agreement'].includes(el('model').value)) {
    const hour=displayedCityHour;
    const list=document.createElement('dl');
    list.className='point-models';
    for(const model of MODELS){
      const value=readingAt(datasets.get(model.name)?.[point],model,hour)?.[variable];
      const dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=model.name;
      dd.textContent=Number.isFinite(value)?format(value)+' '+MODEL_VARIABLES[variable].unit:'—';
      list.append(dt,dd);
    }
    content.append(list);
  }
  return content;
}
function drawRadar() {
  const time = radar.show(index);
  if (!time) return;
  const label = clock.format(time);
  el('valid').textContent=el('frame-time').textContent=label;
  el('frame-time').hidden=false;
  el('hour').value=index;
  el('hour').setAttribute('aria-valuetext',label);
  el('play').disabled=el('hour').disabled=false;
  el('prev').disabled=index===0;
  el('next').disabled=false;
  el('status').textContent='Radar observat · RainViewer';
  updatePick();
}
function draw() {
  if (radarActive) return;
  const valid = new Date(firstHour+index*3600000);
  const hour = valid.toISOString().slice(0,16);
  const model = el('model').value;
  el('valid').textContent = clock.format(valid);
  el('hour').value = index+(joined?radarLength:0);
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
        if(variable==='rain'){
          const names=model==='native-compare'?['AROME HD','ARPEGE Europa']:[sourceAt(map.getCenter())];
          void Promise.allSettled(MODELS.filter(m=>names.includes(m.name)).map(fetchModel)).then(()=>{
            if(nativeKey===key){refreshSnow(hour);updatePick();}
          });
        }
        el('frame-time').textContent=clock.format(valid);
        synopticLayer.show(hour);
        showCityTemperatures(hour);
        el('frame-time').hidden=false;
        el('curtain').hidden=model!=='native-compare';
        el('status').textContent=name+' · '+MODEL_VARIABLES[variable].label+(variable==='temperature'?' · mostreig interpolat':'');
      }
    }).catch(()=>{
      if(nativeKey!==key)return;
      showCityTemperatures(null);synopticLayer.show(null);
      el('curtain').hidden=true;el('frame-time').hidden=true;stop();el('retry').hidden=false;el('status').textContent='Capa no disponible per a aquesta hora.';
    }).finally(()=>{if(nativeKey===key)loadingImage=false;});
    return;
  }
  el('frame-time').textContent=clock.format(valid);el('frame-time').hidden=false;
  synopticLayer.show(hour);
    showCityTemperatures(hour);
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

    if (available) coverage++;
  });
  paintField(frame.data,raster.width,values,palette());
  context.putImageData(frame,0,0);
  overlay.setUrl(raster.toDataURL());
  const label = model==='combined' ? 'Consens' : agreement() ? 'Coincidència' : model;
  el('status').textContent = pending ? 'Carregant · '+(MODELS.length-pending)+'/'+MODELS.length+' models' : label+' · '+(variable==='rain'?'per cel·les':'interpolació visual')+' · '+coverage+'/'+coordinates.length+' punts amb dades · '+datasets.size+'/'+MODELS.length+' sortides';
  el('retry').hidden = pending > 0 || datasets.size===MODELS.length;
  el('play').disabled = el('hour').disabled = datasets.size===0;
  el('prev').disabled = (!index && !joined) || !datasets.size;
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
    hourly:'temperature_2m,precipitation,snowfall,wind_speed_10m,cloud_cover',timezone:'GMT',forecast_days:String(Math.min(3,model.horizon))
  });
  if (model.model) params.set('models',model.model);
  const nativeGrid=detail && model.name===(detailStep===.01?'AROME HD':'ARPEGE Europa');
  if(detail){params.set('cell_selection','nearest');params.set('elevation','nan');}
  if(nativeGrid){
    params.delete('latitude');params.delete('longitude');
    params.set('bounding_box',[latitudes[0]-detailStep/3,longitudes[0]-detailStep/3,latitudes.at(-1)+detailStep/3,longitudes.at(-1)+detailStep/3].map(n=>n.toFixed(4)).join(','));
  }
  const base = 'https://api.open-meteo.com'+(model.model ? '/v1/forecast' : model.path);
  const request = ()=>fetch(base+'?'+params,{signal:AbortSignal.timeout(18000)});
  let response = await request();
  if (response.status===429) {
    const retry = response.headers.get('Retry-After');
    const wait = retry === null ? 2500 + MODELS.indexOf(model)*400 :
      (/^\d+$/.test(retry) ? Number(retry)*1000 : Date.parse(retry)-Date.now());
    if (Number.isFinite(wait) && wait<=12000) {
      await new Promise(resolve=>setTimeout(resolve,Math.max(1000,wait)));
      response = await request();
    }
  }
  if (response.status===400) {
    params.set('hourly','temperature_2m,precipitation,wind_speed_10m,cloud_cover');
    response=await request();
  }
  if (!response.ok) throw new Error('Font no disponible');
  let data = await response.json();
  if(nativeGrid && Array.isArray(data)){
    const key=(lat,lon)=>Number(lat).toFixed(3)+','+Number(lon).toFixed(3);
    const cells=new Map(data.map(cell=>[key(cell.latitude,cell.longitude),cell]));
    data=coordinates.map(([lat,lon])=>cells.get(key(lat,lon)));
    if(data.some(cell=>!cell))throw new Error('Malla incompleta');
  }
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
  if(local || detail)el('model').value='combined';
  el('zone').textContent=local||detail?'Obre Catalunya':'Detall del Baix Montseny';
  el('zone').href=local||detail?'./':'?zona=montseny';
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
    cityMarkers.push(L.marker([lat,lon],{pane:'placeLabels',keyboard:false,interactive:false,
      icon:L.divIcon({className:'city-label',html:name+'<span class="city-temperature"></span>',iconSize:null,iconAnchor:[0,8]})
    }).addTo(map));
  }
  map.on('moveend zoomend resize',()=>showCityTemperatures(displayedCityHour));
  snowLayer=L.layerGroup().addTo(map);
  overlay = L.imageOverlay(raster.toDataURL(),L.latLngBounds(coordinates),{className:'forecast-field',opacity:0.74,interactive:false}).addTo(map);
  markers = coordinates.map((point,i)=>{
    const icon = L.divIcon({className:'sample missing',html:'<span>—</span>',iconSize:[39,26],iconAnchor:[19,13]});
    const marker = L.marker(point,{icon}).addTo(map);
    marker.on('click',event=>{
      const pointer=event.originalEvent;
      selectPoint(pointer?.detail>0 ? map.mouseEventToLatLng(pointer) : marker.getLatLng());
    });
    return marker;
  });
  map.on('click',event=>selectPoint(event.latlng));
  map.on('popupclose',event=>{
    if(event.popup===pointPopup){pin?.remove();pin=null;pick=null;pointPopup=null;}
  });
  MODELS.forEach(model=>el('local-models').append(new Option(model.name,model.name)));
  const samples=L.layerGroup([overlay,...markers]);
  samples.addTo(map);
  radar = radarHistory(map,()=>{
    if(!radarActive)return;
    stop();
    el('status').textContent='Imatge radar incompleta';
    el('retry').hidden=false;
  });
  function setModeUI(mode) {
    document.body.dataset.mode=mode;
    for(const name of ['consensus','models','radar']) el('mode-'+name).setAttribute('aria-pressed',String(name===mode));
    el('title').textContent={consensus:'Consens multimodel',models:'Models de previsió',radar:'Radar observat'}[mode];
    el('mode-help').textContent=detail && mode!=='radar'?'81 cel·les · malla '+(detailStep===.01?'AROME HD a 0,01°':'ARPEGE a 0,1°')+' · cada model conserva la seva resolució.':mode==='radar'?'Precipitació observada · RainViewer':mode==='models'?'Sortides individuals i comparació AROME–ARPEGE.':agreement()?'Dispersió entre famílies per a la mateixa hora.':'Mediana de les famílies de models disponibles.';
    document.querySelector('.radar-source').hidden=mode!=='radar';
    el('time-label').textContent=mode==='radar'?'Hora d’observació':'Hora de previsió';
  }
  async function openRadar(){
    clearPick();
    if (!joined){forecastIndex=index;priorVariable=variable;}
    joined=true;
    radarActive=true;
    const request=++radarRequest;
    stop(); regional.clear(); nativeKey=''; loadingImage=false;
    samples.remove(); map.closePopup(); showCityTemperatures(null); synopticLayer.show(null);
    setModeUI('radar');
    el('curtain').hidden=el('frame-time').hidden=el('retry').hidden=true;
    el('valid').textContent='—';
    el('status').textContent='Carregant observacions…';
    el('legend-title').textContent='Precipitació observada';
    el('scale').hidden=true;
    el('phase-key').hidden=true;
    for(const id of ['hour','play','prev','next']) el(id).disabled=true;
    try {
      const length=await radar.load();
      if(request!==radarRequest)return;
      radarLength=length;
      index=length-1;
      el('hour').max=String(length+24);
      el('boundary').hidden=false;
      el('boundary').style.setProperty('--now',((length-.5)/(length+24)*100)+'%');
      drawRadar();
    }catch{
      if(request!==radarRequest)return;
      radarLength=0;
      el('status').textContent='Radar temporalment no disponible';
      el('retry').hidden=false;
    }
  }
  function switchModel(){
    clearPick();
    if(joined){radarRequest++;radar.clear();radarActive=false;joined=false;index=forecastIndex;variable=priorVariable;el('boundary').hidden=true;el('hour').max='24';
      for(const b of el('variables').children)b.setAttribute('aria-pressed',String(b.dataset.variable===variable));
    }
    const grouped = ['combined','agreement'].includes(el('model').value);
    if (!grouped) lastIndividual=el('model').value;
    setModeUI(grouped?'consensus':'models');
    showCityTemperatures(null);synopticLayer.show(null);
    el('curtain').hidden=true;el('frame-time').hidden=true;
    stop();regional.clear();nativeKey='';loadingImage=false;
    if(native())samples.remove();
    else samples.addTo(map);
    legend();
    if(!native() && datasets.size<MODELS.length && !pending)void load();
    else draw();
  }
  el('mode-radar').onclick=openRadar;
  el('mode-models').onclick=()=>{el('model').value=lastIndividual;switchModel();};
  el('mode-consensus').onclick=()=>{el('model').value='combined';switchModel();};
  el('model').addEventListener('change',switchModel);
  el('variables').addEventListener('click',event=>{
    const button = event.target.closest('[data-variable]');
    if (!button) return;
    if(variable===button.dataset.variable)return;
    if(native()){showCityTemperatures(null);synopticLayer.show(null);regional.clear();nativeKey='';el('curtain').hidden=true;el('frame-time').hidden=true;}
    variable = button.dataset.variable;
    for(const b of el('variables').children) b.setAttribute('aria-pressed',String(b===button));
    legend(); draw();
  });
  function position(){return joined && !radarActive ? index+radarLength : index;}
  function seek(value){
    if(!joined){index=value;draw();return;}
    if(value<radarLength){
      if(!radarActive){clearPick();samples.remove();showCityTemperatures(null);synopticLayer.show(null);}
      radarActive=true;setModeUI('radar');el('legend-title').textContent='Precipitació observada';el('scale').hidden=el('phase-key').hidden=true;
      index=value;drawRadar();return;
    }
    if(radarActive){clearPick();radar.hide();radarActive=false;el('model').value='combined';variable='rain';samples.addTo(map);legend();}
    setModeUI('radar');el('title').textContent='Previsió de precipitació';el('mode-help').textContent='Mediana de les famílies disponibles · després del radar.';el('time-label').textContent='Hora de previsió';
    index=value-radarLength;
    if(!pending && !datasets.size)void load();else draw();
  }
  el('play').onclick=()=>{
    if(timer){stop();return;}
    el('play').textContent='Ⅱ';el('play').setAttribute('aria-pressed','true');el('play').setAttribute('aria-label','Atura la reproducció');
    timer=setInterval(()=>{if(!loadingImage)seek((position()+1)%(Number(el('hour').max)+1));},1000);
  };
  el('hour').oninput=()=>{stop();seek(Number(el('hour').value));};
  el('prev').onclick=()=>{stop();seek(Math.max(0,position()-1));};
  el('next').onclick=()=>{stop();seek(Math.min(Number(el('hour').max),position()+1));};
  el('divider').oninput=event=>{
    const value=Number(event.target.value);
    regional.setSplit(value);
    showCityTemperatures(displayedCityHour);
    el('curtain').style.setProperty('--split',value+'%');
    event.target.setAttribute('aria-valuetext','AROME '+value+' %, ARPEGE '+(100-value)+' %');
  };
  el('center').onclick=setExtent;
  el('retry').onclick=()=>{if(radarActive){void openRadar();return;}if(native()){nativeKey='';draw();}else void load();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  switchModel();
}
el('info').onclick=()=>el('method').showModal();
start();
