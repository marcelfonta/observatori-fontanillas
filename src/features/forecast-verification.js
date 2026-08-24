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
  if(!status||!hero||!metrics||!horizons||!detail||!method)return;
  const days=Number(payload.sampleDays)||0;
  if(payload.status!=='ready'){
    const target=7;
    const progress=Math.min(100,Math.max(0,days/target*100));
    status.textContent=days?`${days} de ${target} dies · recollint`:'Recollida iniciada';
    hero.innerHTML=`<div class="verification-orbit" role="progressbar" aria-label="Dies verificats" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${days}" style="--verification-progress:${progress}%"><strong>${days}</strong><span>de ${target} dies verificats</span></div><div><h4>${days?'La mostra creix cada dia':'La comparació comença avui'}</h4><p>Guardem la predicció abans que passi el dia i després la contrastem amb les dades reals de l’estació. Esperem 7 dies complets per no treure conclusions enganyoses.</p></div>`;
    detail.hidden=false;
    detail.innerHTML=`<div class="verification-collecting"><div><span class="is-done">1</span><strong>Desem la predicció</strong><small>Abans de conèixer el resultat real</small></div><div><span class="${days?'is-done':''}">2</span><strong>Mesurem què ha passat</strong><small>Temperatura, pluja i ratxa de vent</small></div><div><span>3</span><strong>Calculem l’error</strong><small>Visible quan arribem a 7 dies</small></div></div><p class="verification-example"><b>Exemple il·lustratiu:</b> si es preveuen 24 °C i l’estació en mesura 25 °C, l’error és d’1 °C. Les dades d’aquest exemple no formen part del resultat.</p>`;
    if(payload.firstIssued)method.textContent=`Primera predicció desada: ${new Date(payload.firstIssued).toLocaleString('ca-ES')}. No reconstruïm pronòstics passats.`;
    return;
  }
  const confidence=payload.confidence||{label:'Resultat preliminar',note:'La mostra encara creix'};
  status.textContent=`${confidence.label} · ${days} dies`;
  const s=payload.summary||{};
  const bias=Number(s.temperatureBias);const biasCopy=!Number.isFinite(bias)||Math.abs(bias)<.2?'sense biaix apreciable':bias>0?`tendeix a preveure ${fmt(Math.abs(bias))} °C de més`:`tendeix a preveure ${fmt(Math.abs(bias))} °C de menys`;
  hero.innerHTML=`<div class="verification-orbit is-ready" aria-label="${days} dies verificats"><strong>${days}</strong><span>dies verificats</span></div><div><h4>Resultats mesurats, no impressions</h4><p><b>${confidence.label}:</b> ${confidence.note}. Com més baixa és la diferència en graus i km/h, millor. Amb aquesta mostra, el model ${biasCopy}.</p></div>`;
  metrics.hidden=false;
  metrics.innerHTML=[
    metric('Temperatura',fmt(s.temperatureMae),' °C d’error',quality(s.temperatureMae,1.5,2.5),Number(s.temperatureMae)<=2.5?'good':'warn'),
    metric('Pluja',fmt(s.rainAccuracy,0),'% d’encert','Dia amb pluja o dia sec',Number(s.rainAccuracy)>=70?'good':'warn'),
    metric('Probabilitat de pluja',fmt(s.rainBrier,3),' Brier','0 és perfecte · 1 és el pitjor',Number(s.rainBrier)<=.25?'good':'warn'),
    metric('Ratxa de vent',fmt(s.windMae),' km/h d’error',quality(s.windMae,7,12),Number(s.windMae)<=12?'good':'warn')
  ].join('');
  horizons.hidden=false;
  horizons.innerHTML=`<h4>Com canvia l’encert amb els dies?</h4><div>${(payload.horizons||[]).map(item=>`<article><span>${item.label}</span><strong>${item.samples?`${fmt(item.temperatureMae)} °C`:'Encara sense mostra'}</strong><small>${item.samples?`${fmt(item.rainAccuracy,0)}% pluja · ${item.samples} casos`:'Recollint prediccions'}</small></article>`).join('')}</div>`;
  if((payload.detail||[]).length){
    detail.hidden=false;
    detail.innerHTML=`<h4>Dies verificats: previsió guardada → resultat real</h4><p class="verification-legend">El valor verd és el que s’havia previst; després de la fletxa hi ha el que va mesurar l’estació.</p><div class="verification-table" role="table" aria-label="Prediccions comparades amb observacions"><div class="verification-row is-head" role="row"><span role="columnheader">Dia</span><span role="columnheader">Màxima</span><span role="columnheader">Mínima</span><span role="columnheader">Pluja</span><span role="columnheader">Ratxa</span></div>${payload.detail.slice(0,7).map(item=>`<div class="verification-row" role="row"><span role="cell">${new Date(`${item.date}T12:00:00`).toLocaleDateString('ca-ES',{day:'numeric',month:'short'})}</span><span role="cell"><b>${fmt(item.forecast.max)}°</b> → ${fmt(item.observed.max)}°</span><span role="cell"><b>${fmt(item.forecast.min)}°</b> → ${fmt(item.observed.min)}°</span><span role="cell"><b>${fmt(item.forecast.rain)} mm</b> → ${fmt(item.observed.rain)} mm</span><span role="cell"><b>${fmt(item.forecast.gust)} km/h</b> → ${fmt(item.observed.gust)} km/h</span></div>`).join('')}</div>`;
  }
  method.textContent=`${payload.method?.note||'Predicció registrada abans del dia i contrastada amb l’estació.'} Mostra: ${days} dies complets; no es presenta com una certesa.`;
}

export async function initForecastVerification(){
  try{render(await fetchForecastVerification(45));}
  catch(error){const status=document.getElementById('verification-status');if(status)status.textContent='Temporalment no disponible';console.warn('Verificació de prediccions no disponible.',error);}
}
