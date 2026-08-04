import { CONFIG } from './config.js';
import { fetchCurrentWeather, fetchForecast, fetchModelComparison, fetchStationHistory } from './api.js';
import { setText } from './utils.js';
import { renderStation } from '../modules/estacio.js';
import { renderCharts, renderMetricSparklines } from '../modules/grafiques.js';
import { initWebcam } from '../modules/webcams.js';
import { recordReading, normalizeRemoteHistory, summarizeRemoteHistory } from '../modules/historics.js';
import { renderForecast, renderForecastError, renderModelComparison, renderModelError, renderFourLookComparison, renderFourLookError, initForecastControls } from '../modules/prediccio.js';
import { renderSummary, renderSummaryFallback } from '../modules/resum.js';
import { initContact } from '../modules/contacte.js';
import { initRadar } from '../modules/radar.js';
import { renderAstronomy } from '../modules/astronomia.js';
import { renderExtremeArchive, initExtremeControls } from '../modules/extrems.js';
import { initModelViewer } from '../modules/models.js';

const demo = { temperature:21.8, feelsLike:21.6, humidity:64, dewPoint:14.7, pressure:1017.4, windSpeed:6.2, windGust:13.1, windDirection:155, rainToday:0, rainRate:0, solarRadiation:null, uv:null, webcam:CONFIG.fallbackWebcam, updated:new Date().toISOString() };
let latest = demo;
let latestHistory = [];
let historyFetchedAt = 0;

function updateClock(){ setText('header-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())); }
function setUpdated(value){ const date=value?new Date(String(value).replace(' ','T')):new Date(); const safe=Number.isNaN(date.getTime())?new Date():date; setText('updated-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(safe)); setText('webcam-time',`Captura ${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(new Date())}`); const mins=Math.max(0,Math.round((Date.now()-safe.getTime())/60000)); setText('updated-relative',mins<2?'ara mateix':`fa ${mins} min`); }
async function loadForecastSuite(){
  const [forecastResult,modelsResult]=await Promise.allSettled([fetchForecast(),fetchModelComparison()]);
  if(forecastResult.status==='fulfilled'){renderForecast(forecastResult.value);renderAstronomy(forecastResult.value);}else{renderForecastError();renderAstronomy(null);}
  if(modelsResult.status==='fulfilled')renderModelComparison(modelsResult.value);else renderModelError();
  if(forecastResult.status==='fulfilled')renderFourLookComparison({best:forecastResult.value});else renderFourLookError();
}

async function loadHistory(){
  if(latestHistory.length&&Date.now()-historyFetchedAt<30*60*1000)return latestHistory;
  let remote;
  try { remote=await fetchStationHistory(365); }
  catch { remote=await fetchStationHistory(31); }
  latestHistory=normalizeRemoteHistory(remote);
  historyFetchedAt=Date.now();
  return latestHistory;
}

async function load(){
  const label=document.getElementById('connection-label');
  loadForecastSuite();
  try {
    latest=await fetchCurrentWeather();
    let context;
    try {
      await loadHistory();
      context=summarizeRemoteHistory(latest,latestHistory);
      renderSummary(context.summary,latestHistory.length);
    } catch(historyError) {
      console.warn('Històric remot no disponible.',historyError);
      context=recordReading(latest);
      latestHistory=context.history;
      renderSummaryFallback();
    }
    renderStation(latest,context); renderCharts(latest,latestHistory); renderMetricSparklines(latest,latestHistory); renderExtremeArchive(latestHistory); setUpdated(latest.updated);
    if(label){label.textContent='En directe';label.parentElement.classList.remove('is-offline');}
  } catch(error) {
    console.warn('No s’han pogut carregar les dades en directe.',error); latest=demo; renderStation(latest); renderCharts(latest,[]); renderMetricSparklines(latest,[]); renderExtremeArchive([]); setUpdated(latest.updated);
    if(label){label.textContent='Mode demo';label.parentElement.classList.add('is-offline');}
  }
}
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-period]').forEach(b=>b.classList.remove('is-active'));button.classList.add('is-active');renderCharts(latest,latestHistory,button.dataset.period);}));
initWebcam(); initContact(); initForecastControls(); initExtremeControls(); initModelViewer(); initRadar(); updateClock(); setInterval(updateClock,1000); load(); setInterval(load,CONFIG.refreshMs);
