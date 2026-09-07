import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATALONIA_COUNTY_PATHS } from '../worker/catalonia-counties.js';
import { projectRainPoint, rainMapGrid } from './youtube-rain-map.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const INPUT=resolve(ROOT,process.env.FORECAST_EPISODE_INPUT||'build/forecast-episode/input.json');
const OUTPUT=resolve(ROOT,process.env.FORECAST_EPISODE_OUTPUT||'build/forecast-episode');
const MODEL_ENDPOINTS={ecmwf:'/v1/ecmwf',gfs:'/v1/gfs',icon:'/v1/dwd-icon'};
const MODEL_LABELS={ecmwf:'ECMWF',gfs:'GFS',icon:'ICON'};
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
const finite=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);

export function episodeVariable(kind){
  if(kind==='cooling'||kind==='warming')return {api:'temperature_2m',unit:'°C respecte del dia anterior',label:'Canvi de temperatura'};
  if(kind==='wind')return {api:'wind_gusts_10m',unit:'km/h',label:'Ratxa prevista'};
  return {api:'precipitation',unit:'mm/h',label:kind==='storm'?'Senyal de tempesta':'Pluja prevista'};
}

export function episodeFrameTimes(targetDate){
  return [6,12,18,23].map(hour=>`${targetDate}T${String(hour).padStart(2,'0')}:00`);
}

function previousDay(time){
  const date=new Date(`${time}:00Z`);date.setUTCDate(date.getUTCDate()-1);return date.toISOString().slice(0,16);
}

function normalizeLocations(payload,expected){
  const locations=Array.isArray(payload)?payload:[payload];
  if(locations.length!==expected)throw new Error(`El model ha retornat ${locations.length} punts de ${expected}.`);
  return locations;
}

