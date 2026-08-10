import { CONFIG } from '../core/config.js';
import { DEFAULT_NOTIFICATION_PREFERENCES, notificationPreferenceSummary, notificationTags } from '../core/notification-preferences.js';

const appId = String(CONFIG.oneSignalAppId || '').trim();
const button = document.getElementById('push-alert-button');
const status = document.getElementById('push-alert-status');
const modal = document.getElementById('pushPreferencesModal');
const closeButton = document.getElementById('push-preferences-close');
const saveButton = document.getElementById('push-preferences-save');
const disableButton = document.getElementById('push-preferences-disable');
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

const DEFAULT_PREFS = DEFAULT_NOTIFICATION_PREFERENCES;

function isIos() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function loadPrefs(){ try { return {...DEFAULT_PREFS,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; } catch { return {...DEFAULT_PREFS}; } }
function savePrefsLocal(prefs){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(prefs)); } catch {} }
function inviteDecision(){ try { return localStorage.getItem(INVITE_KEY); } catch { return null; } }
function saveInviteDecision(value){ try { localStorage.setItem(INVITE_KEY,value); } catch {} }
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
  levelFields.forEach(field=>{field.checked=field.value===prefs.minLevel;});
  if(summary)summary.textContent=notificationPreferenceSummary(prefs);
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
  prefs.minLevel=levelFields.find(field=>field.checked)?.value||'orange';
  if(prefs.all) Object.keys(prefs).forEach(k=>prefs[k]=true);
  prefs.minLevel=levelFields.find(field=>field.checked)?.value||'orange';
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
  const prefs=collectPrefs();
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
  try {
    await OneSignalRef.Notifications.requestPermission();
    await OneSignalRef.User.PushSubscription.optIn();
    await syncTags(prefs); closeModal(); await refresh();
    window.observatoriTrack?.('push_subscribed');
  } catch(error){ console.warn('No s’ha pogut activar Web Push.',error); setState('Activar avisos','No s’ha pogut completar la subscripció'); }
}
async function disablePush(){
  const disabled={...DEFAULT_PREFS,rain:false,wind:false,storm:false,snow:false,temperature:false,all:false};savePrefsLocal(disabled);
  await syncTags(disabled);
  try { await OneSignalRef?.User?.PushSubscription?.optOut?.(); } catch(error){ console.warn('No s’han pogut desactivar els avisos.',error); }
  closeModal(); await refresh(); window.observatoriTrack?.('push_unsubscribed');
}

function bindUi(){
  if(!button||!status)return;
  button.addEventListener('click',()=>{saveInviteDecision('accepted');openModal();});
  saveButton?.addEventListener('click',enablePush);
  disableButton?.addEventListener('click',disablePush);
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
  window.OneSignalDeferred=window.OneSignalDeferred||[];
  window.OneSignalDeferred.push(async function(OneSignal){
    OneSignalRef=OneSignal;
    try {
      await OneSignal.init({ appId, serviceWorkerPath:'push/onesignal/OneSignalSDKWorker.js', serviceWorkerParam:{scope:'/push/onesignal/'}, autoResubscribe:true, notificationClickHandlerMatch:'origin', notificationClickHandlerAction:'focus' });
      sdkReady=true;
      OneSignal.User?.PushSubscription?.addEventListener?.('change',refresh);
      if(await optedIn())await syncTags(loadPrefs());
      await refresh();
    } catch(error){
      console.warn('OneSignal no s’ha pogut inicialitzar.',error);
      sdkReady=false;
      setState('Configurar avisos','Tria els tipus d’avís; el servei push no està disponible ara mateix',false,false);
    }
  });
}
