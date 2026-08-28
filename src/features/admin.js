import { CONFIG } from '../core/config.js';
import { initFooterSocial } from './footer-social.js';

const TOKEN_KEY='fontanillas-admin-session-v1';
const incidents=[];
const performanceMetrics={lcp:null,cls:null,inp:null,ttfb:null};
const performanceObservers=[];
let token='';
let latestDiagnostic=null;
let refreshTimer=null;
let socialFilter='';
let socialDrafts=[];
const SOCIAL_PAGE_SIZE=6;
let socialOffset=0;
let socialHasMore=false;
let socialCredentials={meta:false,facebook:false,instagram:false,bluesky:false,telegram:false,threads:false,tiktok:false};
let socialEditorDirty=false;
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
function renderIntegrations(integrations={}){const analytics=analyticsServiceState({googleMeasurementId:CONFIG.analyticsMeasurementId,cloudflareBeacon:cloudflareAnalyticsDetected(),cloudflareEnabled:Boolean(CONFIG.cloudflareWebAnalyticsEnabled)});const socialCount=[integrations.facebook,integrations.instagram,integrations.bluesky,integrations.telegram,integrations.threads].filter(Boolean).length;const socialState=socialCount===5?{label:'5 canals preparats',className:'is-ok'}:socialCount?{label:`${socialCount}/5 canals`,className:'is-warning'}:{label:'No configurat',className:'is-muted'};const states={weatherUnderground:serviceState(Boolean(integrations.weatherUnderground)),database:serviceState(Boolean(integrations.database)),contact:serviceState(Boolean(integrations.contact)),pushClient:serviceState(Boolean(CONFIG.oneSignalAppId)),pushWorker:serviceState(Boolean(integrations.push)),advancedAI:integrations.advancedAI?{label:'Disponible',className:'is-ok'}:{label:'Mode local actiu',className:'is-warning'},admin:serviceState(Boolean(integrations.admin)),analytics,social:socialState,youtube:integrations.youtube?{label:'Credencials preparades',className:'is-ok'}:{label:'Flux extern no verificat',className:'is-warning'}};document.querySelectorAll('#admin-integrations > [data-integration]').forEach(row=>{const state=states[row.dataset.integration]||serviceState(false);const badge=row.querySelector('b');badge.textContent=state.label;badge.className=state.className;});const required=Boolean(integrations.weatherUnderground&&integrations.database&&integrations.admin);setPill('admin-integrations-pill',required?'Principals actives':'Configuració incompleta',required?'is-ok':'is-warning');return analytics;}

function renderSocialQueue(social={}){
  const automatic=social.mode==='automatic';
  text('admin-social-mode',automatic?`Automàtic · ${social.schedule||'08:00'}`:'Revisió manual');
  text('admin-social-facebook',social.channelCredentials?.facebook?'Configurada':'No configurada');
  text('admin-social-instagram',social.channelCredentials?.instagram?'Configurada':'No configurada');
  text('admin-social-bluesky',social.channelCredentials?.bluesky?'Configurada':'No configurada');
  text('admin-social-telegram',social.channelCredentials?.telegram?'Configurada':'No configurada');
  text('admin-social-threads',social.channelCredentials?.threads?'Configurada':'No configurada');
  text('admin-social-tiktok',social.channelCredentials?.bufferTikTok?(social.bufferTikTokAutomationEnabled?'Clau preparada · automatització activa':'Clau preparada · automatització apagada'):'Pendent de configurar Buffer');
  text('admin-social-drafts',formatNumber(social.pendingDrafts??0));
  text('admin-social-approved',formatNumber(social.approved??0));
  text('admin-social-published',formatNumber(social.published??0));
  text('admin-social-last',formatDate(social.latestCreated));
  text('admin-social-preflight',social.preflight?.checkedAt?`${social.preflight.status==='healthy'?'Correcta':'Cal revisar'} · ${formatDate(social.preflight.checkedAt)}`:'Pendent de la primera comprovació');
  setPill('admin-social-pill',automatic?'Automàtic actiu':'Revisió manual',automatic?'is-ok':'is-warning');
  socialCredentials={...socialCredentials,...(social.channelCredentials||{})};
}

