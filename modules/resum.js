import { cardinal, format, setText } from '../js/utils.js';

function time(item) { return item?.time ? new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(new Date(String(item.time).replace(' ','T'))) : '—'; }
function delta(id, value, suffix) {
  const node=document.getElementById(id); if(!node)return;
  if(!Number.isFinite(value)){node.textContent='—';node.className='';return;}
  const stable=Math.abs(value)<.05; node.textContent=stable?`→ estable`:`${value>0?'↗ +':'↘ '}${format(value,1)}${suffix}`; node.className=stable?'':value>0?'is-up':'is-down';
}

export function renderSummary(summary, count) {
  setText('remote-history-status',`${count} lectures horàries reals disponibles`);
  setText('today-high',format(summary.high?.temperatureMax ?? summary.high?.temperature,1)); setText('today-high-time',time(summary.high));
  setText('today-low',format(summary.low?.temperatureMin ?? summary.low?.temperature,1)); setText('today-low-time',time(summary.low));
  setText('trend-period',summary.comparisonHours?`Fa ${summary.comparisonHours} h`:'Sense comparativa');
  delta('change-temp',summary.deltaTemperature,' °C'); delta('change-pressure',summary.deltaPressure,' hPa'); delta('change-humidity',summary.deltaHumidity,' %');
  setText('max-gust',format(summary.gust?.windGust,1)); setText('max-gust-direction',cardinal(summary.gust?.windDirection)); setText('max-gust-time',time(summary.gust));
  setText('rain-24h',format(summary.rain24h,1)); setText('rain-observed-today',`${format(summary.rainToday,1)} mm`); setText('wet-hours',`${summary.wetHours} ${summary.wetHours===1?'hora':'hores'} amb pluja`);
}

export function renderSummaryFallback() { setText('remote-history-status','Històric temporalment no disponible'); }
