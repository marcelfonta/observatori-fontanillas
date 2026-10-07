import { CONFIG } from '../core/config.js';
import { getLocale } from '../core/i18n.js';

const RECENT_MAX_MINUTES = 12;
const STALE_MAX_MINUTES = 30;

function copyFor(state, date) {
  const locale=getLocale();
  const time=date ? new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date) : null;
  const copy={
    'ca-ES':{recent:'Imatge recent',delayed:'Imatge amb retard',stale:'Imatge desactualitzada',unavailable:'Imatge no disponible',capture:'Captura'},
    'es-ES':{recent:'Imagen reciente',delayed:'Imagen con retraso',stale:'Imagen desactualizada',unavailable:'Imagen no disponible',capture:'Captura'},
    'en-GB':{recent:'Recent image',delayed:'Delayed image',stale:'Outdated image',unavailable:'Image unavailable',capture:'Captured'},
    'fr-FR':{recent:'Image récente',delayed:'Image retardée',stale:'Image obsolète',unavailable:'Image indisponible',capture:'Capture'}
  }[locale] || null;
  const labels=copy || {recent:'Imatge recent',delayed:'Imatge amb retard',stale:'Imatge desactualitzada',unavailable:'Imatge no disponible',capture:'Captura'};
  return {status:labels[state],time:time ? `${labels.capture} ${time}` : labels.unavailable};
}

function containers() {
  return document.querySelectorAll('.hero-webcam-preview, .webcam-frame');
}

function setState(state, capturedAt=null) {
  const text=copyFor(state,capturedAt);
  document.querySelectorAll('[data-webcam-status]').forEach(node=>{node.textContent=text.status;});
  document.querySelectorAll('[data-webcam-time]').forEach(node=>{node.textContent=text.time;});
  containers().forEach(node=>{
    node.classList.toggle('is-stale',state==='stale');
    node.classList.toggle('is-delayed',state==='delayed');
    node.classList.toggle('is-unavailable',state==='unavailable');
  });
}

async function refreshCameraMetadata() {
  try {
    const response=await fetch(CONFIG.cameraUrl,{method:'HEAD',cache:'no-store'});
    if(!response.ok)throw new Error(`Camera ${response.status}`);
    const capturedAt=new Date(response.headers.get('x-captured-at') || response.headers.get('last-modified'));
    if(!Number.isFinite(capturedAt.getTime()))throw new Error('Hora de captura absent');
    const ageMinutes=Math.max(0,(Date.now()-capturedAt.getTime())/60000);
    setState(ageMinutes<=RECENT_MAX_MINUTES?'recent':ageMinutes<=STALE_MAX_MINUTES?'delayed':'stale',capturedAt);
  } catch(error) {
    console.warn('Metadades de la càmera no disponibles.',error);
    setState('unavailable');
  }
}

export function initWebcam() {
  const webcamUrl=`${CONFIG.cameraUrl}?t=${Date.now()}`;
  document.querySelectorAll('#webcam-image, #hero-webcam-image').forEach(image => {
    image.addEventListener('error', () => {
      image.removeAttribute('src');
      image.alt = 'La càmera no està disponible temporalment. Les dades de l’estació continuen actualitzant-se.';
      setState('unavailable');
    });
    image.addEventListener('load', () => refreshCameraMetadata(),{once:true});
    if(image.getClientRects().length)image.src=webcamUrl;
  });
  refreshCameraMetadata();
  const dialog=document.querySelector('#webcam-dialog');
  const dialogImage=document.querySelector('#webcam-dialog-image');
  document.querySelector('#webcam-expand')?.addEventListener('click',()=>{
    if(!dialog || !dialogImage)return;
    dialogImage.src=`${CONFIG.cameraUrl}?t=${Date.now()}`;
    if(typeof dialog.showModal==='function')dialog.showModal();
  });
  document.querySelector('#webcam-dialog-close')?.addEventListener('click',()=>dialog?.close());
  dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
}
