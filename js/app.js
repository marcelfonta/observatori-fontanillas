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
function setBrandFavicon(){
  const canvas=document.createElement('canvas'); canvas.width=64; canvas.height=64;
  const ctx=canvas.getContext('2d'); if(!ctx)return;
  ctx.fillStyle='#0b1b17'; ctx.beginPath(); ctx.roundRect(2,2,60,60,15); ctx.fill();
  ctx.strokeStyle='rgba(197,231,208,.35)'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#e6c56c'; ctx.beginPath(); ctx.arc(46,18,7,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#4f8f6b'; ctx.beginPath(); ctx.moveTo(7,49); ctx.lineTo(25,23); ctx.lineTo(38,41); ctx.lineTo(46,32); ctx.lineTo(59,49); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#89d6a3'; ctx.beginPath(); ctx.moveTo(8,51); ctx.lineTo(29,30); ctx.lineTo(42,51); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#77b7c8'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(10,53); ctx.lineTo(20,53); ctx.lineTo(24,47); ctx.lineTo(29,56); ctx.lineTo(35,53); ctx.lineTo(54,53); ctx.stroke();
  const link=document.getElementById('site-favicon'); if(link)link.href=canvas.toDataURL('image/png');
}
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
setBrandFavicon();
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
