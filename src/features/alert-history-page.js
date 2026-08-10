import { CONFIG } from '../core/config.js';

const locale='ca-ES';
const state={page:1,pageSize:20,filters:{q:'',year:'',month:'',level:'',source:'',phenomenon:''},payload:null,controller:null};
const $=id=>document.getElementById(id);
const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
const levelLabel=level=>({red:'Vermell',orange:'Taronja',yellow:'Groc',none:'Sense avisos',unknown:'Oficial'})[level]||'Oficial';
const number=value=>(Number(value)||0).toLocaleString(locale);
const dateLabel=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(date);};
const monthLabel=value=>{const date=new Date(`${value}-01T12:00:00`);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat(locale,{month:'short',year:'2-digit'}).format(date).replaceAll('.','');};

export function buildAlertHistoryQuery(filters={},page=1,pageSize=20){
  const params=new URLSearchParams({page:String(Math.max(1,Number(page)||1)),pageSize:String(Math.min(100,Math.max(1,Number(pageSize)||20)))});
  for(const key of ['q','year','month','level','source','phenomenon'])if(String(filters[key]||'').trim())params.set(key,String(filters[key]).trim());
  return params.toString();
}

export function alertHistoryCsv(items=[]){
  const cell=value=>`"${String(value??'').replaceAll('"','""')}"`;
  const rows=[['Data inici','Data final','Nivell','Fenomen','Organisme','Títol','Descripció'],...items.map(item=>[item.started_at,item.expires_at,levelLabel(item.level),item.phenomenon,item.source,item.title,item.description])];
  return `\ufeff${rows.map(row=>row.map(cell).join(';')).join('\n')}`;
}

function readFilters(){
  state.filters={q:$('history-search')?.value||'',year:$('history-year')?.value||'',month:$('history-month')?.value||'',level:$('history-level')?.value||'',source:$('history-source')?.value||'',phenomenon:$('history-phenomenon')?.value||''};
}

function setOptions(id,values,label){
  const select=$(id);if(!select)return;const current=select.value;
  select.innerHTML=`<option value="">${label}</option>${(values||[]).map(value=>`<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('')}`;
  if([...select.options].some(option=>option.value===current))select.value=current;
}

function renderStats(stats={}){
  $('history-stat-total').textContent=number(stats.total);$('history-stat-days').textContent=number(stats.alertDays);$('history-stat-severe').textContent=number(stats.severe);
  $('history-stat-red').textContent=`${number(stats.red)} ${Number(stats.red)===1?'vermell':'vermells'}`;$('history-stat-top').textContent=stats.topPhenomenon||'—';
  $('history-stat-range').textContent=stats.first&&stats.latest?`${new Date(stats.first).getFullYear()}–${new Date(stats.latest).getFullYear()}`:'Arxiu complet';
}

function renderBars(id,rows,labeler=value=>value){
  const host=$(id);if(!host)return;const values=(rows||[]).filter(row=>row.key&&Number(row.count)>0);const max=Math.max(1,...values.map(row=>Number(row.count)||0));
  host.innerHTML=values.length?values.map(row=>`<div class="history-bar"><span>${escapeHtml(labeler(row.key))}</span><i><b style="width:${Math.max(5,(Number(row.count)||0)/max*100)}%"></b></i><strong>${number(row.count)}</strong></div>`).join(''):'<span class="history-chart-empty">Encara no hi ha prou dades per dibuixar el gràfic.</span>';
}

function renderCharts(stats={}){
  const months=[...(stats.byMonth||[])].sort((a,b)=>String(a.key).localeCompare(String(b.key)));
  renderBars('history-month-chart',months,monthLabel);renderBars('history-phenomenon-chart',(stats.byPhenomenon||[]).slice(0,8));
}

function renderFilters(){
  const labels=[];const f=state.filters;
  if(f.q)labels.push(`cerca «${f.q}»`);if(f.year)labels.push(`any ${f.year}`);if(f.month)labels.push($('history-month')?.selectedOptions[0]?.textContent);if(f.level)labels.push(`nivell ${levelLabel(f.level).toLowerCase()}`);if(f.source)labels.push(f.source);if(f.phenomenon)labels.push(f.phenomenon);
  $('history-filter-summary').textContent=labels.length?`Filtres actius · ${labels.join(' · ')}`:'Sense filtres: es mostra tot l’arxiu.';
}

function renderItems(payload){
  const list=$('history-page-list');const items=payload.items||[];const pagination=payload.pagination||{};
  $('history-page-count').textContent=`${number(pagination.total)} ${Number(pagination.total)===1?'episodi':'episodis'}`;
  if(list)list.innerHTML=items.length?items.map(item=>`<article class="alert-history-item is-${escapeHtml(item.level||'unknown')}"><span class="alert-history-level">${levelLabel(item.level)}</span><div><strong>${escapeHtml(item.phenomenon||item.title||'Avís meteorològic')}</strong><small>${escapeHtml(item.source||'AEMET')} · ${dateLabel(item.started_at||item.created_at)}</small><p>${escapeHtml(item.description||item.title||'')}</p>${item.expires_at?`<em>Final previst · ${dateLabel(item.expires_at)}</em>`:''}</div></article>`).join(''):'<div class="alert-history-empty"><strong>No hi ha coincidències</strong><span>Prova un altre període, nivell, organisme o terme de cerca.</span></div>';
  const totalPages=Number(pagination.totalPages)||0;const page=Number(pagination.page)||1;
  $('history-pagination-label').textContent=totalPages?`Pàgina ${page} de ${totalPages}`:'Cap pàgina';
  $('history-previous').disabled=page<=1;$('history-next').disabled=!totalPages||page>=totalPages;
}

function render(payload){
  state.payload=payload;state.page=payload.pagination?.page||1;
  setOptions('history-year',payload.facets?.years,'Tots els anys');setOptions('history-source',payload.facets?.sources,'Tots els organismes');setOptions('history-phenomenon',payload.facets?.phenomena,'Tots els fenòmens');
  renderStats(payload.stats);renderCharts(payload.stats);renderFilters();renderItems(payload);
}

async function load(){
  state.controller?.abort();state.controller=new AbortController();
  $('history-page-list').setAttribute('aria-busy','true');$('history-page-count').textContent='Carregant…';
  try{
    const query=buildAlertHistoryQuery(state.filters,state.page,state.pageSize);
    const response=await fetch(`${CONFIG.apiUrl}/alert-history?${query}`,{cache:'no-store',headers:{Accept:'application/json'},signal:state.controller.signal});
    if(!response.ok)throw new Error(`API ${response.status}`);render(await response.json());
  }catch(error){
    if(error.name==='AbortError')return;console.warn('Historial complet no disponible.',error);
    $('history-page-list').innerHTML='<div class="alert-history-empty"><strong>No s’ha pogut carregar l’arxiu</strong><span>La pàgina d’avisos i les fonts oficials continuen disponibles.</span></div>';$('history-page-count').textContent='No disponible';
  }finally{$('history-page-list')?.removeAttribute('aria-busy');}
}

async function fetchAllFiltered(){
  const first=await fetch(`${CONFIG.apiUrl}/alert-history?${buildAlertHistoryQuery(state.filters,1,100)}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!first.ok)throw new Error(`API ${first.status}`);
  const payload=await first.json();const items=[...(payload.items||[])];const pages=Number(payload.pagination?.totalPages)||1;
  for(let page=2;page<=pages;page+=1){const response=await fetch(`${CONFIG.apiUrl}/alert-history?${buildAlertHistoryQuery(state.filters,page,100)}`,{cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`API ${response.status}`);items.push(...((await response.json()).items||[]));}
  return items;
}

