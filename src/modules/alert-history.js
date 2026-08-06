import { CONFIG } from '../core/config.js';

const LOCAL_KEY='fontanillas-alert-history-local-v1';
let serverItems=[];
let localItems=loadLocal();

function escapeHtml(value=''){ return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function levelLabel(level){ return ({red:'Vermell',orange:'Taronja',yellow:'Groc',none:'Sense avisos',unknown:'Oficial'})[level]||'Oficial'; }
function formatDate(value){ const d=new Date(value); if(Number.isNaN(d.getTime()))return '—'; return new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(d); }
function loadLocal(){ try{return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]')}catch{return []} }
function saveLocal(items){ try{localStorage.setItem(LOCAL_KEY,JSON.stringify(items.slice(0,30)))}catch{} }
function keyOf(item){ return [item.level,item.phenomenon||item.title,item.started_at||item.created_at].join('|'); }
function combinedItems(){
  const map=new Map();
  [...serverItems,...localItems].forEach(item=>map.set(keyOf(item),item));
  return [...map.values()].sort((a,b)=>new Date(b.started_at||b.created_at||0)-new Date(a.started_at||a.created_at||0)).slice(0,20);
}
function render(){
  const host=document.getElementById('alert-history-list');
  const status=document.getElementById('alert-history-status');
  if(!host)return;
  const items=combinedItems();
  if(!items.length){
    host.innerHTML='<div class="alert-history-empty"><strong>Cap episodi actiu registrat</strong><span>L’historial només desa avisos meteorològics oficials quan n’hi ha. La situació actual sense avisos no és cap error.</span></div>';
    if(status)status.textContent='Sense episodis registrats';
    return;
  }
  host.innerHTML=items.map(item=>`<article class="alert-history-item is-${escapeHtml(item.level||'unknown')}"><span class="alert-history-level">${levelLabel(item.level)}</span><div><strong>${escapeHtml(item.phenomenon||item.title||'Avís meteorològic')}</strong><small>${escapeHtml(item.source||'AEMET')} · ${formatDate(item.started_at||item.created_at)}</small><p>${escapeHtml(item.description||'')}</p></div></article>`).join('');
  if(status)status.textContent=`${items.length} episodis recents`;
}
function capturePayload(payload){
  if(!payload?.ok || !Array.isArray(payload.alerts) || !payload.alerts.length)return;
  const now=new Date().toISOString();
  const additions=payload.alerts.map(item=>({source:'AEMET',level:item.level||payload.maxLevel||'unknown',phenomenon:item.phenomenon||item.title||'Avís meteorològic',title:item.title||'',description:item.description||'',started_at:item.published||now,expires_at:item.expires||null,created_at:now}));
  const map=new Map([...additions,...localItems].map(item=>[keyOf(item),item]));
  localItems=[...map.values()].sort((a,b)=>new Date(b.started_at||0)-new Date(a.started_at||0)).slice(0,30);
  saveLocal(localItems); render();
}

export async function loadAlertHistory(){
  const host=document.getElementById('alert-history-list');
  const status=document.getElementById('alert-history-status');
  if(!host)return;
  document.addEventListener('observatori:alerts-updated',event=>capturePayload(event.detail));
  try{
    const r=await fetch(`${CONFIG.apiUrl}/alert-history?limit=20`,{cache:'no-store',headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error(`API ${r.status}`);
    const data=await r.json(); serverItems=Array.isArray(data.items)?data.items:[];
    render();
  }catch(error){
    console.warn('Historial d’avisos remot no disponible.',error);
    render();
    if(!combinedItems().length && status)status.textContent='Historial local actiu';
  }
}
