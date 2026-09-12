import { ephemerisDateLabel, meteorologicalEphemeridesForDate } from '../data/meteorological-ephemerides.js';
import { fetchAlertHistory } from '../services/weather-api.js';
import { getLanguage, getLocale } from '../core/i18n.js';
import { finiteNumber as number } from '../core/numeric.js';
import { normalizeArchive, calendarCoverage, rainTotal, dailyRainTotals as dailyRain, daysSinceRainRecord as daysSinceThreshold } from '../core/archive-coverage.js';
import { intradayCoverage, weightedDeviation, weightedMean } from '../core/statistics.js';
export { calendarCoverage } from '../core/archive-coverage.js';

const DAY = 86400000;
const DATA_TABS = ['summary', 'charts', 'rain', 'episodes', 'quality'];

let archive = [];
let current = null;
let activeDays = 30;
let activeTab = 'summary';
let alertArchive = [];
let timelineFilter = 'all';

const values = (items, key, fallback) => items.map(item => number(item[key] ?? (fallback ? item[fallback] : null))).filter(value => value !== null);
const fmt = (value, digits = 1) => value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat(getLocale(), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[character]);
const dateKey = value => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(value));
const selected = () => archive.filter(item => item.t >= Date.now() - activeDays * DAY);

const copy = (ca, es, en, fr) => ({ ca, es, en, fr })[getLanguage()] || ca;
const coverageLabel = (coverage, continuity = null) => {
  const calendar = copy(
    `${coverage.observedDays} dies amb registres · interval de ${coverage.spanDays} dies`,
    `${coverage.observedDays} días con registros · intervalo de ${coverage.spanDays} días`,
    `${coverage.observedDays} days with records · ${coverage.spanDays}-day span`,
    `${coverage.observedDays} jours avec relevés · intervalle de ${coverage.spanDays} jours`
  );
  if (continuity?.percent == null) return calendar;
  const percent = continuity.percent > 0 && continuity.percent < 1
    ? '<1'
    : new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(continuity.percent);
  const samples = new Intl.NumberFormat(getLocale()).format(continuity.coveredSamples);
  const expected = new Intl.NumberFormat(getLocale()).format(continuity.expectedSamples);
  return `${calendar} · ${copy(
    `${percent}% de continuïtat (${samples}/${expected} intervals equivalents)`,
    `${percent}% de continuidad (${samples}/${expected} intervalos equivalentes)`,
    `${percent}% continuity (${samples}/${expected} equivalent intervals)`,
    `${percent}% de continuité (${samples}/${expected} intervalles équivalents)`
  )}`;
};

function annualCoverageLabel(coverage) {
  if (!coverage.observedDays) return ({ es: 'Sin cobertura disponible este año', en: 'No coverage available this year', fr: 'Aucune couverture disponible cette année' })[getLanguage()] || 'Sense cobertura disponible aquest any';
  const start = new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' }).format(coverage.first);
  return ({
    es: `Cobertura: ${coverage.spanDays} días de periodo · ${coverage.observedDays} con datos desde el ${start}`,
    en: `Coverage: ${coverage.spanDays}-day span · ${coverage.observedDays} days with data since ${start}`,
    fr: `Couverture : période de ${coverage.spanDays} jours · ${coverage.observedDays} jours avec données depuis le ${start}`
  })[getLanguage()] || `Cobertura: ${coverage.spanDays} dies de període · ${coverage.observedDays} amb dades des del ${start}`;
}

