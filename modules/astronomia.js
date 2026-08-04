import { CONFIG } from '../js/config.js';
import { cardinal, clamp, format, setText } from '../js/utils.js';

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const phaseNames = [
  ['Lluna nova','🌑'],['Lluna creixent','🌒'],['Quart creixent','🌓'],['Gibosa creixent','🌔'],
  ['Lluna plena','🌕'],['Gibosa minvant','🌖'],['Quart minvant','🌗'],['Lluna minvant','🌘']
];

const fallbackSeasons = [
  ['2025-12-21T15:03:00Z','Hivern','Solstici d’hivern','❄'],
  ['2026-03-20T14:46:00Z','Primavera','Equinocci de primavera','🌱'],
  ['2026-06-21T08:24:00Z','Estiu','Solstici d’estiu','☀'],
  ['2026-09-23T00:05:00Z','Tardor','Equinocci de tardor','🍂'],
  ['2026-12-21T20:50:00Z','Hivern','Solstici d’hivern','❄'],
  ['2027-03-20T20:25:00Z','Primavera','Equinocci de primavera','🌱'],
  ['2027-06-21T14:11:00Z','Estiu','Solstici d’estiu','☀'],
  ['2027-09-23T06:02:00Z','Tardor','Equinocci de tardor','🍂'],
  ['2027-12-22T02:42:00Z','Hivern','Solstici d’hivern','❄']
].map(([date,season,label,symbol])=>({date:new Date(date),season,label,symbol}));

let seasonsRequested = false;
let seasonsCache = fallbackSeasons;

const events = [
  { date:'2026-08-12T19:30:00+02:00', title:'Eclipsi de Sol', badge:'Excepcional', copy:'Visible al capvespre. Cal horitzó oest lliure i protecció solar homologada.' },
  { date:'2026-08-12T23:00:00+02:00', title:'Màxim de les Perseides', badge:'Nit 12–13', copy:'Pluja de meteors molt favorable el 2026 per la proximitat de la Lluna nova.' },
  { date:'2026-08-28T04:00:00+02:00', title:'Eclipsi parcial de Lluna', badge:'Visible', copy:'Observable a simple vista abans que la Lluna es pongui des de l’est peninsular.' },
  { date:'2026-12-14T00:00:00+01:00', title:'Màxim dels Gemínids', badge:'Destacat', copy:'Una de les pluges de meteors més intenses i regulars de l’any.' },
  { date:'2027-01-03T23:00:00+01:00', title:'Màxim dels Quadràntids', badge:'Finestra curta', copy:'Pluja de meteors d’hivern amb un màxim breu però potencialment intens.' },
  { date:'2027-04-22T23:00:00+02:00', title:'Màxim dels Lírides', badge:'Primavera', copy:'Meteors ràpids visibles millor des de llocs foscos i amb horitzó obert.' }
];

function localDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type,part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function madridOffsetHours(date = new Date()) {
  const zone = new Intl.DateTimeFormat('en-US', { timeZone:'Europe/Madrid', timeZoneName:'longOffset' }).formatToParts(date).find(part=>part.type==='timeZoneName')?.value || 'GMT+1';
  const match = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 1;
  const value = Number(match[2]) + Number(match[3] || 0) / 60;
  return match[1] === '-' ? -value : value;
}

function approximateMoon(date = new Date()) {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  const age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const fraction = age / SYNODIC_MONTH;
  const index = Math.floor((fraction * 8) + .5) % 8;
  return { age, fraction, illumination:(1 - Math.cos(2 * Math.PI * fraction)) / 2 * 100, name:phaseNames[index][0], symbol:phaseNames[index][1] };
}

function translatePhase(name = '') {
  const normalized = name.toLowerCase();
  if (normalized.includes('new')) return ['Lluna nova','🌑'];
  if (normalized.includes('first') || normalized.includes('waxing half')) return ['Quart creixent','🌓'];
  if (normalized.includes('full')) return ['Lluna plena','🌕'];
  if (normalized.includes('last') || normalized.includes('third') || normalized.includes('waning half')) return ['Quart minvant','🌗'];
  if (normalized.includes('waxing crescent')) return ['Lluna creixent','🌒'];
  if (normalized.includes('waxing gibbous')) return ['Gibosa creixent','🌔'];
  if (normalized.includes('waning gibbous')) return ['Gibosa minvant','🌖'];
  if (normalized.includes('waning crescent')) return ['Lluna minvant','🌘'];
  return [name || 'Fase lunar','◐'];
}

