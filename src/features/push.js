import { CONFIG } from '../core/config.js';
import { DEFAULT_NOTIFICATION_PREFERENCES, notificationPreferenceSummary, notificationTags } from '../core/notification-preferences.js';

const appId = String(CONFIG.oneSignalAppId || '').trim();
const button = document.getElementById('push-alert-button');
const status = document.getElementById('push-alert-status');
const modal = document.getElementById('pushPreferencesModal');
const closeButton = document.getElementById('push-preferences-close');
const saveButton = document.getElementById('push-preferences-save');
const disableButton = document.getElementById('push-preferences-disable');
const testButton = document.getElementById('push-preferences-test');
const fields = [...document.querySelectorAll('[data-alert-preference]')];
const levelFields = [...document.querySelectorAll('[data-alert-level]')];
const summary = document.getElementById('push-preference-summary');
const STORAGE_KEY = CONFIG.pushPreferencesKey || 'fontanillas-alert-preferences-v1';
const INVITE_KEY = 'fontanillas-alert-invite-v1';
const invite = document.getElementById('alertInviteModal');
const inviteYes = document.getElementById('alert-invite-yes');
const inviteNo = document.getElementById('alert-invite-no');
let OneSignalRef = null;
let sdkReady = false;
let sdkReadyTimer = null;
let pushActionBusy = false;

function loadOneSignalSdk(){
  if(!appId || document.querySelector('script[data-onesignal-sdk]'))return;
  const script=document.createElement('script');
  script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
  script.defer=true;
  script.dataset.onesignalSdk='';
  script.onerror=()=>setState('Configurar avisos','No s’ha pogut carregar el servei push; les preferències continuen desades',false,false);
  document.head.append(script);
}

const DEFAULT_PREFS = DEFAULT_NOTIFICATION_PREFERENCES;

function isIos() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function loadPrefs(){ try { return {...DEFAULT_PREFS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; } catch { return {...DEFAULT_PREFS}; } }
function savePrefsLocal(prefs){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(prefs)); } catch {} }
function inviteDecision(){ try { return localStorage.getItem(INVITE_KEY); } catch { return null; } }
function saveInviteDecision(value){ try { localStorage.setItem(INVITE_KEY,value); } catch {} }
function wait(ms){ return new Promise(resolve=>window.setTimeout(resolve,ms)); }
async function waitUntil(check,timeout=20000){
  const started=Date.now();
  while(Date.now()-started<timeout){
    try { if(await check())return true; } catch {}
    await wait(250);
  }
  return false;
}
function setPushActionState(busy,label='Desar i activar'){
  pushActionBusy=busy;
  if(saveButton){ saveButton.disabled=busy; saveButton.textContent=label; saveButton.setAttribute('aria-busy',String(busy)); }
  if(disableButton)disableButton.disabled=busy;
  if(closeButton)closeButton.disabled=busy;
}
function showPushProgress(message,isError=false){
  if(!summary)return;
  summary.textContent=message;
  summary.classList.toggle('is-error',isError);
  summary.setAttribute('role',isError?'alert':'status');
  summary.setAttribute('aria-live','polite');
}
function setState(label, text, active = false, disabled = false) {
  if (button) {
    const strong = button.querySelector('b');
    if (strong) strong.textContent = label;
    button.classList.toggle('is-active', active);
    button.disabled = disabled;
    button.hidden = false;
  }
  if (status) { status.textContent = text; status.hidden = false; }
}
function openModal(){
  if(!modal)return;
  const prefs=loadPrefs();
  fields.forEach(f=>{f.checked=Boolean(prefs[f.value]);});
  const selected=Array.isArray(prefs.levels)?prefs.levels:['orange','red'];
  levelFields.forEach(field=>{field.checked=selected.includes(field.value);});
  if(summary){ summary.textContent=notificationPreferenceSummary(prefs); summary.classList.remove('is-error'); }
  setPushActionState(false);
  modal.hidden=false; modal.style.display='flex'; document.body.style.overflow='hidden';
}
function closeModal(){ if(!modal)return; modal.hidden=true; modal.style.display='none'; document.body.style.overflow=''; }
function openInvite(){
  if(!invite||inviteDecision())return;
  invite.hidden=false;
  document.body.style.overflow='hidden';
  inviteYes?.focus();
}
function closeInvite(value){
  if(value)saveInviteDecision(value);
  if(!invite)return;
  invite.hidden=true;
  document.body.style.overflow='';
}
function collectPrefs(){
  const prefs={...DEFAULT_PREFS};
  fields.forEach(f=>prefs[f.value]=Boolean(f.checked));
  prefs.levels=levelFields.filter(field=>field.checked).map(field=>field.value);
  if(prefs.all){prefs.rain=true;prefs.wind=true;prefs.storm=true;prefs.snow=true;prefs.temperature=true;}
  if(prefs.all)prefs.levels=levelFields.filter(field=>field.checked).map(field=>field.value);
  return prefs;
}
async function syncTags(prefs){
  if(!OneSignalRef)return;
  const tags=notificationTags(prefs);
  try {
    if(OneSignalRef.User?.addTags) await OneSignalRef.User.addTags(tags);
    else if(OneSignalRef.sendTags) await OneSignalRef.sendTags(tags);
  } catch(error){ console.warn('No s’han pogut sincronitzar les preferències push.',error); }
}
async function optedIn(){ try { return Boolean(OneSignalRef?.User?.PushSubscription?.optedIn); } catch { return false; } }