function archiveCoverageLabel(coverage) {
  if (!coverage.observedDays) return ({ es: 'Las estadísticas se activarán cuando el archivo disponga de cobertura.', en: 'Statistics will become available once the archive has coverage.', fr: 'Les statistiques seront disponibles lorsque les archives disposeront d’une couverture.' })[getLanguage()] || 'Les estadístiques s’activaran quan l’arxiu disposi de cobertura.';
  const first = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(coverage.first);
  const last = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(coverage.last);
  return ({
    es: `Archivo: ${coverage.observedDays} días con registros entre el ${first} y el ${last}. Las sumas pueden ser parciales. Los días desde la última lluvia registrada no certifican una racha seca: puede haber huecos.`,
    en: `Archive: ${coverage.observedDays} days with records between ${first} and ${last}. Totals may be partial. Days since the last recorded rain do not certify a dry spell: gaps may exist.`,
    fr: `Archives : ${coverage.observedDays} jours avec relevés du ${first} au ${last}. Les cumuls peuvent être partiels. Les jours depuis la dernière pluie enregistrée ne prouvent pas une période sèche : des lacunes sont possibles.`
  })[getLanguage()] || `Arxiu: ${coverage.observedDays} dies amb registres entre el ${first} i el ${last}. Els acumulats poden ser parcials. Els dies des de l’última pluja registrada no certifiquen una ratxa seca: hi pot haver buits.`;
}

function recentEpisodeRain(items) {
  const samples = items.filter(item => item.t >= Date.now() - 72 * 3600000).sort((a, b) => a.t - b.t);
  const wet = samples.map((item, index) => ({ t: item.t, rain: Math.max(0, number(item.rainIncrement) ?? 0), rate: Math.max(0, number(item.rainRate) ?? 0), index })).filter(item => item.rain > 0 || item.rate > 0);
  if (!wet.length || (Date.now() - wet.at(-1).t > 12 * 3600000 && (number(current?.rainRate) ?? 0) <= 0)) return null;
  let start = wet.at(-1).index;
  let previousWet = wet.at(-1).t;
  for (let index = wet.length - 2; index >= 0; index -= 1) {
    if (previousWet - wet[index].t > 6 * 3600000) break;
    start = wet[index].index;
    previousWet = wet[index].t;
  }
  return rainTotal(samples.slice(start));
}

function dryLabel(value) {
  if (value === null) return '—';
  return String(value);
}

function renderRainDashboard() {
  const totals = dailyRain(archive);
  const today = dateKey(Date.now());
  const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - DAY).toISOString().slice(0, 10);
  const month = today.slice(0, 7); const year = today.slice(0, 4);
  const totalFor = prefix => { const known = [...totals].filter(([key, value]) => key.startsWith(prefix) && value !== null); return known.length ? known.reduce((sum, [, value]) => sum + value, 0) : null; };
  const recent24h = archive.filter(item => item.t >= Date.now() - DAY);
  const yearItems = archive.filter(item => dateKey(item.t).startsWith(year) && totals.get(dateKey(item.t)) !== null);
  const yearCoverage = calendarCoverage(yearItems);
  const yearDays = [...totals].filter(([key, value]) => key.startsWith(year) && value !== null);
  const wettest = yearDays.sort((a, b) => b[1] - a[1])[0];
  set('data-rain-now', `${fmt(number(current?.rainRate))} mm/h`);
  set('data-rain-today', `${fmt(totals.get(today) ?? null)} mm`);
  set('data-rain-24h', `${fmt(rainTotal(recent24h))} mm`);
  set('data-rain-episode', `${fmt(recentEpisodeRain(archive))} mm`);
  set('data-rain-yesterday', `${fmt(totals.get(yesterday) ?? null)} mm`);
  set('data-rain-month', `${fmt(totalFor(month))} mm`);
  set('data-rain-year', `${fmt(totalFor(year))} mm`);
  set('data-rain-year-coverage', annualCoverageLabel(yearCoverage));
  set('data-rain-wet-days', yearDays.length ? String(yearDays.filter(([, value]) => value >= .1).length) : '—');
  set('data-rain-dry-days', dryLabel(daysSinceThreshold(totals, .1)));
  set('data-rain-since-1', dryLabel(daysSinceThreshold(totals, 1)));
  set('data-rain-since-10', dryLabel(daysSinceThreshold(totals, 10)));
  set('data-rain-since-20', dryLabel(daysSinceThreshold(totals, 20)));
  set('data-rain-wettest', wettest && wettest[1] > 0 ? `${fmt(wettest[1])} mm · ${new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' }).format(new Date(`${wettest[0]}T12:00:00`))}` : copy('Sense pluja registrada', 'Sin lluvia registrada', 'No recorded rain', 'Aucune pluie enregistrée'));
  set('data-rain-coverage', archiveCoverageLabel(calendarCoverage(archive)));
}