function renderOperations(operations={},schedule={}){
  const scheduler=operations.scheduler;
  const social=operations.social;
  const push=operations.push;
  const youtube=operations.youtube;
  const bufferTikTok=operations.bufferTikTok;
  const bufferDiagnostics=operations.bufferTikTokDiagnostics;
  text('admin-scheduler-last',formatDate(scheduler?.checkedAt));
  text('admin-scheduler-state',scheduler?scheduler.status==='healthy'?`Correcte · ${scheduler.detail?.jobs??0} processos`:`Error · ${scheduler.detail?.failed??1} processos`:'Pendent de la primera execució V22.5');
  text('admin-social-schedule',`${schedule.social||'08:00'} · ${schedule.timeZone||'Europe/Madrid'}`);
  text('admin-social-operation',social?.checkedAt?`${social.status==='healthy'?'Correcta':'Incompleta'} · ${formatDate(social.checkedAt)}`:'Encara no registrada');
  text('admin-push-operation',push?.checkedAt?`${push.status==='healthy'?'Enviat':'Error'} · ${formatDate(push.checkedAt)}`:'Encara no s’ha enviat cap avís');
  text('admin-push-recipients',push?.detail?.sent?formatNumber(push.detail.recipients):push?.detail?.reason==='not_configured'?'No configurat':'—');
  text('admin-youtube-schedule',`${schedule.youtube||'07:20,19:45'} · ${schedule.timeZone||'Europe/Madrid'}`);
  text('admin-youtube-operation',youtube?.checkedAt?`${youtube.status==='healthy'?'Correcte':'Error'} · ${formatDate(youtube.checkedAt)}`:'Pendent del primer disparador');
  text('admin-buffer-diagnostics',bufferDiagnostics?.checkedAt?`${bufferDiagnostics.status==='healthy'?'Correcta':'Error'} · ${formatDate(bufferDiagnostics.checkedAt)}`:'Pendent de comprovació');
  text('admin-buffer-operation',bufferTikTok?.checkedAt?`${bufferTikTok.status==='healthy'?'Programat':bufferTikTok.status==='running'?'En curs':'Error'} · ${formatDate(bufferTikTok.checkedAt)}`:'Automatització encara desactivada');
  const healthy=scheduler?.status==='healthy';
  setPill('admin-operations-pill',healthy?'Programador operatiu':scheduler?'Cal revisar':'Esperant execució',healthy?'is-ok':'is-warning');
}

