import { CONFIG } from '../core/config.js';
import { getLocale } from '../core/i18n.js';

const REFRESH_MS=30*60*1000;
const byId=id=>document.getElementById(id);

function textElement(tag,className,text){const element=document.createElement(tag);element.className=className;element.textContent=text;return element;}

function renderUnavailable(){
  const list=byId('civil-protection-list');if(!list)return;
  list.replaceChildren(textElement('div','civil-protection-empty','No s’ha pogut verificar ara el registre oficial. Consulta la font del CECAT.'));
  byId('civil-protection-status').textContent='Temporalment no disponible';
}

function renderPlan(plan){
  const article=document.createElement('article');article.className=`civil-protection-plan is-${plan.phaseKey||'active'}`;
  const head=document.createElement('header');
  const identity=document.createElement('div');identity.append(textElement('span','civil-protection-plan__code',plan.acronym||'Pla actiu'),textElement('strong','',plan.name||plan.acronym||'Pla de protecció civil'));
  head.append(identity,textElement('span','civil-protection-plan__phase',plan.phase||'Actiu'));
  const scope=textElement('p',`civil-protection-plan__scope${plan.scope?.localImpact==='confirmed'?' is-local':''}`,plan.scope?.label||'Actiu a Catalunya');
  const description=textElement('p','civil-protection-plan__description',plan.description||'Sense descripció addicional al registre oficial.');
  article.append(head,scope,description);
  if(plan.updatedLabel)article.append(textElement('small','civil-protection-plan__updated',`Darrera actualització oficial: ${plan.updatedLabel}`));
  if(plan.scope?.localImpact!=='confirmed')article.append(textElement('small','civil-protection-plan__caveat','El registre general no confirma per si sol afectació a Sant Celoni.'));
  if(plan.documentUrl){const link=document.createElement('a');link.href=plan.documentUrl;link.target='_blank';link.rel='noreferrer';link.textContent='Llegir el comunicat oficial ↗';article.append(link);}
  return article;
}

function render(payload){
  const list=byId('civil-protection-list');if(!list)return;
  const plans=Array.isArray(payload?.plans)?payload.plans:[];
  list.replaceChildren(...(plans.length?plans.map(renderPlan):[textElement('div','civil-protection-empty is-clear','Ara mateix el registre oficial no publica cap pla actiu.') ]));
  const time=payload?.checkedAt?new Intl.DateTimeFormat(getLocale(),{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(payload.checkedAt)):'';
  byId('civil-protection-status').textContent=plans.length?`${plans.length} ${plans.length===1?'pla actiu':'plans actius'}${time?` · ${time}`:''}`:`Sense plans actius${time?` · ${time}`:''}`;
}

async function load(){
  if(!byId('civil-protection-list'))return;
  try{const response=await fetch(`${CONFIG.apiUrl}/civil-protection-plans`,{headers:{Accept:'application/json'},cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const payload=await response.json();if(payload?.ok!==true)throw new Error('Resposta oficial no disponible');render(payload);}catch(error){console.warn('Plans de Protecció Civil no disponibles.',error);renderUnavailable();}
}

export function initCivilProtectionPlans(){if(!byId('civil-protection-plans'))return;load();setInterval(load,REFRESH_MS);}
