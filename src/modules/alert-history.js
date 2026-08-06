import { CONFIG } from '../core/config.js';

function escapeHtml(value=''){ return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function levelLabel(level){ return ({red:'Vermell',orange:'Taronja',yellow:'Groc',none:'Sense avisos',unknown:'Oficial'})[level]||'Oficial'; }
function formatDate(value){ const d=new Date(value); if(Number.isNaN(d.getTime()))return '—'; return new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(d); }

export async function loadAlertHistory(){
  const host=document.getElementById('alert-history-list');
  const status=document.getElementById('alert-history-status');
  if(!host)return;
  try{
    const r=await fetch(`${CONFIG.apiUrl}/alert-history?limit=20`,{cache:'no-store',headers:{Accept:'application/json'}});
    if(!r.ok)throw new Error(`API ${r.status}`);
    const data=await r.json(); const items=Array.isArray(data.items)?data.items:[];
    if(!items.length){ host.innerHTML='<div class="alert-history-empty"><strong>Encara no hi ha avisos desats</strong><span>L’historial s’anirà construint quan el Worker registri canvis oficials.</span></div>'; if(status)status.textContent='0 episodis desats'; return; }
    host.innerHTML=items.map(item=>`<article class="alert-history-item is-${escapeHtml(item.level||'unknown')}"><span class="alert-history-level">${levelLabel(item.level)}</span><div><strong>${escapeHtml(item.phenomenon||item.title||'Avís meteorològic')}</strong><small>${escapeHtml(item.source||'AEMET')} · ${formatDate(item.started_at||item.created_at)}</small><p>${escapeHtml(item.description||'')}</p></div></article>`).join('');
    if(status)status.textContent=`${items.length} episodis recents`;
  }catch(error){ console.warn('Historial d’avisos no disponible.',error); host.innerHTML='<div class="alert-history-empty"><strong>Historial temporalment no disponible</strong><span>Els avisos actuals continuen funcionant amb normalitat.</span></div>'; if(status)status.textContent='No disponible'; }
}
