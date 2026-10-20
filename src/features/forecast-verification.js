import { fetchForecastVerification, fetchPublicOperationsStatus } from '../services/weather-api.js';

let latestVerification=null;

const fmt=(value,digits=1)=>Number.isFinite(Number(value))?Number(value).toLocaleString('ca-ES',{maximumFractionDigits:digits,minimumFractionDigits:digits}):'—';
const quality=(mae,good,medium)=>!Number.isFinite(Number(mae))?'Recollint':mae<=good?'Molt bona':mae<=medium?'Bona':'Millorable';
const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));

function metric(label,value,unit,copy,tone='good'){
  return `<article class="is-${tone}"><span>${label}</span><strong>${value}<small>${unit}</small></strong><p>${copy}</p></article>`;
}

export function rainSampleCopy(summary={}){
  const wet=Math.max(0,Number(summary.wetDays)||0);
  const dry=Math.max(0,Number(summary.dryDays)||0);
  if(!wet&&dry)return `${dry} ${dry===1?'dia sec':'dies secs'} · encara cap dia amb pluja`;
  return `${wet} ${wet===1?'dia amb pluja':'dies amb pluja'} · ${dry} ${dry===1?'dia sec':'dies secs'}`;
}

export function verificationMilestoneCopy(payload={}){
  const days=Math.max(0,Number(payload.sampleDays)||0);
  if(days===29)return 'Demà, si arriba un cas complet, s’assolirà el primer tall de 30 dies. Servirà per detectar tendències inicials, no per corregir automàticament la previsió ni l’estació.';
  if(days<30)return '';
  const wet=Math.max(0,Number(payload.summary?.wetDays)||0);
  const rainCaution=wet<5?` La pluja encara només inclou ${wet} ${wet===1?'dia plujós':'dies plujosos'}: cal més varietat meteorològica.`:'';
  return `Primer tall de 30 dies assolit: ja permet detectar tendències inicials, però no certificar ni corregir automàticament la previsió o l’estació.${rainCaution}`;
}

export function modelMaturityCopy(payload={}){
  const maturity=payload.modelMaturity||{};
  const comparable=Math.max(0,Number(maturity.comparableDays??payload.comparableDays)||0);
  const wet=Math.max(0,Number(maturity.wetDays)||0);
  if(comparable<7)return `${comparable} de 7 dies comuns als cinc models. Encara no es calculen pesos candidats.`;
  const review=Number(maturity.nextReviewDays);
  const reviewCopy=review?` Propera revisió metodològica: ${review} dies (${Math.max(0,Number(maturity.daysToNextReview)||0)} pendents).`:' Ja s’han superat els talls de revisió de 60 i 90 dies.';
  const rainCopy=maturity.rainWeightsReady?' La mostra de pluja ja supera el mínim de varietat.':` La pluja continua bloquejada: ${wet} de ${Number(maturity.minimumWetDays)||7} dies plujosos comparables.`;
  return `${comparable} dies exactament comuns als cinc models.${reviewCopy}${rainCopy}`;
}

function verificationChart(detail=[]){
  const rows=detail.slice(0,14).reverse().filter(item=>Number.isFinite(Number(item.forecast?.max))&&Number.isFinite(Number(item.observed?.max)));
  if(rows.length<2)return '';
  const values=rows.flatMap(item=>[Number(item.forecast.max),Number(item.observed.max)]);
  const min=Math.min(...values)-1;const max=Math.max(...values)+1;const span=Math.max(1,max-min);
  const point=(value,index)=>`${24+index*(592/(rows.length-1))},${154-(Number(value)-min)/span*122}`;
  const forecast=rows.map((item,index)=>point(item.forecast.max,index)).join(' ');
  const observed=rows.map((item,index)=>point(item.observed.max,index)).join(' ');
  const first=escapeHtml(rows[0]?.date);const last=escapeHtml(rows.at(-1)?.date);
  return `<figure class="verification-chart"><figcaption><span><i class="is-forecast"></i> Màxima prevista</span><span><i class="is-observed"></i> Màxima observada</span></figcaption><svg viewBox="0 0 640 180" role="img" aria-label="Evolució de la temperatura màxima prevista i observada"><line x1="24" y1="154" x2="616" y2="154"></line><polyline class="is-forecast" points="${forecast}"></polyline><polyline class="is-observed" points="${observed}"></polyline></svg><small>${first||''} → ${last||''} · cada punt és un pronòstic de demà verificat</small></figure>`;
}