function renderMoon(moon) {
  setText('moon-phase', moon.name);
  setText('moon-illumination', format(moon.illumination, 0));
  setText('moon-age', `${format(moon.age, 1)} dies des de la Lluna nova`);
  setText('moon-visual', moon.symbol);
  setText('moon-visibility',moon.illumination<15?'Cel especialment fosc':moon.illumination<45?'Llum lunar baixa':moon.illumination<75?'Llum lunar moderada':'Molta llum lunar');
}

function approximatePhases(now = new Date()) {
  const moon = approximateMoon(now);
  return [0,.25,.5,.75].map(target => {
    let delta = (target - moon.fraction + 1) % 1;
    if (delta < .015) delta += 1;
    const date = new Date(now.getTime() + delta * SYNODIC_MONTH * 86400000);
    const index = Math.round(target * 8) % 8;
    return { name:phaseNames[index][0], symbol:phaseNames[index][1], date };
  }).sort((a,b)=>a.date-b.date);
}

function renderPhases(phases) {
  const container = document.getElementById('moon-phases');
  if (!container) return;
  if (phases[0]) setText('moon-next-phase',`${phases[0].name} · ${new Intl.DateTimeFormat(CONFIG.locale,{day:'numeric',month:'short'}).format(phases[0].date)}`);
  container.innerHTML = phases.slice(0,4).map(phase => `<div class="moon-phase-item"><i aria-hidden="true">${phase.symbol}</i><b>${phase.name}</b><small>${new Intl.DateTimeFormat(CONFIG.locale,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(phase.date)}</small></div>`).join('');
}

async function loadUsnoMoon() {
  const date = localDateKey();
  const offset = madridOffsetHours();
  const coords = `${CONFIG.station.latitude},${CONFIG.station.longitude}`;
  const [dayResponse,phaseResponse] = await Promise.all([
    fetch(`https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${encodeURIComponent(coords)}&tz=${offset}&ID=FONTAMET`, { cache:'no-store' }),
    fetch(`https://aa.usno.navy.mil/api/moon/phases/date?date=${date}&nump=4&ID=FONTAMET`, { cache:'no-store' })
  ]);
  if (!dayResponse.ok || !phaseResponse.ok) throw new Error('USNO no disponible');
  const dayPayload = await dayResponse.json();
  const phasePayload = await phaseResponse.json();
  const data = dayPayload?.properties?.data;
  const approximate = approximateMoon();
  const [name,symbol] = translatePhase(data?.curphase);
  const illumination = Number.parseFloat(data?.fracillum);
  renderMoon({ ...approximate, name, symbol, illumination:Number.isFinite(illumination) ? illumination : approximate.illumination });
  const moonRise = (data?.moondata || []).find(item => ['R','Rise'].includes(item.phen));
  const moonSet = (data?.moondata || []).find(item => ['S','Set'].includes(item.phen));
  if (moonRise || moonSet) setText('moon-times',`Surt ${moonRise?.time || '—'} · Es pon ${moonSet?.time || '—'}`);
  const sunRise = (data?.sundata || []).find(item => ['R','Rise'].includes(item.phen));
  const sunSet = (data?.sundata || []).find(item => ['S','Set'].includes(item.phen));
  const sunTransit = (data?.sundata || []).find(item => ['U','Upper Transit'].includes(item.phen));
  if (sunRise) setText('sunrise-time',sunRise.time);
  if (sunSet) setText('sunset-time',sunSet.time);
  if (sunTransit) setText('solar-noon',sunTransit.time);
  const phases = (phasePayload?.phasedata || []).map(item => {
    const [translated,symbolValue] = translatePhase(item.phase);
    return { name:translated, symbol:symbolValue, date:new Date(`${item.year}-${String(item.month).padStart(2,'0')}-${String(item.day).padStart(2,'0')}T${item.time || '00:00'}:00Z`) };
  }).filter(item=>!Number.isNaN(item.date.getTime()));
  if (phases.length) renderPhases(phases);
  setText('moon-source-status','USNO · actualitzat');
}

