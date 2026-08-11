import { CONFIG } from '../core/config.js';
import { initFooterSocial } from './footer-social.js';

const TOKEN_KEY='fontanillas-admin-session-v1';
const incidents=[];
const performanceMetrics={lcp:null,cls:null,inp:null,ttfb:null};
const performanceObservers=[];
let token='';
let latestDiagnostic=null;
let refreshTimer=null;
const element=id=>document.getElementById(id);
const text=(id,value)=>{const node=element(id);if(node)node.textContent=value ?? '—';};
const number=value=>Number.isFinite(Number(value))?Number(value):null;
const formatNumber=value=>number(value)===null?'—':new Intl.NumberFormat('ca-ES').format(number(value));
const formatDecimal=(value,digits=1)=>number(value)===null?'—':number(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const formatDate=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(date);};

export function serviceState(value){return value?{label:'Configurat',className:'is-ok'}:{label:'No configurat',className:'is-muted'};}
export function analyticsServiceState({googleMeasurementId='',cloudflareBeacon=false,cloudflareEnabled=false}={}){if(cloudflareBeacon)return {label:'Cloudflare actiu',className:'is-ok',provider:'cloudflare',detected:true};if(cloudflareEnabled)return {label:'Actiu al domini',className:'is-ok',provider:'cloudflare',detected:false};if(googleMeasurementId)return {label:'Google actiu',className:'is-ok',provider:'google',detected:true};return {label:'No configurat',className:'is-muted',provider:'none',detected:false};}
export function overallState(payload){if(!payload?.ok)return {label:'No disponible',className:'is-error'};if(!payload.station?.ok||!payload.alerts?.ok)return {label:'Cal revisar serveis',className:'is-warning'};return {label:'Sistema operatiu',className:'is-ok'};}
export function performanceRating(metric,value){
  if(!Number.isFinite(value))return 'pending';
  const thresholds={lcp:[2500,4000],inp:[200,500],cls:[0.1,0.25],ttfb:[800,1800]};
  const [good,poor]=thresholds[metric]||[Infinity,Infinity];
  return value<=good?'good':value<=poor?'needs-improvement':'poor';
}

function setCard(name,state,label,detail){const card=document.querySelector(`[data-admin-card="${name}"]`);card?.classList.remove('is-ok','is-warning','is-error','is-muted');card?.classList.add(state);text(`admin-${name}-state`,label);text(`admin-${name}-detail`,detail);}
function setPill(id,label,state){const node=element(id);if(!node)return;node.textContent=label;node.className=`admin-status-pill ${state}`;}