async function refresh(){
  if(!button||!status)return;
  const prefs=loadPrefs();
  if(!appId){
    const hasPrefs=Boolean(localStorage.getItem(STORAGE_KEY));
    setState(hasPrefs?'Preferències desades':'Configurar avisos', hasPrefs?`${notificationPreferenceSummary(prefs)} · activació push pendent`:'Tria fenomen i nivell mínim', false, false);
    return;
  }
  if(!sdkReady || !OneSignalRef){ setState('Activar avisos','Preparant notificacions…',false,true); return; }
  const supported=OneSignalRef.Notifications?.isPushSupported?.();
  if(!supported){ setState('Avisos no compatibles','Aquest navegador no admet notificacions web push',false,true); return; }
  const active=await optedIn();
  if(active) setState('Gestionar avisos',notificationPreferenceSummary(prefs),true,false);
  else if(isIos()&&!isStandalone()) setState('Activar avisos','A iPhone, afegeix primer la web a la pantalla d’inici',false,false);
  else setState('Activar avisos','Rep només avisos meteorològics importants',false,false);
}

async function enablePush(){
  if(pushActionBusy)return;
  const prefs=collectPrefs();
  if(!prefs.levels.length){showPushProgress('Selecciona almenys un nivell d’avís.',true);return;}
  savePrefsLocal(prefs);
  if(!appId || !OneSignalRef){
    closeModal();
    setState('Preferències desades',`${notificationPreferenceSummary(prefs)} · activació push pendent`,false,false);
    window.observatoriTrack?.('push_preferences_saved');
    return;
  }
  if(isIos()&&!isStandalone()){
    alert('A l’iPhone, les notificacions web funcionen quan l’Observatori està afegit a la pantalla d’inici. Fes Compartir → Afegir a la pantalla d’inici i obre’l des de la icona.');
    return;
  }
  setPushActionState(true,'Activant…');
  try {
    const notifications=OneSignalRef.Notifications;
    const subscription=OneSignalRef.User?.PushSubscription;
    if(!notifications?.isPushSupported?.())throw new Error('push-not-supported');
    if(typeof Notification==='undefined')throw new Error('push-not-supported');
    let browserPermission=Notification.permission;
    if(browserPermission==='default'){
      showPushProgress('Esperant el permís del navegador…');
      browserPermission=await Notification.requestPermission();
    }
    if(browserPermission!=='granted')throw new Error(browserPermission==='denied'?'permission-denied':'permission-not-granted');
    const oneSignalPermissionReady=await waitUntil(()=>Boolean(notifications.permission),5000);
    if(!oneSignalPermissionReady)throw new Error('permission-not-synced');
    if(!await optedIn()){
      showPushProgress('Creant la subscripció d’avisos…');
      await subscription?.optIn?.();
      const subscriptionReady=await waitUntil(optedIn);
      if(!subscriptionReady)throw new Error('subscription-not-ready');
    }
    showPushProgress('Desant les teves preferències…');
    await syncTags(prefs);
    closeModal();
    await refresh();
    window.observatoriTrack?.('push_subscribed');
  } catch(error){
    console.warn('No s’ha pogut activar Web Push.',error);
    const denied=['permission-not-granted','permission-denied'].includes(error?.message);
    showPushProgress(denied
      ? 'Firefox té les notificacions bloquejades per a aquesta web. Restableix el permís a Configuració → Privadesa i seguretat → Notificacions i torna-ho a provar.'
      : 'No s’ha pogut completar l’activació. Revisa els permisos de notificacions del navegador i torna-ho a provar.',true);
    setState('Activar avisos','L’activació està pendent; revisa el permís del navegador',false,false);
  } finally { setPushActionState(false); }
}
async function disablePush(){
  const disabled={...DEFAULT_PREFS,rain:false,wind:false,storm:false,snow:false,temperature:false,all:false};savePrefsLocal(disabled);
  await syncTags(disabled);
  try { await OneSignalRef?.User?.PushSubscription?.optOut?.(); } catch(error){ console.warn('No s’han pogut desactivar els avisos.',error); }
  closeModal(); await refresh(); window.observatoriTrack?.('push_unsubscribed');
}