function solarPosition(date = new Date()) {
  const rad=Math.PI/180;
  const days=date.getTime()/86400000-.5+2440588-2451545;
  const anomaly=rad*(357.5291+.98560028*days);
  const longitude=anomaly+rad*(1.9148*Math.sin(anomaly)+.02*Math.sin(2*anomaly)+.0003*Math.sin(3*anomaly))+rad*102.9372+Math.PI;
  const obliquity=rad*23.4397;
  const declination=Math.asin(Math.sin(longitude)*Math.sin(obliquity));
  const rightAscension=Math.atan2(Math.sin(longitude)*Math.cos(obliquity),Math.cos(longitude));
  const latitude=CONFIG.station.latitude*rad;
  const hourAngle=rad*(280.16+360.9856235*days)+CONFIG.station.longitude*rad-rightAscension;
  const altitude=Math.asin(Math.sin(latitude)*Math.sin(declination)+Math.cos(latitude)*Math.cos(declination)*Math.cos(hourAngle));
  const azimuth=Math.atan2(Math.sin(hourAngle),Math.cos(hourAngle)*Math.sin(latitude)-Math.tan(declination)*Math.cos(latitude));
  return { elevation:altitude/rad, azimuth:(azimuth/rad+180+360)%360 };
}

function renderSun(forecast) {
  const now=new Date();
  const position=solarPosition(now);
  setText('sun-elevation',format(position.elevation,1));
  setText('sun-azimuth',format(position.azimuth,0));
  setText('sun-status',position.elevation>10?`Sol alt cap al ${cardinal(position.azimuth)}`:position.elevation>0?`Sol baix cap al ${cardinal(position.azimuth)}`:`Sol sota l’horitzó · ${cardinal(position.azimuth)}`);
  const sunrise=new Date(forecast?.daily?.sunrise?.[0]);
  const sunset=new Date(forecast?.daily?.sunset?.[0]);
  if (!Number.isNaN(sunrise.getTime())&&!Number.isNaN(sunset.getTime())) {
    const solarNoon=new Date((sunrise.getTime()+sunset.getTime())/2);
    const formatter=new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'});
    setText('sunrise-time',formatter.format(sunrise)); setText('sunset-time',formatter.format(sunset)); setText('solar-noon',formatter.format(solarNoon));
    const progress=clamp((now-sunrise)/(sunset-sunrise),0,1);
    const progressBar=document.getElementById('day-progress'); if(progressBar)progressBar.style.width=`${progress*100}%`;
    const orbit=document.getElementById('sun-orbit-marker');
    if(orbit){orbit.style.left=`${progress*100}%`;orbit.style.bottom=`${Math.max(0,Math.sin(progress*Math.PI)*72)}%`;}
  }
}

function seasonMeta(item) {
  const month=Number(item.month);
  if(month===3)return {season:'Primavera',label:'Equinocci de primavera',symbol:'🌱'};
  if(month===6)return {season:'Estiu',label:'Solstici d’estiu',symbol:'☀'};
  if(month===9)return {season:'Tardor',label:'Equinocci de tardor',symbol:'🍂'};
  return {season:'Hivern',label:'Solstici d’hivern',symbol:'❄'};
}

function parseSeason(item) {
  const month=Number(item.month); const day=Number(item.day); const year=Number(item.year);
  const time=String(item.time||'00:00').match(/\d{1,2}:\d{2}/)?.[0]||'00:00';
  const [hour,minute]=time.split(':').map(Number); const meta=seasonMeta({month});
  return {...meta,date:new Date(Date.UTC(year,month-1,day,hour,minute))};
}

function renderSeasons(items) {
  const sorted=items.filter(item=>item.date instanceof Date&&!Number.isNaN(item.date.getTime())).sort((a,b)=>a.date-b.date);
  const now=Date.now();
  const previous=[...sorted].reverse().find(item=>item.date.getTime()<=now)||sorted[0];
  const next=sorted.find(item=>item.date.getTime()>now)||sorted.at(-1);
  setText('current-season',previous?.season||'—');
  if(previous&&next){
    const progress=clamp((now-previous.date)/(next.date-previous.date),0,1);
    setText('season-progress-copy',`${format(progress*100,0)}% del recorregut fins a ${next.season.toLowerCase()}`);
    const gauge=document.getElementById('season-progress'); if(gauge)gauge.style.width=`${progress*100}%`;
  }
  const upcoming=sorted.filter(item=>item.date.getTime()>now).slice(0,4);
  const container=document.getElementById('seasons-timeline'); if(!container)return;
  container.innerHTML=upcoming.map((item,index)=>`<div class="season-item ${index===0?'is-next':''}"><i aria-hidden="true">${item.symbol}</i><div><b>${item.label}</b><small>${new Intl.DateTimeFormat(CONFIG.locale,{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(item.date)}</small></div></div>`).join('');
}