const SOCIAL_LABELS={draft:'Esborrany',review:'En revisió',approved:'Aprovat',partially_published:'Publicat parcialment',published:'Publicat',discarded:'Descartat'};
const CHANNEL_LABELS={facebook:'Facebook',instagram:'Instagram',bluesky:'Bluesky',telegram:'Telegram',threads:'Threads'};
const DIAGNOSTIC_CHANNEL_LABELS={...CHANNEL_LABELS,tiktok:'TikTok'};
function socialFeedback(message,state='ok'){
  const node=element('admin-social-feedback');if(!node)return;
  node.hidden=!message;node.textContent=message||'';node.className=`admin-social-feedback is-${state}`;
}
async function adminApi(path,{method='GET',body}={}){
  const response=await fetch(`${CONFIG.apiUrl}${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const payload=await response.json().catch(()=>({error:'Resposta no vàlida'}));
  if(response.status===401){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('La sessió ha caducat o la clau no és correcta.',true);throw new Error('Sessió no autoritzada');}
  if(!response.ok)throw new Error(payload.error||`Error ${response.status}`);
  return payload;
}
function renderSocialDiagnostics(results=[]){
  const list=element('admin-social-diagnostic-list');if(!list)return;
  if(!results.length){list.innerHTML='<p class="admin-social-diagnostic-empty">Encara no s’han comprovat les connexions.</p>';return;}
  list.replaceChildren(...results.map(result=>{const row=document.createElement('div');const label=document.createElement('strong');const detail=document.createElement('span');const state=document.createElement('b');row.className=`admin-social-diagnostic ${result.ok?'is-ok':'is-error'}`;label.textContent=DIAGNOSTIC_CHANNEL_LABELS[result.channel]||result.channel;detail.textContent=result.detail||'';state.textContent=result.ok?'Connexió correcta':'Cal revisar';row.append(label,detail,state);return row;}));
}
async function runSocialDiagnostics(){
  const button=element('admin-social-diagnose');if(!button)return;
  button.disabled=true;button.textContent='Comprovant…';socialFeedback('Comprovant les sis connexions sense publicar res…','warning');
  try{const payload=await adminApi('/admin/social-diagnostics',{method:'POST',body:{channel:'all'}});renderSocialDiagnostics(payload.results||[]);const failed=(payload.results||[]).filter(item=>!item.ok).length;socialFeedback(failed?`${failed} connexió o connexions necessiten revisió.`:'Les sis xarxes estan connectades. Ja pots fer publicacions de prova controlades.',failed?'error':'ok');}
  catch(error){renderSocialDiagnostics([]);socialFeedback(`No s’ha pogut completar el diagnòstic: ${error.message}`,'error');recordIncident('Diagnòstic social',error.message);}
  finally{button.disabled=false;button.textContent='Comprovar les 6 connexions';}
}
async function runSocialReelTest(slot){
  const button=element(slot==='morning'?'admin-social-reels-morning':'admin-social-reels-evening');if(!button)return;
  const label=slot==='morning'?'matí':'vespre';
  if(!window.confirm(`Vols publicar ara el Short del ${label} com a Reel a Instagram i Facebook? És una prova real i no es podrà repetir automàticament.`))return;
  button.disabled=true;button.textContent='Publicant Reels…';socialFeedback(`Enviant la prova de Reels del ${label} a Instagram i Facebook…`,'warning');
  try{const payload=await adminApi('/admin/social-reels/test',{method:'POST',body:{slot}});const channels=(payload.outcomes||[]).filter(item=>item.ok).map(item=>item.channel);socialFeedback(`Prova completada: ${channels.join(' i ')} han acceptat el Reel. Ara comprova visualment les dues publicacions.`, 'ok');await fetchStatus({skipDrafts:true});}
  catch(error){socialFeedback(`La prova de Reels no s’ha completat: ${error.message}`,'error');recordIncident('Prova de Reels',error.message);}
  finally{button.disabled=false;button.textContent=`Provar Reels del ${label}`;}
}
async function runBufferTikTokTest(slot){
  const button=element(slot==='morning'?'admin-buffer-tiktok-morning':'admin-buffer-tiktok-evening');if(!button)return;
  const label=slot==='morning'?'matí':'vespre';
  if(!window.confirm(`Vols crear un esborrany de TikTok del ${label} a Buffer? No es publicarà automàticament.`))return;
  button.disabled=true;button.textContent='Creant esborrany…';socialFeedback(`Enviant el Short del ${label} a Buffer com a esborrany segur…`,'warning');
  try{const payload=await adminApi('/admin/buffer-tiktok/test',{method:'POST',body:{slot}});socialFeedback(`${payload.message||'Esborrany creat a Buffer.'} Revisa’l a Buffer abans d’activar la cua automàtica.`, 'ok');await fetchStatus({skipDrafts:true});}
  catch(error){socialFeedback(`La prova de TikTok no s’ha completat: ${error.message}`,'error');recordIncident('Prova TikTok Buffer',error.message);}
  finally{button.disabled=false;button.textContent=`Provar TikTok del ${label}`;}
}
function socialDraftValues(card){
  return {title:card.querySelector('[name="title"]')?.value.trim()||'',body:card.querySelector('[name="body"]')?.value.trim()||'',channels:[...card.querySelectorAll('[name="channels"]:checked')].map(input=>input.value)};
}
function makeSocialButton(label,action,className=''){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.socialAction=action;if(className)button.className=className;return button;
}
function socialPublicationRows(draft){
  const container=document.createElement('div');container.className='admin-social-publications';
  const publications=Array.isArray(draft.publications)?draft.publications:[];
  if(!publications.length){const empty=document.createElement('small');empty.textContent='Encara no hi ha cap intent de publicació.';container.append(empty);return container;}
  publications.forEach(item=>{const row=document.createElement('div');const channel=document.createElement('strong');const status=document.createElement('span');channel.textContent=CHANNEL_LABELS[item.channel]||item.channel;status.textContent=item.status==='published'?`Publicat · ${formatDate(item.published_at)}`:`Error · ${item.error||'sense detall'}`;row.className=item.status==='published'?'is-ok':'is-error';row.append(channel,status);container.append(row);});
  return container;
}
function socialDraftCard(draft){
  const card=document.createElement('article');card.className='admin-social-card';card.dataset.draftId=String(draft.id);card.dataset.status=draft.status;
  const header=document.createElement('header');const heading=document.createElement('div');const eyebrow=document.createElement('p');const title=document.createElement('h3');const badge=document.createElement('span');
  eyebrow.className='eyebrow';eyebrow.textContent=`${draft.kind||'contingut'} · ${formatDate(draft.created_at)}`;title.textContent=draft.title||'Resum meteorològic';badge.className=`admin-social-state is-${draft.status}`;badge.textContent=SOCIAL_LABELS[draft.status]||draft.status;heading.append(eyebrow,title);header.append(heading,badge);
  const form=document.createElement('div');form.className='admin-social-form';
  const titleLabel=document.createElement('label');titleLabel.textContent='Títol';const titleInput=document.createElement('input');titleInput.name='title';titleInput.maxLength=180;titleInput.value=draft.title||'';titleLabel.append(titleInput);
  const bodyLabel=document.createElement('label');bodyLabel.textContent='Text';const textarea=document.createElement('textarea');textarea.name='body';textarea.maxLength=3900;textarea.rows=5;textarea.value=draft.body||'';bodyLabel.append(textarea);
  const channels=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent='Canals previstos';channels.append(legend);
  Object.entries(CHANNEL_LABELS).forEach(([value,label])=>{const option=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.name='channels';input.value=value;input.checked=(draft.channels||[]).includes(value);option.append(input,document.createTextNode(label));channels.append(option);});
  form.append(titleLabel,bodyLabel,channels);
  const note=document.createElement('p');note.className='admin-social-meta-note';note.textContent='Cada canal publica només quan prems el seu botó i confirmes l’acció. Els intents i errors queden registrats.';
  const actions=document.createElement('div');actions.className='admin-social-actions';
  if(draft.status==='published'){
    const immutable=document.createElement('small');immutable.className='admin-social-immutable';immutable.textContent='El text queda protegit. Pots marcar un canal que faltava, desar-lo i publicar-hi després.';actions.append(immutable,makeSocialButton('Desar canals nous','save','is-secondary'));
    titleInput.disabled=true;textarea.disabled=true;
  }else if(draft.status==='discarded')actions.append(makeSocialButton('Restaurar','restore','is-secondary'));
  else{
    actions.append(makeSocialButton('Desar canvis','save','is-secondary'));
    if(!['approved','partially_published','published'].includes(draft.status))actions.append(makeSocialButton('Aprovar','approve','is-primary'));
    if(draft.status!=='published')actions.append(makeSocialButton('Descartar','discard','is-danger'));
  }
  if(['approved','partially_published','published'].includes(draft.status)){
    const publishedChannels=new Set((draft.publications||[]).filter(item=>item.status==='published').map(item=>item.channel));
    const failedChannels=[...new Set((draft.publications||[]).filter(item=>item.status==='failed'&&!publishedChannels.has(item.channel)).map(item=>item.channel))];
    Object.entries(CHANNEL_LABELS).forEach(([channel,label])=>{const published=publishedChannels.has(channel);const selected=(draft.channels||[]).includes(channel);const button=makeSocialButton(published?`${label} · publicat`:`Publicar a ${label}`,`publish-${channel}`,'is-publish');button.disabled=published||!selected||!socialCredentials[channel];button.title=published?`Aquest contingut ja s’ha publicat a ${label}`:!selected?`Marca ${label} i desa els canals abans de publicar`:socialCredentials[channel]?'Demana confirmació abans de publicar':`Falten credencials de ${label}`;actions.append(button);});
    if(failedChannels.length){const retry=makeSocialButton(`Repetir només els errors (${failedChannels.length})`,'retry-failed','is-primary');retry.dataset.failedChannels=failedChannels.join(',');actions.append(retry);}
    actions.append(makeSocialButton('Preparar per al canal de WhatsApp','whatsapp','is-secondary'));
  }
  const archived=['published','discarded'].includes(draft.status);
  if(archived){
    const details=document.createElement('details');details.className='admin-social-card__details';
    const summary=document.createElement('summary');summary.textContent='Veure el detall i el registre per canal';
    details.append(summary,form,note,actions,socialPublicationRows(draft));
    card.append(header,details);
  }else card.append(header,form,note,actions,socialPublicationRows(draft));
  card.querySelectorAll('input:not(:disabled),textarea:not(:disabled)').forEach(control=>control.addEventListener('input',()=>{card.classList.add('is-dirty');socialEditorDirty=true;socialFeedback('Hi ha canvis sense desar.','warning');}));
  return card;
}
function renderSocialPagination(){
  const pagination=element('admin-social-pagination');
  const previous=element('admin-social-previous');
  const next=element('admin-social-next');
  if(!pagination||!previous||!next)return;
  const first=socialDrafts.length?socialOffset+1:0;
  const last=socialOffset+socialDrafts.length;
  pagination.hidden=!socialDrafts.length;
  previous.disabled=socialOffset===0;
  next.disabled=!socialHasMore;
  text('admin-social-page',socialDrafts.length?`Registres ${first}–${last}${socialFilter?' · filtre actiu':''}`:'Sense registres');
}
function initSocialPagination(){
  element('admin-social-previous')?.addEventListener('click',()=>{if(socialOffset===0)return;socialOffset=Math.max(0,socialOffset-SOCIAL_PAGE_SIZE);fetchSocialDrafts(true);});
  element('admin-social-next')?.addEventListener('click',()=>{if(!socialHasMore)return;socialOffset+=SOCIAL_PAGE_SIZE;fetchSocialDrafts(true);});
}
function renderSocialEditor(){
  const list=element('admin-social-list');if(!list)return;
  if(!socialDrafts.length){const empty=document.createElement('p');empty.className='admin-social-empty';empty.textContent=socialFilter?'No hi ha continguts amb aquest estat.':'Encara no hi ha cap esborrany editorial.';list.replaceChildren(empty);renderSocialPagination();return;}
  list.replaceChildren(...socialDrafts.map(socialDraftCard));renderSocialPagination();
}
async function fetchSocialDrafts(force=false){
  if(!token||socialEditorDirty&&!force)return;
  const list=element('admin-social-list');if(list&&!socialDrafts.length)list.setAttribute('aria-busy','true');
  try{const query=new URLSearchParams({limit:String(SOCIAL_PAGE_SIZE),offset:String(socialOffset)});if(socialFilter)query.set('status',socialFilter);const payload=await adminApi(`/admin/social-drafts?${query}`);socialDrafts=payload.drafts||[];socialHasMore=Boolean(payload.hasMore);socialEditorDirty=false;renderSocialEditor();socialFeedback('');}
  catch(error){recordIncident('Cua editorial',error.message);socialFeedback(`No s’ha pogut carregar la cua: ${error.message}`,'error');}
  finally{list?.removeAttribute('aria-busy');}
}
async function handleSocialAction(event){
  const button=event.target.closest('[data-social-action]');if(!button)return;
  const card=button.closest('[data-draft-id]');if(!card)return;
  const draftId=Number(card.dataset.draftId);const action=button.dataset.socialAction;
  if(action==='retry-failed'){
    const channels=String(button.dataset.failedChannels||'').split(',').filter(Boolean);
    if(!channels.length||!window.confirm(`Vols repetir només ${channels.length===1?'el canal que ha fallat':'els canals que han fallat'}?`))return;
    button.disabled=true;button.textContent='Reintentant…';socialFeedback('Reintentant exclusivament els canals amb error…','warning');
    const results=[];
    for(const channel of channels){try{await adminApi(`/admin/social-drafts/${draftId}/publish`,{method:'POST',body:{channel}});results.push({channel,ok:true});}catch(error){results.push({channel,ok:false,error:error.message});}}
    socialEditorDirty=false;const failed=results.filter(item=>!item.ok);socialFeedback(failed.length?`${failed.length} canal(s) continuen amb error.`:'Tots els canals pendents s’han publicat correctament.',failed.length?'error':'ok');await Promise.all([fetchSocialDrafts(true),fetchStatus({skipDrafts:true})]);return;
  }
  if(action==='whatsapp'){
    button.disabled=true;button.textContent='Preparant…';socialFeedback('Preparant la imatge i el text per compartir a WhatsApp…','warning');
    try{
      const payload=await adminApi(`/admin/social-drafts/${draftId}/prepare-whatsapp`,{method:'POST',body:{}});
      const response=await fetch(payload.imageUrl);if(!response.ok)throw new Error('No s’ha pogut baixar la imatge.');
      const file=new File([await response.blob()],'meteo-fontanillas.jpg',{type:'image/jpeg'});
      if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({title:'Meteo Fontanillas',text:payload.text,files:[file]});
      else{await navigator.clipboard.writeText(`${payload.text}\n\nImatge: ${payload.imageUrl}`);window.open(payload.channelUrl||CONFIG.social.whatsapp,'_blank','noopener,noreferrer');socialFeedback('Text i enllaç de la imatge copiats. Enganxa’ls al canal de WhatsApp.','ok');}
    }catch(error){if(error.name!=='AbortError'){socialFeedback(`No s’ha pogut preparar WhatsApp: ${error.message}`,'error');recordIncident('WhatsApp',error.message);}}
    finally{button.disabled=false;button.textContent='Preparar per al canal de WhatsApp';}
    return;
  }
  if(action.startsWith('publish-')){
    const channel=action.replace('publish-','');const label=CHANNEL_LABELS[channel]||channel;
    if(!window.confirm(`Vols publicar ara aquest contingut a ${label}? Aquesta acció és real i quedarà registrada.`))return;
    button.disabled=true;button.textContent='Publicant…';socialFeedback(`Enviant manualment a ${label}…`,'warning');
    try{await adminApi(`/admin/social-drafts/${draftId}/publish`,{method:'POST',body:{channel}});socialEditorDirty=false;socialFeedback(`Publicació a ${label} completada i registrada.`,'ok');await Promise.all([fetchSocialDrafts(true),fetchStatus({skipDrafts:true})]);}
    catch(error){socialFeedback(`No s’ha pogut publicar a ${label}: ${error.message}`,'error');recordIncident(`Publicació ${label}`,error.message);button.disabled=false;button.textContent=`Publicar a ${label}`;}
    return;
  }
  const labels={save:'desar els canvis',approve:'aprovar',discard:'descartar',restore:'restaurar'};
  if(action==='discard'&&!window.confirm('Vols descartar aquest contingut? No s’eliminarà i el podràs restaurar.'))return;
  button.disabled=true;socialFeedback(`S’està intentant ${labels[action]||action}…`,'warning');
  try{await adminApi(`/admin/social-drafts/${draftId}`,{method:'POST',body:{action,...socialDraftValues(card)}});socialEditorDirty=false;socialFeedback(action==='approve'?'Contingut aprovat. Encara no s’ha publicat.':`S’ha pogut ${labels[action]||action}.`,'ok');await Promise.all([fetchSocialDrafts(true),fetchStatus({skipDrafts:true})]);}
  catch(error){socialFeedback(error.message,'error');recordIncident('Revisió editorial',error.message);button.disabled=false;}
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
  renderOperations(payload.operations,payload.schedule);
  latestDiagnostic={...payload,client:{webVersion:'22.14.0',requestLatencyMs:requestLatency,pwa:await localPwaStatus(),publication:await renderPublicationReadiness(),performance:renderPerformanceSnapshot(),analyticsConfigured:analytics.provider!=='none',analyticsProvider:analytics.provider,analyticsDetectedOnPage:Boolean(analytics.detected),oneSignalClientConfigured:Boolean(CONFIG.oneSignalAppId),socialAutomation:payload.social?.mode||'manual-review'},incidents:[...incidents]};
  const overall=overallState(payload);text('admin-overall-status',overall.label);text('admin-last-update',`Actualitzat ${formatDate(payload.generatedAt)} · ${requestLatency} ms`);
  setCard('worker',payload.ok?'is-ok':'is-error',payload.ok?'Operatiu':'Error',`V${payload.worker?.version||'—'} · ${payload.latencyMs??'—'} ms`);
  const stationOk=Boolean(payload.station?.ok);setCard('station',stationOk?'is-ok':'is-warning',stationOk?'Al dia':'Cal revisar',payload.station?.ageMinutes===null?'Antiguitat desconeguda':`${payload.station.ageMinutes} min d’antiguitat`);
  const databaseOk=Boolean(payload.database?.enabled);setCard('database',databaseOk?'is-ok':'is-warning',databaseOk?'Connectada':'No disponible',databaseOk?`${formatNumber(payload.database.totalRows)} files · ${formatNumber(payload.database.observations)} observacions`:'Sense D1');
  const alertsOk=Boolean(payload.alerts?.ok);setCard('alerts',alertsOk?'is-ok':'is-warning',alertsOk?(payload.alerts.active?`${payload.alerts.active} actius`:'Sense avisos'):'No verificats',alertsOk?`Nivell ${payload.alerts.maxLevel||'none'}`:'Cal consultar la font oficial');
  text('admin-worker-version',payload.worker?.version?`V${payload.worker.version}`:'—');text('admin-environment',payload.worker?.environment||'—');
  text('admin-observation-time',formatDate(payload.station?.updated));text('admin-observation-age',payload.station?.ageMinutes===null?'—':`${payload.station.ageMinutes} min`);text('admin-availability',payload.station?.storage?.availability24h===undefined?'—':`${formatDecimal(payload.station.storage.availability24h)}%`);text('admin-samples',payload.station?.storage?`${formatNumber(payload.station.storage.samples24h)} / ${formatNumber(payload.station.storage.expected24h)}`:'—');text('admin-missing',payload.station?.missingFields?.length?payload.station.missingFields.join(', '):'Cap');text('admin-station-latency',payload.station?.latencyMs===null?'—':`${payload.station.latencyMs} ms`);setPill('admin-quality-pill',stationOk?'Correcta':'Cal revisar',stationOk?'is-ok':'is-warning');
  text('admin-d1-total-rows',formatNumber(payload.database?.totalRows));text('admin-observations',formatNumber(payload.database?.observations));text('admin-coverage',payload.database?.coverageDays===undefined?'—':`${formatDecimal(payload.database.coverageDays)} dies`);text('admin-storage-last',formatDate(payload.database?.lastObservation));text('admin-alert-events',formatNumber(payload.database?.alertEvents));text('admin-alert-last',formatDate(payload.database?.latestAlertEvent));text('admin-contact-count',formatNumber(payload.database?.contactRequests24h));setPill('admin-storage-pill',databaseOk?'Connectada':'No disponible',databaseOk?'is-ok':'is-warning');
  element('admin-dashboard').hidden=false;element('admin-login').hidden=true;
}

function showLogin(message='',isError=false){element('admin-dashboard').hidden=true;element('admin-login').hidden=false;text('admin-login-status',message);element('admin-login-status')?.classList.toggle('is-error',isError);element('admin-token')?.focus();}
async function fetchStatus({skipDrafts=false}={}){if(!token){showLogin();return;}const refresh=element('admin-refresh');if(refresh){refresh.disabled=true;refresh.textContent='Comprovant…';}const started=performance.now();try{const response=await fetch(`${CONFIG.apiUrl}/admin/status`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},cache:'no-store'});const payload=await response.json().catch(()=>({error:'Resposta no vàlida'}));if(response.status===401){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('La clau no és correcta.',true);return;}if(response.status===429){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('Massa intents fallits. Espera quinze minuts abans de tornar-ho a provar.',true);return;}if(response.status===503&&payload.code==='ADMIN_NOT_CONFIGURED'){sessionStorage.removeItem(TOKEN_KEY);token='';showLogin('Cal configurar primer la clau privada al Worker.',true);return;}if(!response.ok)throw new Error(payload.error||`Error ${response.status}`);await renderDashboard(payload,Math.round(performance.now()-started));if(!skipDrafts)await fetchSocialDrafts();}catch(error){recordIncident('Connexió',error.message);text('admin-overall-status','No s’ha pogut actualitzar');text('admin-last-update',error.message);if(element('admin-dashboard').hidden)showLogin('No s’ha pogut connectar amb el Worker.',true);}finally{if(refresh){refresh.disabled=false;refresh.textContent='Actualitzar';}}}
function recordIncident(type,message){incidents.unshift({time:new Date().toISOString(),type,message:String(message||'Error desconegut').slice(0,240)});if(incidents.length>20)incidents.pop();const list=element('admin-incident-list');if(list){list.replaceChildren(...incidents.map(item=>{const entry=document.createElement('li');entry.innerHTML=`<time>${formatDate(item.time)}</time><b></b><span></span>`;entry.querySelector('b').textContent=item.type;entry.querySelector('span').textContent=item.message;return entry;}));}text('admin-incident-count',`${incidents.length} ${incidents.length===1?'incidència':'incidències'}`);}
async function copyDiagnostic(){if(!latestDiagnostic)return;const safe=JSON.stringify(latestDiagnostic,null,2);try{await navigator.clipboard.writeText(safe);text('admin-last-update','Diagnòstic copiat sense incloure la clau');}catch{recordIncident('Portapapers','No s’ha pogut copiar el diagnòstic.');}}
function init(){initFooterSocial();observePerformance();initSocialPagination();window.addEventListener('error',event=>recordIncident('JavaScript',event.message));window.addEventListener('unhandledrejection',event=>recordIncident('Promesa',event.reason?.message||event.reason));element('admin-login-form')?.addEventListener('submit',event=>{event.preventDefault();token=String(new FormData(event.currentTarget).get('token')||'').trim();if(token.length<24){showLogin('La clau és massa curta.',true);return;}sessionStorage.setItem(TOKEN_KEY,token);fetchStatus();});element('admin-refresh')?.addEventListener('click',()=>{if(socialEditorDirty&&!window.confirm('Hi ha canvis editorials sense desar. Vols descartar-los i actualitzar?'))return;socialEditorDirty=false;fetchStatus();});element('admin-copy-diagnostic')?.addEventListener('click',copyDiagnostic);element('admin-social-diagnose')?.addEventListener('click',runSocialDiagnostics);element('admin-social-reels-morning')?.addEventListener('click',()=>runSocialReelTest('morning'));element('admin-social-reels-evening')?.addEventListener('click',()=>runSocialReelTest('evening'));element('admin-buffer-tiktok-morning')?.addEventListener('click',()=>runBufferTikTokTest('morning'));element('admin-buffer-tiktok-evening')?.addEventListener('click',()=>runBufferTikTokTest('evening'));element('admin-social-list')?.addEventListener('click',handleSocialAction);document.querySelector('.admin-social-toolbar')?.addEventListener('click',event=>{const button=event.target.closest('[data-social-filter]');if(!button)return;if(socialEditorDirty&&!window.confirm('Hi ha canvis sense desar. Vols descartar-los i canviar el filtre?'))return;socialEditorDirty=false;socialFilter=button.dataset.socialFilter||'';socialOffset=0;document.querySelectorAll('[data-social-filter]').forEach(item=>item.classList.toggle('is-active',item===button));fetchSocialDrafts(true);});element('admin-logout')?.addEventListener('click',()=>{sessionStorage.removeItem(TOKEN_KEY);token='';latestDiagnostic=null;socialDrafts=[];socialOffset=0;socialHasMore=false;socialEditorDirty=false;showLogin('Sessió tancada.');});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&token&&!socialEditorDirty)fetchStatus();});token=sessionStorage.getItem(TOKEN_KEY)||'';if(token)fetchStatus();else showLogin();refreshTimer=setInterval(()=>{if(token&&!document.hidden&&!socialEditorDirty)fetchStatus();},120000);window.addEventListener('pagehide',()=>{clearInterval(refreshTimer);performanceObservers.forEach(observer=>observer.disconnect());},{once:true});}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
