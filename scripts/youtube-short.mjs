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
const sentence=value=>value?`${value.charAt(0).toUpperCase()}${value.slice(1)}`:'Temps variable';

export function weatherLabel(code){
  const value=Number(code);
  if(value===0)return 'Cel serè';
  if(value===1)return 'Poc ennuvolat';
  if(value===2)return 'Núvols i clarianes';
  if(value===3)return 'Cel cobert';
  if(value===45||value===48)return 'Boira o núvols baixos';
  if(value>=51&&value<=57)return 'Plugim';
  if(value>=61&&value<=67)return 'Pluja';
  if(value>=71&&value<=77)return 'Neu';
  if(value>=80&&value<=82)return 'Ruixats';
  if(value>=85&&value<=86)return 'Ruixats de neu';
  if(value>=95)return 'Tempesta';
  return 'Temps variable';
}

export function weatherTheme(code){
  if(code===null||code===undefined||code===''||!Number.isFinite(Number(code)))return {kind:'neutral',accent:'#8fe0bd',deep:'#102d23'};
  const value=Number(code);
  if(value===0)return {kind:'clear',accent:'#ffd166',deep:'#4b3717'};
  if(value<=2)return {kind:'partly',accent:'#f4cd68',deep:'#34472b'};
  if(value===3)return {kind:'overcast',accent:'#c5d6d0',deep:'#263f3b'};
  if(value===45||value===48)return {kind:'fog',accent:'#c8d4cf',deep:'#364b47'};
  if(value>=51&&value<=57)return {kind:'drizzle',accent:'#7fd5e6',deep:'#163d49'};
  if((value>=61&&value<=67)||(value>=80&&value<=82))return {kind:'rain',accent:'#65c7e8',deep:'#153b50'};
  if((value>=71&&value<=77)||(value>=85&&value<=86))return {kind:'snow',accent:'#d8f4ff',deep:'#294655'};
  if(value>=95)return {kind:'storm',accent:'#ffca58',deep:'#43344f'};
  return {kind:'variable',accent:'#8ee7ba',deep:'#183d31'};
}

export function weatherGlyph(code,x=790,y=510,scale=1){
  const theme=weatherTheme(code);const {kind,accent}=theme;
  const sun=(kind==='clear'||kind==='partly')?`<g fill="${accent}"><circle cx="20" cy="5" r="46"/><g stroke="${accent}" stroke-width="12" stroke-linecap="round"><path d="M20-76v-25M20 86v25M-62 5h-25M102 5h25M-38-53l-18-18M78 63l18 18M78-53l18-18M-38 63l-18 18"/></g></g>`:'';
  const cloud=kind!=='clear'?'<path d="M-31 85c-35 0-63-24-63-55 0-29 24-52 55-54 13-41 52-68 97-68 55 0 99 40 104 92 33 5 58 31 58 62 0 36-30 64-69 64H-31z" fill="#f1f8f5" stroke="#9bc6b5" stroke-width="8"/>':'';
  const rain=(kind==='drizzle'||kind==='rain'||kind==='storm')?`<g stroke="#66c7e8" stroke-width="12" stroke-linecap="round"><path d="M-23 158l-15 31M48 158l-15 31M119 158l-15 31"/>${kind==='rain'||kind==='storm'?'<path d="M12 213l-15 31M83 213l-15 31"/>':''}</g>`:'';
  const snow=kind==='snow'?'<g fill="#d8f4ff"><circle cx="-20" cy="178" r="10"/><circle cx="50" cy="215" r="10"/><circle cx="118" cy="178" r="10"/><path d="M-20 148v60M-50 178h60M50 185v60M20 215h60M118 148v60M88 178h60" stroke="#d8f4ff" stroke-width="7"/></g>':'';
  const fog=kind==='fog'?'<g stroke="#c8d4cf" stroke-width="12" stroke-linecap="round"><path d="M-55 164h190M-25 205h210M-65 246H95"/></g>':'';
  const storm=kind==='storm'?'<path d="M58 131h49l-32 52h31l-69 84 19-65H17z" fill="#ffd166" stroke="#7b5b22" stroke-width="4"/>':'';
  const unknown=kind==='variable'?'<text x="55" y="70" text-anchor="middle" fill="#8ee7ba" font-family="DejaVu Sans" font-size="120" font-weight="800">?</text>':'';
  return `<g transform="translate(${x} ${y}) scale(${scale})"><title>${esc(weatherLabel(code))}</title><circle cx="55" cy="62" r="190" fill="${accent}" opacity=".08"/>${sun}${cloud}${rain}${snow}${fog}${storm}${unknown}</g>`;
}

