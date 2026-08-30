import { CATALONIA_COUNTY_PATHS } from '../worker/catalonia-counties.js';

const AROME_ENDPOINT='https://api.open-meteo.com/v1/meteofrance';
const BEST_MATCH_ENDPOINT='https://api.open-meteo.com/v1/forecast';
const AROME_MODEL='meteofrance_arome_france_hd';
const STATION={latitude:41.6906,longitude:2.4890,name:'Sant Celoni'};
const MAP_BOUNDS={minLongitude:.15908081604079632,maxLongitude:3.3324892923870486,minLatitude:40.522936934580386,maxLatitude:42.86131820731102,width:500,height:420,padding:4};
const REGION={minLatitude:41.15,maxLatitude:42.35,minLongitude:1.55,maxLongitude:3.15,rows:7,columns:9};

const finite=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;' }[char]));
const number=(value,digits=1)=>finite(value)===null?'—':Number(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});

export function rainMapGrid(){
  const points=[{...STATION,station:true}];
  for(let row=0;row<REGION.rows;row++){
    const latitude=REGION.maxLatitude-row*(REGION.maxLatitude-REGION.minLatitude)/(REGION.rows-1);
    for(let column=0;column<REGION.columns;column++){
      const longitude=REGION.minLongitude+column*(REGION.maxLongitude-REGION.minLongitude)/(REGION.columns-1);
      points.push({latitude:Number(latitude.toFixed(4)),longitude:Number(longitude.toFixed(4)),station:false});
    }
  }
  return points;
}

export function rainFrameHours(slot){
  return slot==='vespre'?[6,12,18,23]:[9,13,17,21];
}

export function rainColor(value){
  const rain=Math.max(0,finite(value)||0);
  if(rain<.05)return {color:'#4aa7c7',opacity:0};
  if(rain<.2)return {color:'#55b9d7',opacity:.26};
  if(rain<.5)return {color:'#45c8d5',opacity:.4};
  if(rain<1)return {color:'#39d09b',opacity:.52};
  if(rain<2)return {color:'#7fd050',opacity:.62};
  if(rain<5)return {color:'#d6cf45',opacity:.72};
  if(rain<10)return {color:'#ffad42',opacity:.8};
  if(rain<20)return {color:'#f26657',opacity:.86};
  return {color:'#d747b4',opacity:.9};
}

export function projectRainPoint({latitude,longitude}){
  const longitudeRange=MAP_BOUNDS.maxLongitude-MAP_BOUNDS.minLongitude;
  const latitudeRange=MAP_BOUNDS.maxLatitude-MAP_BOUNDS.minLatitude;
  const scale=Math.min((MAP_BOUNDS.width-MAP_BOUNDS.padding*2)/longitudeRange,(MAP_BOUNDS.height-MAP_BOUNDS.padding*2)/latitudeRange);
  const offsetX=(MAP_BOUNDS.width-longitudeRange*scale)/2;
  const offsetY=(MAP_BOUNDS.height-latitudeRange*scale)/2;
  return {
    x:offsetX+(longitude-MAP_BOUNDS.minLongitude)*scale,
    y:offsetY+(MAP_BOUNDS.maxLatitude-latitude)*scale,
  };
}

function targetTimes(slot,targetDate){
  return rainFrameHours(slot).map(hour=>`${targetDate}T${String(hour).padStart(2,'0')}:00`);
}

function normalizeLocations(payload,expected){
  const locations=Array.isArray(payload)?payload:[payload];
  if(locations.length!==expected)throw new Error(`La graella de pluja ha retornat ${locations.length} punts de ${expected}.`);
  return locations;
}