async function testPush(){
  if(typeof Notification==='undefined'){showPushProgress('Aquest navegador no admet notificacions.',true);return;}
  if(isIos()&&!isStandalone()){showPushProgress('A l’iPhone, obre primer l’Observatori des de la icona de la pantalla d’inici.',true);return;}
  let permission=Notification.permission;
  if(permission==='default')permission=await Notification.requestPermission();
  if(permission!=='granted'){showPushProgress('Cal permetre les notificacions del navegador per fer la prova.',true);return;}
  try{
    const registration=await navigator.serviceWorker?.ready;
    if(registration?.showNotification)await registration.showNotification('Avisos Meteo Fontanillas',{body:'Prova correcta: aquest dispositiu pot mostrar avisos meteorològics.',icon:'/assets/icons/icon-192.png',badge:'/assets/icons/icon-192.png',tag:'fontanillas-push-test'});
    else new Notification('Avisos Meteo Fontanillas',{body:'Prova correcta: aquest dispositiu pot mostrar avisos meteorològics.'});
    showPushProgress('Prova enviada. Si no la veus, revisa el centre de notificacions del dispositiu.');
  }catch(error){console.warn('No s’ha pogut mostrar la notificació de prova.',error);showPushProgress('No s’ha pogut mostrar la prova en aquest dispositiu.',true);}
}

function bindUi(){
  if(!button||!status)return;
  button.addEventListener('click',()=>{saveInviteDecision('accepted');openModal();});
  saveButton?.addEventListener('click',enablePush);
  disableButton?.addEventListener('click',disablePush);
  testButton?.addEventListener('click',testPush);
  closeButton?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal?.hidden)closeModal();});
  fields.find(f=>f.value==='all')?.addEventListener('change',e=>{if(e.target.checked)fields.filter(f=>f!==e.target).forEach(f=>f.checked=true);});
  fields.filter(field=>field.value!=='all').forEach(field=>field.addEventListener('change',()=>{if(!field.checked){const all=fields.find(item=>item.value==='all');if(all)all.checked=false;}}));
  [...fields,...levelFields].forEach(field=>field.addEventListener('change',()=>{if(summary)summary.textContent=notificationPreferenceSummary(collectPrefs());}));
  inviteNo?.addEventListener('click',()=>{closeInvite('declined');window.observatoriTrack?.('push_invite_declined');});
  inviteYes?.addEventListener('click',()=>{closeInvite('accepted');openModal();window.observatoriTrack?.('push_invite_accepted');});
  refresh();
  window.setTimeout(openInvite,1200);
}

bindUi();

if(appId){
  sdkReadyTimer=window.setTimeout(()=>{
    if(!sdkReady)setState('Configurar avisos','El servei de notificacions no ha respost. Recarrega la pàgina o revisa la protecció del navegador.',false,false);
  },15000);
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async function(OneSignal){
    OneSignalRef=OneSignal;
    try {
      await OneSignal.init({ appId, serviceWorkerPath:'/OneSignalSDKWorker.js', serviceWorkerParam:{scope:'/'}, autoResubscribe:true, notificationClickHandlerMatch:'origin', notificationClickHandlerAction:'focus' });
      sdkReady=true;
      window.clearTimeout(sdkReadyTimer);
      OneSignal.User?.PushSubscription?.addEventListener?.('change',refresh);
      if(await optedIn())await syncTags(loadPrefs());
      await refresh();
    } catch(error){
      window.clearTimeout(sdkReadyTimer);
      console.warn('OneSignal no s’ha pogut inicialitzar.',error);
      sdkReady=false;
      setState('Configurar avisos','Tria els tipus d’avís; el servei push no està disponible ara mateix',false,false);
    }
  });
  loadOneSignalSdk();
}
