import { format, isNumber, setText } from '../js/utils.js';

let completeHistory = [];
let activeDays = 1;

function values(items, keys) {
  return items.flatMap(item => keys.map(key => item[key])).filter(isNumber).map(Number);
}

function mean(items) {
  return items.length ? items.reduce((sum,value)=>sum+value,0) / items.length : NaN;
}

function accumulatedRain(items) {
  return items.reduce((total,item,index) => {
    const current = Number(item.rainTotal);
    const previous = Number(items[index-1]?.rainTotal);
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return total;
    return total + (current >= previous ? current - previous : current);
  },0);
}

function periodLabel(days) { return days === 1 ? 'les últimes 24 hores' : days === 365 ? 'l’últim any' : `els últims ${days} dies`; }

function render(days = activeDays) {
  activeDays = days;
  const end = completeHistory.at(-1)?.t || Date.now();
  const start = end - days * 86400000;
  const selected = completeHistory.filter(item => item.t >= start && item.t <= end);
  const availableSpan = completeHistory.length > 1 ? Math.max(1,(end-completeHistory[0].t)/86400000) : 0;
  const usedSpan = selected.length > 1 ? Math.max(1,(end-selected[0].t)/86400000) : 0;
  setText('extremes-coverage',selected.length ? `${selected.length} lectures · ${format(usedSpan,0)} dies coberts de ${periodLabel(days)}` : `Encara no hi ha lectures per a ${periodLabel(days)}`);

  const temperatureMax = values(selected,['temperatureMax','temperature']);
  const temperatureMin = values(selected,['temperatureMin','temperature']);
  const rainRate = values(selected,['rainRate']);
  const gusts = values(selected,['windGust']);
  const winds = values(selected,['windSpeed']);
  const solar = values(selected,['solarRadiation']);
  const daytimeSolar = solar.filter(value=>value>0);
  const uv = values(selected,['uv']);
  const pressuresMin = values(selected,['pressureMin','pressure']);
  const pressuresMax = values(selected,['pressureMax','pressure']);
  const humidityMin = values(selected,['humidityMin','humidity']);
  const humidityMax = values(selected,['humidityMax','humidity']);

  setText('extreme-temp-max',format(temperatureMax.length?Math.max(...temperatureMax):NaN,1));
  setText('extreme-temp-min',format(temperatureMin.length?Math.min(...temperatureMin):NaN,1));
  setText('extreme-rain-total',format(accumulatedRain(selected),1));
  setText('extreme-rain-rate',format(rainRate.length?Math.max(...rainRate):NaN,1));
  setText('extreme-wind-gust',format(gusts.length?Math.max(...gusts):NaN,1));
  setText('extreme-wind-mean',format(mean(winds),1));
  setText('extreme-solar-max',format(solar.length?Math.max(...solar):NaN,0));
  setText('extreme-solar-mean',format(mean(daytimeSolar),0));
  setText('extreme-uv-max',format(uv.length?Math.max(...uv):NaN,1));
  setText('extreme-uv-high-hours',format(uv.filter(value=>value>=6).length,0));
  setText('extreme-pressure-range',pressuresMin.length&&pressuresMax.length?`${format(Math.min(...pressuresMin),0)}–${format(Math.max(...pressuresMax),0)} hPa`:'—');
  setText('extreme-humidity-range',humidityMin.length&&humidityMax.length?`${format(Math.min(...humidityMin),0)}–${format(Math.max(...humidityMax),0)}%`:'—');

  if (days > availableSpan && completeHistory.length) {
    setText('extremes-coverage',`${selected.length} lectures · ${format(availableSpan,0)} dies reals disponibles dels ${days===365?'365':days} sol·licitats`);
  }
}

export function renderExtremeArchive(history) {
  completeHistory = Array.isArray(history) ? history : [];
  render(activeDays);
}

export function initExtremeControls() {
  document.querySelectorAll('[data-extreme-period]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-extreme-period]').forEach(item=>item.classList.remove('is-active'));
    button.classList.add('is-active');
    render(Number(button.dataset.extremePeriod));
  }));
}