async function requestRainGrid(endpoint,points,times,options={}){
  const params=new URLSearchParams({
    latitude:points.map(point=>point.latitude).join(','),
    longitude:points.map(point=>point.longitude).join(','),
    hourly:'precipitation',
    timezone:'Europe/Madrid',
    forecast_days:'3',
    ...(options.model?{models:options.model}:{}),
  });
  const response=await fetch(`${endpoint}?${params}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`${options.label||'Model de pluja'}: HTTP ${response.status}`);
  const locations=normalizeLocations(await response.json(),points.length);
  const frames=times.map(time=>({
    time,
    values:locations.map(location=>{
      const index=Array.isArray(location.hourly?.time)?location.hourly.time.indexOf(time):-1;
      return index>=0?Math.max(0,finite(location.hourly?.precipitation?.[index])||0):null;
    }),
  }));
  if(frames.every(frame=>frame.values.every(value=>value===null)))throw new Error(`${options.label||'Model de pluja'} sense hores compatibles.`);
  return {frames,points,source:options.label,sourceDetail:options.detail,spatial:true};
}

function pointFallback(times,hourly){
  const values=times.map(time=>{
    const index=Array.isArray(hourly?.time)?hourly.time.indexOf(time):-1;
    return index>=0?Math.max(0,finite(hourly?.precipitation?.[index])||0):null;
  });
  const points=rainMapGrid();
  return {
    frames:times.map((time,index)=>({time,values:points.map((_,pointIndex)=>pointIndex===0?values[index]:null)})),
    points,
    source:'Open-Meteo Best Match',
    sourceDetail:'evolució puntual de reserva',
    spatial:false,
  };
}

export async function fetchRainEvolution({slot,targetDate,hourlyFallback}){
  const points=rainMapGrid();
  const times=targetTimes(slot,targetDate);
  try{
    return await requestRainGrid(AROME_ENDPOINT,points,times,{model:AROME_MODEL,label:'AROME France HD',detail:'model d’alta resolució · 1,5 km'});
  }catch(aromeError){
    console.warn(`AROME HD no disponible: ${aromeError.message}`);
  }
  try{
    return await requestRainGrid(BEST_MATCH_ENDPOINT,points,times,{label:'Open-Meteo Best Match',detail:'millor model disponible per punt'});
  }catch(bestMatchError){
    console.warn(`Mapa Best Match no disponible: ${bestMatchError.message}`);
  }
  return pointFallback(times,hourlyFallback);
}

function timeLabel(time){
  return `${String(time||'').slice(11,16)} h`;
}

function frameSummary(evolution,frame){
  const station=finite(frame.values?.[0]);
  const regional=frame.values?.slice(1).map(finite).filter(value=>value!==null)||[];
  const maximum=regional.length?Math.max(...regional):station;
  if((maximum||0)<.05&&(station||0)<.05)return {headline:'Sense pluja destacable',detail:'No s’aprecia precipitació significativa en aquesta franja.'};
  return {headline:`Màxim a la zona: ${number(maximum)} mm/h`,detail:`Sant Celoni: ${number(station)} mm/h`};
}

export function rainMapContent(evolution,frameIndex){
  const frame=evolution.frames[frameIndex];
  if(!frame)throw new Error(`Fotograma de pluja ${frameIndex} inexistent.`);
  const projected=evolution.points.map(projectRainPoint);
  const precipitation=evolution.points.slice(1).map((point,index)=>{
    const value=finite(frame.values[index+1]);
    if(value===null)return '';
    const {color,opacity}=rainColor(value);
    if(opacity===0)return '';
    const projectedPoint=projected[index+1];
    const radius=10+Math.min(10,Math.sqrt(Math.max(0,value))*3.2);
    return `<circle cx="${projectedPoint.x.toFixed(1)}" cy="${projectedPoint.y.toFixed(1)}" r="${radius.toFixed(1)}" fill="${color}" fill-opacity="${opacity}" filter="url(#rain-blur)"/>`;
  }).join('');
  const counties=CATALONIA_COUNTY_PATHS.map(county=>`<path d="${county.path}" fill="#0b2a21" fill-opacity=".72" stroke="${county.id===41?'#f7fcf9':'#79aa95'}" stroke-opacity="${county.id===41?'.96':'.38'}" stroke-width="${county.id===41?'1.5':'.55'}"/>`).join('');
  const station=projected[0];
  const stationRain=finite(frame.values[0]);
  const stationTheme=rainColor(stationRain);
  const summary=frameSummary(evolution,frame);
  const pills=evolution.frames.map((item,index)=>{
    const active=index===frameIndex;
    return `<rect x="${76+index*232}" y="1430" width="208" height="68" rx="34" fill="${active?'#65c7e8':'#071712'}" fill-opacity="${active?'.9':'.72'}" stroke="#65c7e8" stroke-opacity="${active?'1':'.32'}"/><text x="${180+index*232}" y="1475" text-anchor="middle" fill="${active?'#071712':'#b8cdc3'}" font-family="DejaVu Sans" font-size="27" font-weight="800">${esc(timeLabel(item.time))}</text>`;
  }).join('');
  const spatialNote=evolution.spatial?'Pluja horària estimada sobre el nord-est de Catalunya':'Reserva puntual: només Sant Celoni';
  return `<rect x="76" y="604" width="928" height="750" rx="42" fill="#061712" fill-opacity=".72" stroke="#65c7e8" stroke-opacity=".42"/>
  <svg x="92" y="620" width="896" height="620" viewBox="225 75 275 225" preserveAspectRatio="xMidYMid meet">
    <defs><filter id="rain-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <rect x="225" y="75" width="275" height="225" rx="8" fill="#10231f"/>
    ${counties}${precipitation}
    <g fill="none" stroke="#cfe4da" stroke-opacity=".6" stroke-width=".55">${CATALONIA_COUNTY_PATHS.map(county=>`<path d="${county.path}"/>`).join('')}</g>
    <circle cx="${station.x.toFixed(1)}" cy="${station.y.toFixed(1)}" r="7" fill="${stationTheme.opacity?stationTheme.color:'#f7fcf9'}" fill-opacity=".35"/>
    <circle cx="${station.x.toFixed(1)}" cy="${station.y.toFixed(1)}" r="2.8" fill="#f7fcf9" stroke="#071712" stroke-width="1"/>
    <text x="${(station.x+7).toFixed(1)}" y="${(station.y-4).toFixed(1)}" fill="#f7fcf9" font-family="DejaVu Sans" font-size="5.8" font-weight="800" paint-order="stroke" stroke="#071712" stroke-width="2">SANT CELONI</text>
  </svg>
  <rect x="104" y="1250" width="872" height="80" rx="25" fill="#071712" fill-opacity=".9"/>
  <text x="132" y="1284" fill="#65c7e8" font-family="DejaVu Sans" font-size="25" font-weight="800">${esc(summary.headline)}</text>
  <text x="132" y="1315" fill="#b8cdc3" font-family="DejaVu Sans" font-size="21">${esc(summary.detail)} · ${esc(spatialNote)}</text>
  ${pills}
  <g transform="translate(104 1540)"><text fill="#b8cdc3" font-family="DejaVu Sans" font-size="23">mm/h</text>${[['#55b9d7','0,1'],['#39d09b','1'],['#d6cf45','5'],['#f26657','10'],['#d747b4','20+']].map(([color,label],index)=>`<circle cx="${115+index*142}" cy="-7" r="10" fill="${color}"/><text x="${135+index*142}" fill="#d8e7e0" font-family="DejaVu Sans" font-size="22">${label}</text>`).join('')}</g>`;
}

export function rainEvolutionFooter(evolution){
  if(evolution.source==='AROME France HD')return 'AROME HD via Open-Meteo · 1,5 km · orientatiu';
  return `${evolution.source} · estimació orientativa`;
}
