// Observatori Meteorològic Fontanillas — app.js · V7 Fase 1
import { CONFIG } from './core/config.js';
import { fetchAlerts, fetchCurrentWeather, fetchDataQuality, fetchForecast, fetchLongRangeForecast, fetchModelComparison, fetchStationHistory, fetchStationRecords, getLastCachedForecast, getLastCachedObs } from './services/weather-api.js';
import { setText } from './core/dom.js';
import { renderStation } from './modules/estacio.js';
import { renderCharts, renderMetricSparklines } from './modules/grafiques.js';
import { loadChartJs } from './modules/chart-loader.js';
import { initWebcam } from './modules/webcams.js';
import { recordReading, normalizeRemoteHistory, summarizeRemoteHistory } from './modules/historics.js';
import { renderForecast, renderForecastError, renderModelComparison, renderModelError, initForecastControls } from './modules/prediccio.js';
import { renderSummary, renderSummaryFallback } from './modules/resum.js';
import { initContact } from './modules/contacte.js';
import { initRadar } from './modules/radar.js';
import { renderAstronomy } from './modules/astronomia.js';
import { renderExtremeArchive, initExtremeControls } from './modules/extrems.js';
import { initModelViewer } from './modules/models.js';
import { initNavigation, initWhenVisible, loadDeferredAssets } from './modules/navigation.js';
import { renderDataQuality, renderDataQualityUnavailable } from './modules/qualitat.js';
import { renderAlerts, renderAlertsUnavailable } from './modules/avisos.js';
import { updateSituation } from './modules/situacio.js';
import { initShare, updateShareContext } from './features/share.js';
import { initPortal } from './features/portal-router.js';
import { initMeteoAI, initMeteoAIWidget, updateMeteoAIContext } from './features/meteo-ai.js';
import { initLearning } from './features/learning.js';
import { initFooterSocial } from './features/footer-social.js';
import { updateSeoObservation } from './features/seo.js';
import { initHomeDensity } from './features/home-density.js';
import { getLocale, initLanguage } from './core/i18n.js';
import { initHeaderTools } from './features/header-tools.js';
import { initStationRecords } from './features/station-records.js';
import { initHomeNow, updateHomeNow } from './features/home-now.js';

const demo = { temperature:21.8, feelsLike:21.6, humidity:64, dewPoint:14.7, pressure:1017.4, windSpeed:6.2, windGust:13.1, windDirection:155, rainToday:0, rainRate:0, solarRadiation:null, uv:null, webcam:CONFIG.fallbackWebcam, updated:new Date().toISOString() };
let latest = demo;
let latestHistory = [];
let historyFetchedAt = 0;
let currentFetchedAt = 0;
let forecastFetchedAt = 0;
let qualityFetchedAt = 0;
let alertsFetchedAt = 0;
let chartsAvailable = false;
let chartPeriod = '24h';
let chartData = null;
let chartHistory = [];
let loadInFlight = null;
let forecastInFlight = null;
const ACTIVE_PAGE=document.body.dataset.page || document.documentElement.dataset.portalPage || 'inici';
const HISTORY_PAGES=new Set(['inici','meteo-ia','estacio','verificacio','histories','centre-dades']);
const QUALITY_PAGES=new Set(['inici','estacio','centre-dades']);
const ALERT_PAGES=new Set(['inici','meteo-ia','prediccio','avisos']);
const FORECAST_PAGES=new Set(['inici','meteo-ia','prediccio','llarg-termini','videos','verificacio','cel','avisos','histories']);
const ENVIRONMENT_PAGES=new Set(['medi-ambient','meteo-ia']);

