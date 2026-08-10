import { CONFIG } from '../core/config.js';

let items=[];
const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
const levelLabel=level=>({red:'Vermell',orange:'Taronja',yellow:'Groc',none:'Sense avisos',unknown:'Oficial'})[level]||'Oficial';
function dateLabel(value){const date=new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(date);}
function render(){
  const list=document.getElementById('history-page-list');
  const count=document.getElementById('history-page-count');
  const query=(document.getElementById('history-search')?.value||'').trim().toLocaleLowerCase('ca');
  const year=document.getElementById('history-year')?.value||'';
  const level=document.getElementById('history-level')?.value||'';
  const filtered=items.filter(item=>{
    const date=new Date(item.started_at||item.created_at||0);
    const haystack=[item.phenomenon,item.title,item.description,item.source].join(' ').toLocaleLowerCase('ca');
    return (!query||haystack.includes(query))&&(!year||String(date.getFullYear())===year)&&(!level||item.level===level);
  });
  if(count)count.textContent=`${filtered.length} ${filtered.length===1?'episodi':'episodis'}`;
  if(!list)return;
  list.innerHTML=filtered.length?filtered.map(item=>`<article class="alert-history-item is-${escapeHtml(item.level||'unknown')}"><span class="alert-history-level">${levelLabel(item.level)}</span><div><strong>${escapeHtml(item.phenomenon||item.title||'Avís meteorològic')}</strong><small>${escapeHtml(item.source||'AEMET')} · ${dateLabel(item.started_at||item.created_at)}</small><p>${escapeHtml(item.description||'')}</p></div></article>`).join(''):'<div class="alert-history-empty"><strong>No hi ha coincidències</strong><span>Prova un altre any, nivell o terme de cerca.</span></div>';
}
async function init(){
  const list=document.getElementById('history-page-list');
  if(!list)return;
  try{
    const response=await fetch(`${CONFIG.apiUrl}/alert-history?limit=100`,{cache:'no-store',headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`API ${response.status}`);
    const payload=await response.json();items=Array.isArray(payload.items)?payload.items:[];
    const years=[...new Set(items.map(item=>new Date(item.started_at||item.created_at||0).getFullYear()).filter(Number.isFinite))].sort((a,b)=>b-a);
    const select=document.getElementById('history-year');if(select)select.insertAdjacentHTML('beforeend',years.map(year=>`<option value="${year}">${year}</option>`).join(''));
    render();
  }catch(error){console.warn('Historial complet no disponible.',error);list.innerHTML='<div class="alert-history-empty"><strong>No s’ha pogut carregar l’arxiu</strong><span>La pàgina d’avisos i les fonts oficials continuen disponibles.</span></div>';}
  ['history-search','history-year','history-level'].forEach(id=>document.getElementById(id)?.addEventListener(id==='history-search'?'input':'change',render));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
