import { fetchForecastVerification } from '../services/weather-api.js';

const fmt=(value,digits=1)=>Number.isFinite(Number(value))?Number(value).toLocaleString('ca-ES',{maximumFractionDigits:digits,minimumFractionDigits:digits}):'—';
const quality=(mae,good,medium)=>!Number.isFinite(Number(mae))?'Recollint':mae<=good?'Molt bona':mae<=medium?'Bona':'Millorable';

function metric(label,value,unit,copy,tone='good'){
  return `<article class="is-${tone}"><span>${label}</span><strong>${value}<small>${unit}</small></strong><p>${copy}</p></article>`;
}

function render(payload){
  const status=document.getElementById('verification-status');
  const hero=document.getElementById('verification-hero');
  const metrics=document.getElementById('verification-metrics');
  const horizons=document.getElementById('verification-horizons');
  const detail=document.getElementById('verification-detail');
  const method=document.getElementById('verification-method');
  if(!status||!hero||!metrics||!horizons||!detail)return;
  const days=Number(payload.sampleDays)||0;
  if(payload.status!=='ready'){
    status.textContent=days?`${days} dies · encara recollint`:'Recollida iniciada';
    hero.innerHTML=`<div class="verification-orbit"><strong>${days}</strong><span>${days===1?'dia verificat':'dies verificats'}</span></div><div><h4>${days?'Ja estem construint una mostra fiable':'La comparació comença avui'}</h4><p>Necessitem almenys 7 dies complets per evitar conclusions enganyoses. Les primeres mètriques apareixeran automàticament.</p></div>`;
    if(payload.firstIssued)method.textContent=`Primera predicció desada: ${new Date(payload.firstIssued).toLocaleString('ca-ES')}. No reconstruïm pronòstics passats.`;
    return;
  }
  status.textContent=`${days} dies verificats`;
  hero.innerHTML=`<div class="verification-orbit is-ready"><strong>${days}</strong><span>dies verificats</span></div><div><h4>Resultats mesurats, no impressions</h4><p>Com més baixa és la diferència en graus i km/h, millor. L’encert de pluja indica en quants dies el model va anticipar correctament si plouria.</p></div>`;
  const s=payload.summary||{};
  metrics.hidden=false;
  metrics.innerHTML=[
    metric('Temperatura',fmt(s.temperatureMae),' °C d’error',quality(s.temperatureMae,1.5,2.5),Number(s.temperatureMae)<=2.5?'good':'warn'),
    metric('Pluja',fmt(s.rainAccuracy,0),'% d’encert','Dia amb pluja o dia sec',Number(s.rainAccuracy)>=70?'good':'warn'),
    metric('Ratxa de vent',fmt(s.windMae),' km/h d’error',quality(s.windMae,7,12),Number(s.windMae)<=12?'good':'warn')
  ].join('');
  horizons.hidden=false;
  horizons.innerHTML=`<h4>Com canvia l’encert amb els dies?</h4><div>${(payload.horizons||[]).map(item=>`<article><span>${item.label}</span><strong>${item.samples?`${fmt(item.temperatureMae)} °C`:'Encara sense mostra'}</strong><small>${item.samples?`${fmt(item.rainAccuracy,0)}% pluja · ${item.samples} casos`:'Recollint prediccions'}</small></article>`).join('')}</div>`;
  if((payload.detail||[]).length){
    detail.hidden=false;
    detail.innerHTML=`<h4>Demà: previsió guardada i resultat real</h4><div class="verification-table"><div class="verification-row is-head"><span>Dia</span><span>Màxima</span><span>Mínima</span><span>Pluja</span></div>${payload.detail.slice(0,7).map(item=>`<div class="verification-row"><span>${new Date(`${item.date}T12:00:00`).toLocaleDateString('ca-ES',{day:'numeric',month:'short'})}</span><span><b>${fmt(item.forecast.max)}°</b> → ${fmt(item.observed.max)}°</span><span><b>${fmt(item.forecast.min)}°</b> → ${fmt(item.observed.min)}°</span><span><b>${fmt(item.forecast.rain)} mm</b> → ${fmt(item.observed.rain)} mm</span></div>`).join('')}</div>`;
  }
  method.textContent=payload.method?.note||'Predicció registrada abans del dia i contrastada amb l’estació.';
}

export async function initForecastVerification(){
  try{render(await fetchForecastVerification(45));}
  catch(error){const status=document.getElementById('verification-status');if(status)status.textContent='Temporalment no disponible';console.warn('Verificació de prediccions no disponible.',error);}
}
