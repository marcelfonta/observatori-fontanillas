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

function parseAlertDate(value) {
  if(!value)return null;
  const parsed=new Date(value);
  return Number.isNaN(parsed.getTime())?null:parsed;
}

function alertStart(entry) {
  const direct=parseAlertDate(entry?.starts || entry?.startsAt || entry?.start || entry?.from);
  if(direct)return direct;
  const text=String(entry?.description || '');
  const match=text.match(/(?:des(?: |\s)*de|a partir de(?: les)?|inici(?:o)?(?:\s+a les)?|\bde)\s+(\d{1,2}):(\d{2})\s+(\d{2})-(\d{2})-(\d{4})(?:[^()]*\(UTC\s*([+-]\d{1,2})\))?/i);
  if(!match)return null;
  const offset=Number(match[6]||0);
  const parsed=new Date(Date.UTC(Number(match[5]),Number(match[4])-1,Number(match[3]),Number(match[1])-offset,Number(match[2])));
  return Number.isNaN(parsed.getTime())?null:parsed;
}

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
  const now=new Date();
  const alerts=Array.isArray(payload.alerts)
    ? payload.alerts.filter(entry=>{
      const expiry=alertExpiry(entry);
      return !expiry || expiry.getTime()>now.getTime();
    })
    : [];
  const windows=classifyAlertWindows(alerts,now);
  const maxLevel=windows.now.reduce((highest,entry)=>
    (levelRanks[entry?.level] ?? 0)>(levelRanks[highest] ?? -1) ? (entry.level || 'unknown') : highest
  ,'none');
  return {
    ...payload,
    status:windows.now.length?'active':'clear',
    active:windows.now.length,
    maxLevel,
    alerts,
    windows
  };
}

function madridDateKey(value) {
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}

function nextDateKey(key) {
  const [year,month,day]=String(key).split('-').map(Number);
  if(!year||!month||!day)return '';
  return new Date(Date.UTC(year,month-1,day+1)).toISOString().slice(0,10);
}

export function classifyAlertWindows(alerts=[],now=new Date()) {
  const current=now instanceof Date?now:new Date(now);
  const today=madridDateKey(current);
  const tomorrow=nextDateKey(today);
  const result={now:[],today:[],tomorrow:[],later:[]};
  for(const entry of alerts){
    const start=alertStart(entry);
    const end=alertExpiry(entry);
    if(end&&end<=current)continue;
    if((!start||start<=current)&&(!end||end>current)){result.now.push(entry);continue;}
    const key=madridDateKey(start);
    if(key===today)result.today.push(entry);
    else if(key===tomorrow)result.tomorrow.push(entry);
    else result.later.push(entry);
  }
  return result;
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
    .flatMap(entry=>[alertStart(entry),alertExpiry(entry)])
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
    const activeAlerts=payload.windows?.now||payload.alerts;
    const expiry=expiryLabel(activeAlerts);
    copy=[phenomenaLabel(activeAlerts),expiry].filter(Boolean).join(' · ');
    action='Consultar →';
  } else if(payload?.ok) {
    const upcoming=(payload.windows?.today?.length||0)+(payload.windows?.tomorrow?.length||0);
    level='clear'; title='Sense avisos oficials actius ara';
    copy=upcoming?`${upcoming} ${upcoming===1?'avís previst':'avisos previstos'} entre avui i demà`:'Darrera comprovació oficial actualitzada';
    action='Veure fonts →';
  }
  [quick,mobile].forEach(element=>{
    if(!element)return;
    element.className=element===quick?`quick-alert is-${level}`:`mobile-alert-shortcut is-${level}`;
    element.setAttribute('aria-label',`${title}. ${copy}. Anar als avisos oficials.`);
  });
  setText('quick-alert-kicker',level==='clear'?'Vigilància oficial':'Avisos oficials');
  setText('quick-alert-title',title); setText('quick-alert-action',action);
  setText('quick-alert-meta',copy);
  setText('mobile-alert-title',title); setText('mobile-alert-copy',copy);
}

function checkedLabel(payload) {
  const value=payload?.checkedAt || payload?.updated;
  if(!value)return 'Comprovació oficial sense hora disponible';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Comprovació oficial actualitzada';
  return `Comprovat a les ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date)}`;
}

