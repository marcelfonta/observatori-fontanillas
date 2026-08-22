import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const OUTPUT=resolve(ROOT,'build/youtube-short');
const API='https://fonta-meteo.marcelfonta.workers.dev';
const FORECAST='https://api.open-meteo.com/v1/forecast';
const LATITUDE=41.6906;
const LONGITUDE=2.4890;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;' }[char]));
const number=(value,digits=0)=>Number.isFinite(Number(value))?Number(value).toLocaleString('ca-ES',{maximumFractionDigits:digits,minimumFractionDigits:digits}):'—';
const dateLabel=value=>new Intl.DateTimeFormat('ca-ES',{weekday:'long',day:'numeric',month:'long',timeZone:'Europe/Madrid'}).format(new Date(`${value}T12:00:00+02:00`));

export function weatherLabel(code){
  const value=Number(code);
  if(value===0)return 'Cel serè';
  if(value<=3)return 'Núvols i clarianes';
  if(value<=48)return 'Boira o núvols baixos';
  if(value<=57)return 'Plugim';
  if(value<=67)return 'Pluja';
  if(value<=77)return 'Neu';
  if(value<=82)return 'Ruixats';
  if(value<=86)return 'Ruixats de neu';
  if(value>=95)return 'Tempesta';
  return 'Temps variable';
}

