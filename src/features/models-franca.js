import { CONFIG } from '../core/config.js';

const $=selector=>document.querySelector(selector);
const state={model:'arome',layer:'precipitation',products:[]};
const LABELS={precipitation:'precipitació',temperature:'temperatura',wind:'vent',clouds:'nuvolositat'};

function api(path){return `${CONFIG.apiUrl}${path}`;}
function product(id){return state.products.find(item=>item.id===id);}
function mapUrl(){const params=new URLSearchParams({model:state.model,layer:state.layer,width:'1500',height:'850',fresh:String(Math.floor(Date.now()/600000))});return api(`/meteofrance/map?${params}`);}
function statusLabel(item){if(item.available)return 'Catàleg oficial disponible';if(!item.configured)return 'Pendent d’activar al servidor';return 'Resposta temporalment no disponible';}
function card(item){
  const mode=item.visualizable?'Mapa oficial directe':`${item.members} escenaris probabilístics`;
  const details=[item.horizon,mode,item.steps?`${item.steps} passos temporals`:null,item.coverages?`${item.coverages} cobertures`:null].filter(Boolean);
  return `<article class="product-card"><div class="card-top"><div><p class="eyebrow">${item.protocol.toUpperCase()} · ${item.visualizable?'visual':'numèric'}</p><h3>${item.shortLabel}</h3></div><span class="status ${item.available?'ok':item.configured?'wait':''}" title="${statusLabel(item)}"></span></div><p class="product-purpose">${item.purpose}</p><div class="product-meta">${details.map(value=>`<span>${value}</span>`).join('')}</div><p class="product-note">${statusLabel(item)}</p></article>`;
}
function renderCatalog(){
  $('#product-grid').innerHTML=state.products.map(card).join('');
  const ready=state.products.filter(item=>item.available).length;
  $('#global-state').textContent=`${ready} de ${state.products.length} productes disponibles`;
  $('#global-dot').style.background=ready===state.products.length?'var(--green)':ready?'var(--amber)':'var(--red)';
}
function syncControls(){
  document.querySelectorAll('[data-model]').forEach(button=>button.classList.toggle('active',button.dataset.model===state.model));
  const selected=product(state.model);
  document.querySelectorAll('[data-layer]').forEach(button=>{const enabled=selected?.layers?.includes(button.dataset.layer);button.disabled=!enabled;button.classList.toggle('active',button.dataset.layer===state.layer&&enabled);});
  if(selected&&!selected.layers.includes(state.layer))state.layer=selected.layers[0]||'precipitation';
  document.querySelectorAll('[data-layer]').forEach(button=>button.classList.toggle('active',button.dataset.layer===state.layer&&!button.disabled));
  $('#viewer-title').textContent=`${selected?.shortLabel||state.model} · ${LABELS[state.layer]||state.layer}`;
  $('#viewer-subtitle').textContent=selected?.purpose||'Producte oficial de Météo-France.';
  $('#map-caption').textContent=`${selected?.label||state.model} · Catalunya`;
}
function loadMap(){
  syncControls();
  const image=$('#model-map'); const message=$('#map-message');
  image.classList.remove('loaded');message.hidden=false;message.classList.remove('error');message.innerHTML='<span class="spinner"></span><strong>Preparant el mapa oficial…</strong>';
  image.onload=()=>{image.classList.add('loaded');message.hidden=true;};
  image.onerror=()=>{message.hidden=false;message.classList.add('error');message.innerHTML='<strong>Aquest mapa no està disponible ara mateix. Pots provar un altre producte o tornar-ho a intentar.</strong>';};
  image.src=mapUrl();
}
async function init(){
  try{
    const response=await fetch(api('/meteofrance/models'),{headers:{Accept:'application/json'},cache:'no-store'});
    if(!response.ok)throw new Error(`API ${response.status}`);
    const data=await response.json();state.products=data.products||[];
    $('#checked-at').textContent=`Comprovat ${new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.checkedAt))}`;
    renderCatalog();loadMap();
  }catch{
    $('#product-grid').innerHTML='<article class="product-card"><h3>Connexió temporalment no disponible</h3><p class="product-purpose">La previsió principal continua funcionant. Torna a provar aquest laboratori més tard.</p></article>';
    $('#global-state').textContent='Laboratori temporalment no disponible';$('#global-dot').style.background='var(--red)';loadMap();
  }
}
$('#model-controls').addEventListener('click',event=>{const button=event.target.closest('[data-model]');if(!button)return;state.model=button.dataset.model;loadMap();});
$('#layer-controls').addEventListener('click',event=>{const button=event.target.closest('[data-layer]');if(!button||button.disabled)return;state.layer=button.dataset.layer;loadMap();});
$('#map-refresh').addEventListener('click',loadMap);
init();