function wrapText(value,maxChars=22,maxLines=2){
  const words=String(value||'').trim().split(/\s+/).filter(Boolean);const lines=[];let line='';
  for(let index=0;index<words.length;index++){const word=words[index];const next=line?`${line} ${word}`:word;if(next.length<=maxChars||!line)line=next;else if(lines.length<maxLines-1){lines.push(line);line=word;}else{const remaining=[line,...words.slice(index)].join(' ');line=remaining.length<=maxChars?remaining:`${remaining.slice(0,maxChars-1).trimEnd().replace(/[.,;:]?$/,'')}…`;break;}}
  if(line&&lines.length<maxLines)lines.push(line);
  return lines;
}

function multilineText(value,{x=76,y=440,maxChars=22,maxLines=2,fontSize=76,lineHeight=88,fill='#f7fcf9',weight=800,anchor='start'}={}){
  return wrapText(value,maxChars,maxLines).map((line,index)=>`<text x="${x}" y="${y+index*lineHeight}" text-anchor="${anchor}" fill="${fill}" font-family="DejaVu Sans" font-size="${fontSize}" font-weight="${weight}">${esc(line)}</text>`).join('');
}

function baseSvg({title,kicker,content,footer,logoData,weatherCode=null,slideIndex=1}){
  const theme=weatherTheme(weatherCode);const hasGlyph=weatherCode!==null&&weatherCode!==undefined&&weatherCode!==''&&Number.isFinite(Number(weatherCode));const titleWidth=hasGlyph?17:24;
  const progress=Array.from({length:5},(_,index)=>`<rect x="${76+index*188}" y="1684" width="164" height="8" rx="4" fill="${index<slideIndex?theme.accent:'#365f50'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#061510"/><stop offset=".54" stop-color="#123e31"/><stop offset="1" stop-color="${theme.deep}"/></linearGradient><radialGradient id="glow"><stop stop-color="${theme.accent}" stop-opacity=".28"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient></defs>
  <rect width="1080" height="1920" fill="url(#bg)"/><circle cx="920" cy="250" r="520" fill="url(#glow)"/><circle cx="80" cy="1660" r="420" fill="url(#glow)" opacity=".42"/>
  <image href="data:image/png;base64,${logoData}" x="74" y="72" width="126" height="126"/>
  <text x="224" y="124" fill="#f5fbf8" font-family="DejaVu Sans" font-size="42" font-weight="700">METEO FONTANILLAS</text>
  <text x="224" y="170" fill="${theme.accent}" font-family="DejaVu Sans" font-size="25" letter-spacing="3">OBSERVATORI · SANT CELONI</text>
  <rect x="76" y="272" width="${Math.min(530,Math.max(250,String(kicker).length*22))}" height="62" rx="31" fill="${theme.accent}" fill-opacity=".13" stroke="${theme.accent}" stroke-opacity=".55"/>
  <text x="108" y="313" fill="${theme.accent}" font-family="DejaVu Sans" font-size="25" font-weight="800" letter-spacing="3">${esc(kicker).toUpperCase()}</text>
  ${multilineText(title,{x:76,y:440,maxChars:titleWidth,maxLines:2,fontSize:76,lineHeight:88})}
  ${hasGlyph?weatherGlyph(weatherCode,850,420,.42):''}
  ${content}
  ${progress}
  <line x1="76" y1="1740" x2="1004" y2="1740" stroke="${theme.accent}" stroke-opacity=".38"/>
  <text x="76" y="1810" fill="#b8cdc3" font-family="DejaVu Sans" font-size="27">${esc(footer)}</text>
  <text x="1004" y="1810" text-anchor="end" fill="${theme.accent}" font-family="DejaVu Sans" font-size="27" font-weight="700">meteo.fontanillas.cat</text>
  </svg>`;
}

function metricCard(x,y,label,value,unit='',accent='#8ee7ba'){
  return `<rect x="${x}" y="${y}" width="438" height="230" rx="34" fill="#071712" fill-opacity=".7" stroke="${accent}" stroke-opacity=".34"/><text x="${x+38}" y="${y+64}" fill="#9cb8ab" font-family="DejaVu Sans" font-size="27">${esc(label)}</text><text x="${x+38}" y="${y+160}" fill="#f7fcf9" font-family="DejaVu Sans" font-size="64" font-weight="780">${esc(value)}<tspan fill="${accent}" font-size="32"> ${esc(unit)}</tspan></text>`;
}

function forecastAdvice(day){
  const code=Number(day?.weatherCode);const rain=Number(day?.rainProbability);const gust=Number(day?.gust);const max=Number(day?.max);
  if(code>=95)return 'Possibles tempestes: segueix el radar i els avisos oficials.';
  if((code>=51&&code<=82)||rain>=60)return 'Porta paraigua i revisa el radar abans de sortir.';
  if(gust>=45)return 'Vent destacable: precaució a les zones exposades.';
  if(max>=32)return 'Calor marcada: hidrata’t i evita les hores centrals.';
  return 'Consulta l’evolució horària i el radar abans de sortir.';
}

function forecastDay(daily,index){
  return {date:daily.time[index],weatherCode:Number(daily.weather_code[index]),condition:weatherLabel(daily.weather_code[index]),max:Number(daily.temperature_2m_max[index]),min:Number(daily.temperature_2m_min[index]),rainProbability:Number(daily.precipitation_probability_max[index]),gust:Number(daily.wind_gusts_10m_max[index])};
}

function forecastDetail(day,y=760){
  const accent=weatherTheme(day.weatherCode).accent;
  return `${metricCard(76,y,'Màxima / mínima',`${number(day.max)}° / ${number(day.min)}°`,'',accent)}${metricCard(566,y,'Probabilitat de pluja',number(day.rainProbability),'%',accent)}${metricCard(76,y+252,'Ratxa màxima',number(day.gust),'km/h',accent)}<rect x="566" y="${y+252}" width="438" height="230" rx="34" fill="${accent}" fill-opacity=".13" stroke="${accent}" stroke-opacity=".5"/>${multilineText(forecastAdvice(day),{x:604,y:y+318,maxChars:24,maxLines:3,fontSize:29,lineHeight:39,fill:'#f7fcf9',weight:650})}`;
}

export function buildSlideSvg({title,kicker,content,footer,logoData='test',weatherCode=null,slideIndex=1}){return baseSvg({title,kicker,content,footer,logoData,weatherCode,slideIndex});}

async function getJson(url){
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function main(){
  await mkdir(OUTPUT,{recursive:true});
  const slot=process.env.SHORT_SLOT==='vespre'?'vespre':'mati';
  const params=new URLSearchParams({latitude:String(LATITUDE),longitude:String(LONGITUDE),timezone:'Europe/Madrid',forecast_days:'6',daily:'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_gusts_10m_max'});
  const [current,forecast,logo]=await Promise.all([getJson(API),getJson(`${FORECAST}?${params}`),readFile(resolve(ROOT,'assets/icons/icon-512.png'))]);
  if(current.degraded)throw new Error('La font principal està degradada; no es genera el Short.');
  const logoData=logo.toString('base64');const daily=forecast.daily;
  if(!daily?.time?.length||daily.time.length<5)throw new Error('La predicció no conté prou dies per generar el Short.');
  const days=daily.time.map((_,index)=>forecastDay(daily,index));
  const mainIndex=slot==='vespre'?1:0;const secondaryIndex=slot==='vespre'?2:1;const mainDay=days[mainIndex];const secondaryDay=days[secondaryIndex];
  const now=new Date();const time=new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(now);
  const accent=weatherTheme(mainDay.weatherCode).accent;
  const slides=[];
  slides.push(baseSvg({title:sentence(mainDay.condition),kicker:slot==='vespre'?'Demà a Sant Celoni':'Avui a Sant Celoni',weatherCode:mainDay.weatherCode,slideIndex:1,logoData,content:`<text x="76" y="720" fill="#b8cdc3" font-family="DejaVu Sans" font-size="31">PREVISIÓ PRINCIPAL</text><text x="76" y="850" fill="#f7fcf9" font-family="DejaVu Sans" font-size="120" font-weight="850">${esc(number(mainDay.max))}° <tspan fill="${accent}" font-size="64">/ ${esc(number(mainDay.min))}°</tspan></text><rect x="76" y="955" width="928" height="210" rx="38" fill="#071712" fill-opacity=".68" stroke="${accent}" stroke-opacity=".42"/>${multilineText(forecastAdvice(mainDay),{x:124,y:1030,maxChars:36,maxLines:3,fontSize:38,lineHeight:51,fill:'#f7fcf9',weight:650})}<text x="76" y="1295" fill="#b8cdc3" font-family="DejaVu Sans" font-size="34">Pluja ${esc(number(mainDay.rainProbability))}% · ratxa ${esc(number(mainDay.gust))} km/h</text>`,footer:'Predicció Open-Meteo · actualització automàtica'}));
  slides.push(baseSvg({title:'Ara mateix, dades reals',kicker:'Observació de l’estació',slideIndex:2,logoData,content:`<text x="76" y="650" fill="${accent}" font-family="DejaVu Sans" font-size="31" font-weight="700">LECTURA DE LES ${esc(time)}</text>${metricCard(76,720,'Temperatura',number(current.temperature,1),'°')}${metricCard(566,720,'Sensació',number(current.feelsLike,1),'°')}${metricCard(76,972,'Humitat',number(current.humidity),'%')}${metricCard(566,972,'Vent',number(current.windSpeed,1),'km/h')}<text x="76" y="1328" fill="#b8cdc3" font-family="DejaVu Sans" font-size="34">Pluja avui: ${esc(number(current.rainToday,1))} mm · pressió: ${esc(number(current.pressure,0))} hPa</text>`,footer:'Observació real · Estació Meteo Fontanillas'}));
  slides.push(baseSvg({title:'Les claus de la previsió',kicker:slot==='vespre'?'Demà':'Avui',weatherCode:mainDay.weatherCode,slideIndex:3,logoData,content:forecastDetail(mainDay,720),footer:`${dateLabel(mainDay.date)} · predicció orientativa`}));
  slides.push(baseSvg({title:sentence(secondaryDay.condition),kicker:slot==='vespre'?'Demà passat':'Avanç de demà',weatherCode:secondaryDay.weatherCode,slideIndex:4,logoData,content:forecastDetail(secondaryDay,720),footer:`${dateLabel(secondaryDay.date)} · segueix-ne l’evolució`}));
  const trendStart=slot==='vespre'?2:1;
  const rows=days.slice(trendStart,trendStart+3).map((day,index)=>{const y=650+index*280;const dayAccent=weatherTheme(day.weatherCode).accent;return `<rect x="76" y="${y}" width="928" height="238" rx="38" fill="#071712" fill-opacity=".68" stroke="${dayAccent}" stroke-opacity=".4"/>${weatherGlyph(day.weatherCode,178,y+106,.25)}<text x="315" y="${y+70}" fill="${dayAccent}" font-family="DejaVu Sans" font-size="27" font-weight="800">${esc(dateLabel(day.date).toUpperCase())}</text><text x="315" y="${y+132}" fill="#f7fcf9" font-family="DejaVu Sans" font-size="38" font-weight="750">${esc(day.condition)}</text><text x="950" y="${y+103}" text-anchor="end" fill="#f7fcf9" font-family="DejaVu Sans" font-size="58" font-weight="850">${esc(number(day.max))}°</text><text x="950" y="${y+164}" text-anchor="end" fill="${dayAccent}" font-family="DejaVu Sans" font-size="27">${esc(number(day.rainProbability))}% pluja</text>`;}).join('');
  slides.push(baseSvg({title:'Tendència dels pròxims dies',kicker:'D’un cop d’ull',weatherCode:mainDay.weatherCode,slideIndex:5,logoData,content:rows,footer:'Predicció actualitzada i més detall a la web'}));
  await Promise.all(slides.map((svg,index)=>writeFile(resolve(OUTPUT,`slide-${index+1}.svg`),svg)));
  const date=new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'long',timeZone:'Europe/Madrid'}).format(now);
  const title=slot==='vespre'?`Demà a Sant Celoni: ${mainDay.condition.toLowerCase()} · ${date} #Shorts`:`Avui a Sant Celoni: ${mainDay.condition.toLowerCase()} · ${date} #Shorts`;
  const period=slot==='vespre'?'demà':'avui';
  const description=`Previsió per ${period}: ${mainDay.condition.toLowerCase()}, màxima ${number(mainDay.max)}°, mínima ${number(mainDay.min)}° i ${number(mainDay.rainProbability)}% de probabilitat de pluja. Dades reals de l’Observatori Meteo Fontanillas, Sant Celoni.`;
  await writeFile(resolve(OUTPUT,'metadata.json'),JSON.stringify({title,description:`${description}\n\nConsulta totes les dades: https://meteo.fontanillas.cat/\n\n#MeteoFontanillas #SantCeloni #ElTemps #Meteo #Shorts`,tags:['Meteo Fontanillas','Sant Celoni','meteorologia','el temps','Shorts']},null,2));
  console.log(`Generades ${slides.length} pantalles ${slot} · ${mainDay.condition} · ${number(mainDay.max)}°/${number(mainDay.min)}°`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error);process.exitCode=1;});