async function loadUsnoSeasons() {
  const year=new Date().getUTCFullYear();
  const responses=await Promise.all([year,year+1].map(value=>fetch(`https://aa.usno.navy.mil/api/seasons?year=${value}&ID=FONTAMET`,{cache:'no-store'})));
  if(responses.some(response=>!response.ok))throw new Error('Estacions USNO no disponibles');
  const payloads=await Promise.all(responses.map(response=>response.json()));
  const items=payloads.flatMap(payload=>(payload?.data||[]).filter(item=>['Equinox','Solstice'].includes(item.phenom)).map(parseSeason));
  const previousFallback=fallbackSeasons.filter(item=>item.date.getUTCFullYear()===year-1);
  seasonsCache=[...previousFallback,...items];
  renderSeasons(seasonsCache);
  setText('season-source-status','USNO · actualitzat');
}

function renderEvents() {
  const container = document.getElementById('astronomy-events');
  if (!container) return;
  const upcoming = events.filter(event => new Date(event.date).getTime() >= Date.now() - 43200000).slice(0,4);
  container.innerHTML = upcoming.map(event => {
    const date = new Date(event.date);
    return `<div class="astronomy-event"><time datetime="${event.date}">${new Intl.DateTimeFormat(CONFIG.locale,{day:'numeric',month:'short'}).format(date)}</time><div><b>${event.title}</b><small>${event.copy}</small></div><span>${event.badge}</span></div>`;
  }).join('') || '<div class="forecast-loading">S’està preparant el calendari dels pròxims esdeveniments.</div>';
}

function renderNightQuality(forecast, moon) {
  const sunset = new Date(forecast?.daily?.sunset?.[0]);
  const sunrise = new Date(forecast?.daily?.sunrise?.[1]);
  if (Number.isNaN(sunset.getTime()) || Number.isNaN(sunrise.getTime())) return;
  const indices = (forecast.hourly?.time || []).map((value,index)=>({date:new Date(value),index})).filter(item=>item.date >= sunset && item.date <= sunrise);
  const clouds = indices.map(item=>Number(forecast.hourly.cloud_cover?.[item.index])).filter(Number.isFinite);
  const rain = indices.map(item=>Number(forecast.hourly.precipitation_probability?.[item.index])).filter(Number.isFinite);
  const cloudAverage = clouds.length ? clouds.reduce((sum,value)=>sum+value,0)/clouds.length : 50;
  const rainMaximum = rain.length ? Math.max(...rain) : 0;
  const score = Math.round(clamp(100 - cloudAverage * .72 - rainMaximum * .18 - moon.illumination * .1, 0, 100));
  const rating = score >= 80 ? 'Nit excel·lent' : score >= 60 ? 'Condicions bones' : score >= 40 ? 'Condicions irregulars' : 'Observació difícil';
  setText('night-score',score); setText('night-rating',rating);
  setText('night-summary',`${format(cloudAverage,0)}% de nuvolositat mitjana · ${format(rainMaximum,0)}% màxim de pluja · Lluna ${format(moon.illumination,0)}%`);
  const darkness = (sunrise - sunset) / 3600000;
  setText('darkness-hours',`${format(darkness,1)} h`);
  setText('darkness-times',`${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(sunset)} → ${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(sunrise)}`);
}

export function renderAstronomy(forecast) {
  const moon = approximateMoon();
  renderMoon(moon);
  renderPhases(approximatePhases());
  renderEvents();
  renderNightQuality(forecast,moon);
  renderSun(forecast);
  renderSeasons(seasonsCache);
  setText('moon-source-status','Càlcul local');
  loadUsnoMoon().catch(error => console.warn('Efemèrides USNO no disponibles; s’utilitza el càlcul local.',error));
  if(!seasonsRequested){seasonsRequested=true;loadUsnoSeasons().catch(error=>{seasonsRequested=false;console.warn('Estacions USNO no disponibles; s’utilitza el calendari local.',error);});}
}
