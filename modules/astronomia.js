import { CONFIG } from '../js/config.js';
import { clamp, format, setText } from '../js/utils.js';

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const phaseNames = [
  ['Lluna nova','🌑'],['Lluna creixent','🌒'],['Quart creixent','🌓'],['Gibosa creixent','🌔'],
  ['Lluna plena','🌕'],['Gibosa minvant','🌖'],['Quart minvant','🌗'],['Lluna minvant','🌘']
];

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
  const phases = (phasePayload?.phasedata || []).map(item => {
    const [translated,symbolValue] = translatePhase(item.phase);
    return { name:translated, symbol:symbolValue, date:new Date(`${item.year}-${String(item.month).padStart(2,'0')}-${String(item.day).padStart(2,'0')}T${item.time || '00:00'}:00Z`) };
  }).filter(item=>!Number.isNaN(item.date.getTime()));
  if (phases.length) renderPhases(phases);
  setText('moon-source-status','USNO · actualitzat');
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
  setText('moon-source-status','Càlcul local');
  loadUsnoMoon().catch(error => console.warn('Efemèrides USNO no disponibles; s’utilitza el càlcul local.',error));
}
