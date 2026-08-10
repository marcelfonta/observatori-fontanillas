import { ephemerisDateLabel, meteorologicalEphemeridesForDate } from '../data/meteorological-ephemerides.js';
import { fetchAlertHistory } from '../services/weather-api.js';

const DAY = 86400000;
const locale = 'ca-ES';

let archive = [];
let current = null;
let activeDays = 30;
let alertArchive = [];
let timelineFilter = 'all';

const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const values = (items, key, fallback) => items.map(item => number(item[key] ?? (fallback ? item[fallback] : null))).filter(value => value !== null);
const mean = list => list.length ? list.reduce((total, value) => total + value, 0) / list.length : null;
const deviation = list => { const average = mean(list); return average === null ? null : Math.sqrt(list.reduce((total, value) => total + (value - average) ** 2, 0) / list.length); };
const fmt = (value, digits = 1) => value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[character]);
const dateKey = value => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(value));
const selected = () => archive.filter(item => item.t >= Date.now() - activeDays * DAY);

function rainTotal(items) {
  const increments = values(items, 'rainIncrement');
  if (increments.length) return increments.reduce((total, value) => total + Math.max(0, value), 0);
  return items.reduce((total, item, index) => {
    const value = number(item.rainTotal);
    const previous = number(items[index - 1]?.rainTotal);
    if (value === null || previous === null) return total;
    return total + (value >= previous ? value - previous : value);
  }, 0);
}

