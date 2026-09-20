import {mountPortalShell} from './portal-shell.js';
import {missingCaptureSlots} from '../core/fonta-diagnostics.js';
mountPortalShell('fonta');
const names={best_match:'Open-Meteo · Best Match',ecmwf_ifs025:'ECMWF · IFS 0,25°',icon_eu:'DWD · ICON-EU',meteofrance_arome_france:'Météo-France · AROME',blend:'Mitjana dels tres models',persistence:'Persistència',fonta:'Fonta · correcció experimental'};
const $=id=>document.getElementById(id);
const number=x=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString('ca-ES',{maximumFractionDigits:1}):'—';
const date=x=>new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(x));
const cell=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
const safeDate=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?date(value):'desconeguda';
const qcLabels={coverage:'cobertura inferior al 90%',samples:'lectures insuficients',hours:'hores sense lectures',gap:'buit superior a 20 min',jump:'salt tèrmic per revisar',invalid:'valors invàlids o contradictoris','unknown-quality':'qualitat pendent de detall'};
const issueLabels={'outside-window':'Fora de la finestra D+1 (08–10 UTC)','incomplete-models':'Models incomplets per a D+1','duplicate-day':'Ja hi havia una emissió per a aquest dia','eligible-issue':'Emissió apta; encara cal l’observació posterior'};
const url='https://raw.githubusercontent.com/marcelfonta/observatori-fontanillas/fonta-data/status.json';
let displayedReport=null,displayedStale=false;
function detailTable(title,headers,rows){
  const details=document.createElement('details');details.append(cell('summary',title));
  const wrap=document.createElement('div');wrap.className='fonta-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',title);
  const table=document.createElement('table'),thead=document.createElement('thead'),head=document.createElement('tr');
  for(const label of headers){const th=cell('th',label);th.scope='col';head.append(th);}thead.append(head);table.append(thead);
  const body=document.createElement('tbody');for(const values of rows){const tr=document.createElement('tr');values.forEach((value,i)=>{const el=cell(i?'td':'th',value);if(!i)el.scope='row';tr.append(el);});body.append(tr);}table.append(body);wrap.append(table);details.append(wrap);return details;
}
function renderDiagnostics(report,age){
  const box=$('fonta-monitor'),d=report.diagnostics;box.replaceChildren();delete box.dataset.state;
  if(d?.schema!==1||!d.progress||!d.budget||!Array.isArray(d.sources)||!Array.isArray(d.quality?.recent)||!Array.isArray(d.recentCaptures)){
    box.append(cell('p','Aquest informe encara no inclou el nou diagnòstic detallat. Les captures existents es conserven.'));return;
  }
  const missing=missingCaptureSlots(d),degraded=d.sources.some(s=>s.state!=='available')||d.latestFailures?.length>0;
  const observationRejected=d.quality.recent.at(-1)?.eligible===false;
  const state=age>30*3600000?'stale':degraded||observationRejected||missing?.length||d.budget.reviewNeeded?'review':'current';
  box.dataset.state=state;
  box.append(cell('h3',state==='stale'?'Arxiu desactualitzat':state==='review'?'Pilot amb punts per revisar':'Última captura completa'));
  box.append(cell('p',`Diagnòstic de l’informe: ${safeDate(d.asOf)}. No certifica que totes les execucions programades s’hagin fet.`));
  if(degraded)box.append(cell('p','Hi ha fonts absents o incompletes. No s’han substituït per zeros ni per una altra font.'));
  if(observationRejected)box.append(cell('p','L’últim dia observat no supera els filtres tècnics. Els motius es detallen a la taula de qualitat.'));
  if(missing?.length)box.append(cell('p',`${missing.length} franges sense captura a la finestra recent (màxim 7 dies), amb 2 h de marge. Cal consultar Actions: això no identifica la causa.`));
  const event=d.execution?.event==='schedule'?'programada':d.execution?.event==='workflow_dispatch'?'manual':'local o no identificada';
  box.append(cell('p',`Generació de l’informe: ${event}. Horari previst: 08:10 i 20:10 UTC; GitHub pot endarrerir-lo. Una franja ja conservada no es torna a capturar.`));
  const actions=document.createElement('a');actions.textContent='Consultar execucions a GitHub →';actions.href='https://github.com/marcelfonta/observatori-fontanillas/actions/workflows/fonta-shadow.yml';box.append(actions);
  const progress=document.createElement('div');progress.className='fonta-progress-grid';
  for(const [title,current,total] of [['Entrenament disponible',d.progress.trainingDays,d.progress.trainingRequired],['Prova cronològica recalculada',d.progress.backtestDays,d.progress.exploratoryRequired]]){
    const item=document.createElement('div');item.append(cell('strong',`${title}: ${number(current)} / ${number(total)} dies`));
    if(Number.isInteger(current)&&current>=0&&Number.isInteger(total)&&total>0){const bar=document.createElement('progress');bar.max=total;bar.value=Math.min(current,total);bar.setAttribute('aria-label',title);item.append(bar);}progress.append(item);
  }
  box.append(progress,cell('p','Són requisits mínims tècnics, no un percentatge de qualitat ni una autorització per publicar previsions Fonta.'));
  const size=Number.isFinite(d.budget.bytes)?`${number(d.budget.bytes/1048576)} MiB`:'mida desconeguda';
  box.append(cell('p',`Arxiu pilot: ${number(d.budget.captureCount)} / ${number(d.budget.captureLimit)} captures · ${size} / ${number(d.budget.byteLimit/1048576)} MiB. Mida dels JSON de captures, no de tot l’historial Git.`));
  if(d.budget.reviewNeeded)box.append(cell('p','Cal preparar la migració de l’arxiu abans del límit; no s’esborren captures automàticament.'));
  const states={available:'Disponible',missing:'Absent',incomplete:'Incompleta per a demà'};
  box.append(detailTable('Fonts i hora de recepció',['Font','Estat','Rebuda','Inicialització del model'],d.sources.map(s=>[
    names[s.model]||(s.model==='observations'?'Observacions Fontanillas':'Font desconeguda'),states[s.state]||'Desconegut',safeDate(s.receivedAt),s.model==='observations'?'No aplicable':safeDate(s.modelRunAt)])));
  box.append(cell('p',`Qualitat de l’última versió coneguda de cada dia: ${number(d.quality.accepted)} aptes i ${number(d.quality.rejected)} descartats. Un dia sense lectures no apareix com a dia apte. L’avaluació conserva la primera observació elegible disponible.`));
  box.append(detailTable('Qualitat dels darrers dies observats (màxim 14)',['Dia','Cobertura','Lectures','Buit màxim','Resultat'],d.quality.recent.map(o=>[
    o.date,typeof o.coverage==='number'?`${number(o.coverage*100)}%`:'—',`${number(o.samples)} / ${number(o.expectedSamples)}`,`${number(o.maxGapMinutes)} min`,o.eligible?'Apte tècnicament':(o.reasons||['unknown-quality']).map(r=>qcLabels[r]||qcLabels['unknown-quality']).join('; ')])));
  box.append(detailTable('Darreres captures (màxim 14)',['Captura','Hora','Ús en la comparació'],d.recentCaptures.map(c=>[c.id,safeDate(c.capturedAt),issueLabels[c.issueState]||'Pendent de revisar'])));
}
function render(report){
  if(report?.schema!==1||report.station!=='ISANTC198'||report.mode!=='shadow'||report.productionEnabled!==false||!Array.isArray(report.forecast)||!report.scores)throw new Error('Contracte desconegut');
  const age=Date.now()-Date.parse(report.latestCaptureAt);
  if(!Number.isFinite(age)||age< -300000)throw new Error('Data de captura invàlida');
  renderDiagnostics(report,age);
  const p=report.prospective;
  $('fonta-prospective').replaceChildren(cell('strong','Prediccions congelades abans dels fets'));
  $('fonta-prospective').append(cell('p',Number.isInteger(p?.days)&&p.days>0?`${p.days} dies verificats · MAE màxima: ${number(p.max?.mae)} °C · MAE mínima: ${number(p.min?.mae)} °C. Sèrie exploratòria separada: no comparar-la directament amb la taula si els dies o les hores són diferents.`:'Encara no hi ha resultats prospectius disponibles. No equival a un error de zero graus.'));
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
  displayedReport=report;displayedStale=age>30*3600000;
}
// Expire a page left open without another HTTP request. Never resurrect a failed read.
setInterval(()=>{if(displayedReport&&!displayedStale&&Date.now()-Date.parse(displayedReport.latestCaptureAt)>30*3600000)render(displayedReport);},60000);
$('fonta-refresh').addEventListener('click',async()=>{
  $('fonta-refresh').disabled=true;
  try{const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000),credentials:'omit'});if(!response.ok)throw new Error('Arxiu no disponible');render(await response.json());}
  catch{displayedReport=null;displayedStale=false;$('fonta-status').textContent='No s’ha pogut confirmar l’arxiu automàtic. Pot estar pendent d’activació o temporalment inaccessible. No es mostren previsions ni resultats no verificats.';$('fonta-forecasts').replaceChildren();$('fonta-scores').replaceChildren(cell('p','Resultats no disponibles.'));for(const id of ['fonta-captures','fonta-pairs','fonta-evaluated'])$(id).textContent='—';$('fonta-forecast-date').textContent='Sense previsió verificada disponible.';$('fonta-monitor').replaceChildren(cell('p','Diagnòstic no disponible; no es conserva un estat anterior com si fos actual.'));delete $('fonta-monitor').dataset.state;$('fonta-prospective').replaceChildren(cell('p','Resultats prospectius no disponibles.'));}
  finally{$('fonta-refresh').disabled=false;}
});
