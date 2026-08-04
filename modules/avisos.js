import { setText } from '../js/utils.js';

const levelLabels = {
  red:'Avís vermell', orange:'Avís taronja', yellow:'Avís groc',
  none:'Sense avisos', unknown:'Estat no determinat'
};

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
  const link=document.createElement('a');
  link.href=entry.link || 'https://www.aemet.es/es/eltiempo/prediccion/avisos?l=690803&w=hoy';
  link.target='_blank'; link.rel='noreferrer'; link.textContent='Detall oficial ↗';
  body.append(title,copy,link); article.append(level,body);
  return article;
}

export function renderAlerts(payload) {
  const card=document.getElementById('alerts-local-card');
  const list=document.getElementById('official-alert-list');
  if(!card||!list)return;
  const level=payload?.ok ? (payload.maxLevel || 'none') : 'unknown';
  card.className=`alerts-local panel is-${level}`;
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
    setText('alerts-local-copy',`AEMET informa d’un nivell màxim ${levelLabels[level]?.replace('Avís ','').toLowerCase() || 'actiu'} al Prelitoral de Barcelona.`);
    setText('alerts-local-status',levelLabels[level] || 'Avís actiu');
    payload.alerts.forEach(entry=>list.append(alertItem(entry)));
  } else {
    setText('alerts-local-title','Sense avisos oficials actius');
    setText('alerts-local-copy','AEMET no manté cap avís actiu al Prelitoral de Barcelona en la darrera comprovació.');
    setText('alerts-local-status','Situació sense avisos');
    const empty=document.createElement('div'); empty.className='official-alert-empty is-clear';
    empty.innerHTML='<strong>Prelitoral de Barcelona · sense avisos</strong><span>Continua disponible el mapa de Meteocat per contrastar el Vallès Oriental.</span>';
    list.append(empty);
  }
  setText('alerts-updated',checkedLabel(payload));
}

export function renderAlertsUnavailable() {
  renderAlerts({ ok:false, status:'unavailable', maxLevel:'unknown', alerts:[], active:null, checkedAt:new Date().toISOString() });
}