function dailyRain(items) {
  const groups = new Map();
  items.forEach(item => {
    const key = dateKey(item.t);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  const totals = new Map([...groups].map(([key, group]) => [key, rainTotal(group)]));
  const today = dateKey(Date.now());
  const observedToday = number(current?.rainToday);
  if (observedToday !== null) totals.set(today, Math.max(totals.get(today) || 0, observedToday));
  return totals;
}

function recentEpisodeRain(items) {
  const samples = items.filter(item => item.t >= Date.now() - 72 * 3600000).sort((a, b) => a.t - b.t);
  const wet = samples.map((item, index) => ({ t: item.t, rain: Math.max(0, number(item.rainIncrement) ?? 0), rate: Math.max(0, number(item.rainRate) ?? 0), index })).filter(item => item.rain > 0 || item.rate > 0);
  if (!wet.length || (Date.now() - wet.at(-1).t > 12 * 3600000 && (number(current?.rainRate) ?? 0) <= 0)) return 0;
  let start = wet.at(-1).index;
  let previousWet = wet.at(-1).t;
  for (let index = wet.length - 2; index >= 0; index -= 1) {
    if (previousWet - wet[index].t > 6 * 3600000) break;
    start = wet[index].index;
    previousWet = wet[index].t;
  }
  return rainTotal(samples.slice(start));
}

function daysSinceThreshold(totals, threshold) {
  const today = new Date(`${dateKey(Date.now())}T12:00:00`);
  const matches = [...totals].filter(([, rain]) => rain >= threshold).map(([key]) => key).sort();
  if (matches.length) {
    const last = new Date(`${matches.at(-1)}T12:00:00`);
    return Math.max(0, Math.round((today - last) / DAY));
  }
  if (!archive.length) return null;
  const first = new Date(`${dateKey(archive[0].t)}T12:00:00`);
  return { minimum: Math.max(0, Math.round((today - first) / DAY)) };
}

function dryLabel(value) {
  if (value === null) return '—';
  if (typeof value === 'object') return `Més de ${value.minimum}`;
  return String(value);
}

function renderRainDashboard() {
  const totals = dailyRain(archive);
  const today = dateKey(Date.now());
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dateKey(yesterdayDate);
  const month = today.slice(0, 7); const year = today.slice(0, 4);
  const totalFor = prefix => [...totals].filter(([key]) => key.startsWith(prefix)).reduce((sum, [, value]) => sum + value, 0);
  const recent24h = archive.filter(item => item.t >= Date.now() - DAY);
  const yearDays = [...totals].filter(([key]) => key.startsWith(year));
  const wettest = yearDays.sort((a, b) => b[1] - a[1])[0];
  set('data-rain-now', `${fmt(number(current?.rainRate))} mm/h`);
  set('data-rain-today', `${fmt(totals.get(today) ?? number(current?.rainToday) ?? 0)} mm`);
  set('data-rain-24h', `${fmt(rainTotal(recent24h))} mm`);
  set('data-rain-episode', `${fmt(recentEpisodeRain(archive))} mm`);
  set('data-rain-yesterday', `${fmt(totals.get(yesterday) ?? 0)} mm`);
  set('data-rain-month', `${fmt(totalFor(month))} mm`);
  set('data-rain-year', `${fmt(totalFor(year))} mm`);
  set('data-rain-wet-days', String(yearDays.filter(([, value]) => value >= .1).length));
  set('data-rain-dry-days', dryLabel(daysSinceThreshold(totals, .1)));
  set('data-rain-since-1', dryLabel(daysSinceThreshold(totals, 1)));
  set('data-rain-since-10', dryLabel(daysSinceThreshold(totals, 10)));
  set('data-rain-since-20', dryLabel(daysSinceThreshold(totals, 20)));
  set('data-rain-wettest', wettest && wettest[1] > 0 ? `${fmt(wettest[1])} mm · ${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${wettest[0]}T12:00:00`))}` : 'Encara cap dia plujós');
  const coverage = archive.length ? Math.max(1, Math.round((Date.now() - archive[0].t) / DAY)) : 0;
  set('data-rain-coverage', coverage ? `Càlcul fet amb ${coverage} dies de cobertura disponible. «Més de» indica que no hi ha cap episodi anterior dins de l’arxiu.` : 'Les estadístiques s’activaran quan l’arxiu disposi de cobertura.');
}

function periodSummary(items) {
  const temperatures = values(items, 'temperature');
  return { temperature: mean(temperatures), rain: rainTotal(items), samples: items.length };
}

function renderPeriod(idPrefix, items) {
  const summary = periodSummary(items);
  set(`${idPrefix}-temp`, summary.temperature === null ? 'Sense dades' : `${fmt(summary.temperature)} °C`);
  set(`${idPrefix}-rain`, summary.samples ? `Mitjana · ${fmt(summary.rain)} mm · ${summary.samples} mostres` : 'Període encara no disponible');
}

function renderEphemeris() {
  const now = new Date();
  const todayKey = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const matches = archive.filter(item => {
    const date = new Date(item.t);
    return date.getFullYear() < now.getFullYear() && `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === todayKey;
  });
  if (!matches.length) {
    set('data-ephemeris-copy', 'Fontanillas encara no té altres anys comparables. Mentrestant, aquí tens efemèrides històriques verificades properes a aquesta data.');
  } else {
    const highs = values(matches, 'temperatureMax', 'temperature');
    const lows = values(matches, 'temperatureMin', 'temperature');
    const years = [...new Set(matches.map(item => new Date(item.t).getFullYear()))];
    set('data-ephemeris-copy', `${years.length} ${years.length === 1 ? 'any comparable' : 'anys comparables'} a Fontanillas · màxima ${fmt(highs.length ? Math.max(...highs) : null)} °C · mínima ${fmt(lows.length ? Math.min(...lows) : null)} °C.`);
  }
  const host=document.getElementById('data-ephemeris-list');if(!host)return;
  host.innerHTML=meteorologicalEphemeridesForDate(now,3).map(item=>`<article><span>${escapeHtml(item.scope)} · ${escapeHtml(item.kind)}</span><strong>${item.year} · ${escapeHtml(item.title)}</strong><p>${escapeHtml(item.summary)}</p><a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${item.exact?'Tal dia com avui':ephemerisDateLabel(item)} · ${escapeHtml(item.source)} ↗</a></article>`).join('');
}

