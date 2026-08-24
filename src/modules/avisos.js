import { setText } from '../core/dom.js';

const levelLabels = {
  red:'Avís vermell', orange:'Avís taronja', yellow:'Avís groc',
  none:'Sense avisos', unknown:'Estat no determinat'
};

const pluralLevels = {
  red:'vermells', orange:'taronges', yellow:'grocs', unknown:'oficials'
};

const levelRanks = { red:4, orange:3, yellow:2, unknown:0, none:-1 };
let expiryTimer=null;

function alertExpiry(entry) {
  const direct=entry?.expires || entry?.endsAt || entry?.end || entry?.until;
  if(direct) {
    const parsed=new Date(direct);
    if(!Number.isNaN(parsed.getTime()))return parsed;
  }
  const text=String(entry?.description || '');
  const matches=[...text.matchAll(/(?:a|fins(?:\s+a)?)\s+(\d{1,2}):(\d{2})\s+(\d{2})-(\d{2})-(\d{4})/gi)];
  const match=matches.at(-1);
  if(!match)return null;
  const parsed=new Date(Number(match[5]),Number(match[4])-1,Number(match[3]),Number(match[1]),Number(match[2]));
  return Number.isNaN(parsed.getTime())?null:parsed;
}

function normalizeAlertsPayload(payload) {
  if(!payload?.ok)return payload;
  const now=Date.now();
  const alerts=Array.isArray(payload.alerts)
    ? payload.alerts.filter(entry=>{
      const expiry=alertExpiry(entry);
      return !expiry || expiry.getTime()>now;
    })
    : [];
  const maxLevel=alerts.reduce((highest,entry)=>
    (levelRanks[entry?.level] ?? 0)>(levelRanks[highest] ?? -1) ? (entry.level || 'unknown') : highest
  ,'none');
  return {
    ...payload,
    status:alerts.length?'active':'clear',
    active:alerts.length,
    maxLevel,
    alerts
  };
}

function notifyAlertState(payload) {
  document.dispatchEvent(new CustomEvent('observatori:alerts-updated',{ detail:payload }));
}

function scheduleExpiryRefresh(payload) {
  if(expiryTimer)clearTimeout(expiryTimer);
  expiryTimer=null;
  if(!payload?.ok)return;
  const now=Date.now();
  const next=(payload.alerts || [])
    .map(alertExpiry)
    .filter(date=>date && date.getTime()>now)
    .sort((a,b)=>a-b)[0];
  if(!next)return;
  expiryTimer=setTimeout(()=>renderAlerts(payload),Math.max(250,next.getTime()-now+250));
}

function expiryLabel(alerts=[]) {
  const expiries=alerts.map(alertExpiry).filter(Boolean).sort((a,b)=>b-a);
  if(!expiries.length)return '';
  const expiry=expiries[0];
  const sameDay=expiry.toDateString()===new Date().toDateString();
  const time=new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(expiry);
  return sameDay?`Vigent fins a les ${time}`:`Vigent fins al ${new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(expiry)}`;
}

function phenomenaLabel(alerts=[]) {
  const values=[...new Set(alerts.map(entry=>entry.phenomenon || entry.title).filter(Boolean).map(value=>String(value).trim()))];
  if(!values.length)return 'Consulta el detall oficial';
  if(values.length===1)return values[0];
  if(values.length===2)return `${values[0]} i ${values[1].toLocaleLowerCase('ca-ES')}`;
  return `${values.slice(0,-1).join(', ')} i ${values.at(-1).toLocaleLowerCase('ca-ES')}`;
}

function renderAlertShortcuts(payload) {
  const quick=document.getElementById('quick-alert-link');
  const mobile=document.getElementById('mobile-alert-shortcut');
  let level='unknown'; let title='Verificació no disponible'; let copy='Consulta els canals oficials'; let action='Comprovar →';
  if(payload?.ok && Number(payload.active)>0) {
    level=payload.maxLevel || 'unknown';
    const count=Number(payload.active);
    title=count===1 ? (levelLabels[level] || 'Avís oficial actiu') : `${count} avisos ${pluralLevels[level] || 'oficials'} actius`;
    const expiry=expiryLabel(payload.alerts);
    copy=[phenomenaLabel(payload.alerts),expiry].filter(Boolean).join(' · ');
    action='Consultar →';
  } else if(payload?.ok) {
    level='clear'; title='Sense avisos oficials actius'; copy='Darrera comprovació oficial actualitzada'; action='Veure fonts →';
  }
  [quick,mobile].forEach(element=>{
    if(!element)return;
    element.className=element===quick?`quick-alert is-${level}`:`mobile-alert-shortcut is-${level}`;
    element.setAttribute('aria-label',`${title}. ${copy}. Anar als avisos oficials.`);
  });
  setText('quick-alert-kicker',level==='clear'?'Vigilància oficial':'Avisos oficials');
  setText('quick-alert-title',title); setText('quick-alert-action',action);
  setText('mobile-alert-title',title); setText('mobile-alert-copy',copy);
}

