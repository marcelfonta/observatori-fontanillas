import { CONFIG } from './config.js';
import { fetchCurrentWeather } from './api.js';
import { setText } from './utils.js';
import { renderStation } from '../modules/estacio.js';
import { renderCharts } from '../modules/grafiques.js';
import { initWebcam } from '../modules/webcams.js';

const demo = { temperature:21.8, feelsLike:21.6, humidity:64, dewPoint:14.7, pressure:1017.4, windSpeed:6.2, windGust:13.1, windDirection:155, rainToday:0, rainRate:0, uv:null, webcam:CONFIG.fallbackWebcam, updated:new Date().toISOString() };
let latest = demo;

function updateClock(){ setText('header-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())); }
function setUpdated(value){ const date=value?new Date(String(value).replace(' ','T')):new Date(); const safe=Number.isNaN(date.getTime())?new Date():date; setText('updated-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(safe)); setText('webcam-time',`Captura ${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(new Date())}`); const mins=Math.max(0,Math.round((Date.now()-safe.getTime())/60000)); setText('updated-relative',mins<2?'ara mateix':`fa ${mins} min`); }
async function load(){
  const label=document.getElementById('connection-label');
  try { latest=await fetchCurrentWeather(); renderStation(latest); renderCharts(latest); setUpdated(latest.updated); if(label){label.textContent='En directe';label.parentElement.classList.remove('is-offline');} }
  catch(error){ console.warn('No s’han pogut carregar les dades en directe.',error); latest=demo; renderStation(latest); renderCharts(latest); setUpdated(latest.updated); if(label){label.textContent='Mode demo';label.parentElement.classList.add('is-offline');} }
}
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-period]').forEach(b=>b.classList.remove('is-active'));button.classList.add('is-active');renderCharts(latest,button.dataset.period);}));
initWebcam(); updateClock(); setInterval(updateClock,1000); load(); setInterval(load,CONFIG.refreshMs);