function periodSummary(items) {
  const continuity = intradayCoverage(items);
  return { temperature: weightedMean(items, 'temperature'), rain: rainTotal(items), samples: continuity.samples };
}

function renderPeriod(idPrefix, items) {
  const summary = periodSummary(items);
  set(`${idPrefix}-temp`, summary.temperature === null ? 'Sense dades' : `${fmt(summary.temperature)} °C`);
  set(`${idPrefix}-rain`, summary.samples ? `Mitjana · ${fmt(summary.rain)} mm · ${summary.samples} mostres` : 'Període encara no disponible');
}

function renderLast24HoursComparison() {
  const end = Date.now();
  const current24 = archive.filter(item => item.t >= end - DAY && item.t <= end);
  const previous24 = archive.filter(item => item.t >= end - 2 * DAY && item.t < end - DAY);
  const currentTemperature = weightedMean(current24, 'temperature');
  const previousTemperature = weightedMean(previous24, 'temperature');
  const currentRain = rainTotal(current24);
  const previousRain = rainTotal(previous24);
  const temperatureDelta = currentTemperature === null || previousTemperature === null ? null : currentTemperature - previousTemperature;
  set('data-summary-temp-24h', currentTemperature === null ? '—' : `${fmt(currentTemperature)} °C`);
  set('data-summary-temp-24h-note', temperatureDelta === null ? 'Calen 48 h de dades comparables' : Math.abs(temperatureDelta) < .1 ? 'Pràcticament igual que les 24 h anteriors' : `${fmt(Math.abs(temperatureDelta))} °C ${temperatureDelta > 0 ? 'més càlida' : 'més fresca'} que les 24 h anteriors`);
  set('data-summary-rain-24h', `${fmt(currentRain)} mm`);
  const difference = fmt(Math.abs(currentRain - previousRain));
  set('data-summary-rain-24h-note', currentRain !== null && previousRain !== null ? copy(
    `${difference} mm ${currentRain >= previousRain ? 'més' : 'menys'} registrats que les 24 h anteriors · cobertura possiblement parcial`,
    `${difference} mm ${currentRain >= previousRain ? 'más' : 'menos'} registrados que en las 24 h anteriores · cobertura posiblemente parcial`,
    `${difference} mm ${currentRain >= previousRain ? 'more' : 'less'} recorded than in the previous 24 h · coverage may be partial`,
    `${difference} mm enregistrés ${currentRain >= previousRain ? 'de plus' : 'de moins'} que durant les 24 h précédentes · couverture éventuellement partielle`
  ) : copy('Calen 48 h de dades comparables', 'Se necesitan 48 h de datos comparables', '48 h of comparable data needed', '48 h de données comparables nécessaires'));
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
  const items=normalizeArchive(history);const groups=new Map();
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
  host.innerHTML=filtered.length?filtered.map(item=>`<article class="is-${escapeHtml(item.type)}"><time datetime="${new Date(item.timestamp).toISOString()}">${new Intl.DateTimeFormat(getLocale(),{day:'numeric',month:'short',year:'numeric'}).format(item.timestamp)}</time><i></i><div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p><a href="${escapeHtml(item.href)}">${escapeHtml(item.source)} →</a></div></article>`).join(''):'<div class="weather-timeline__empty">No hi ha episodis d’aquest tipus dins del període disponible.</div>';
  set('data-weather-timeline-status',`${all.length} fites trobades · ${coverageLabel(calendarCoverage(periodItems))}`);
}