function performanceSnapshot(){return {...performanceMetrics};}
function renderPerformanceSnapshot(){
  const metrics=performanceSnapshot();
  text('admin-lcp',Number.isFinite(metrics.lcp)?`${Math.round(metrics.lcp)} ms`:'Esperant pintura');
  text('admin-cls',Number.isFinite(metrics.cls)?metrics.cls.toFixed(3):'No mesurable');
  text('admin-inp',Number.isFinite(metrics.inp)?`${Math.round(metrics.inp)} ms`:'Interactua amb el panell');
  text('admin-ttfb',Number.isFinite(metrics.ttfb)?`${Math.round(metrics.ttfb)} ms`:'No mesurable');
  const ratings=['lcp','cls','ttfb'].map(metric=>performanceRating(metric,metrics[metric]));
  if(Number.isFinite(metrics.inp))ratings.push(performanceRating('inp',metrics.inp));
  const poor=ratings.includes('poor');
  const warning=ratings.includes('needs-improvement');
  const pending=ratings.includes('pending');
  const label=poor?'Cal millorar':warning?'A observar':pending?'Recollint dades':'Bona localment';
  setPill('admin-performance-pill',label,poor?'is-error':warning||pending?'is-warning':'is-ok');
  text('admin-performance-context',Number.isFinite(metrics.inp)?'Mesura local d’aquesta càrrega; no s’envia a cap servei extern.':'Fes alguna interacció amb el panell per completar l’INP. Les dades no surten del navegador.');
  return metrics;
}
function observePerformance(){
  const navigation=performance.getEntriesByType?.('navigation')?.[0];
  if(navigation)performanceMetrics.ttfb=Math.max(0,navigation.responseStart-navigation.startTime);
  if(typeof PerformanceObserver==='undefined'){renderPerformanceSnapshot();return;}
  const supported=PerformanceObserver.supportedEntryTypes||[];
  const observe=(type,callback,options={})=>{
    if(!supported.includes(type))return;
    try{const observer=new PerformanceObserver(list=>{callback(list.getEntries());renderPerformanceSnapshot();});observer.observe({type,buffered:true,...options});performanceObservers.push(observer);}catch{}
  };
  observe('largest-contentful-paint',entries=>{const last=entries.at(-1);if(last)performanceMetrics.lcp=last.startTime;});
  if(supported.includes('layout-shift'))performanceMetrics.cls=0;
  observe('layout-shift',entries=>{entries.forEach(entry=>{if(!entry.hadRecentInput)performanceMetrics.cls+=entry.value;});});
  observe('event',entries=>{entries.forEach(entry=>{if(entry.interactionId&&(!Number.isFinite(performanceMetrics.inp)||entry.duration>performanceMetrics.inp))performanceMetrics.inp=entry.duration;});},{durationThreshold:40});
  renderPerformanceSnapshot();
}
async function localPwaStatus(){const serviceWorker='serviceWorker'in navigator?(navigator.serviceWorker.controller?'Actiu i controlant la pàgina':'Disponible, encara no actiu'):'No compatible';const installed=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone===true?'Sí':'No';let cacheCount=null;try{cacheCount='caches'in window?(await caches.keys()).length:null;}catch{cacheCount=null;}text('admin-service-worker',serviceWorker);text('admin-installed',installed);text('admin-cache-count',cacheCount===null?'No consultable':String(cacheCount));setPill('admin-pwa-pill',serviceWorker.startsWith('Actiu')?'Operativa':'Disponible',serviceWorker.startsWith('Actiu')?'is-ok':'is-warning');return {serviceWorker,installed,cacheCount};}
function cloudflareAnalyticsDetected(){const script=Boolean(document.querySelector('script[src*="static.cloudflareinsights.com/beacon"]'));const resource=performance.getEntriesByType?.('resource')?.some(entry=>String(entry.name).includes('static.cloudflareinsights.com/beacon'));return script||Boolean(resource);}
function renderIntegrations(integrations={}){const analytics=analyticsServiceState({googleMeasurementId:CONFIG.analyticsMeasurementId,cloudflareBeacon:cloudflareAnalyticsDetected(),cloudflareEnabled:Boolean(CONFIG.cloudflareWebAnalyticsEnabled)});const socialCount=[integrations.socialToken,integrations.bluesky,integrations.telegram].filter(Boolean).length;const socialState=socialCount===3?{label:'4 canals preparats',className:'is-ok'}:socialCount?{label:`${socialCount}/3 credencials`,className:'is-warning'}:{label:'No configurat',className:'is-muted'};const states={weatherUnderground:serviceState(Boolean(integrations.weatherUnderground)),database:serviceState(Boolean(integrations.database)),contact:serviceState(Boolean(integrations.contact)),pushClient:serviceState(Boolean(CONFIG.oneSignalAppId)),pushWorker:serviceState(Boolean(integrations.push)),admin:serviceState(Boolean(integrations.admin)),analytics,social:socialState};document.querySelectorAll('#admin-integrations > [data-integration]').forEach(row=>{const state=states[row.dataset.integration]||serviceState(false);const badge=row.querySelector('b');badge.textContent=state.label;badge.className=state.className;});const required=Boolean(integrations.weatherUnderground&&integrations.database&&integrations.admin);setPill('admin-integrations-pill',required?'Principals actives':'Configuració incompleta',required?'is-ok':'is-warning');return analytics;}

function renderSocialQueue(social={}){
  const draftMode=social.mode!=='publish';
  text('admin-social-mode',draftMode?'Només esborranys':'Publicació');
  text('admin-social-token',social.tokenConfigured?'Configurada':'No configurada');
  text('admin-social-bluesky',social.channelCredentials?.bluesky?'Configurada':'No configurada');
  text('admin-social-telegram',social.channelCredentials?.telegram?'Configurada':'No configurada');
  text('admin-social-drafts',formatNumber(social.pendingDrafts??0));
  text('admin-social-last',formatDate(social.latestCreated));
  setPill('admin-social-pill',draftMode?'Mode segur':'Publicació activa',draftMode?'is-ok':'is-warning');
  const list=element('admin-social-list');
  if(!list)return;
  const recent=Array.isArray(social.recent)?social.recent:[];
  if(!recent.length){const empty=document.createElement('li');empty.textContent='Encara no hi ha esborranys.';list.replaceChildren(empty);return;}
  list.replaceChildren(...recent.map(item=>{const entry=document.createElement('li');const title=document.createElement('strong');const meta=document.createElement('span');title.textContent=item.title||'Resum meteorològic';meta.textContent=`${formatDate(item.createdAt||item.created_at)} · ${item.status==='draft'?'pendent de revisió':item.status||'esborrany'}`;entry.append(title,meta);return entry;}));
}

