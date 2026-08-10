// Observatori Meteorològic Fontanillas — app.js · V7 Fase 1
import { CONFIG } from './core/config.js';
import { fetchAlerts, fetchCurrentWeather, fetchDataQuality, fetchForecast, fetchModelComparison, fetchStationHistory, getLastCachedObs } from './services/weather-api.js';
import { setText } from './core/dom.js';
import { renderStation } from './modules/estacio.js';
import { renderCharts, renderMetricSparklines } from './modules/grafiques.js';
import { initWebcam } from './modules/webcams.js';
import { recordReading, normalizeRemoteHistory, summarizeRemoteHistory } from './modules/historics.js';
import { renderForecast, renderForecastError, renderModelComparison, renderModelError, initForecastControls } from './modules/prediccio.js';
import { renderSummary, renderSummaryFallback } from './modules/resum.js';
import { initContact } from './modules/contacte.js';
import { initRadar } from './modules/radar.js';
import { renderAstronomy } from './modules/astronomia.js';
import { renderExtremeArchive, initExtremeControls } from './modules/extrems.js';
import { initModelViewer } from './modules/models.js';
import { initNavigation, initWhenVisible } from './modules/navigation.js';
import { renderDataQuality, renderDataQualityUnavailable } from './modules/qualitat.js';
import { renderAlerts, renderAlertsUnavailable } from './modules/avisos.js';
import { updateSituation } from './modules/situacio.js';
import { initShare } from './features/share.js';
import { initPortal } from './features/portal-router.js';
import { initDataCenter, renderDataCenter } from './features/data-center.js';
import { initEnvironment, updateEnvironmentStation } from './features/environment.js';
import { initMeteoAI, initMeteoAIWidget, updateMeteoAIContext } from './features/meteo-ai.js';

const demo = { temperature:21.8, feelsLike:21.6, humidity:64, dewPoint:14.7, pressure:1017.4, windSpeed:6.2, windGust:13.1, windDirection:155, rainToday:0, rainRate:0, solarRadiation:null, uv:null, webcam:CONFIG.fallbackWebcam, updated:new Date().toISOString() };
let latest = demo;
let latestHistory = [];
let historyFetchedAt = 0;
let currentFetchedAt = 0;
let forecastFetchedAt = 0;
let qualityFetchedAt = 0;
let alertsFetchedAt = 0;

const OFFLINE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hores
function showOfflineBanner(ageMinutes){ const banner=document.getElementById('offline-banner'); if(!banner)return; banner.textContent=`Mostrant dades de fa ${ageMinutes} min (mode sense connexió)`; banner.hidden=false; }
function hideOfflineBanner(){ const banner=document.getElementById('offline-banner'); if(banner)banner.hidden=true; }
function updateClock(){ setText('header-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Madrid'}).format(new Date())); }
function setUpdated(value){ const date=value?new Date(String(value).replace(' ','T')):new Date(); const safe=Number.isNaN(date.getTime())?new Date():date; setText('updated-time',new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(safe)); setText('webcam-time',`Captura ${new Intl.DateTimeFormat(CONFIG.locale,{hour:'2-digit',minute:'2-digit'}).format(new Date())}`); const mins=Math.max(0,Math.round((Date.now()-safe.getTime())/60000)); setText('updated-relative',mins<2?'ara mateix':`fa ${mins} min`); }
async function loadForecastSuite(){
  const [forecastResult,modelsResult]=await Promise.allSettled([fetchForecast(),fetchModelComparison()]);
  if(forecastResult.status==='fulfilled'){renderForecast(forecastResult.value);initWhenVisible('#cel-nocturn', () => renderAstronomy(forecastResult.value));updateSituation({forecast:forecastResult.value});updateMeteoAIContext({forecast:forecastResult.value});}else{renderForecastError();initWhenVisible('#cel-nocturn', () => renderAstronomy(null));updateSituation({forecast:null});updateMeteoAIContext({forecast:null});}
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
  } catch(error) {
    console.warn('Avisos oficials no disponibles.',error);
    renderAlertsUnavailable();
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
    renderStation(latest,context); renderCharts(latest,latestHistory); renderMetricSparklines(latest,latestHistory); renderExtremeArchive(latestHistory); renderDataCenter(latestHistory,latest); setUpdated(latest.updated); updateSituation({current:latest}); updateMeteoAIContext({current:latest,history:latestHistory});
    hideOfflineBanner();
    if(label){label.textContent='En directe';label.parentElement.classList.remove('is-offline');}
  } catch(error) {
    console.warn('No s’han pogut carregar les dades en directe.',error);
    const cached=getLastCachedObs();
    if(cached && (Date.now()-cached.ts)<OFFLINE_MAX_AGE_MS){
      latest=cached.data; renderStation(latest); renderCharts(latest,[]); renderMetricSparklines(latest,[]); renderExtremeArchive([]); renderDataCenter([],latest); setUpdated(latest.updated); updateSituation({current:latest}); updateMeteoAIContext({current:latest,history:[]});
      showOfflineBanner(cached.ageMinutes);
      if(label){label.textContent='Sense connexió';label.parentElement.classList.add('is-offline');}
    } else {
      latest=demo; renderStation(latest); renderCharts(latest,[]); renderMetricSparklines(latest,[]); renderExtremeArchive([]); renderDataCenter([],latest); setUpdated(latest.updated); updateSituation({current:latest}); updateMeteoAIContext({current:null,history:[]});
      hideOfflineBanner();
      if(label){label.textContent='Mode demo';label.parentElement.classList.add('is-offline');}
    }
  }
  updateEnvironmentStation(latest);
  currentFetchedAt=Date.now();
}
const periodLabels={ '24h':'Lectures de les últimes 24 hores','7d':'Evolució dels últims 7 dies','30d':'Evolució dels últims 30 dies','1y':'Evolució de l’últim any disponible' };
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-period]').forEach(b=>b.classList.remove('is-active'));button.classList.add('is-active');setText('evolution-period-copy',periodLabels[button.dataset.period]||'Històric disponible');renderCharts(latest,latestHistory,button.dataset.period);}));
initPortal();
initNavigation();
initWebcam();
initContact();
initForecastControls();
initExtremeControls();
initDataCenter();
initMeteoAI();
initMeteoAIWidget();
initShare();
document.addEventListener('observatori:alerts-updated',event=>updateSituation({alerts:event.detail}));
initWhenVisible('.model-viewer',initModelViewer);
initWhenVisible('#territori',initRadar,'700px 0px');
initWhenVisible('#medi-ambient',initEnvironment,'600px 0px');
if(document.body.dataset.page==='meteo-ia')initEnvironment();
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
async function refreshAfterResume(force=false){
  const now=Date.now();
  const minAge=CONFIG.foregroundRefreshMinMs || 30000;
  if(force || now-currentFetchedAt>minAge) await load();
  if(force || now-qualityFetchedAt>CONFIG.refreshMs) loadQuality();
  if(force || now-alertsFetchedAt>CONFIG.alertsRefreshMs) loadAlerts();
  if(force || now-forecastFetchedAt>CONFIG.forecastRefreshMs) loadForecastSuite();
}
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden) refreshAfterResume(false);
});
window.addEventListener('pageshow',event=>{
  // Especialment important en PWA/iPhone, que pot restaurar una vista congelada des de memòria.
  refreshAfterResume(Boolean(event.persisted));
});
window.addEventListener('focus',()=>refreshAfterResume(false));