export function buildWeatherTimeline(history=[],alerts=[]){
  const items=[...history].filter(item=>Number.isFinite(Number(item.t))).sort((a,b)=>a.t-b.t);const groups=new Map();
  items.forEach(item=>{const key=dateKey(item.t);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);});
  const firstTimestamp=items[0]?.t||0;const events=(alerts||[]).map(item=>({timestamp:new Date(item.started_at||item.created_at||0).getTime(),type:'alert',label:'Avís oficial',title:item.phenomenon||item.title||'Avís meteorològic',detail:`Nivell ${String(item.level||'oficial').toLowerCase()} · ${item.source||'AEMET'}`,source:item.source||'AEMET',href:'./historial-avisos.html'})).filter(item=>Number.isFinite(item.timestamp)&&(!firstTimestamp||item.timestamp>=firstTimestamp));
  const days=[...groups].map(([key,group])=>{const temperatures=values(group,'temperature');const highs=values(group,'temperatureMax','temperature');const lows=values(group,'temperatureMin','temperature');const gusts=values(group,'windGust');return {key,timestamp:new Date(`${key}T12:00:00`).getTime(),rain:rainTotal(group),high:highs.length?Math.max(...highs):temperatures.length?Math.max(...temperatures):null,low:lows.length?Math.min(...lows):temperatures.length?Math.min(...temperatures):null,gust:gusts.length?Math.max(...gusts):null};});
  days.filter(day=>day.rain>=.1).sort((a,b)=>b.rain-a.rain).slice(0,4).forEach(day=>events.push({timestamp:day.timestamp,type:'rain',label:'Pluja observada',title:`${fmt(day.rain)} mm en un dia`,detail:'Acumulació calculada amb l’arxiu de Fontanillas',source:'Estació Fontanillas',href:'./?page=centre-dades'}));
  const highs=days.filter(day=>day.high!==null).sort((a,b)=>b.high-a.high);if(highs[0])events.push({timestamp:highs[0].timestamp,type:'extreme',label:'Temperatura',title:`Màxima del període · ${fmt(highs[0].high)} °C`,detail:'Valor més alt dins de la selecció',source:'Estació Fontanillas',href:'./?page=centre-dades'});
  const lows=days.filter(day=>day.low!==null).sort((a,b)=>a.low-b.low);if(lows[0])events.push({timestamp:lows[0].timestamp,type:'extreme',label:'Temperatura',title:`Mínima del període · ${fmt(lows[0].low)} °C`,detail:'Valor més baix dins de la selecció',source:'Estació Fontanillas',href:'./?page=centre-dades'});
  const gusts=days.filter(day=>day.gust!==null).sort((a,b)=>b.gust-a.gust);if(gusts[0])events.push({timestamp:gusts[0].timestamp,type:'extreme',label:'Vent',title:`Ratxa màxima · ${fmt(gusts[0].gust)} km/h`,detail:'Ratxa més alta dins de la selecció',source:'Estació Fontanillas',href:'./?page=centre-dades'});
  return events.sort((a,b)=>b.timestamp-a.timestamp);
}

function renderWeatherTimeline(){
  const host=document.getElementById('data-weather-timeline');if(!host)return;const periodItems=selected();const all=buildWeatherTimeline(periodItems,alertArchive);const filtered=(timelineFilter==='all'?all:all.filter(item=>item.type===timelineFilter)).slice(0,10);
  host.innerHTML=filtered.length?filtered.map(item=>`<article class="is-${escapeHtml(item.type)}"><time datetime="${new Date(item.timestamp).toISOString()}">${new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric'}).format(item.timestamp)}</time><i></i><div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p><a href="${escapeHtml(item.href)}">${escapeHtml(item.source)} →</a></div></article>`).join(''):'<div class="weather-timeline__empty">No hi ha episodis d’aquest tipus dins del període disponible.</div>';
  const coverage=periodItems.length?Math.max(1,Math.round((periodItems.at(-1).t-periodItems[0].t)/DAY)+1):0;set('data-weather-timeline-status',`${all.length} fites trobades · ${coverage?`${coverage} dies de cobertura disponible`:'sense cobertura local'}`);
}

async function loadAlertTimeline(){
  try{const payload=await fetchAlertHistory({page:1,pageSize:50});alertArchive=Array.isArray(payload.items)?payload.items:[];}catch(error){console.warn('L’historial d’avisos no està disponible per a la cronologia.',error);alertArchive=[];}renderWeatherTimeline();
}

export function renderDataCenter(history = [], latest = null) {
  archive = [...history].filter(item => Number.isFinite(Number(item.t))).sort((a, b) => a.t - b.t);
  current = latest;
  const items = selected();
  const temperatures = values(items, 'temperature');
  const gusts = values(items, 'windGust');
  const first = items[0]?.t;
  const last = items.at(-1)?.t;
  const coverageDays = first && last ? Math.max(1, Math.round((last - first) / DAY) + 1) : 0;
  const samples = items.reduce((total, item) => total + (number(item.samples) ?? 1), 0);
  set('data-summary-samples', new Intl.NumberFormat(locale).format(samples));
  set('data-summary-coverage', coverageDays ? `${coverageDays} dies amb dades dins del període` : 'Sense cobertura disponible');
  set('data-summary-temp-mean', fmt(mean(temperatures)));
  set('data-summary-temp-deviation', temperatures.length ? `Desviació estàndard ${fmt(deviation(temperatures))} °C` : 'Desviació no disponible');
  set('data-summary-rain', fmt(rainTotal(items)));
  set('data-summary-gust', fmt(gusts.length ? Math.max(...gusts) : null));
  set('data-center-period-status', items.length ? `${activeDays === 365 ? 'Últim any' : `Últims ${activeDays} dies`} · del ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(first)} al ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(last)}` : 'No hi ha dades disponibles per a aquest període.');

  const now = new Date();
  const today = dateKey(now);
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  renderPeriod('data-daily', archive.filter(item => dateKey(item.t) === today));
  renderPeriod('data-monthly', archive.filter(item => dateKey(item.t).startsWith(month)));
  renderPeriod('data-yearly', archive.filter(item => dateKey(item.t).startsWith(year)));
  renderRainDashboard();
  renderEphemeris();
  renderWeatherTimeline();
  if (typeof document.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    document.dispatchEvent(new CustomEvent('observatori:data-period-change', { detail: { days: activeDays } }));
  }
}

