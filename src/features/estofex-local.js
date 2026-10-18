import {CONFIG} from '../core/config.js';

const dateTime=value=>value?new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(value)):'hora no disponible';
const riskLabel=value=>String(value||'zona de tempestes').replace(/^15thunder$/i,'zona de tempestes').replace(/^level\s*/i,'nivell ');

export function estofexLocalCopy(item){
  if(!item?.relevant)return 'La perspectiva vigent no situa cap zona de risc a menys de 120 km de Sant Celoni.';
  if(item.inside)return `Sant Celoni queda dins la zona ${riskLabel(item.risk)} de la perspectiva vigent.`;
  return `La zona ${riskLabel(item.risk)} més rellevant passa a uns ${item.distanceKm} km de Sant Celoni.`;
}

export async function initEstofexLocal(){
  const host=document.getElementById('estofex-local');
  const summary=document.getElementById('estofex-summary');
  if(!host||!summary)return;
  try{
    const response=await fetch(`${CONFIG.apiUrl}/estofex-local`,{headers:{Accept:'application/json'}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const data=await response.json();
    const item=data.forecasts?.[0];
    summary.textContent=item?estofexLocalCopy(item):'Ara mateix ESTOFEX no publica cap perspectiva vigent. No és un avís oficial.';
    if(!item)return;
    host.hidden=false;host.setAttribute('aria-busy','false');
    document.getElementById('estofex-risk').textContent=item.relevant?(item.inside?`Dins la zona ${riskLabel(item.risk)}`:`Zona ${riskLabel(item.risk)} a ${item.distanceKm} km`):'Sense afectació pròxima detectada';
    document.getElementById('estofex-period').textContent=`Vigent del ${dateTime(item.start)} al ${dateTime(item.expiry)} · emès per ${item.forecaster||'ESTOFEX'}`;
    const image=document.getElementById('estofex-map');image.src=item.mapUrl;image.hidden=!item.relevant;
  }catch(error){
    console.warn('No s’ha pogut carregar el context local ESTOFEX.',error);
    summary.textContent='El context d’ESTOFEX no està disponible temporalment. Consulta els avisos oficials i la font original.';
  }
}