async function loadAlertTimeline(){
  try{const payload=await fetchAlertHistory({page:1,pageSize:50});alertArchive=Array.isArray(payload.items)?payload.items:[];}catch(error){console.warn('L’historial d’avisos no està disponible per a la cronologia.',error);alertArchive=[];}renderWeatherTimeline();
}

export function renderDataCenter(history = [], latest = null) {
  archive = normalizeArchive(history);
  current = latest;
  const items = selected();
  const temperatures = values(items, 'temperature');
  const gusts = values(items, 'windGust');
  const first = items[0]?.t;
  const last = items.at(-1)?.t;
  const coverage = calendarCoverage(items);
  const continuity = intradayCoverage(items);
  set('data-summary-samples', new Intl.NumberFormat(getLocale()).format(continuity.samples));
  set('data-summary-coverage', coverageLabel(coverage, continuity));
  set('data-summary-temp-mean', fmt(weightedMean(items, 'temperature')));
  set('data-summary-temp-deviation', temperatures.length ? `Desviació estàndard ${fmt(weightedDeviation(items, 'temperature'))} °C` : 'Desviació no disponible');
  set('data-summary-rain', fmt(rainTotal(items)));
  set('data-summary-gust', fmt(gusts.length ? Math.max(...gusts) : null));
  renderLast24HoursComparison();
  set('data-center-period-status', items.length ? `${activeDays === 365 ? 'Últim any' : `Últims ${activeDays} dies`} · del ${new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(first)} al ${new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(last)}` : 'No hi ha dades disponibles per a aquest període.');

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
    `Generat: ${new Date().toLocaleString(getLocale())}`,
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
  const activateTab = (next, { focus = false, syncUrl = true } = {}) => {
    activeTab = DATA_TABS.includes(next) ? next : 'summary';
    document.querySelectorAll('[data-data-center-tab]').forEach(button => {
      const selected = button.dataset.dataCenterTab === activeTab;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    document.querySelectorAll('[data-data-center-panel]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.dataCenterPanel === activeTab));
    if (syncUrl && document.body.dataset.page === 'centre-dades') {
      const url = new URL(window.location.href);
      if (activeTab === 'summary') url.searchParams.delete('tab');
      else url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
    document.dispatchEvent(new CustomEvent('observatori:data-tab-change', { detail: { tab: activeTab } }));
  };
  const tabButtons = [...document.querySelectorAll('[data-data-center-tab]')];
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button.dataset.dataCenterTab));
    button.addEventListener('keydown', event => {
      let target = null;
      if (event.key === 'ArrowRight') target = (index + 1) % tabButtons.length;
      if (event.key === 'ArrowLeft') target = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabButtons.length - 1;
      if (target === null) return;
      event.preventDefault();
      activateTab(tabButtons[target].dataset.dataCenterTab, { focus: true });
    });
  });
  const requestedTab = new URLSearchParams(window.location.search).get('tab');
  activateTab(requestedTab || activeTab, { syncUrl: false });
  document.querySelectorAll('[data-data-period]').forEach(button => button.addEventListener('click', () => {
    activeDays = Number(button.dataset.dataPeriod) || 30;
    document.querySelectorAll('[data-data-period]').forEach(item => item.classList.toggle('is-active', item === button));
    renderDataCenter(archive, current);
  }));
  document.querySelectorAll('[data-export-format]').forEach(button => button.addEventListener('click', () => runExport(button.dataset.exportFormat)));
  document.querySelectorAll('[data-timeline-filter]').forEach(button=>button.addEventListener('click',()=>{timelineFilter=button.dataset.timelineFilter||'all';document.querySelectorAll('[data-timeline-filter]').forEach(item=>item.classList.toggle('is-active',item===button));renderWeatherTimeline();}));
  document.addEventListener('observatori:language-change', () => { if (archive.length || current) renderDataCenter(archive, current); });
  loadAlertTimeline();
}
