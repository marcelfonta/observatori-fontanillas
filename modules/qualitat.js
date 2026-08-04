import { clamp, format, setText } from '../js/utils.js';

const sensorNames = {
  temperature:'Temperatura', humidity:'Humitat', pressure:'Pressió', wind:'Vent',
  rain:'Pluja', solar:'Radiació solar', uv:'Índex UV'
};

function percentage(value) {
  const number=Number(value);
  return Number.isFinite(number)?clamp(number,0,100):null;
}

function setBadge(status, label) {
  const badge=document.getElementById('quality-badge');
  if(!badge)return;
  badge.className=`quality-badge is-${status}`;
  setText('quality-badge-label',label);
}

function renderPeriods(days) {
  [1,7,30,365].forEach(period=>{
    const progress=clamp((Number(days)||0)/period*100,0,100);
    const bar=document.getElementById(`quality-period-${period}`);
    if(bar)bar.style.width=`${progress}%`;
    const copy=progress>=100
      ?'Cobertura completa'
      :!days
        ?'Encara sense dades'
        :days<1
          ?`${format(days*24,1)} h acumulades`
          :`${format(Math.min(days,period),days<10?1:0)} de ${period} dies`;
    setText(`quality-period-${period}-copy`,copy);
  });
}

function renderSensors(sensors, hasSamples) {
  Object.entries(sensorNames).forEach(([key])=>{
    const value=hasSamples?percentage(sensors?.[key]):null;
    setText(`quality-sensor-${key}`,value===null?'—%':`${format(value,0)}%`);
    const item=document.querySelector(`[data-quality-sensor="${key}"]`);
    const bar=item?.querySelector('i');
    if(bar)bar.style.width=`${value ?? 0}%`;
    item?.classList.toggle('is-partial',value!==null&&value<90);
    item?.classList.toggle('is-empty',value===null);
  });
}

export function renderDataQuality(payload) {
  const storage=payload?.storage || {};
  const availability=percentage(storage.availability24h);
  const sensorValues=Object.values(payload?.sensors || {}).map(percentage).filter(value=>value!==null);
  const sensorMean=sensorValues.length?sensorValues.reduce((total,value)=>total+value,0)/sensorValues.length:100;
  const currentScore=payload?.ok?100:payload?.status==='stale'?30:65;
  const score=storage.enabled&&storage.samples24h?Math.round(currentScore*.35+(availability ?? 0)*.4+sensorMean*.25):currentScore;
  const scoreNode=document.getElementById('quality-score');
  if(scoreNode)scoreNode.style.setProperty('--quality-score',score);
  setText('quality-score-value',score);

  if(payload?.status==='stale'){
    setBadge('danger','Lectura endarrerida');
    setText('quality-state-title','L’estació necessita atenció');
    setText('quality-state-copy','La lectura més recent supera els 30 minuts. Les dades es mantenen visibles, però ja no es consideren en directe.');
  }else if(payload?.status==='degraded'){
    setBadge('warning','Cobertura parcial');
    setText('quality-state-title','Sistema operatiu amb incidències');
    setText('quality-state-copy',payload.missingFields?.length?`Falten camps actuals: ${payload.missingFields.join(', ')}.`:'Algunes lectures no han arribat amb la continuïtat esperada.');
  }else{
    setBadge('healthy','Sistema saludable');
    setText('quality-state-title','Estació i API operatives');
    setText('quality-state-copy','La lectura actual és recent i tots els sensors essencials responen correctament.');
  }

  setText('quality-last-reading',payload.ageMinutes===null||payload.ageMinutes===undefined?'Hora no disponible':payload.ageMinutes<2?'Ara mateix':`Fa ${payload.ageMinutes} min`);
  setText('quality-latency',Number.isFinite(Number(payload.latencyMs))?`${format(payload.latencyMs,0)} ms`:'—');
  setText('quality-storage-status',storage.enabled?'D1 activa':'Pendent');
  setText('quality-readings',storage.enabled?new Intl.NumberFormat('ca-ES').format(storage.storedReadings || 0):'—');
  setText('quality-days',storage.enabled?format(storage.coverageDays || 0,Number(storage.coverageDays)<10?1:0):'—');
  setText('quality-availability',availability===null?'—%':`${format(availability,0)}%`);
  setText('quality-samples',storage.enabled?`${storage.samples24h || 0} lectures rebudes de ${storage.expected24h || 0} esperades`:'La base de dades encara no està vinculada');
  setText('quality-cadence',storage.cadenceMinutes?`Cada ${storage.cadenceMinutes} min`:'Cadència pendent');
  const availabilityBar=document.getElementById('quality-availability-bar');
  if(availabilityBar)availabilityBar.style.width=`${availability ?? 0}%`;
  renderPeriods(storage.coverageDays || 0);
  renderSensors(payload.sensors,Boolean(storage.samples24h));
  setText('quality-updated',`Comprovat a les ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date())}`);
}

export function renderDataQualityUnavailable() {
  setBadge('pending','Control no disponible');
  const scoreNode=document.getElementById('quality-score');
  if(scoreNode)scoreNode.style.setProperty('--quality-score',0);
  setText('quality-score-value','—');
  setText('quality-state-title','L’estació continua operativa');
  setText('quality-state-copy','Falta activar la base de dades i el nou control de qualitat al Worker. La resta del dashboard continuarà funcionant amb normalitat.');
  setText('quality-last-reading','—');
  setText('quality-latency','—');
  setText('quality-storage-status','No vinculada');
  setText('quality-readings','—');
  setText('quality-days','—');
  setText('quality-availability','—%');
  const availabilityBar=document.getElementById('quality-availability-bar');
  if(availabilityBar)availabilityBar.style.width='0%';
  setText('quality-cadence','Cadència pendent');
  setText('quality-samples','Segueix la guia V5.2 per iniciar l’arxiu propi');
  setText('quality-updated','Control avançat encara no disponible');
  renderPeriods(0);
  renderSensors({},false);
}