function checkedLabel(payload) {
  const value=payload?.checkedAt || payload?.updated;
  if(!value)return 'Comprovació oficial sense hora disponible';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Comprovació oficial actualitzada';
  return `Comprovat a les ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date)}`;
}

function alertItem(entry) {
  const article=document.createElement('article');
  article.className=`official-alert-item is-${entry.level || 'unknown'}`;
  const level=document.createElement('span');
  level.textContent=entry.levelLabel || levelLabels[entry.level] || 'Avís actiu';
  const body=document.createElement('div');
  const title=document.createElement('strong');
  title.textContent=entry.phenomenon || entry.title || 'Fenomen meteorològic';
  const copy=document.createElement('small');
  copy.textContent=entry.description || entry.title || 'Consulta el detall oficial per conèixer l’abast i la vigència.';
  const expiry=alertExpiry(entry);
  const validity=document.createElement('span');
  validity.className='official-alert-validity';
  validity.textContent=expiry ? expiryLabel([entry]) : 'Vigència disponible al detall oficial';
  const link=document.createElement('a');
  link.href=entry.link || 'https://www.aemet.es/es/eltiempo/prediccion/avisos?l=690803&w=hoy';
  link.target='_blank'; link.rel='noreferrer'; link.textContent='Detall oficial ↗';
  body.append(title,copy,validity,link); article.append(level,body);
  return article;
}

export function renderAlerts(payload) {
  payload=normalizeAlertsPayload(payload);
  const card=document.getElementById('alerts-local-card');
  const list=document.getElementById('official-alert-list');
  if(!card||!list)return payload;
  const level=payload?.ok ? (payload.maxLevel || 'none') : 'unknown';
  renderAlertShortcuts(payload);
  card.className=`alerts-local is-${level}`;
  list.replaceChildren();
  if(!payload?.ok){
    setText('alerts-local-title','No s’ha pogut verificar ara mateix');
    setText('alerts-local-copy','El servei oficial no ha respost. L’enllaç directe d’AEMET continua disponible per fer la comprovació manual.');
    setText('alerts-local-status','Servei temporalment no disponible');
    const empty=document.createElement('div'); empty.className='official-alert-empty';
    empty.innerHTML='<strong>Estat desconegut</strong><span>No s’interpreta com a absència d’avisos.</span>';
    list.append(empty);
  } else if(payload.active>0){
    setText('alerts-local-title',`${payload.active} ${payload.active===1?'avís oficial actiu':'avisos oficials actius'}`);
    setText('alerts-local-copy',`AEMET informa d’un nivell màxim ${levelLabels[level]?.replace('Avís ','').toLowerCase() || 'actiu'} a la zona oficial del Prelitoral de Barcelona, que inclou Sant Celoni.`);
    setText('alerts-local-status',levelLabels[level] || 'Avís actiu');
    payload.alerts.forEach(entry=>list.append(alertItem(entry)));
  } else {
    setText('alerts-local-title','Sense avisos oficials actius');
    setText('alerts-local-copy','AEMET no manté cap avís actiu a la zona oficial del Prelitoral de Barcelona en la darrera comprovació.');
    setText('alerts-local-status','Situació sense avisos');
    const empty=document.createElement('div'); empty.className='official-alert-empty is-clear';
    empty.innerHTML='<strong>Prelitoral de Barcelona · sense avisos</strong><span>Continua disponible el mapa de Meteocat per contrastar el Vallès Oriental.</span>';
    list.append(empty);
  }
  setText('alerts-updated',checkedLabel(payload));
  scheduleExpiryRefresh(payload);
  notifyAlertState(payload);
  return payload;
}

export function renderAlertsUnavailable() {
  renderAlerts({ ok:false, status:'unavailable', maxLevel:'unknown', alerts:[], active:null, checkedAt:new Date().toISOString() });
}