export async function fetchEpisodeGrid(episode,fetcher=fetch){
  const points=rainMapGrid();
  const times=episodeFrameTimes(episode.targetDate);
  const variable=episodeVariable(episode.kind);
  const candidates=(episode.agreeingModels||[]).filter(name=>MODEL_ENDPOINTS[name]);
  const errors=[];
  for(const model of candidates){
    try{
      const params=new URLSearchParams({
        latitude:points.map(point=>point.latitude).join(','),longitude:points.map(point=>point.longitude).join(','),
        hourly:variable.api,timezone:'Europe/Madrid',forecast_days:'7',past_days:'1',
      });
      const response=await fetcher(`https://api.open-meteo.com${MODEL_ENDPOINTS[model]}?${params}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const locations=normalizeLocations(await response.json(),points.length);
      const frames=times.map(time=>({time,values:locations.map(location=>{
        const index=location.hourly?.time?.indexOf(time)??-1;
        const current=index>=0?finite(location.hourly?.[variable.api]?.[index]):null;
        if(episode.kind!=='cooling'&&episode.kind!=='warming')return current;
        const previousIndex=location.hourly?.time?.indexOf(previousDay(time))??-1;
        const previous=previousIndex>=0?finite(location.hourly?.[variable.api]?.[previousIndex]):null;
        return current===null||previous===null?null:current-previous;
      })}));
      if(frames.every(frame=>frame.values.every(value=>value===null)))throw new Error('sense dades horàries');
      return {model,modelLabel:MODEL_LABELS[model],points,frames,variable};
    }catch(error){errors.push(`${MODEL_LABELS[model]}: ${error.message}`);}
  }
  throw new Error(`Cap model coincident ha retornat una graella real: ${errors.join('; ')}`);
}

export function episodeColor(kind,value){
  const number=finite(value);
  if(number===null)return {color:'#4f7568',opacity:0};
  if(kind==='cooling')return {color:number<=-10?'#3157d7':number<=-7?'#4389e8':number<=-4?'#65c7e8':'#8ccfc0',opacity:Math.min(.9,.28+Math.abs(number)/16)};
  if(kind==='warming')return {color:number>=10?'#dd3f42':number>=7?'#f26a4b':number>=4?'#f5ad5b':'#e5cd78',opacity:Math.min(.9,.28+Math.abs(number)/16)};
  if(kind==='wind')return {color:number>=80?'#d747b4':number>=65?'#f26657':number>=45?'#ffad42':'#76cbd8',opacity:number<20?0:Math.min(.9,.25+number/120)};
  return {color:number>=20?'#d747b4':number>=10?'#f26657':number>=5?'#ffad42':number>=1?'#57ce91':'#55b9d7',opacity:number<.05?0:Math.min(.9,.3+number/30)};
}

function textLines(text,max=28){
  const words=String(text||'').trim().split(/\s+/);const lines=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>max&&line){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);return lines;
}

function lineSvg(text,{x=76,y=500,size=64,color='#f4faf7',weight=800,max=28,gap=1.18}={}){
  return textLines(text,max).map((line,index)=>`<text x="${x}" y="${y+index*size*gap}" fill="${color}" font-family="DejaVu Sans" font-size="${size}" font-weight="${weight}">${esc(line)}</text>`).join('');
}

function shell({kicker,title,content,footer}){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#031812"/><defs><radialGradient id="glow"><stop stop-color="#276c55" stop-opacity=".68"/><stop offset="1" stop-color="#031812" stop-opacity="0"/></radialGradient></defs><circle cx="910" cy="210" r="560" fill="url(#glow)"/><rect x="56" y="54" width="968" height="1812" rx="54" fill="#06231a" fill-opacity=".72" stroke="#4c8c73" stroke-opacity=".42"/><text x="82" y="126" fill="#7fdba7" font-family="DejaVu Sans" font-size="25" font-weight="800" letter-spacing="4">${esc(kicker.toUpperCase())}</text>${lineSvg(title,{x:82,y:235,size:72,max:24})}${content}<line x1="82" y1="1760" x2="998" y2="1760" stroke="#6ba78d" stroke-opacity=".45"/><text x="82" y="1815" fill="#a9c0b6" font-family="DejaVu Sans" font-size="22">${esc(footer)}</text><text x="998" y="1815" text-anchor="end" fill="#7fdba7" font-family="DejaVu Sans" font-size="22" font-weight="800">meteo.fontanillas.cat</text></svg>`;
}

function introSvg(payload){
  const episode=payload.episode;const date=String(episode.dateLabel||episode.targetDate);
  return shell({kicker:'Canvi de temps en seguiment',title:episode.title,content:`${lineSvg(episode.lead||payload.draft?.title,{x:82,y:620,size:47,color:'#8ce0ae',max:31})}<rect x="82" y="1000" width="916" height="285" rx="40" fill="#061712" stroke="#65a989"/><text x="126" y="1075" fill="#a9c0b6" font-family="DejaVu Sans" font-size="27">HORITZÓ DEL CANVI</text>${lineSvg(date,{x:126,y:1160,size:48,max:28})}<text x="82" y="1450" fill="#a9c0b6" font-family="DejaVu Sans" font-size="29">Una lectura prudent dels models globals.</text>`,footer:'Font: ECMWF, GFS i ICON via Open-Meteo · predicció orientativa'});
}

function agreementSvg(payload){
  const episode=payload.episode;const rows=(episode.models||[]).map((model,index)=>{
    const agreed=(episode.agreeingModels||[]).includes(model.name);const day=model.days?.find(item=>item.date===episode.targetDate)||{};
    const detail=episode.kind==='wind'?`${finite(day.gust)?.toFixed(0)??'—'} km/h`:episode.kind==='rain'||episode.kind==='storm'?`${finite(day.rain)?.toFixed(1)??'—'} mm · ${finite(day.rainProbability)?.toFixed(0)??'—'}%`:`${finite(day.min)?.toFixed(1)??'—'} / ${finite(day.max)?.toFixed(1)??'—'} °C`;
    return `<rect x="82" y="${650+index*190}" width="916" height="150" rx="32" fill="#071712" stroke="${agreed?'#7fdba7':'#496b5d'}"/><circle cx="140" cy="${725+index*190}" r="17" fill="${agreed?'#7fdba7':'#496b5d'}"/><text x="184" y="${710+index*190}" fill="#f4faf7" font-family="DejaVu Sans" font-size="38" font-weight="800">${MODEL_LABELS[model.name]||esc(model.name)}</text><text x="184" y="${758+index*190}" fill="#a9c0b6" font-family="DejaVu Sans" font-size="26">${esc(detail)}</text>`;
  }).join('');
  return shell({kicker:'No ens quedem amb un sol mapa',title:`Coincideixen ${episode.agreement} de ${episode.totalModels} models`,content:`${lineSvg('La coincidència dona confiança, però no elimina la incertesa.',{x:82,y:505,size:34,color:'#a9c0b6',max:44})}${rows}`,footer:'Comparació automàtica de models · actualització: '+String(episode.issuedAt||'').slice(0,16).replace('T',' ')});
}

function mapSvg(payload,grid,index){
  const episode=payload.episode;const frame=grid.frames[index];
  const counties=CATALONIA_COUNTY_PATHS.map(county=>`<path d="${county.path}" fill="#102b22" stroke="#8cb9a5" stroke-opacity=".55" stroke-width=".65"/>`).join('');
  const layers=grid.points.map((point,pointIndex)=>{const theme=episodeColor(episode.kind,frame.values[pointIndex]);if(!theme.opacity)return '';const projected=projectRainPoint(point);return `<circle cx="${projected.x.toFixed(1)}" cy="${projected.y.toFixed(1)}" r="16" fill="${theme.color}" fill-opacity="${theme.opacity.toFixed(2)}" filter="url(#blur)"/>`;}).join('');
  const valid=frame.values.map(finite).filter(value=>value!==null);const median=valid.length?valid.sort((a,b)=>a-b)[Math.floor(valid.length/2)]:null;
  const time=frame.time.slice(11,16);const value=median===null?'—':`${median>0&&['warming'].includes(episode.kind)?'+':''}${median.toFixed(1)} ${grid.variable.unit}`;
  const map=`<rect x="82" y="540" width="916" height="845" rx="42" fill="#061712" stroke="#65a989"/><svg x="100" y="590" width="880" height="660" viewBox="0 35 510 370" preserveAspectRatio="xMidYMid meet"><defs><filter id="blur" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="7"/></filter></defs>${counties}${layers}<g fill="none" stroke="#dbece4" stroke-opacity=".52" stroke-width=".55">${CATALONIA_COUNTY_PATHS.map(county=>`<path d="${county.path}"/>`).join('')}</g></svg><rect x="120" y="1265" width="840" height="88" rx="30" fill="#031812"/><text x="155" y="1322" fill="#f4faf7" font-family="DejaVu Sans" font-size="30" font-weight="800">${esc(grid.variable.label)} · ${esc(value)}</text><text x="82" y="1495" fill="#7fdba7" font-family="DejaVu Sans" font-size="35" font-weight="800">${grid.modelLabel} · ${time} h</text>${lineSvg('Mira l’evolució, no un fotograma aïllat.',{x:82,y:1570,size:30,color:'#a9c0b6',max:45})}`;
  return shell({kicker:`Evolució prevista · ${index+1} de 4`,title:episode.title,content:map,footer:`${grid.modelLabel} via Open-Meteo · no és un avís oficial`});
}

function outroSvg(payload){
  const episode=payload.episode;
  return shell({kicker:'Ho continuarem seguint',title:'Què cal retenir?',content:`${lineSvg(episode.detail||'Els models assenyalen un canvi, encara amb marge per afinar.',{x:82,y:620,size:42,color:'#8ce0ae',max:36})}<rect x="82" y="1120" width="916" height="270" rx="42" fill="#071712" stroke="#f2c36b"/><text x="126" y="1200" fill="#f2c36b" font-family="DejaVu Sans" font-size="28" font-weight="800">IMPORTANT</text>${lineSvg('És una predicció de models, no un avís oficial.',{x:126,y:1280,size:35,max:38})}<text x="82" y="1540" fill="#a9c0b6" font-family="DejaVu Sans" font-size="29">Nova actualització si el senyal es confirma o canvia.</text>`,footer:'Avisos oficials: Meteocat i Protecció Civil'});
}

export async function buildForecastEpisodeVideo(input,{fetcher=fetch}={}){
  const episode=input?.episode;
  if(!episode?.kind||!episode?.targetDate||!Array.isArray(episode.agreeingModels))throw new Error('Les dades de l’episodi són incompletes.');
  const grid=await fetchEpisodeGrid(episode,fetcher);
  await mkdir(OUTPUT,{recursive:true});
  const slides=[introSvg(input),agreementSvg(input),...grid.frames.map((_,index)=>mapSvg(input,grid,index)),outroSvg(input)];
  await Promise.all(slides.map((svg,index)=>writeFile(resolve(OUTPUT,`frame-${index+1}.svg`),svg)));
  const metadata={title:`${episode.title} · ${episode.dateLabel||episode.targetDate} #Shorts`.slice(0,100),description:`${input.draft?.body||''}\n\nDades de models: ECMWF, GFS i ICON via Open-Meteo. Predicció orientativa; no és un avís oficial.\n${input.draft?.sourceUrl||'https://meteo.fontanillas.cat/?page=prediccio'}`.trim(),tags:['meteo','Sant Celoni','Baix Montseny','predicció','models meteorològics','canvi de temps']};
  await writeFile(resolve(OUTPUT,'metadata.json'),JSON.stringify(metadata,null,2));
  return {slides:grid.frames.length+3,model:grid.model,metadata};
}

async function main(){const input=JSON.parse(await readFile(INPUT,'utf8'));const result=await buildForecastEpisodeVideo(input);console.log(JSON.stringify(result));}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error);process.exitCode=1;});