async function renderPublicationReadiness(){
  const checks=await Promise.all(['sitemap.xml','robots.txt','privacitat.html'].map(async path=>{try{const response=await fetch(path,{cache:'no-store'});return response.ok;}catch{return false;}}));
  text('admin-sitemap',checks[0]?(CONFIG.searchConsoleSitemapSubmitted?'Publicat · processat':'Publicat'):'No disponible');text('admin-robots',checks[1]?'Publicat':'No disponible');text('admin-privacy',checks[2]?'Publicada':'No disponible');
  text('admin-search-console',CONFIG.searchConsoleVerified?'Verificada per DNS':CONFIG.googleSiteVerification?'Meta configurat':'Pendent de confirmar');
  const navigation=performance.getEntriesByType('navigation')[0];const loadMs=navigation?Math.round(navigation.loadEventEnd||performance.now()):null;text('admin-navigation-time',loadMs?`${loadMs} ms · navegador actual`:'No mesurable');
  const ready=checks.every(Boolean);setPill('admin-publication-pill',ready?'Base preparada':'Cal revisar',ready?'is-ok':'is-warning');
  return {sitemap:checks[0],sitemapSubmitted:Boolean(CONFIG.searchConsoleSitemapSubmitted),robots:checks[1],privacy:checks[2],searchConsoleVerified:Boolean(CONFIG.searchConsoleVerified),searchConsoleMeta:Boolean(CONFIG.googleSiteVerification),navigationMs:loadMs};
}

async function renderDashboard(payload,requestLatency){
  const analytics=renderIntegrations(payload.integrations);
  renderSocialQueue(payload.social);
  latestDiagnostic={...payload,client:{webVersion:'21.0.2',requestLatencyMs:requestLatency,pwa:await localPwaStatus(),publication:await renderPublicationReadiness(),performance:renderPerformanceSnapshot(),analyticsConfigured:analytics.provider!=='none',analyticsProvider:analytics.provider,analyticsDetectedOnPage:Boolean(analytics.detected),oneSignalClientConfigured:Boolean(CONFIG.oneSignalAppId),socialAutomation:'draft-queue'},incidents:[...incidents]};
  const overall=overallState(payload);text('admin-overall-status',overall.label);text('admin-last-update',`Actualitzat ${formatDate(payload.generatedAt)} · ${requestLatency} ms`);
  setCard('worker',payload.ok?'is-ok':'is-error',payload.ok?'Operatiu':'Error',`V${payload.worker?.version||'—'} · ${payload.latencyMs??'—'} ms`);
  const stationOk=Boolean(payload.station?.ok);setCard('station',stationOk?'is-ok':'is-warning',stationOk?'Al dia':'Cal revisar',payload.station?.ageMinutes===null?'Antiguitat desconeguda':`${payload.station.ageMinutes} min d’antiguitat`);
  const databaseOk=Boolean(payload.database?.enabled);setCard('database',databaseOk?'is-ok':'is-warning',databaseOk?'Connectada':'No disponible',databaseOk?`${formatNumber(payload.database.observations)} observacions`:'Sense D1');
  const alertsOk=Boolean(payload.alerts?.ok);setCard('alerts',alertsOk?'is-ok':'is-warning',alertsOk?(payload.alerts.active?`${payload.alerts.active} actius`:'Sense avisos'):'No verificats',alertsOk?`Nivell ${payload.alerts.maxLevel||'none'}`:'Cal consultar la font oficial');
  text('admin-worker-version',payload.worker?.version?`V${payload.worker.version}`:'—');text('admin-environment',payload.worker?.environment||'—');
  text('admin-observation-time',formatDate(payload.station?.updated));text('admin-observation-age',payload.station?.ageMinutes===null?'—':`${payload.station.ageMinutes} min`);text('admin-availability',payload.station?.storage?.availability24h===undefined?'—':`${formatDecimal(payload.station.storage.availability24h)}%`);text('admin-samples',payload.station?.storage?`${formatNumber(payload.station.storage.samples24h)} / ${formatNumber(payload.station.storage.expected24h)}`:'—');text('admin-missing',payload.station?.missingFields?.length?payload.station.missingFields.join(', '):'Cap');text('admin-station-latency',payload.station?.latencyMs===null?'—':`${payload.station.latencyMs} ms`);setPill('admin-quality-pill',stationOk?'Correcta':'Cal revisar',stationOk?'is-ok':'is-warning');
  text('admin-observations',formatNumber(payload.database?.observations));text('admin-coverage',payload.database?.coverageDays===undefined?'—':`${formatDecimal(payload.database.coverageDays)} dies`);text('admin-storage-last',formatDate(payload.database?.lastObservation));text('admin-alert-events',formatNumber(payload.database?.alertEvents));text('admin-alert-last',formatDate(payload.database?.latestAlertEvent));text('admin-contact-count',formatNumber(payload.database?.contactRequests24h));setPill('admin-storage-pill',databaseOk?'Connectada':'No disponible',databaseOk?'is-ok':'is-warning');
  element('admin-dashboard').hidden=false;element('admin-login').hidden=true;
}