function exportRows() {
  return selected().map(item => ({
    data: new Date(item.t).toISOString(),
    temperatura_c: item.temperature ?? '',
    humitat_pct: item.humidity ?? '',
    pressio_hpa: item.pressure ?? '',
    vent_kmh: item.windSpeed ?? '',
    ratxa_kmh: item.windGust ?? '',
    pluja_increment_mm: item.rainIncrement ?? '',
    pluja_acumulada_mm: item.rainTotal ?? '',
    radiacio_wm2: item.solarRadiation ?? '',
    uv: item.uv ?? ''
  }));
}

function download(content, type, extension) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fontanillas-${activeDays}-dies-${dateKey(Date.now())}.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function xml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }

function exportCsv(rows) {
  const headers = Object.keys(rows[0]);
  const body = [headers, ...rows.map(row => headers.map(key => row[key]))].map(line => line.map(csvCell).join(';')).join('\n');
  download(`\ufeff${body}`, 'text/csv;charset=utf-8', 'csv');
}

function exportExcel(rows) {
  const headers = Object.keys(rows[0]);
  const table = [headers, ...rows.map(row => headers.map(key => row[key]))].map(line => `<Row>${line.map(value => `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`).join('')}</Row>`).join('');
  const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Observacions"><Table>${table}</Table></Worksheet></Workbook>`;
  download(workbook, 'application/vnd.ms-excel;charset=utf-8', 'xls');
}

function pdfAscii(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '').replace(/[\\()]/g, match => `\\${match}`); }
function exportPdf(rows) {
  const summary = periodSummary(selected());
  const lines = [
    'OBSERVATORI METEOROLOGIC FONTANILLAS',
    `Informe del Centre de Dades - ${activeDays} dies`,
    `Generat: ${new Date().toLocaleString(locale)}`,
    '',
    `Mostres disponibles: ${rows.length}`,
    `Temperatura mitjana: ${fmt(summary.temperature)} C`,
    `Pluja acumulada: ${fmt(summary.rain)} mm`,
    '',
    'Aquest informe resumeix el periode seleccionat.',
    'El CSV, Excel o JSON contenen totes les observacions.'
  ];
  const stream = lines.map((line, index) => `BT /F1 ${index === 0 ? 16 : 11} Tf 54 ${780 - index * 28} Td (${pdfAscii(line)}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(pdf, 'application/pdf', 'pdf');
}

function runExport(format) {
  const rows = exportRows();
  if (!rows.length) { set('data-export-status', 'No hi ha observacions per descarregar en aquest període.'); return; }
  if (format === 'csv') exportCsv(rows);
  if (format === 'excel') exportExcel(rows);
  if (format === 'json') download(JSON.stringify({ station: 'Fontanillas', generatedAt: new Date().toISOString(), days: activeDays, current, observations: rows }, null, 2), 'application/json;charset=utf-8', 'json');
  if (format === 'pdf') exportPdf(rows);
  set('data-export-status', `${format === 'excel' ? 'Excel' : format.toUpperCase()} preparat amb ${rows.length} observacions.`);
}

export function initDataCenter() {
  document.querySelectorAll('[data-data-period]').forEach(button => button.addEventListener('click', () => {
    activeDays = Number(button.dataset.dataPeriod) || 30;
    document.querySelectorAll('[data-data-period]').forEach(item => item.classList.toggle('is-active', item === button));
    renderDataCenter(archive, current);
  }));
  document.querySelectorAll('[data-export-format]').forEach(button => button.addEventListener('click', () => runExport(button.dataset.exportFormat)));
  document.querySelectorAll('[data-timeline-filter]').forEach(button=>button.addEventListener('click',()=>{timelineFilter=button.dataset.timelineFilter||'all';document.querySelectorAll('[data-timeline-filter]').forEach(item=>item.classList.toggle('is-active',item===button));renderWeatherTimeline();}));
  loadAlertTimeline();
}