function formatValidityDate(value) {
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  return new Intl.DateTimeFormat('ca-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(date);
}

function alertItem(entry,sourceName='AEMET') {
  const article=document.createElement('article');
  article.className=`official-alert-item is-${entry.level || 'unknown'}`;
  const level=document.createElement('span');
  level.textContent=entry.levelLabel || levelLabels[entry.level] || 'Avís actiu';
  const body=document.createElement('div');
  const title=document.createElement('strong');
  title.textContent=entry.phenomenon || entry.title || 'Fenomen meteorològic';
  const copy=document.createElement('small');
  copy.textContent=entry.description || entry.title || 'Consulta el detall oficial per conèixer l’abast i la vigència.';
  const start=alertStart(entry);
  const expiry=alertExpiry(entry);
  const validity=document.createElement('span');
  validity.className='official-alert-validity';
  const validityParts=[start?`Inici ${formatValidityDate(start)}`:'Inici no facilitat',expiry?`Final ${formatValidityDate(expiry)}`:'Final al detall oficial'];
  validity.textContent=`${entry.source||sourceName} · ${validityParts.join(' · ')}`;
  const scope=document.createElement('span');
  scope.className='official-alert-scope';
  const searchable=`${entry.area||''} ${entry.scopeName||''} ${entry.description||''} ${entry.title||''}`.toLocaleLowerCase('ca-ES');
  const municipal=/sant celoni/.test(searchable);
  const meteocat=(entry.source||sourceName)==='Meteocat';
  scope.classList.add(municipal?'is-municipal':'is-zonal');
  scope.innerHTML=municipal
    ? '<b>Abast municipal</b><span>Sant Celoni consta explícitament al detall oficial.</span>'
    : meteocat
      ? '<b>Abast comarcal</b><span>Vallès Oriental; la intensitat exacta a Sant Celoni pot variar.</span>'
      : '<b>Abast zonal</b><span>Prelitoral de Barcelona; la intensitat exacta a Sant Celoni pot variar.</span>';
  const link=document.createElement('a');
  link.href=entry.link || (meteocat?'https://www.meteo.cat/prediccio/general':'https://www.aemet.es/es/eltiempo/prediccion/avisos?l=690803&w=hoy');
  link.target='_blank'; link.rel='noreferrer'; link.textContent='Detall oficial ↗';
  body.append(title,copy,validity,scope,link); article.append(level,body);
  return article;
}

export function renderAlerts(payload) {
  payload=normalizeAlertsPayload(payload);
  const card=document.getElementById('alerts-local-card');
  const list=document.getElementById('official-alert-list');
  if(!card||!list)return payload;
  const visibleAlerts=payload?.windows ? [...payload.windows.now,...payload.windows.today,...payload.windows.tomorrow,...payload.windows.later] : (payload?.alerts||[]);
  const visibleLevel=visibleAlerts.reduce((highest,entry)=>(levelRanks[entry?.level]??0)>(levelRanks[highest]??-1)?(entry.level||'unknown'):highest,'none');
  const level=payload?.ok ? (payload.active?payload.maxLevel:visibleLevel) : 'unknown';
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
  } else if(visibleAlerts.length){
    setText('alerts-local-title',payload.active?`${payload.active} ${payload.active===1?'avís oficial actiu':'avisos oficials actius'}`:'Ara mateix, sense avisos actius');
    const todayCount=payload.windows?.today?.length||0;const tomorrowCount=payload.windows?.tomorrow?.length||0;
    const laterCount=payload.windows?.later?.length||0;
    setText('alerts-local-copy',`${payload.active?'Hi ha avisos vigents ara mateix.':'Ara mateix no hi ha cap avís vigent.'}${todayCount?` ${todayCount} ${todayCount===1?'comença':'comencen'} més tard avui.`:''}${tomorrowCount?` ${tomorrowCount} ${tomorrowCount===1?'correspon':'corresponen'} a demà.`:''}${laterCount?` ${laterCount} ${laterCount===1?'correspon':'corresponen'} als dies següents.`:''} Fonts oficials: AEMET per al Prelitoral de Barcelona, que inclou Sant Celoni, i Meteocat per al Vallès Oriental.`);
    setText('alerts-local-status',payload.active?(levelLabels[payload.maxLevel]||'Avís actiu'):'Pròxims avisos');
    const groups=[['Ara',payload.windows?.now],['Avui, més tard',payload.windows?.today],['Demà',payload.windows?.tomorrow],['Més endavant',payload.windows?.later]];
    groups.forEach(([label,entries])=>{
      if(!entries?.length)return;
      const heading=document.createElement('h4');heading.className='official-alert-period';heading.textContent=label;list.append(heading);
      entries.forEach(entry=>list.append(alertItem(entry,payload.source?.name||'AEMET')));
    });
  } else {
    setText('alerts-local-title','Sense avisos oficials actius');
    setText('alerts-local-copy','AEMET i Meteocat no mantenen cap avís vigent o previst per als períodes consultats en la darrera comprovació.');
    setText('alerts-local-status','Situació sense avisos');
    const empty=document.createElement('div'); empty.className='official-alert-empty is-clear';
    empty.innerHTML='<strong>Prelitoral de Barcelona i Vallès Oriental · sense avisos</strong><span>Darrera comprovació de les dues fonts oficials disponible.</span>';
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