const safeCsv=value=>{const text=String(value??'');return `"${(/^[=+\-@]/.test(text)?`'${text}`:text).replaceAll('"','""')}"`;};
export function verificationCsv(payload={}){
  const rows=[['date','issued_at','forecast_max_c','observed_max_c','forecast_min_c','observed_min_c','forecast_rain_mm','observed_rain_mm','forecast_gust_kmh','observed_gust_kmh']];
  for(const item of payload.detail||[])rows.push([item.date,item.issuedAt,item.forecast?.max,item.observed?.max,item.forecast?.min,item.observed?.min,item.forecast?.rain,item.observed?.rain,item.forecast?.gust,item.observed?.gust]);
  return rows.map(row=>row.map(safeCsv).join(',')).join('\n');
}
function download(name,type,content){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([content],{type}));link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),0);}
function prepareExports(payload){
  latestVerification=payload;
  const csv=document.getElementById('verification-export-csv');const json=document.getElementById('verification-export-json');const status=document.getElementById('verification-export-status');
  const ready=Array.isArray(payload.detail)&&payload.detail.length>0;
  if(csv)csv.disabled=!ready;if(json)json.disabled=!ready;
  if(status)status.textContent=ready?`${payload.detail.length} casos visibles · generat ${new Date(payload.generatedAt).toLocaleString('ca-ES')}`:'La mostra encara no conté casos exportables.';
}
function renderPublicHealth(payload){
  const badge=document.getElementById('verification-public-health');const summary=document.getElementById('verification-health-summary');const list=document.getElementById('verification-health-services');if(!badge||!summary||!list)return;
  badge.textContent=payload.status==='healthy'?'Serveis operatius':payload.status==='degraded'?'Incidència activa':'Estat no disponible';
  summary.textContent=payload.scope||'Estat tècnic agregat dels processos públics.';
  const labels={scheduler:'Programador', 'database-maintenance':'Base de dades','forecast-capture':'Captura de prediccions','social-automatic':'Publicació social','meteocat-alert-social':'Avisos Meteocat','camera-nord':'Càmera nord'};
  list.innerHTML=(payload.services||[]).length?(payload.services||[]).map(item=>`<li><span>${escapeHtml(labels[item.key]||item.key)}</span><b class="${item.status==='healthy'?'':'is-down'}">${item.status==='healthy'?'Correcte':item.status==='down'?'Incidència':'Pendent'}</b></li>`).join(''):'<li>No hi ha prou registres públics encara.</li>';
}

function render(payload){
  const status=document.getElementById('verification-status');
  const hero=document.getElementById('verification-hero');
  const metrics=document.getElementById('verification-metrics');
  const horizons=document.getElementById('verification-horizons');
  const detail=document.getElementById('verification-detail');
  const method=document.getElementById('verification-method');
  if(!status||!hero||!metrics||!horizons||!detail||!method)return;
  const days=Number(payload.sampleDays)||0;
  prepareExports(payload);
  if(payload.status!=='ready'){
    const target=7;
    const progress=Math.min(100,Math.max(0,days/target*100));
    status.textContent=days?`${days} de ${target} pronòstics · recollint`:'Recollida iniciada';
    hero.innerHTML=`<div class="verification-orbit" role="progressbar" aria-label="Pronòstics de demà verificats" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${days}" style="--verification-progress:${progress}%"><strong>${days}</strong><span>de ${target} pronòstics de demà</span></div><div><h4>${days?'La mostra comparable creix cada dia':'La comparació comença avui'}</h4><p>Comparem sempre el pronòstic de demà, guardat el dia anterior, amb les dades reals de l’estació. Esperem 7 casos complets abans de mostrar indicadors per no barrejar horitzons ni treure conclusions enganyoses.</p></div>`;
    detail.hidden=false;
    detail.innerHTML=`<div class="verification-collecting"><div><span class="is-done">1</span><strong>Desem la predicció</strong><small>Abans de conèixer el resultat real</small></div><div><span class="${days?'is-done':''}">2</span><strong>Mesurem què ha passat</strong><small>Temperatura, pluja i ratxa de vent</small></div><div><span>3</span><strong>Calculem l’error</strong><small>Visible quan arribem a 7 dies</small></div></div><p class="verification-example"><b>Exemple il·lustratiu:</b> si es preveuen 24 °C i l’estació en mesura 25 °C, l’error és d’1 °C. Les dades d’aquest exemple no formen part del resultat.</p>`;
    if(payload.firstIssued)method.textContent=`Primera predicció desada: ${new Date(payload.firstIssued).toLocaleString('ca-ES')}. No reconstruïm pronòstics passats.`;
    return;
  }
  const confidence=payload.confidence||{label:'Resultat preliminar',note:'La mostra encara creix'};
  status.textContent=`${confidence.label} · ${days} pronòstics de demà`;
  const s=payload.summary||{};
  const bias=Number(s.temperatureBias);const biasCopy=!Number.isFinite(bias)||Math.abs(bias)<.2?'sense biaix apreciable':bias>0?`tendeix a preveure ${fmt(Math.abs(bias))} °C de més`:`tendeix a preveure ${fmt(Math.abs(bias))} °C de menys`;
  const milestone=verificationMilestoneCopy(payload);
  hero.innerHTML=`<div class="verification-orbit is-ready" aria-label="${days} pronòstics de demà verificats"><strong>${days}</strong><span>pronòstics de demà verificats</span></div><div><h4>Resultats mesurats, no impressions</h4><p><b>${confidence.label}:</b> ${confidence.note}. Tots els casos tenen el mateix horitzó: la previsió de l’endemà guardada el dia anterior. Amb aquesta mostra, el model ${biasCopy}.</p>${milestone?`<p class="verification-milestone">${escapeHtml(milestone)}</p>`:''}</div>`;
  metrics.hidden=false;
  metrics.innerHTML=[
    metric('Temperatura',fmt(s.temperatureMae),' °C d’error',quality(s.temperatureMae,1.5,2.5),Number(s.temperatureMae)<=2.5?'good':'warn'),
    metric('Pluja',fmt(s.rainAccuracy,0),'% d’encert',rainSampleCopy(s),Number(s.rainAccuracy)>=70?'good':'warn'),
    metric('Probabilitat de pluja',fmt(s.rainBrier,3),' Brier','0 és perfecte · 1 és el pitjor',Number(s.rainBrier)<=.25?'good':'warn'),
    metric('Ratxa de vent',fmt(s.windMae),' km/h d’error',quality(s.windMae,7,12),Number(s.windMae)<=12?'good':'warn')
  ].join('');
  horizons.hidden=false;
  horizons.innerHTML=`<h4>Com canvia l’encert amb l’horitzó?</h4><p class="verification-legend">«Avui» és l’última actualització del mateix dia i només serveix de context; el resum principal usa exclusivament «Demà».</p><div>${(payload.horizons||[]).map(item=>`<article><span>${item.key==='today'?'Avui · actualització del dia':item.label}</span><strong>${item.samples?`${fmt(item.temperatureMae)} °C`:'Encara sense mostra'}</strong><small>${item.samples?`${fmt(item.rainAccuracy,0)}% pluja · ${item.samples} casos`:'Recollint prediccions'}</small></article>`).join('')}</div>`;
  if((payload.byModel||[]).length)horizons.innerHTML+=`<h4 class="verification-model-title">Quin model funciona millor aquí?</h4><p class="verification-legend">${escapeHtml(modelMaturityCopy(payload))} Els pesos són candidats experimentals i no s’apliquen a la previsió.</p><div class="verification-models">${payload.byModel.map(item=>{const maxWeight=Number(payload.weights?.maximumTemperature?.[item.model]);const minWeight=Number(payload.weights?.minimumTemperature?.[item.model]);return `<article><span>${escapeHtml(item.label)}</span><strong>${item.samples>=7?`Màx. ${fmt(item.maximumTemperatureMae)} °C · mín. ${fmt(item.minimumTemperatureMae)} °C`:'Recollint'}</strong><small>${item.samples} dies comuns · ${item.wetDays} amb pluja${Number.isFinite(maxWeight)&&Number.isFinite(minWeight)?` · pesos candidats ${fmt(maxWeight*100,0)}% / ${fmt(minWeight*100,0)}%`:''}</small></article>`;}).join('')}</div>`;
  if((payload.detail||[]).length){
    detail.hidden=false;
    detail.innerHTML=`<h4>Pronòstics de demà verificats: previsió → resultat real</h4><p class="verification-legend">El valor verd es va guardar el dia anterior; després de la fletxa hi ha el que va mesurar l’estació.</p>${verificationChart(payload.detail)}<p class="verification-scroll-hint">En pantalles petites, arrossega la taula cap als costats.</p><div class="verification-table" role="table" aria-label="Pronòstics de demà comparats amb observacions" tabindex="0"><div class="verification-row is-head" role="row"><span role="columnheader">Dia</span><span role="columnheader">Màxima</span><span role="columnheader">Mínima</span><span role="columnheader">Pluja</span><span role="columnheader">Ratxa</span></div>${payload.detail.slice(0,7).map(item=>`<div class="verification-row" role="row"><span role="cell">${new Date(`${item.date}T12:00:00`).toLocaleDateString('ca-ES',{day:'numeric',month:'short'})}</span><span role="cell"><b>${fmt(item.forecast.max)}°</b> → ${fmt(item.observed.max)}°</span><span role="cell"><b>${fmt(item.forecast.min)}°</b> → ${fmt(item.observed.min)}°</span><span role="cell"><b>${fmt(item.forecast.rain)} mm</b> → ${fmt(item.observed.rain)} mm</span><span role="cell"><b>${fmt(item.forecast.gust)} km/h</b> → ${fmt(item.observed.gust)} km/h</span></div>`).join('')}</div>`;
  }
  const wet=Number(s.wetDays)||0;const dry=Number(s.dryDays)||0;
  method.innerHTML=`<details class="verification-brier"><summary>Què vol dir l’índex Brier?</summary><p>Mesura si les probabilitats de pluja estan ben calibrades: 0 és perfecte i 1 és el pitjor resultat. Exemple: si es dona un 20% de probabilitat i no plou, l’error és (0,2 − 0)² = 0,04. No és una unitat meteorològica, sinó una puntuació estadística.</p></details><p>${escapeHtml(payload.method?.note||'Predicció registrada abans del dia i contrastada amb l’estació.')} Mostra principal: ${days} pronòstics (${wet} dies amb pluja i ${dry} dies secs).${!wet?' Sense dies plujosos, el percentatge descriu sobretot l’encert dels dies secs i encara no avalua bé la detecció de pluja.':''} Fonts: ${escapeHtml(payload.method?.provider||'proveïdor de previsió')} i ${escapeHtml(payload.method?.observation||'estació local')}. L’encert binari usa el llindar de ${Number(payload.method?.rainProbabilityThreshold) || 40}% o ${fmt(payload.method?.rainThresholdMillimetres??0.2)} mm.</p>`;
}

export async function initForecastVerification(){
  document.getElementById('verification-export-csv')?.addEventListener('click',()=>{if(latestVerification)download(`verificacio-meteo-${new Date().toISOString().slice(0,10)}.csv`,'text/csv;charset=utf-8',verificationCsv(latestVerification));});
  document.getElementById('verification-export-json')?.addEventListener('click',()=>{if(latestVerification)download(`verificacio-meteo-${new Date().toISOString().slice(0,10)}.json`,'application/json',JSON.stringify({...latestVerification,license:{station:'Dades pròpies de l’Observatori Fontanillas',forecast:'Derivat Open-Meteo; consulteu atribució i termes de la font'},exportedAt:new Date().toISOString()},null,2));});
  const [verification,operations]=await Promise.allSettled([fetchForecastVerification(90),fetchPublicOperationsStatus()]);
  if(verification.status==='fulfilled')render(verification.value);
  else {const status=document.getElementById('verification-status');if(status)status.textContent='Temporalment no disponible';console.warn('Verificació de prediccions no disponible.',verification.reason);}
  if(operations.status==='fulfilled')renderPublicHealth(operations.value);
  else renderPublicHealth({status:'unavailable',scope:'L’estat operatiu no està disponible temporalment.',services:[]});
}