function download(content,type,name){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function pdfAscii(value){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,'').replace(/\s+/g,' ').replace(/[\\()]/g,match=>`\\${match}`);}
function alertHistoryPdf(items){
  const generated=new Date().toLocaleString(locale);const body=items.flatMap((item,index)=>[`${index+1}. ${dateLabel(item.started_at)} | ${levelLabel(item.level)} | ${item.phenomenon||item.title||'Avis'}`,`   ${item.source||'AEMET'} | ${String(item.description||item.title||'').slice(0,95)}`]);
  const chunks=[];for(let index=0;index<Math.max(1,body.length);index+=38)chunks.push(body.slice(index,index+38));
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const kids=[];
  chunks.forEach((chunk,pageIndex)=>{const pageId=4+pageIndex*2,contentId=pageId+1;kids.push(`${pageId} 0 R`);const lines=['OBSERVATORI METEOROLOGIC FONTANILLAS',`Historial d'avisos | ${items.length} episodis | ${generated}`,`Pagina ${pageIndex+1} de ${chunks.length}`,'',...chunk];const stream=lines.map((line,index)=>`BT /F1 ${index===0?15:9} Tf 45 ${800-index*18} Td (${pdfAscii(line)}) Tj ET`).join('\n');objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);});
  objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${String(offset).padStart(10,'0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return pdf;
}

async function runExport(format){
  const status=$('history-export-status');status.textContent='Preparant l’arxiu complet filtrat…';
  try{const items=await fetchAllFiltered();if(!items.length){status.textContent='No hi ha episodis per exportar amb aquests filtres.';return;}if(format==='csv')download(alertHistoryCsv(items),'text/csv;charset=utf-8','historial-avisos-fontanillas.csv');else download(alertHistoryPdf(items),'application/pdf','historial-avisos-fontanillas.pdf');status.textContent=`${format.toUpperCase()} preparat amb ${number(items.length)} episodis.`;}catch(error){console.warn('Exportació d’avisos no disponible.',error);status.textContent='No s’ha pogut preparar la descàrrega. Torna-ho a provar.';}
}

function init(){
  if(!$('history-page-list'))return;
  let searchTimer;$('history-search')?.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{readFilters();state.page=1;load();},280);});
  for(const id of ['history-year','history-month','history-level','history-source','history-phenomenon'])$(id)?.addEventListener('change',()=>{readFilters();state.page=1;load();});
  $('history-page-size')?.addEventListener('change',event=>{state.pageSize=Number(event.target.value)||20;state.page=1;load();});
  $('history-previous')?.addEventListener('click',()=>{if(state.page>1){state.page-=1;load();}});$('history-next')?.addEventListener('click',()=>{state.page+=1;load();});
  $('history-clear')?.addEventListener('click',()=>{for(const id of ['history-search','history-year','history-month','history-level','history-source','history-phenomenon'])if($(id))$(id).value='';readFilters();state.page=1;load();});
  $('history-export-csv')?.addEventListener('click',()=>runExport('csv'));$('history-export-pdf')?.addEventListener('click',()=>runExport('pdf'));load();
}

if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