function baseSvg(title,kicker,content,footer,logoData){
  const slideIndex={'Actualització meteorològica':1,'Ara mateix':2,'Avui':3,'Demà':4,'Tendència ràpida':5}[kicker]||1;
  const progress=Array.from({length:5},(_,index)=>`<rect x="${76+index*188}" y="1684" width="164" height="8" rx="4" fill="${index<slideIndex?'#8ee7ba':'#365f50'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071812"/><stop offset=".52" stop-color="#123e31"/><stop offset="1" stop-color="#0a2028"/></linearGradient><radialGradient id="glow"><stop stop-color="#72e4ad" stop-opacity=".28"/><stop offset="1" stop-color="#72e4ad" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="url(#bg)"/><circle cx="920" cy="260" r="520" fill="url(#glow)"/><circle cx="120" cy="1700" r="420" fill="url(#glow)" opacity=".55"/>
  <image href="data:image/png;base64,${logoData}" x="74" y="72" width="126" height="126"/>
  <text x="224" y="124" fill="#f5fbf8" font-family="DejaVu Sans" font-size="42" font-weight="700">METEO FONTANILLAS</text>
  <text x="224" y="170" fill="#8ee7ba" font-family="DejaVu Sans" font-size="25" letter-spacing="3">OBSERVATORI · SANT CELONI</text>
  <text x="76" y="330" fill="#8ee7ba" font-family="DejaVu Sans" font-size="29" font-weight="700" letter-spacing="4">${esc(kicker).toUpperCase()}</text>
  <text x="76" y="440" fill="#f7fcf9" font-family="DejaVu Sans" font-size="76" font-weight="750">${esc(title)}</text>
  ${weatherGlyph(3,900,300,.34)}
  ${content}
  ${progress}
  <line x1="76" y1="1740" x2="1004" y2="1740" stroke="#8ee7ba" stroke-opacity=".35"/>
  <text x="76" y="1810" fill="#b8cdc3" font-family="DejaVu Sans" font-size="27">${esc(footer)}</text>
  <text x="1004" y="1810" text-anchor="end" fill="#8ee7ba" font-family="DejaVu Sans" font-size="27" font-weight="700">meteo.fontanillas.cat</text>
  </svg>`;
}

function weatherGlyph(code,x=790,y=510,scale=1){
  const value=Number(code);const rainy=value>=51&&value<=86;const storm=value>=95;const sunny=value<=1;
  return `<g transform="translate(${x} ${y}) scale(${scale})">${sunny||value<=3?'<circle cx="28" cy="18" r="42" fill="#f7c958"/>':''}${sunny?'':'<path d="M-24 90c-33 0-59-23-59-52 0-27 23-49 52-51 13-38 49-64 91-64 51 0 93 38 97 87 31 5 55 29 55 58 0 33-29 60-65 60H-24z" fill="#edf7f2" stroke="#8ee7ba" stroke-width="8"/>'}${rainy?'<g stroke="#77b7c8" stroke-width="12" stroke-linecap="round"><path d="M-20 155l-14 28M48 155l-14 28M116 155l-14 28"/></g>':''}${storm?'<path d="M60 132h45l-30 47h30l-62 78 17-60H25z" fill="#f7c958"/>':''}</g>`;
}

function metricCard(x,y,label,value,unit=''){
  return `<rect x="${x}" y="${y}" width="438" height="250" rx="34" fill="#071712" fill-opacity=".62" stroke="#8ee7ba" stroke-opacity=".28"/><text x="${x+38}" y="${y+68}" fill="#9cb8ab" font-family="DejaVu Sans" font-size="28">${esc(label)}</text><text x="${x+38}" y="${y+170}" fill="#f7fcf9" font-family="DejaVu Sans" font-size="68" font-weight="750">${esc(value)}<tspan fill="#8ee7ba" font-size="34"> ${esc(unit)}</tspan></text>`;
}

export function buildSlideSvg({title,kicker,content,footer,logoData='test'}){return baseSvg(title,kicker,content,footer,logoData);}

async function getJson(url){
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function main(){
  await mkdir(OUTPUT,{recursive:true});
  const params=new URLSearchParams({latitude:String(LATITUDE),longitude:String(LONGITUDE),timezone:'Europe/Madrid',forecast_days:'5',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max'});
  const [current,forecast,logo]=await Promise.all([getJson(API),getJson(`${FORECAST}?${params}`),readFile(resolve(ROOT,'assets/icons/icon-512.png'))]);
  if(current.degraded)throw new Error('La font principal està degradada; no es genera el Short.');
  const logoData=logo.toString('base64');
  const now=new Date();
  const time=new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(now);
  const today=forecast.daily;
  const slides=[];
  slides.push(baseSvg('El temps, en 25 segons','Actualització meteorològica',`<text x="76" y="650" fill="#f7fcf9" font-family="DejaVu Sans" font-size="132" font-weight="800">${esc(number(current.temperature,1))}°</text><text x="76" y="760" fill="#b8cdc3" font-family="DejaVu Sans" font-size="45">Sant Celoni · dades reals a les ${esc(time)}</text><rect x="76" y="910" width="928" height="300" rx="46" fill="#071712" fill-opacity=".56"/><text x="128" y="1030" fill="#8ee7ba" font-family="DejaVu Sans" font-size="34" font-weight="700">ARA MATEIX</text><text x="128" y="1135" fill="#f7fcf9" font-family="DejaVu Sans" font-size="58" font-weight="700">${esc(weatherLabel(today.weather_code[0]))}</text>`,'Dades de l’estació i previsió Open-Meteo',logoData));
  slides.push(baseSvg('Condicions actuals','Ara mateix',metricCard(76,560,'Temperatura',`${number(current.temperature,1)}°`)+metricCard(566,560,'Humitat',number(current.humidity),'%')+metricCard(76,850,'Vent',number(current.windSpeed,1),'km/h')+metricCard(566,850,'Pluja avui',number(current.rainToday,1),'mm')+`<text x="76" y="1280" fill="#b8cdc3" font-family="DejaVu Sans" font-size="36">Sensació: ${esc(number(current.feelsLike,1))}° · Pressió: ${esc(number(current.pressure,0))} hPa</text>`,'Lectura automàtica de l’Observatori Fontanillas',logoData));
  slides.push(baseSvg(weatherLabel(today.weather_code[0]),'Avui',`<text x="76" y="620" fill="#f7fcf9" font-family="DejaVu Sans" font-size="116" font-weight="800">${esc(number(today.temperature_2m_max[0]))}° <tspan fill="#8ee7ba" font-size="66">/ ${esc(number(today.temperature_2m_min[0]))}°</tspan></text>${metricCard(76,790,'Probabilitat de pluja',number(today.precipitation_probability_max[0]),'%')}${metricCard(566,790,'Ratxa màxima',number(today.wind_gusts_10m_max[0]),'km/h')}<text x="76" y="1230" fill="#b8cdc3" font-family="DejaVu Sans" font-size="38">${esc(dateLabel(today.time[0]))}</text>`,'Previsió orientativa per a Sant Celoni',logoData));
  slides.push(baseSvg(weatherLabel(today.weather_code[1]),'Demà',`<text x="76" y="620" fill="#f7fcf9" font-family="DejaVu Sans" font-size="116" font-weight="800">${esc(number(today.temperature_2m_max[1]))}° <tspan fill="#8ee7ba" font-size="66">/ ${esc(number(today.temperature_2m_min[1]))}°</tspan></text>${metricCard(76,790,'Probabilitat de pluja',number(today.precipitation_probability_max[1]),'%')}${metricCard(566,790,'Ratxa màxima',number(today.wind_gusts_10m_max[1]),'km/h')}<text x="76" y="1230" fill="#b8cdc3" font-family="DejaVu Sans" font-size="38">${esc(dateLabel(today.time[1]))}</text>`,'Consulta els detalls i l’evolució a la web',logoData));
  const rows=today.time.slice(2,5).map((date,index)=>{const i=index+2;return `<rect x="76" y="${590+index*245}" width="928" height="205" rx="34" fill="#071712" fill-opacity=".6" stroke="#8ee7ba" stroke-opacity=".24"/><text x="120" y="${660+index*245}" fill="#8ee7ba" font-family="DejaVu Sans" font-size="29" font-weight="700">${esc(dateLabel(date).toUpperCase())}</text><text x="120" y="${740+index*245}" fill="#f7fcf9" font-family="DejaVu Sans" font-size="43" font-weight="700">${esc(weatherLabel(today.weather_code[i]))}</text><text x="950" y="${700+index*245}" text-anchor="end" fill="#f7fcf9" font-family="DejaVu Sans" font-size="57" font-weight="800">${esc(number(today.temperature_2m_max[i]))}°</text><text x="950" y="${755+index*245}" text-anchor="end" fill="#8ee7ba" font-family="DejaVu Sans" font-size="27">${esc(number(today.precipitation_probability_max[i]))}% pluja</text>`;}).join('');
  slides.push(baseSvg('Els pròxims dies','Tendència ràpida',rows,'Segueix l’evolució actualitzada a la web',logoData));
  await Promise.all(slides.map((svg,index)=>writeFile(resolve(OUTPUT,`slide-${index+1}.svg`),svg)));
  const title=`El temps a Sant Celoni · ${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'long',timeZone:'Europe/Madrid'}).format(now)} #Shorts`;
  await writeFile(resolve(OUTPUT,'metadata.json'),JSON.stringify({title,description:'Dades meteorològiques reals i previsió automàtica de Meteo Fontanillas, Sant Celoni.\n\nConsulta totes les dades: https://meteo.fontanillas.cat/\n\n#MeteoFontanillas #SantCeloni #ElTemps #Meteo #Shorts',tags:['Meteo Fontanillas','Sant Celoni','meteorologia','el temps','Shorts']},null,2));
  console.log(`Generades ${slides.length} pantalles a ${OUTPUT}`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error);process.exitCode=1;});
