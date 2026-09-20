import {mountPortalShell} from './portal-shell.js';
mountPortalShell('fonta');
const names={best_match:'Open-Meteo · Best Match',ecmwf_ifs025:'ECMWF · IFS 0,25°',icon_eu:'DWD · ICON-EU',meteofrance_arome_france:'Météo-France · AROME',blend:'Mitjana dels tres models',persistence:'Persistència',fonta:'Fonta · correcció experimental'};
const $=id=>document.getElementById(id);
const number=x=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('ca-ES',{maximumFractionDigits:1}):'—';
const date=x=>new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(x));
const cell=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
const url='https://raw.githubusercontent.com/marcelfonta/observatori-fontanillas/fonta-data/status.json';
function render(report){
  if(report?.schema!==1||report.station!=='ISANTC198'||report.mode!=='shadow'||report.productionEnabled!==false||!Array.isArray(report.forecast)||!report.scores)throw new Error('Contracte desconegut');
  const age=Date.now()-Date.parse(report.latestCaptureAt);
  if(!Number.isFinite(age)||age< -300000)throw new Error('Data de captura invàlida');
  $('fonta-captures').textContent=number(report.captureCount);$('fonta-pairs').textContent=number(report.pairedDays);$('fonta-evaluated').textContent=number(report.evaluatedDays);
  $('fonta-status').textContent=`Última captura: ${date(report.latestCaptureAt)}. ${age>30*3600000?'Arxiu desactualitzat: les previsions queden ocultes.':'Arxiu consultat. Fonta continua en fase experimental.'}`;
  $('fonta-forecasts').replaceChildren();
  $('fonta-scores').replaceChildren(cell('p','Encara no hi ha dies avaluats fora d’entrenament.'));
  $('fonta-forecast-date').textContent=age>30*3600000?'Sense previsió vigent disponible.':`Previsió per al ${report.targetDate}. Capturada el ${date(report.latestCaptureAt)}.`;
  if(age<=30*3600000)for(const f of report.forecast){
    if(!names[f.model]||!Number.isFinite(f.max)||!Number.isFinite(f.min))continue;
    const article=document.createElement('article');article.append(cell('h3',names[f.model]),cell('p','Màxima / mínima'),cell('b',`${number(f.max)}° / ${number(f.min)}°`));$('fonta-forecasts').append(article);
  }
  if(report.evaluatedDays>0){
    const wrap=document.createElement('div');wrap.className='fonta-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Resultats comparables, taula desplaçable');
    const table=document.createElement('table'),caption=cell('caption',`Error absolut mitjà · ${report.evaluatedDays} dies · resultats exploratoris`),head=document.createElement('tr');
    for(const label of ['Mètode','Màxima · °C','Mínima · °C']){const th=cell('th',label);th.scope='col';head.append(th);}const thead=document.createElement('thead');thead.append(head);table.append(caption,thead);
    const body=document.createElement('tbody');
    for(const [key,label] of Object.entries(names)){const row=document.createElement('tr');const th=cell('th',label);th.scope='row';row.append(th,cell('td',number(report.scores[key]?.max?.mae)),cell('td',number(report.scores[key]?.min?.mae)));body.append(row);}table.append(body);wrap.append(table);$('fonta-scores').replaceChildren(wrap);
  }
}
$('fonta-refresh').addEventListener('click',async()=>{
  $('fonta-refresh').disabled=true;
  try{const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000),credentials:'omit'});if(!response.ok)throw new Error('Arxiu no disponible');render(await response.json());}
  catch{$('fonta-status').textContent='No s’ha pogut confirmar l’arxiu automàtic. Pot estar pendent d’activació o temporalment inaccessible. No es mostren previsions ni resultats no verificats.';$('fonta-forecasts').replaceChildren();$('fonta-scores').replaceChildren(cell('p','Resultats no disponibles.'));for(const id of ['fonta-captures','fonta-pairs','fonta-evaluated'])$(id).textContent='—';$('fonta-forecast-date').textContent='Sense previsió verificada disponible.';}
  finally{$('fonta-refresh').disabled=false;}
});
