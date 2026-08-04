import { CONFIG } from './config.js';
import { fetchAlerts, fetchCurrentWeather, fetchDataQuality, fetchForecast, fetchModelComparison, fetchStationHistory } from './api.js';
import { setText } from './utils.js';
import { renderStation } from '../modules/estacio.js';
import { renderCharts, renderMetricSparklines } from '../modules/grafiques.js';
import { initWebcam } from '../modules/webcams.js';
import { recordReading, normalizeRemoteHistory, summarizeRemoteHistory } from '../modules/historics.js';
import { renderForecast, renderForecastError, renderModelComparison, renderModelError, initForecastControls } from '../modules/prediccio.js';
import { renderSummary, renderSummaryFallback } from '../modules/resum.js';
import { initContact } from '../modules/contacte.js';
import { initRadar } from '../modules/radar.js';
import { renderAstronomy } from '../modules/astronomia.js';
import { renderExtremeArchive, initExtremeControls } from '../modules/extrems.js';
import { initModelViewer } from '../modules/models.js';
import { initNavigation, initWhenVisible } from '../modules/navigation.js';
import { renderDataQuality, renderDataQualityUnavailable } from '../modules/qualitat.js';
import { renderAlerts, renderAlertsUnavailable } from '../modules/avisos.js';
import { updateSituation } from '../modules/situacio.js';

const demo = { temperature:21.8, feelsLike:21.6, humidity:64, dewPoint:14.7, pressure:1017.4, windSpeed:6.2, windGust:13.1, windDirection:155, rainToday:0, rainRate:0, solarRadiation:null, uv:null, webcam:CONFIG.fallbackWebcam, updated:new Date().toISOString() };
let latest = demo;
let latestHistory = [];
let historyFetchedAt = 0;
let currentFetchedAt = 0;
let forecastFetchedAt = 0;
let qualityFetchedAt = 0;
let alertsFetchedAt = 0;

function updateClock(){ setText('header-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Madrid'}).format(new Date())); }
function setUpdated(value){ const date=value?new Date(String(value).replace(' ','T')):new Date(); const safe=Number.isNaN(date.getTime())?new Date():date; setText('updated-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(safe)); setText('webcam-time',`Captura ${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(new Date())}`); const mins=Math.max(0,Math.round((Date.now()-safe.getTime())/60000)); setText('updated-relative',mins<2?'ara mateix':`fa ${mins} min`); }
async function loadForecastSuite(){
  const [forecastResult,modelsResult]=await Promise.allSettled([fetchForecast(),fetchModelComparison()]);
  if(forecastResult.status==='fulfilled'){renderForecast(forecastResult.value);renderAstronomy(forecastResult.value);updateSituation({forecast:forecastResult.value});}else{renderForecastError();renderAstronomy(null);updateSituation({forecast:null});}
  if(modelsResult.status==='fulfilled')renderModelComparison(modelsResult.value);else renderModelError();
  forecastFetchedAt=Date.now();
}

async function loadHistory(){
  if(latestHistory.length&&Date.now()-historyFetchedAt<CONFIG.historyCacheMs)return latestHistory;
  const [recentResult,archiveResult]=await Promise.allSettled([
    fetchStationHistory(45,'hourly'),
    fetchStationHistory(365,'daily')
  ]);
  if(recentResult.status==='rejected'&&archiveResult.status==='rejected')throw recentResult.reason;
  const recent=recentResult.status==='fulfilled'?normalizeRemoteHistory(recentResult.value):[];
  const archive=archiveResult.status==='fulfilled'?normalizeRemoteHistory(archiveResult.value):[];
  const recentStart=recent[0]?.t ?? Infinity;
  const combined=[...archive.filter(item=>item.t<recentStart),...recent];
  latestHistory=[...new Map(combined.map(item=>[item.t,item])).values()].sort((a,b)=>a.t-b.t);
  historyFetchedAt=Date.now();
  return latestHistory;
}

async function loadQuality(){
  try { renderDataQuality(await fetchDataQuality()); }
  catch(error){ console.warn('Control avançat de qualitat no disponible.',error); renderDataQualityUnavailable(); }
  qualityFetchedAt=Date.now();
}

async function loadAlerts(){
  try {
    const payload=await fetchAlerts();
    renderAlerts(payload);
    updateSituation({alerts:payload});
  } catch(error) {
    console.warn('Avisos oficials no disponibles.',error);
    renderAlertsUnavailable();
    updateSituation({alerts:null});
  }
  alertsFetchedAt=Date.now();
}

async function load(){
  const label=document.getElementById('connection-label');
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
    renderStation(latest,context); renderCharts(latest,latestHistory); renderMetricSparklines(latest,latestHistory); renderExtremeArchive(latestHistory); setUpdated(latest.updated); updateSituation({current:latest});
    if(label){label.textContent='En directe';label.parentElement.classList.remove('is-offline');}
  } catch(error) {
    console.warn('No s’han pogut carregar les dades en directe.',error); latest=demo; renderStation(latest); renderCharts(latest,[]); renderMetricSparklines(latest,[]); renderExtremeArchive([]); setUpdated(latest.updated); updateSituation({current:latest});
    if(label){label.textContent='Mode demo';label.parentElement.classList.add('is-offline');}
  }
  currentFetchedAt=Date.now();
}
const periodLabels={ '24h':'Lectures de les últimes 24 hores','7d':'Evolució dels últims 7 dies','30d':'Evolució dels últims 30 dies','1y':'Evolució de l’últim any disponible' };
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-period]').forEach(b=>b.classList.remove('is-active'));button.classList.add('is-active');setText('evolution-period-copy',periodLabels[button.dataset.period]||'Històric disponible');renderCharts(latest,latestHistory,button.dataset.period);}));
initNavigation();
initWebcam();
initContact();
initForecastControls();
initExtremeControls();
initWhenVisible('.model-viewer',initModelViewer);
initWhenVisible('#territori',initRadar,'700px 0px');
updateClock();
setInterval(updateClock,1000);
load();
loadQuality();
loadAlerts();
loadForecastSuite();
setInterval(load,CONFIG.refreshMs);
setInterval(loadQuality,CONFIG.refreshMs);
setInterval(loadAlerts,CONFIG.alertsRefreshMs);
setInterval(loadForecastSuite,CONFIG.forecastRefreshMs);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)return;
  if(Date.now()-currentFetchedAt>CONFIG.refreshMs)load();
  if(Date.now()-qualityFetchedAt>CONFIG.refreshMs)loadQuality();
  if(Date.now()-alertsFetchedAt>CONFIG.alertsRefreshMs)loadAlerts();
  if(Date.now()-forecastFetchedAt>CONFIG.forecastRefreshMs)loadForecastSuite();
});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(error=>console.warn('Mode instal·lable no disponible.',error)));}
