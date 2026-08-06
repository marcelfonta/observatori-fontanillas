import { CONFIG } from '../core/config.js';

const appId = String(CONFIG.oneSignalAppId || '').trim();
const button = document.getElementById('push-alert-button');
const status = document.getElementById('push-alert-status');
const modal = document.getElementById('pushPreferencesModal');
const closeButton = document.getElementById('push-preferences-close');
const saveButton = document.getElementById('push-preferences-save');
const disableButton = document.getElementById('push-preferences-disable');
const fields = [...document.querySelectorAll('[data-alert-preference]')];
const STORAGE_KEY = CONFIG.pushPreferencesKey || 'fontanillas-alert-preferences-v1';
let OneSignalRef = null;

const DEFAULT_PREFS = { rain:true, wind:true, storm:true, snow:true, temperature:true, all:false };

function isIos() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function loadPrefs(){ try { return {...DEFAULT_PREFS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; } catch { return {...DEFAULT_PREFS}; } }
function savePrefsLocal(prefs){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(prefs)); } catch {} }
function setState(label, text, active = false, disabled = false) {
  if (button) {
    const strong = button.querySelector('b');
    if (strong) strong.textContent = label;
    button.classList.toggle('is-active', active);
    button.disabled = disabled;
  }
  if (status) status.textContent = text;
}
function openModal(){ if(!modal)return; const prefs=loadPrefs(); fields.forEach(f=>{f.checked=Boolean(prefs[f.value]);}); modal.hidden=false; modal.style.display='flex'; document.body.style.overflow='hidden'; }
function closeModal(){ if(!modal)return; modal.hidden=true; modal.style.display='none'; document.body.style.overflow=''; }
function collectPrefs(){ const prefs={...DEFAULT_PREFS}; fields.forEach(f=>prefs[f.value]=Boolean(f.checked)); if(prefs.all){ Object.keys(prefs).forEach(k=>prefs[k]=true); } return prefs; }
async function syncTags(prefs){
  if(!OneSignalRef)return;
  const tags={};
  for(const [key,value] of Object.entries(prefs)) tags[`alert_${key}`]=value?'1':'0';
  try {
    if(OneSignalRef.User?.addTags) await OneSignalRef.User.addTags(tags);
    else if(OneSignalRef.sendTags) await OneSignalRef.sendTags(tags);
  } catch(error){ console.warn('No s’han pogut sincronitzar les preferències push.',error); }
}
async function optedIn(){ try { return Boolean(OneSignalRef?.User?.PushSubscription?.optedIn); } catch { return false; } }
async function refresh(){
  if(!button||!status)return;
  if(!appId){ button.hidden=true; status.hidden=true; return; }
  if(!OneSignalRef){ setState('Activar avisos','Preparant notificacions…',false,true); return; }
  const supported=OneSignalRef.Notifications?.isPushSupported?.();
  if(!supported){ setState('Avisos no compatibles','Aquest navegador no admet notificacions web push',false,true); return; }
  const active=await optedIn();
  if(active) setState('Gestionar avisos','Notificacions meteorològiques activades',true,false);
  else if(isIos()&&!isStandalone()) setState('Activar avisos','A iPhone, afegeix primer la web a la pantalla d’inici',false,false);
  else setState('Activar avisos','Rep només avisos meteorològics importants',false,false);
}
async function enablePush(){
  if(!OneSignalRef)return;
  if(isIos()&&!isStandalone()){
    alert('A l’iPhone, les notificacions web funcionen quan l’Observatori està afegit a la pantalla d’inici. Fes Compartir → Afegir a la pantalla d’inici i obre’l des de la icona.');
    return;
  }
  try {
    await OneSignalRef.Notifications.requestPermission();
    await OneSignalRef.User.PushSubscription.optIn();
    const prefs=collectPrefs(); savePrefsLocal(prefs); await syncTags(prefs); closeModal(); await refresh();
    window.observatoriTrack?.('push_subscribed');
  } catch(error){ console.warn('No s’ha pogut activar Web Push.',error); setState('Activar avisos','No s’ha pogut completar la subscripció'); }
}
async function disablePush(){
  try { await OneSignalRef?.User?.PushSubscription?.optOut?.(); closeModal(); await refresh(); window.observatoriTrack?.('push_unsubscribed'); }
  catch(error){ console.warn('No s’han pogut desactivar els avisos.',error); }
}

if(button&&status){
  if(!appId){ button.hidden=true; status.hidden=true; }
  else {
    window.OneSignalDeferred=window.OneSignalDeferred||[];
    window.OneSignalDeferred.push(async function(OneSignal){
      OneSignalRef=OneSignal;
      try {
        await OneSignal.init({ appId, serviceWorkerPath:'push/onesignal/OneSignalSDKWorker.js', serviceWorkerParam:{scope:'/push/onesignal/'}, autoResubscribe:true, notificationClickHandlerMatch:'origin', notificationClickHandlerAction:'focus' });
        OneSignal.User?.PushSubscription?.addEventListener?.('change',refresh);
        await refresh();
      } catch(error){ console.warn('OneSignal no s’ha pogut inicialitzar.',error); button.hidden=true; status.hidden=true; }
    });
    button.addEventListener('click',async()=>{ if(await optedIn()) openModal(); else openModal(); });
    saveButton?.addEventListener('click',async()=>{ const active=await optedIn(); if(active){ const prefs=collectPrefs(); savePrefsLocal(prefs); await syncTags(prefs); closeModal(); await refresh(); } else await enablePush(); });
    disableButton?.addEventListener('click',disablePush);
    closeButton?.addEventListener('click',closeModal);
    modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal?.hidden)closeModal();});
    fields.find(f=>f.value==='all')?.addEventListener('change',e=>{if(e.target.checked)fields.filter(f=>f!==e.target).forEach(f=>f.checked=true);});
  }
}
