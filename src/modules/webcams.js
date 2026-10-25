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

async function refreshWebcamCo2() {
  const node=document.getElementById('webcam-co2');
  if(!node)return;
  try {
    const response=await fetch(`${CONFIG.apiUrl}/climate/co2`,{cache:'no-store'});
    if(!response.ok)throw new Error('CO₂ no disponible');
    const value=(await response.json())?.co2;
    const date=typeof value?.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value.date)?new Date(`${value.date}T00:00:00Z`):null;
    const age=date?(Date.now()-date.getTime())/86400000:Infinity;
    if(value?.fresh!==true||!Number.isFinite(value.ppm)||value.ppm<250||value.ppm>650||!date||!Number.isFinite(age)||age<0||age>4)throw new Error('CO₂ antic o invàlid');
    const locale=getLocale();
    const ppm=value.ppm.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2});
    const dated=new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(date);
    const labels={
      'ca-ES':['CO₂ atmosfèric','Fa 1 any','Fa 10 anys','No és una mesura local ni de qualitat de l’aire.'],
      'es-ES':['CO₂ atmosférico','Hace 1 año','Hace 10 años','No es una medición local ni de calidad del aire.'],
      'en-GB':['Atmospheric CO₂','1 year ago','10 years ago','Not a local or air-quality measurement.'],
      'fr-FR':['CO₂ atmosphérique','Il y a 1 an','Il y a 10 ans','Ce n’est pas une mesure locale ni de la qualité de l’air.']
    }[locale]||['CO₂ atmosfèric','Fa 1 any','Fa 10 anys','No és una mesura local ni de qualitat de l’aire.'];
    const comparison=(years,ppmKey,dateKey,label)=>{
      const historicDate=String(value[dateKey]||'');
      const historicPpm=Number(value[ppmKey]);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(historicDate)||Number(historicDate.slice(0,4))!==Number(value.date.slice(0,4))-years||!Number.isFinite(historicPpm)||historicPpm<250||historicPpm>650)return '';
      const displayDate=new Intl.DateTimeFormat(locale,{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(`${historicDate}T00:00:00Z`));
      return ` · ${label}: ${historicPpm.toLocaleString(locale,{minimumFractionDigits:2,maximumFractionDigits:2})} ppm (${displayDate})`;
    };
    node.textContent=`${labels[0]} · Mauna Loa (NOAA): ${ppm} ppm · ${dated}${comparison(1,'yearAgoPpm','yearAgoDate',labels[1])}${comparison(10,'tenYearsAgoPpm','tenYearsAgoDate',labels[2])}. ${labels[3]}`;
    node.hidden=false;
  } catch {
    node.hidden=true;
    node.textContent='';
  }
}

export function initWebcam() {
  const webcamUrl=`${CONFIG.cameraPreviewUrl || CONFIG.cameraUrl}?t=${Date.now()}`;
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
  refreshWebcamCo2();
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