let dataCenterModulePromise;
let environmentModulePromise;
let weatherStoriesModulePromise;
const getDataCenterModule=()=>dataCenterModulePromise ||= import('./features/data-center.js');
const getEnvironmentModule=()=>environmentModulePromise ||= import('./features/environment.js');
const getWeatherStoriesModule=()=>weatherStoriesModulePromise ||= import('./features/weather-stories.js');
function loadRouteFeature(loader,label){
  return loader().catch(error=>console.warn(`${label} no s’ha pogut carregar.`,error));
}
function renderDataCenterSafely(history,current){
  if(ACTIVE_PAGE!=='centre-dades')return;
  loadRouteFeature(()=>getDataCenterModule().then(module=>module.renderDataCenter(history,current)),'El Centre de Dades');
}

const OFFLINE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hores
function updateWeatherStoriesSafely(payload){
  if(ACTIVE_PAGE!=='histories')return;
  loadRouteFeature(()=>getWeatherStoriesModule().then(module=>module.updateWeatherStories(payload)),'Les històries meteorològiques');
}
function showOfflineBanner(ageMinutes,message=''){ const banner=document.getElementById('offline-banner'); if(!banner)return; banner.textContent=message||`Mostrant dades de fa ${ageMinutes} min (mode sense connexió)`; banner.hidden=false; }
function hideOfflineBanner(){ const banner=document.getElementById('offline-banner'); if(banner)banner.hidden=true; }
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fetchCurrentWeatherResilient(){
  try{return await fetchCurrentWeather();}
  catch(firstError){
    // Una pestanya restaurada, un canvi de xarxa o una actualització del Worker
    // poden fer fallar només la primera petició. Evitem declarar tot el portal
    // «sense connexió» abans de fer un segon intent curt i segur.
    await wait(1200);
    try{return await fetchCurrentWeather();}
    catch{throw firstError;}
  }
}
function refreshCharts(data, history = [], period = chartPeriod) {
  chartData=data; chartHistory=history; chartPeriod=period;
  if (!chartsAvailable) return;
  renderCharts(chartData,chartHistory,chartPeriod); renderMetricSparklines(chartData,chartHistory);
}
async function enableCharts(){try{await loadChartJs();chartsAvailable=true;if(chartData)refreshCharts(chartData,chartHistory,chartPeriod);}catch(error){console.warn('Les gràfiques no estan disponibles ara mateix.',error);}}
function updateClock(){ setText('header-time',new Intl.DateTimeFormat(getLocale(),{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Madrid'}).format(new Date())); }
function setUpdated(value){ const date=value?new Date(String(value).replace(' ','T')):new Date(); const safe=Number.isNaN(date.getTime())?new Date():date; setText('updated-time',new Intl.DateTimeFormat(getLocale(),{hour:'2-digit',minute:'2-digit'}).format(safe)); const mins=Math.max(0,Math.round((Date.now()-safe.getTime())/60000)); setText('updated-relative',mins<2?'ara mateix':`fa ${mins} min`); }
async function performForecastLoad(){
  const cached=getLastCachedForecast();
  if(cached){renderForecast(cached.data);updateHomeNow({forecast:cached.data});setText('forecast-status',`Previsió desada · fa ${cached.ageMinutes} min`);}
  const forecastTask=fetchForecast().then(data=>{renderForecast(data);updateHomeNow({forecast:data});initWhenVisible('#cel-nocturn',()=>renderAstronomy(data));updateSituation({forecast:data});updateMeteoAIContext({forecast:data});updateShareContext({forecast:data});}).catch(error=>{console.warn('Previsió principal temporalment no disponible.',error);if(cached){setText('forecast-status',`Última previsió disponible · fa ${cached.ageMinutes} min`);updateHomeNow({forecast:cached.data});initWhenVisible('#cel-nocturn',()=>renderAstronomy(cached.data));updateSituation({forecast:cached.data});updateMeteoAIContext({forecast:cached.data});updateShareContext({forecast:cached.data});}else{renderForecastError();updateHomeNow({forecast:null});initWhenVisible('#cel-nocturn',()=>renderAstronomy(null));updateSituation({forecast:null});updateMeteoAIContext({forecast:null});updateShareContext({forecast:null});}});
  const modelsTask=fetchModelComparison().then(data=>{renderModelComparison(data);updateHomeNow({models:data});}).catch(error=>{console.warn('Comparació de models temporalment no disponible.',error);renderModelError();updateHomeNow({models:null});});
  await Promise.allSettled([forecastTask,modelsTask]);
  forecastFetchedAt=Date.now();
}
function loadForecastSuite(){
  if(forecastInFlight)return forecastInFlight;
  const pending=performForecastLoad().finally(()=>{
    if(forecastInFlight===pending)forecastInFlight=null;
  });
  forecastInFlight=pending;
  return pending;
}

let longRangeLoaded=false;
async function loadLongRange(){
  if(longRangeLoaded)return;
  longRangeLoaded=true;
  const module=await import('./features/long-range.js');
  try{module.renderLongRangeForecast(await fetchLongRangeForecast());}
  catch(error){console.warn('Tendència de llarg termini no disponible.',error);module.renderLongRangeError();}
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
    renderAlerts(payload);updateShareContext({alerts:payload});
  } catch(error) {
    console.warn('Avisos oficials no disponibles.',error);
    renderAlertsUnavailable();updateHomeNow({alerts:{ok:false}});updateShareContext({alerts:null});
  }
  alertsFetchedAt=Date.now();
}

async function performLoad(){
  const label=document.getElementById('connection-label');
  try {
    latest=await fetchCurrentWeatherResilient();
    const localContext=recordReading(latest);
    let context;
    try {
      if(HISTORY_PAGES.has(ACTIVE_PAGE)){
        await loadHistory();
        context=summarizeRemoteHistory(latest,latestHistory,localContext.stats);
        renderSummary(context.summary,latestHistory.length);
      }else{
        context=localContext;
        latestHistory=context.history;
      }
    } catch(historyError) {
      console.warn('Històric remot no disponible.',historyError);
      context=localContext;
      latestHistory=context.history;
      renderSummaryFallback();
    }
    renderStation(latest,context); updateHomeNow({current:latest}); refreshCharts(latest,latestHistory); renderExtremeArchive(latestHistory); renderDataCenterSafely(latestHistory,latest); updateWeatherStoriesSafely({history:latestHistory}); setUpdated(latest.updated); updateSeoObservation(latest); updateSituation({current:latest}); updateMeteoAIContext({current:latest,history:latestHistory});updateShareContext({current:latest});
    if(latest.degraded){showOfflineBanner(latest.ageMinutes,latest.sourceMessage||`Weather Underground no respon. Mostrant l’última lectura fiable de fa ${latest.ageMinutes} min.`);if(label){label.textContent='Dades de suport';label.parentElement.classList.add('is-offline');}}
    else{hideOfflineBanner();if(label){label.textContent='En directe';label.parentElement.classList.remove('is-offline');}}
  } catch(error) {
    console.warn('No s’han pogut carregar les dades en directe.',error);
    const cached=getLastCachedObs();
    if(cached && (Date.now()-cached.ts)<OFFLINE_MAX_AGE_MS){
      latest=cached.data; renderStation(latest); updateHomeNow({current:{...latest,degraded:true,ageMinutes:cached.ageMinutes}}); refreshCharts(latest,[]); renderExtremeArchive([]); renderDataCenterSafely([],latest); updateWeatherStoriesSafely({history:[]}); setUpdated(latest.updated); updateSeoObservation(latest); updateSituation({current:latest}); updateMeteoAIContext({current:latest,history:[]});updateShareContext({current:latest});
      const browserOffline=typeof navigator!=='undefined'&&navigator.onLine===false;
      showOfflineBanner(cached.ageMinutes,browserOffline
        ? `Sense connexió. Mostrant l’última lectura desada de fa ${cached.ageMinutes} min.`
        : `Servei temporalment no disponible. Mostrant una lectura desada de fa ${cached.ageMinutes} min; reintentarem automàticament.`);
      if(label){label.textContent=browserOffline?'Sense connexió':'Reconnectant…';label.parentElement.classList.add('is-offline');}
    } else {
      latest=demo; renderStation(latest); updateHomeNow({current:null}); refreshCharts(latest,[]); renderExtremeArchive([]); renderDataCenterSafely([],latest); updateWeatherStoriesSafely({history:[]}); setUpdated(latest.updated); updateSeoObservation(null); updateSituation({current:latest}); updateMeteoAIContext({current:null,history:[]});updateShareContext({current:null});
      hideOfflineBanner();
      if(label){label.textContent='Mode demo';label.parentElement.classList.add('is-offline');}
    }
  }
  if(ENVIRONMENT_PAGES.has(ACTIVE_PAGE))loadRouteFeature(()=>getEnvironmentModule().then(module=>module.updateEnvironmentStation(latest)),'Les dades ambientals');
  currentFetchedAt=Date.now();
}
function load(){
  if(loadInFlight)return loadInFlight;
  const pending=performLoad().finally(()=>{
    if(loadInFlight===pending)loadInFlight=null;
  });
  loadInFlight=pending;
  return pending;
}
const periodLabels={ '24h':'Lectures de les últimes 24 hores','7d':'Evolució dels últims 7 dies','30d':'Evolució dels últims 30 dies','1y':'Evolució de l’últim any disponible' };
document.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-period]').forEach(b=>b.classList.remove('is-active'));button.classList.add('is-active');setText('evolution-period-copy',periodLabels[button.dataset.period]||'Històric disponible');refreshCharts(latest,latestHistory,button.dataset.period);}));
document.addEventListener('observatori:data-period-change',event=>{
  const days=Number(event.detail?.days)||30;const chartPeriod=days===365?'1y':`${days}d`;const label=days===365?'1 any':`${days} dies`;
  const chartButton=document.querySelector(`[data-period="${chartPeriod}"]`);if(chartButton)chartButton.click();
  const extremeButton=document.querySelector(`[data-extreme-period="${days}"]`);if(extremeButton)extremeButton.click();
  setText('data-evolution-period-label',`Període del Centre de Dades · ${label}`);setText('data-extremes-period-label',`Període del Centre de Dades · ${label}`);
});
document.addEventListener('observatori:data-tab-change',event=>{
  if(event.detail?.tab!=='charts')return;
  enableCharts().then(()=>requestAnimationFrame(()=>window.dispatchEvent(new Event('resize'))));
});
initLanguage();
initHomeNow();
initPortal();
if(ACTIVE_PAGE==='terra')loadRouteFeature(()=>import('./features/earth-observation.js').then(module=>module.initEarthObservation()),'El visor de la Terra');
if(ACTIVE_PAGE==='avisos')loadRouteFeature(()=>import('./features/estofex-local.js').then(module=>module.initEstofexLocal()),'La vigilància ESTOFEX');
if(ACTIVE_PAGE==='histories')loadRouteFeature(()=>getWeatherStoriesModule().then(module=>module.initWeatherStories()),'Les històries meteorològiques');
if(ACTIVE_PAGE==='resums')loadRouteFeature(()=>import('./features/monthly-summaries.js').then(module=>module.initMonthlySummaries()),'Els resums climatològics');
initHeaderTools();
if(ACTIVE_PAGE==='llarg-termini')loadRouteFeature(()=>import('./features/seasonal-outlook.js').then(module=>module.initSeasonalOutlook()),'La previsió estacional');
if(['estacio','centre-dades'].includes(document.body.dataset.page))initStationRecords(fetchStationRecords);
if(document.body.dataset.page==='inici')initWhenVisible('.metrics-grid',enableCharts,'0px 0px');
if(document.body.dataset.page==='estacio')initWhenVisible('#calculats',enableCharts,'0px 0px');
if(document.body.dataset.page==='centre-dades')initWhenVisible('#tendencies',enableCharts,'200px 0px');
initNavigation();
if(['inici','webcams'].includes(ACTIVE_PAGE))initWebcam();
initContact();
initForecastControls();
initExtremeControls();
if(ACTIVE_PAGE==='centre-dades')loadRouteFeature(()=>getDataCenterModule().then(module=>module.initDataCenter()),'El Centre de Dades');
initMeteoAI();
initMeteoAIWidget();
initShare();
initLearning();
initFooterSocial();
initHomeDensity();
if(ACTIVE_PAGE==='videos')loadRouteFeature(()=>import('./features/forecast-videos.js').then(module=>module.initForecastVideos()),'La predicció en vídeo');
if(ACTIVE_PAGE==='avisos')loadRouteFeature(()=>import('./modules/civil-protection.js').then(module=>module.initCivilProtectionPlans()),'Els plans de protecció civil');
if(ACTIVE_PAGE==='verificacio')initWhenVisible('#forecast-verification',()=>loadRouteFeature(()=>import('./features/forecast-verification.js').then(module=>module.initForecastVerification()),'La verificació de la previsió'),'700px 0px');
document.addEventListener('observatori:alerts-updated',event=>updateSituation({alerts:event.detail}));
initWhenVisible('.model-viewer',initModelViewer);
initWhenVisible('#long-range',loadLongRange,'900px 0px');
initWhenVisible('#territori',initRadar,'700px 0px');
initWhenVisible('#medi-ambient',()=>loadRouteFeature(()=>getEnvironmentModule().then(module=>module.initEnvironment()),'El visor ambiental'),'600px 0px');
initWhenVisible('#avisos',()=>loadDeferredAssets('#avisos'),'600px 0px');
if(document.body.dataset.page==='meteo-ia')loadRouteFeature(()=>getEnvironmentModule().then(module=>module.initEnvironment()),'El visor ambiental');
updateClock();
setInterval(updateClock,1000);
load();
if(QUALITY_PAGES.has(ACTIVE_PAGE))loadQuality();
if(ALERT_PAGES.has(ACTIVE_PAGE))loadAlerts();
if(FORECAST_PAGES.has(ACTIVE_PAGE))loadForecastSuite();
setInterval(load,CONFIG.refreshMs);
if(QUALITY_PAGES.has(ACTIVE_PAGE))setInterval(loadQuality,CONFIG.refreshMs);
if(ALERT_PAGES.has(ACTIVE_PAGE))setInterval(loadAlerts,CONFIG.alertsRefreshMs);
if(FORECAST_PAGES.has(ACTIVE_PAGE))setInterval(loadForecastSuite,CONFIG.forecastRefreshMs);
async function refreshAfterResume(force=false){
  const now=Date.now();
  const minAge=CONFIG.foregroundRefreshMinMs || 30000;
  if(force || now-currentFetchedAt>minAge) await load();
  if(QUALITY_PAGES.has(ACTIVE_PAGE)&&(force || now-qualityFetchedAt>CONFIG.refreshMs)) loadQuality();
  if(ALERT_PAGES.has(ACTIVE_PAGE)&&(force || now-alertsFetchedAt>CONFIG.alertsRefreshMs)) loadAlerts();
  if(FORECAST_PAGES.has(ACTIVE_PAGE)&&(force || now-forecastFetchedAt>CONFIG.forecastRefreshMs)) loadForecastSuite();
}
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden) refreshAfterResume(false);
});
window.addEventListener('pageshow',event=>{
  // Especialment important en PWA/iPhone, que pot restaurar una vista congelada des de memòria.
  refreshAfterResume(Boolean(event.persisted));
});
window.addEventListener('focus',()=>refreshAfterResume(false));
window.addEventListener('online',()=>refreshAfterResume(true));