function showLogin(message='',isError=false){element('admin-dashboard').hidden=true;element('admin-login').hidden=false;text('admin-login-status',message);element('admin-login-status')?.classList.toggle('is-error',isError);element('admin-token')?.focus();}
async function fetchStatus(){if(!token){showLogin();return;}const refresh=element('admin-refresh');if(refresh){refresh.disabled=true;refresh.textContent='Comprovant…';}const started=performance.now();try{const response=await fetch(`${CONFIG.apiUrl}/admin/status`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});const payload=await response.json().catch(()=>({error:'Resposta no vàlida'}));if(response.status===401){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('La clau no és correcta.',true);return;}if(response.status===429){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('Massa intents fallits. Espera quinze minuts abans de tornar-ho a provar.',true);return;}if(response.status===503&&payload.code==='ADMIN_NOT_CONFIGURED'){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('Cal configurar primer la clau privada al Worker.',true);return;}if(!response.ok)throw new Error(payload.error||`Error ${response.status}`);await renderDashboard(payload,Math.round(performance.now()-started));}catch(error){recordIncident('Connexió',error.message);text('admin-overall-status','No s’ha pogut actualitzar');text('admin-last-update',error.message);if(element('admin-dashboard').hidden)showLogin('No s’ha pogut connectar amb el Worker.',true);}finally{if(refresh){refresh.disabled=false;refresh.textContent='Actualitzar';}}}
function recordIncident(type,message){incidents.unshift({time:new Date().toISOString(),type,message:String(message||'Error desconegut').slice(0,240)});if(incidents.length>20)incidents.pop();const list=element('admin-incident-list');if(list){list.replaceChildren(...incidents.map(item=>{const entry=document.createElement('li');entry.innerHTML=`<time>${formatDate(item.time)}</time><b></b><span></span>`;entry.querySelector('b').textContent=item.type;entry.querySelector('span').textContent=item.message;return entry;}));}text('admin-incident-count',`${incidents.length} ${incidents.length===1?'incidència':'incidències'}`);}
async function copyDiagnostic(){if(!latestDiagnostic)return;const safe=JSON.stringify(latestDiagnostic,null,2);try{await navigator.clipboard.writeText(safe);text('admin-last-update','Diagnòstic copiat sense incloure la clau');}catch{recordIncident('Portapapers','No s’ha pogut copiar el diagnòstic.');}}
function init(){initFooterSocial();observePerformance();window.addEventListener('error',event=>recordIncident('JavaScript',event.message));window.addEventListener('unhandledrejection',event=>recordIncident('Promesa',event.reason?.message||event.reason));element('admin-login-form')?.addEventListener('submit',event=>{event.preventDefault();token=String(new FormData(event.currentTarget).get('token')||'').trim();if(token.length<24){showLogin('La clau és massa curta.',true);return;}sessionStorage.setItem(TOKEN_KEY,token);fetchStatus();});element('admin-refresh')?.addEventListener('click',fetchStatus);element('admin-copy-diagnostic')?.addEventListener('click',copyDiagnostic);element('admin-logout')?.addEventListener('click',()=>{sessionStorage.removeItem(TOKEN_KEY);token='';latestDiagnostic=null;showLogin('Sessió tancada.');});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token)fetchStatus();});token=sessionStorage.getItem(TOKEN_KEY)||'';if(token)fetchStatus();else showLogin();refreshTimer=setInterval(()=>{if(token&&!document.hidden)fetchStatus();},120000);window.addEventListener('pagehide',()=>{clearInterval(refreshTimer);performanceObservers.forEach(observer=>observer.disconnect());},{once:true});}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
