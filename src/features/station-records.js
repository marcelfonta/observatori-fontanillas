import { getLanguage, getLocale } from '../core/i18n.js';

const MAIN_RECORDS = ['temperature_high', 'temperature_low', 'wind_gust', 'rain_day', 'rain_rate', 'uv_high'];
const LABELS = {
  temperature_high:{ca:'Temperatura màxima',es:'Temperatura máxima',en:'Highest temperature',fr:'Température maximale'},
  temperature_low:{ca:'Temperatura mínima',es:'Temperatura mínima',en:'Lowest temperature',fr:'Température minimale'},
  wind_gust:{ca:'Ratxa màxima',es:'Racha máxima',en:'Highest wind gust',fr:'Rafale maximale'},
  rain_day:{ca:'Dia més plujós',es:'Día más lluvioso',en:'Wettest day',fr:'Jour le plus pluvieux'},
  rain_rate:{ca:'Intensitat màxima',es:'Intensidad máxima',en:'Highest rain rate',fr:'Intensité maximale'},
  pressure_high:{ca:'Pressió màxima',es:'Presión máxima',en:'Highest pressure',fr:'Pression maximale'},
  pressure_low:{ca:'Pressió mínima',es:'Presión mínima',en:'Lowest pressure',fr:'Pression minimale'},
  humidity_high:{ca:'Humitat màxima',es:'Humedad máxima',en:'Highest humidity',fr:'Humidité maximale'},
  humidity_low:{ca:'Humitat mínima',es:'Humedad mínima',en:'Lowest humidity',fr:'Humidité minimale'},
  solar_high:{ca:'Radiació màxima',es:'Radiación máxima',en:'Highest solar radiation',fr:'Rayonnement maximal'},
  uv_high:{ca:'Índex UV màxim',es:'Índice UV máximo',en:'Highest UV index',fr:'Indice UV maximal'}
};

let latestPayload = null;
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[character]);
const localeText = values => values[getLanguage()] || values.ca;

export function recordAge(occurredAt, now = Date.now()) {
  const timestamp = new Date(occurredAt).getTime();
  if (!Number.isFinite(timestamp)) return '';
  const days = Math.max(0, Math.floor((now - timestamp) / 86400000));
  if (days === 0) return localeText({ca:'avui',es:'hoy',en:'today',fr:"aujourd’hui"});
  if (days === 1) return localeText({ca:'fa 1 dia',es:'hace 1 día',en:'1 day ago',fr:'il y a 1 jour'});
  if (days < 31) return localeText({ca:`fa ${days} dies`,es:`hace ${days} días`,en:`${days} days ago`,fr:`il y a ${days} jours`});
  const months = Math.floor(days / 30.4375);
  if (months === 1) return localeText({ca:'fa 1 mes',es:'hace 1 mes',en:'1 month ago',fr:'il y a 1 mois'});
  if (months < 12) return localeText({ca:`fa ${months} mesos`,es:`hace ${months} meses`,en:`${months} months ago`,fr:`il y a ${months} mois`});
  const years = Math.floor(days / 365.25);
  if (years === 1) return localeText({ca:'fa 1 any',es:'hace 1 año',en:'1 year ago',fr:'il y a 1 an'});
  return localeText({ca:`fa ${years} anys`,es:`hace ${years} años`,en:`${years} years ago`,fr:`il y a ${years} ans`});
}

function formattedValue(record) {
  const digits = ['humidity_high','humidity_low','solar_high'].includes(record.key) ? 0 : 1;
  const value = new Intl.NumberFormat(getLocale(), { minimumFractionDigits:digits, maximumFractionDigits:digits }).format(Number(record.value));
  return `${value}${record.unit ? ` ${record.unit}` : ''}`;
}

function recordDate(record) {
  const options = record.dateOnly ? { dateStyle:'medium' } : { dateStyle:'medium', timeStyle:'short' };
  const date = new Intl.DateTimeFormat(getLocale(), options).format(new Date(record.occurredAt));
  return record.dateOnly ? `${date} · ${localeText({ca:'dia complet',es:'día completo',en:'full day',fr:'journée complète'})}` : date;
}

function recordCard(record) {
  const label = LABELS[record.key] ? localeText(LABELS[record.key]) : record.key;
  return `<article class="station-record-card" data-record-key="${escapeHtml(record.key)}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(formattedValue(record))}</strong><time datetime="${escapeHtml(record.occurredAt)}">${escapeHtml(recordDate(record))}</time><small>${escapeHtml(recordAge(record.occurredAt))}</small></article>`;
}

function render(payload) {
  latestPayload = payload;
  const records = Array.isArray(payload?.records) ? payload.records.filter(record => Number.isFinite(Number(record.value)) && record.occurredAt) : [];
  const main = document.getElementById('station-records-main');
  const complete = document.getElementById('station-records-complete');
  const status = document.getElementById('station-records-status');
  if (main) main.innerHTML = records.filter(record => MAIN_RECORDS.includes(record.key)).sort((a,b)=>MAIN_RECORDS.indexOf(a.key)-MAIN_RECORDS.indexOf(b.key)).map(record => recordCard(record)).join('');
  if (complete) complete.innerHTML = records.map(record => recordCard(record)).join('');
  if (status) {
    const since = payload?.archive?.firstObservation ? new Intl.DateTimeFormat(getLocale(), { dateStyle:'medium' }).format(new Date(payload.archive.firstObservation)) : null;
    status.textContent = since
      ? localeText({ca:`Rècords de l’arxiu Fontanillas des del ${since}; no són rècords climàtics oficials.`,es:`Récords del archivo Fontanillas desde el ${since}; no son récords climáticos oficiales.`,en:`Fontanillas archive records since ${since}; these are not official climate records.`,fr:`Records des archives Fontanillas depuis le ${since} ; il ne s’agit pas de records climatiques officiels.`})
      : localeText({ca:'Cobertura inicial de l’arxiu pendent.',es:'Cobertura inicial del archivo pendiente.',en:'Archive coverage is not available yet.',fr:'La couverture des archives est encore indisponible.'});
  }
}

function renderUnavailable() {
  const copy = localeText({ca:'Els rècords tornaran a estar disponibles quan es recuperi l’accés a l’arxiu.',es:'Los récords volverán a estar disponibles cuando se recupere el acceso al archivo.',en:'Records will return when archive access is restored.',fr:"Les records seront à nouveau disponibles lorsque l’accès aux archives sera rétabli."});
  for (const id of ['station-records-main','station-records-complete']) { const node=document.getElementById(id); if(node)node.innerHTML=`<p class="station-records-empty">${escapeHtml(copy)}</p>`; }
}

export async function initStationRecords(fetchRecords) {
  try { render(await fetchRecords()); }
  catch (error) { console.warn('Rècords històrics no disponibles.', error); renderUnavailable(); }
  document.addEventListener('observatori:language-change', () => { if (latestPayload) render(latestPayload); });
}
