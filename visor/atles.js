import {productReading,rainTiming} from './forecast-products.js';
import {nearStation,stationButton} from './station-point.js';
import {forecastRequest} from './forecast-request.js';
import {pointOutlook} from './point-outlook.js';
import {stationSkill} from './station-skill.js';
import { radarHistory } from './radar.js';
import { contours, synoptic } from './synoptic.js';
import { regionalLayer } from './regional.js';
import { interpolateCell, paintField, palettes } from './color-field.js';
import { MODELS, MODEL_VARIABLES } from './models.js';
import { independentModels, summarize } from './consensus.js';

const el = id => document.getElementById(id);
let coordinates = [];
const query=new URLSearchParams(location.search);
const local=query.get('zona')==='montseny';
let detailStep={arome:.01,arpege:.1}[query.get('malla')];
let detail=Boolean(detailStep && query.has('lat') && query.has('lon') && +query.get('lat')>=40.5 && +query.get('lat')<=42.9 && +query.get('lon')>=0 && +query.get('lon')<=3.6);
function gridAxis(key) {
  const middle=Math.round(Number(query.get(key))/detailStep);
  return Array.from({length:9},(_,i)=>Number(((middle+i-4)*detailStep).toFixed(2)));
}
const openOutlook=pointOutlook();
stationSkill();
let latitudes = detail?gridAxis('lat'):local ? [41.57,41.65,41.73,41.81,41.89] : [40.5,40.9,41.3,41.7,42.1,42.5,42.9];
let longitudes = detail?gridAxis('lon'):local ? [2.27,2.38,2.49,2.60,2.71] : [0,0.6,1.2,1.8,2.4,3,3.6];
for(const latitude of latitudes){
  for(const longitude of longitudes)coordinates.push([latitude,longitude]);
}
let datasets = new Map();
const initialGrid={coordinates,latitudes,longitudes,datasets,detail,detailStep};
let generation=0;
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
let footprintLayer, snowLayer, pin, pointPopup, pick=null;
function sourceAt(location) {
  const choice=el('model').value;
  if(!native()) return choice;
  const left=map.latLngToContainerPoint(location).x<map.getSize().x*Number(el('divider').value)/100;
  return choice==='native-arome' || (choice==='native-compare' && left) ? 'AROME HD' : 'ARPEGE Europa';
}
const period=()=>!joined && variable==='rain' && !agreement() && !originalImage()?Number(el('period').value):1;
const field=()=>!joined && variable==='rain' && !agreement() && !originalImage()?el('hydro').value:variable==='wind' && !originalImage()?el('wind-kind').value:variable;
const timing=()=>agreement() && variable==='rain' && el('discrepancy').value==='timing';
const productUnit=()=>field()==='snow'?'cm':MODEL_VARIABLES[variable].unit;
const productLabel=()=>field()==='snow'?'Neu acumulada':field()==='gust'?'Ratxa a 10 m':MODEL_VARIABLES[variable].label;
const readingCache=new WeakMap();
function sample(point,model,hour){
  const row=datasets.get(model.name)?.[point];
  if(!row)return null;
  const hours=period(),key=hour+'|'+hours;
  let saved=readingCache.get(row);
  if(saved?.key!==key || saved.model!==model){
    saved={key,model,reading:productReading(row,model,hour,hours)};readingCache.set(row,saved);
  }
  return saved.reading;
}
function snowAt(point,hour,choice) {
  const readings=MODELS.map(model=>sample(point,model,hour)).filter(Boolean);
  const grouped=choice==='combined' || choice==='agreement';
  const available=(grouped?independentModels(readings,'snow'):readings.filter(r=>r.model.name===choice)).filter(r=>Number.isFinite(r.snow));
  if(!available.length) return {symbol:'?',text:'Fase de precipitació desconeguda'};
  const snow=available.filter(r=>r.snow>0);
  const disputed=grouped && snow.length && available.some(r=>r.snow===0 && r.rain>0);
  if(disputed)return {symbol:'▨',text:'Fase discrepant · neu en '+snow.length+'/'+available.length+' famílies amb dades de neu'};
  if(!snow.length){
    const missing=(grouped?independentModels(readings,'rain'):readings.filter(r=>r.model.name===choice)).some(r=>r.rain>0 && !Number.isFinite(r.snow));
    return missing?{symbol:'?',text:'Dades de fase incompletes'}:{symbol:'●',text:'Sense neu prevista a la mostra'};
  }
  return {symbol:'❄',text:grouped ? 'Neu prevista per '+snow.length+'/'+available.length+' famílies amb dades' : 'Neu prevista · '+numbers[1].format(snow[0].snow)+' cm en '+period()+' h'};
}
const familyColors={ecmwf:'#102845',gfs:'#9c1740',icon:'#00724c',meteofrance:'#6c2394',gem:'#995600',ukmo:'#056b88'};
function rainFootprints(hour){
  footprintLayer.clearLayers();
  const key=el('footprint-key');
  key.hidden=!hour || radarActive || !(variable==='rain' && agreement() && el('discrepancy').value==='footprint');
  if(key.hidden)return;
  const cells=coordinates.map((_,i)=>independentModels(MODELS.map(m=>sample(i,m,hour)).filter(Boolean),'rain'));
  const names=[];
  for(const [family,color] of Object.entries(familyColors)){
    const values=cells.map(rows=>rows.find(r=>r.model.family===family)?.rain);
    const paths=contours(coordinates,values,longitudes.length,1,.2).get(.2);
    if(!paths)continue;
    const opts={interactive:false,pane:'synoptic'};
    L.polyline(paths,{...opts,color:'white',weight:4,opacity:.8}).addTo(footprintLayer);
    L.polyline(paths,{...opts,color,weight:2}).addTo(footprintLayer);
    const label=document.createElement('span');
    label.style.setProperty('--line',color);label.textContent=family==='meteofrance'?'Météo-France':family.toUpperCase();names.push(label);
  }
  key.replaceChildren(names.length?'Contorn de 0,2 mm/h ':'Cap contorn de 0,2 mm/h a les cel·les disponibles',...names);
}
function refreshSnow(hour) {
  snowLayer.clearLayers();
  el('phase-key').firstChild.textContent=field()==='snow'?'Color · neu acumulada':'Color · precipitació total';
  el('phase-key').hidden=variable!=='rain' || radarActive || agreement();
  if(!hour || variable!=='rain' || radarActive || agreement())return;
  coordinates.forEach((coords,i)=>{
    const choice=sourceAt(coords);
    const phase=snowAt(i,hour,choice);
    if(phase.symbol!=='❄' && phase.symbol!=='▨'){
      const precipitation=MODELS.some(m=>{const r=sample(i,m,hour);return (choice==='combined'?m.family:m.name===choice) && r?.rain>0;})?1:0;
      if(!(precipitation>0))return;
    }
    L.marker(coords,{interactive:false,keyboard:false,pane:'placeLabels',icon:L.divIcon({
      className:'phase-symbol '+(phase.symbol==='▨'?'phase-split':phase.symbol==='❄'?'phase-snow':phase.symbol==='●'?'phase-rain':'phase-unknown'),html:phase.symbol,iconSize:[17,17],iconAnchor:[8,8]
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
  if(pick.inside && !radarActive && displayedCityHour && (!originalImage() || variable==='rain')) {
    const choice=sourceAt(pick.location);
    body.append(document.createElement('hr'), 'Mostra de la graella més propera',popupContent(pick.nearest,pointReading(pick.nearest,displayedCityHour,choice)));
    if(variable==='rain')body.append(snowAt(pick.nearest,displayedCityHour,choice).text);
  }
  const outlook=document.createElement('button');
  outlook.textContent='Meteograma · 24 h';outlook.className='outlook-action';
  outlook.onclick=()=>{
    stop();
    const exact=pick.location.distanceTo(coordinates[pick.nearest])<1;
    const cached=exact?MODELS.map(m=>datasets.get(m.name)?.[pick.nearest]):null;
    openOutlook(pick.location,variable,firstHour,cached);
  };
  body.append(outlook);
  if(nearStation(pick.location)){const source=sourceAt(pick.location);body.append(stationButton(radarActive || source==='agreement'?'combined':source));}
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
function showCityValues(hour) {
  displayedCityHour = hour;
  refreshSnow(hour);
  rainFootprints(hour);
  updatePick();
  const selection = el('model').value;
  const divider = map.getSize().x * Number(el('divider').value) / 100;
  for (const marker of cityMarkers) {
    const label = marker.getElement().querySelector('.city-temperature');
    label.textContent = '';
    if (!hour || originalImage()) continue;
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
    const dx=(location.lng-longitudes[col])/(longitudes[col+1]-longitudes[col]);
    const dy=(location.lat-latitudes[row])/(latitudes[row+1]-latitudes[row]);
    const value=interpolateCell(...values,dx,dy);
    if(Number.isFinite(value))label.textContent=(agreement() && variable!=='rain'?'Δ ':'')+format(value)+' '+unit();
  }
}


let synopticLayer, synopticSource, regional, nativeKey='', loadingImage=false;
const native = () => el('model').value.startsWith('native-');
const originalImage = () => !joined && native() && variable!=='temperature' && el('original-image').checked;
const agreement = () => el('model').value==='agreement';
const palette = () => timing()?'timing':field()==='snow'?'snow':field()==='rain' && period()>1?'rainTotal':agreement() ? ({temperature:'spreadTemperature',wind:'spreadWind',rain:'wetFraction',clouds:'spreadClouds'})[variable] : variable;
const unit = () => timing()?'h':agreement() && variable==='rain' ? '%' : productUnit();
function setExtent() {
  if(!local && !initialGrid.detail){map.fitBounds([[41.0,0.9],[42.55,3.0]],{animate:false});return;}
  map.fitBounds(L.latLngBounds(initialGrid.coordinates),{paddingTopLeft:[30,60],paddingBottomRight:[30,64],animate:false});
}
function stop() {
  clearInterval(timer);
  timer = undefined;
  el('play').textContent = '▶';
  el('play').setAttribute('aria-pressed','false');
  el('play').setAttribute('aria-label','Reprodueix la previsió');
}
function pointReading(point, hour, selected) {
  if(selected==='agreement' && timing()){
    const {spread,families}=rainTiming(MODELS,m=>datasets.get(m.name)?.[point],hour);
    const notes=families.map(r=>r.model.name+' '+(r.onset<0?'sec':clock.format(Date.parse(hour+'Z')+r.onset*3600000)));
    return {value:spread,detail:'Primera hora humida (12 h) · '+(notes.join(' · ')||'sense sèries completes')};
  }
  const readings = MODELS.map(model => sample(point,model,hour)).filter(Boolean);
  if (selected === 'agreement') {
    const group=summarize(readings,field());
    if(group.count<2)return {detail:'Calen dues famílies amb dades'};
    const detail=variable==='rain' ? group.wet+' de '+group.count+' famílies amb ≥0,2 mm/h · '+independentModels(readings,'rain').filter(r=>Number.isFinite(r.rain)).map(r=>r.model.name+(r.rain>=.2?' humit':' sec')).join(' · ') : 'Rang entre '+group.count+' famílies';
    return {value:variable==='rain' ? 100*group.wet/group.count : group.max-group.min,detail};
  }
  if (selected === 'combined') {
    const summary = summarize(readings,field());
    return {value:summary.median, detail:summary.count ? summary.count+' famílies · interval '+format(summary.min)+' – '+format(summary.max):'Sense dades comparables'};
  }
  const value = readings.find(reading => reading.model.name === selected)?.[field()];
  return {value,detail:selected};
}
function format(value) {
  return numbers[MODEL_VARIABLES[variable].digits].format(value);
}
function legend() {
  const rain=variable==='rain', wind=variable==='wind', custom=!originalImage() && !joined;
  el('product-options').hidden=!custom || (!rain && !wind);
  el('rain-product').hidden=el('rain-period').hidden=!rain || agreement();
  el('disagreement-product').hidden=!rain || !agreement();
  el('wind-product').hidden=!wind;
  el('original-control').hidden=joined || !native() || variable==='temperature';
  if(originalImage()){
    el('legend-title').textContent=MODEL_VARIABLES[variable].label+' · Météo-France';
    el('scale').hidden=true;
    return;
  }
  el('scale').hidden=false;
  const options = palettes[palette()];
  el('legend-title').textContent = (timing()?'Diferència d’arribada':agreement()?(variable==='rain'?'Famílies amb pluja':'Diferència màx.–mín.') : productLabel())+' · '+unit()+(period()>1?' / '+period()+' h':'');
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
      const value=sample(point,model,hour)?.[field()];
      const dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.textContent=model.name;
      dd.textContent=Number.isFinite(value)?format(value)+' '+productUnit():'—';
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
    const key=[model,variable,field(),period(),hour,originalImage()].join('|');
    if(key===nativeKey)return;
    nativeKey=key;loadingImage=true;
    el('retry').hidden=true;
    const name=model==='native-compare'?'AROME i ARPEGE':model.slice(7).toUpperCase();
    el('status').textContent='Carregant '+name+' · '+clock.format(valid)+'…';
    el('play').disabled=el('hour').disabled=false;
    el('prev').disabled=index===0;el('next').disabled=index===24;
    regional.show(model.slice(7),variable,valid.toISOString(),!originalImage()).then(shown=>{
      if(shown && nativeKey===key){
        if(originalImage() && variable==='rain'){
          const names=model==='native-compare'?['AROME HD','ARPEGE Europa']:[sourceAt(map.getCenter())];
          void Promise.allSettled(MODELS.filter(m=>names.includes(m.name)).map(fetchModel)).then(()=>{
            if(nativeKey===key){refreshSnow(hour);updatePick();}
          });
        }
        el('frame-time').textContent=clock.format(valid);
        synopticLayer.show(hour);
        showCityValues(hour);
        el('frame-time').hidden=false;
        el('curtain').hidden=model!=='native-compare';
        el('status').textContent=name+' · '+productLabel()+(originalImage()?' · imatge original':' · mostreig interpolat');
      }
    }).catch(()=>{
      if(nativeKey!==key)return;
      showCityValues(null);synopticLayer.show(null);
      el('curtain').hidden=true;el('frame-time').hidden=true;stop();el('retry').hidden=false;el('status').textContent='Capa no disponible per a aquesta hora.';
    }).finally(()=>{if(nativeKey===key)loadingImage=false;});
    return;
  }
  el('frame-time').textContent=clock.format(valid);el('frame-time').hidden=false;
  synopticLayer.show(hour);
    showCityValues(hour);
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
  if(model==='combined' && variable==='rain'){
    const split=coordinates.map((_,i)=>snowAt(i,hour,model).symbol==='▨');
    const side=longitudes.length, size=raster.width/(side-1);
    context.strokeStyle='rgba(57,34,67,.65)';context.lineWidth=1;
    for(let i=0;i<split.length-side;i++){
      if(i%side===side-1 || ![i,i+1,i+side,i+side+1].every(j=>split[j]))continue;
      const x=i%side*size,y=(side-2-Math.floor(i/side))*size;
      context.save();context.beginPath();context.rect(x,y,size,size);context.clip();context.beginPath();
      for(let offset=-size;offset<size;offset+=5){context.moveTo(x+offset,y);context.lineTo(x+offset+size,y+size);}
      context.stroke();context.restore();
    }
  }
  overlay.setUrl(raster.toDataURL());
  const label = model==='combined' ? 'Consens' : agreement() ? 'Coincidència' : model;
  el('status').textContent = (waiting.size?'Límit temporal de la font · reintent en curs · ':pending?'Carregant · ':'')+label+' · interpolació visual · '+coverage+'/'+coordinates.length+' punts amb dades · '+datasets.size+'/'+MODELS.length+' sortides';
  if(field()==='rain' && !agreement() && coverage && values.every(v=>!Number.isFinite(v)||v===0)){
    el('status').textContent+=' · 0 mm a totes les mostres disponibles';
  }
  el('retry').hidden = pending > 0 || datasets.size===MODELS.length;
  el('play').disabled = el('hour').disabled = datasets.size===0;
  el('prev').disabled = (!index && !joined) || !datasets.size;
  el('next').disabled = index===24 || !datasets.size;
}
let requests = new Map();
let waiting = new Set();
function fetchModel(model) {
  if (datasets.has(model.name)) return Promise.resolve();
  if (!requests.has(model.name)) {
    const active=requests;
    active.set(model.name, readModel(model).finally(()=>active.delete(model.name)));
  }
  return requests.get(model.name);
}
async function forecastFrame(name,time,baseVariable) {
  const model = MODELS.find(item=>item.name === (name==='arome'?'AROME HD':'ARPEGE Europa'));
  await fetchModel(model);
  const hour = time.slice(0,16);
  const values = datasets.get(model.name)?.map(row=>productReading(row,model,hour,period())?.[field()]);
  if(!values)throw Error('Camp caducat');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 161;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(canvas.width,canvas.height);
  paintField(pixels.data,canvas.width,values,palette());
  if (!pixels.data.some((value,i)=>i%4===3 && value)) throw new Error('Sense dades per a la variable');
  ctx.putImageData(pixels,0,0);
  return canvas;
}
async function readModel(model) {
  const target=datasets,waitSet=waiting;
  const grid={coordinates,latitudes,longitudes,detail,detailStep};
  return readGrid(model,grid,target,waitSet);
}
async function readGrid(model,{coordinates,latitudes,longitudes,detail,detailStep},target,waitSet) {
  const params = new URLSearchParams({
    latitude:coordinates.map(p=>p[0]).join(','),longitude:coordinates.map(p=>p[1]).join(','),
    hourly:'temperature_2m,precipitation,snowfall,wind_speed_10m,wind_gusts_10m,cloud_cover',past_days:'1',timezone:'GMT',forecast_days:String(Math.min(3,model.horizon))
  });
  if (model.model) params.set('models',model.model);
  const nativeGrid=detail && model.name===(detailStep===.01?'AROME HD':'ARPEGE Europa');
  if(detail)params.set('cell_selection','nearest');
  function requestGridCoordinates(){
    params.delete('bounding_box');
    params.set('latitude',coordinates.map(p=>p[0]).join(','));
    params.set('longitude',coordinates.map(p=>p[1]).join(','));
    params.set('elevation',coordinates.map(()=>'nan').join(','));
  }
  if(detail && !nativeGrid)requestGridCoordinates();
  if(nativeGrid){
    params.delete('latitude');params.delete('longitude');
    params.set('bounding_box',[latitudes[0]-detailStep/3,longitudes[0]-detailStep/3,latitudes.at(-1)+detailStep/3,longitudes.at(-1)+detailStep/3].map(n=>n.toFixed(4)).join(','));
  }
  const base = 'https://api.open-meteo.com'+(model.model ? '/v1/forecast' : model.path);
  const request=()=>forecastRequest(base+'?'+params,{onWait:active=>{
    if(active)waitSet.add(model.name);else waitSet.delete(model.name);
    if(target===datasets)draw();
  }});
  async function fetchRows(){
    let response=await request();
    if(response.status===400 && !params.has('bounding_box')){
      params.set('hourly','temperature_2m,precipitation,snowfall,wind_speed_10m,cloud_cover');
      response=await request();
    }
    if(response.status===400 && !params.has('bounding_box')){
      params.set('hourly','temperature_2m,precipitation,wind_speed_10m,cloud_cover');
      response=await request();
    }
    if(!response.ok){
      if(response.status===400 && params.has('bounding_box'))return [];
      throw new Error('Font no disponible');
    }
    return response.json();
  }
  function alignGrid(rows){
    if(!Array.isArray(rows))return [];
    const key=(lat,lon)=>Number(lat).toFixed(3)+','+Number(lon).toFixed(3);
    const cells=new Map(rows.map(cell=>[key(cell.latitude,cell.longitude),cell]));
    return coordinates.map(([lat,lon])=>cells.get(key(lat,lon)));
  }
  let data=await fetchRows();
  if(nativeGrid){
    data=alignGrid(data);
    if(data.length!==coordinates.length || data.some(cell=>!cell)){
      requestGridCoordinates();
      data=alignGrid(await fetchRows());
      if(data.some(cell=>!cell))throw new Error('Malla incompleta');
    }
  }
  if (!Array.isArray(data) || data.length!==coordinates.length || !data.some(item=>item?.hourly?.time?.length)) throw new Error('Cobertura incompleta');
  target.set(model.name,data);
}
async function load() {
  if (pending) return;
  const version=generation;
  const missing = MODELS.filter(model=>!datasets.has(model.name));
  pending = missing.length;
  draw();
  if(detail){
    const priority=detailStep===.01?'AROME HD':'ARPEGE Europa';
    missing.sort((a,b)=>Number(b.name===priority)-Number(a.name===priority));
  }
  async function nextModel(){
    while(missing.length && generation===version){
      const model=missing.shift();
      try { await fetchModel(model); }
      catch { /* Keep the coverage counter and retry control available. */ }
      finally { if(generation===version){pending--; draw();} }
    }
  }
  await Promise.all(Array.from({length:detail?2:missing.length},nextModel));
}
function start() {
  if (!window.L) { el('status').textContent='No s’ha pogut carregar el mapa. Torna a carregar la pàgina.'; return; }
  map = L.map('map',{zoomControl:false,zoomSnap:0.25,maxZoom:15,minZoom:6});
  if(local || detail)el('model').value='combined';
  el('zone').textContent=local||detail?'Obre Catalunya':'Detall del Baix Montseny';
  el('zone').href=local||detail?'./':'?zona=montseny';
  regional=regionalLayer(map,forecastFrame,()=>[coordinates[0],coordinates.at(-1)]);
  function syncSynoptic(){
    const choice=el('model').value;
    const ref=choice==='native-compare'?'AROME HD':choice==='native-arome'?'AROME HD':choice==='native-arpege'?'ARPEGE Europa':['agreement','combined'].includes(choice)?'GFS':choice;
    el('synoptic-source').textContent='Referència '+ref+(choice==='native-compare'?' · tota la cortina':'');
    if(synopticSource===ref && synopticLayer)return;
    synopticLayer?.remove();synopticSource=ref;
    synopticLayer=synoptic(map,coordinates,longitudes.length,MODELS.find(m=>m.name===ref));
  }
  syncSynoptic();
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
  map.on('moveend zoomend resize',()=>showCityValues(displayedCityHour));
  footprintLayer=L.layerGroup().addTo(map);
  snowLayer=L.layerGroup().addTo(map);
  overlay = L.imageOverlay(raster.toDataURL(),L.latLngBounds(coordinates),{className:'forecast-field',opacity:0.74,interactive:false}).addTo(map);
  function makeMarkers(){return coordinates.map((point,i)=>{
    const icon = L.divIcon({className:'sample missing',html:'<span>—</span>',iconSize:[39,26],iconAnchor:[19,13]});
    const marker = L.marker(point,{icon});
    marker.on('add',()=>{
      const button=marker.getElement();
      button.setAttribute('aria-label','Consulta la previsió a '+point.join(', '));
      button.addEventListener('keydown',event=>{
        if(event.key!=='Enter' && event.key!==' ')return;
        event.preventDefault();
        event.stopPropagation();
        stop();
        selectPoint(marker.getLatLng());
        pointPopup?.getElement()?.querySelector('.outlook-action')?.focus({preventScroll:true});
      });
    });
    marker.addTo(map);
    marker.on('click',event=>{
      const pointer=event.originalEvent;
      selectPoint(pointer?.detail>0 ? map.mouseEventToLatLng(pointer) : marker.getLatLng());
    });
    return marker;
  });
  }
  markers=makeMarkers();
  map.on('click',event=>selectPoint(event.latlng));
  map.on('popupclose',event=>{
    event.popup.getElement()?.remove();
    if(event.popup===pointPopup){pin?.remove();pin=null;pick=null;pointPopup=null;}
  });
  MODELS.forEach(model=>el('local-models').append(new Option(model.name,model.name)));
  let samples=L.layerGroup([overlay,...markers]);
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
    samples.remove(); map.closePopup(); showCityValues(null); synopticLayer.show(null);
    setModeUI('radar');
    el('product-options').hidden=true;
    el('original-control').hidden=true;
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
  let gridTimer;
  const grids=new Map();
  function adaptiveGrid(){
    clearTimeout(gridTimer);
    if(initialGrid.detail || radarActive || joined)return;
    gridTimer=setTimeout(()=>{
      if(joined)return;
      const center=map.getCenter(), zoom=map.getZoom(), choice=el('model').value;
      let next=initialGrid;
      const inside=center.lat>=40.5 && center.lat<=42.9 && center.lng>=0 && center.lng<=3.6;
      if(inside && zoom>=10 && !originalImage()){
        const step=zoom>=12 && !['ARPEGE Europa','native-arpege'].includes(choice) ? .01 : .1;
        const origin=[center.lat,center.lng].map(n=>Math.round(n/step));
        // Keep the local window while its central cells are on screen.
        if(detail && step===detailStep && Math.abs(center.lat-latitudes[4])<2*step && Math.abs(center.lng-longitudes[4])<2*step)return;
        const key=[step,...origin].join('/');
        if(!grids.has(key)){
          const [ys,xs]=origin.map(n=>Array.from({length:9},(_,i)=>Number(((n+i-4)*step).toFixed(2))));
          if(grids.size>=3)grids.delete(grids.keys().next().value);
          grids.set(key,{detail:true,detailStep:step,latitudes:ys,longitudes:xs,coordinates:ys.flatMap(y=>xs.map(x=>[y,x])),datasets:new Map()});
        }
        next=grids.get(key);
      }
      if(next.datasets===datasets)return;
      const selected=pick?.location;
      clearPick();samples.remove();regional.clear();synopticLayer.remove();synopticLayer=null;
      generation++;pending=0;requests=new Map();waiting=new Set();
      ({coordinates,latitudes,longitudes,datasets,detail,detailStep}=next);
      nativeKey='';loadingImage=false;displayedCityHour=null;
      overlay.setBounds(L.latLngBounds(coordinates));markers=makeMarkers();
      samples=L.layerGroup([overlay,...markers]).addTo(map);
      if(native())samples.remove();
      syncSynoptic();setModeUI(['combined','agreement'].includes(choice)?'consensus':'models');
      if(selected && overlay.getBounds().contains(selected))selectPoint(selected);
      if(native())draw();else void load();
    },350);
  }
  map.on('moveend zoomend',adaptiveGrid);
  function switchModel(){
    clearPick();
    if(joined){radarRequest++;radar.clear();radarActive=false;joined=false;index=forecastIndex;variable=priorVariable;el('boundary').hidden=true;el('hour').max='24';
      for(const b of el('variables').children)b.setAttribute('aria-pressed',String(b.dataset.variable===variable));
    }
    adaptiveGrid();
    const grouped = ['combined','agreement'].includes(el('model').value);
    if (!grouped) lastIndividual=el('model').value;
    setModeUI(grouped?'consensus':'models');
    syncSynoptic();showCityValues(null);synopticLayer.show(null);
    el('curtain').hidden=true;el('frame-time').hidden=true;
    stop();regional.clear();nativeKey='';loadingImage=false;
    if(native())samples.remove();
    else samples.addTo(map);
    legend();
    if(!native() && datasets.size<MODELS.length && !pending)void load();
    else draw();
  }
  for(const id of ['period','hydro','wind-kind','discrepancy'])el(id).onchange=()=>{
    nativeKey='';legend();draw();
  };
  el('mode-radar').onclick=openRadar;
  el('mode-models').onclick=()=>{el('model').value=lastIndividual;switchModel();};
  el('mode-consensus').onclick=()=>{el('model').value='combined';switchModel();};
  el('model').addEventListener('change',switchModel);
  el('original-image').addEventListener('change',switchModel);
  el('variables').addEventListener('click',event=>{
    const button = event.target.closest('[data-variable]');
    if (!button) return;
    if(variable===button.dataset.variable)return;
    if(native()){showCityValues(null);synopticLayer.show(null);regional.clear();nativeKey='';el('curtain').hidden=true;el('frame-time').hidden=true;}
    variable = button.dataset.variable;adaptiveGrid();
    for(const b of el('variables').children) b.setAttribute('aria-pressed',String(b===button));
    legend(); draw();
  });
  function position(){return joined && !radarActive ? index+radarLength : index;}
  function seek(value){
    if(!joined){index=value;draw();return;}
    if(value<radarLength){
      if(!radarActive){clearPick();samples.remove();showCityValues(null);synopticLayer.show(null);}
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
    showCityValues(displayedCityHour);
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
