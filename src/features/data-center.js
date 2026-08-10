const DAY = 86400000;
const locale = 'ca-ES';

let archive = [];
let current = null;
let activeDays = 30;

const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const values = (items, key, fallback) => items.map(item => number(item[key] ?? (fallback ? item[fallback] : null))).filter(value => value !== null);
const mean = list => list.length ? list.reduce((total, value) => total + value, 0) / list.length : null;
const deviation = list => { const average = mean(list); return average === null ? null : Math.sqrt(list.reduce((total, value) => total + (value - average) ** 2, 0) / list.length); };
const fmt = (value, digits = 1) => value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat(locale, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; };
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

function periodSummary(items) {
  const temperatures = values(items, 'temperature');
  return { temperature: mean(temperatures), rain: rainTotal(items), samples: items.length };
}

function renderPeriod(idPrefix, items) {
  const summary = periodSummary(items);
  set(`${idPrefix}-temp`, summary.temperature === null ? 'Sense dades' : `${fmt(summary.temperature)} °C de mitjana`);
  set(`${idPrefix}-rain`, summary.samples ? `${fmt(summary.rain)} mm · ${summary.samples} mostres` : 'Període encara no disponible');
}

function renderEphemeris() {
  const now = new Date();
  const todayKey = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const matches = archive.filter(item => {
    const date = new Date(item.t);
    return date.getFullYear() < now.getFullYear() && `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === todayKey;
  });
  if (!matches.length) {
    set('data-ephemeris-copy', 'Encara no hi ha prou anys d’arxiu per comparar aquesta data. L’espai s’omplirà automàticament a mesura que creixi l’històric.');
    return;
  }
  const highs = values(matches, 'temperatureMax', 'temperature');
  const lows = values(matches, 'temperatureMin', 'temperature');
  const years = [...new Set(matches.map(item => new Date(item.t).getFullYear()))];
  set('data-ephemeris-copy', `${years.length} ${years.length === 1 ? 'any comparable' : 'anys comparables'} · màxima ${fmt(highs.length ? Math.max(...highs) : null)} °C · mínima ${fmt(lows.length ? Math.min(...lows) : null)} °C.`);
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
  renderEphemeris();
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
}
