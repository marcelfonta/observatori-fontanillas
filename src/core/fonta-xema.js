import {dayBounds} from './fonta-model.js';

export const XEMA_CANDIDATES=['KP','KX','UQ','VX','WS','XK'];
export const XEMA_ATTRIBUTION='Generalitat de Catalunya. Departament de Territori, Habitatge i Transició Ecològica. Servei Meteorològic de Catalunya (Meteocat).';
export const XEMA_TERMS='https://www.meteo.cat/wpweb/avis-legal/';
const numeric=x=>typeof x==='number'?x:typeof x==='string'&&x.trim()!==''?Number(x):NaN;
function utc(text){
  if(typeof text!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?$/.test(text))throw new Error('Hora XEMA invàlida');
  const at=Date.parse(text+'Z');
  if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,19)!==text.slice(0,19))throw new Error('Hora XEMA invàlida');
  return at;
}
export function xemaRequest(date){
  const b=dayBounds(date),stamp=t=>new Date(t).toISOString().slice(0,19);
  const where=`codi_estacio in ('${XEMA_CANDIDATES.join("','")}') and codi_variable='32' and data_lectura >= '${stamp(b.start)}' and data_lectura < '${stamp(b.end)}'`;
  return 'https://analisi.transparenciacatalunya.cat/resource/nzvn-apee.json?'+new URLSearchParams({'$where':where,'$order':'codi_estacio,data_lectura','$limit':'301'});
}
export function auditXema(rows,metadata,variable,{date,receivedAt}){
  if(!Array.isArray(rows)||rows.length>=301||!Array.isArray(metadata)||variable?.codi_variable!=='32'||variable.unitat!=='°C')throw new Error('Contracte XEMA invàlid o resposta truncada');
  const bounds=dayBounds(date),receipt=Date.parse(receivedAt);
  if(!Number.isFinite(receipt)||receipt<bounds.end)throw new Error('Dia encara obert');
  if(rows.some(r=>!XEMA_CANDIDATES.includes(r.codi_estacio)||r.codi_variable!=='32'))throw new Error('Estació o variable inesperada');
  const stations=XEMA_CANDIDATES.map(code=>{
    const matches=metadata.filter(m=>m.codi_estacio===code&&m.nom_estat_ema==='Operativa');
    if(matches.length!==1)throw new Error('Metadades d’estació absents o ambigües: '+code);
    const m=matches[0],latitude=numeric(m.latitud),longitude=numeric(m.longitud),elevation=numeric(m.altitud);
    if(!Number.isFinite(latitude)||latitude<40||latitude>43||!Number.isFinite(longitude)||longitude<0||longitude>4||!Number.isFinite(elevation))throw new Error('Coordenades invàlides');
    const intervals=new Map();let provisional=0,invalid=0,duplicates=0;
    for(const r of rows.filter(r=>r.codi_estacio===code)){
      const at=utc(r.data_lectura),duration=r.codi_base==='SH'?1800000:r.codi_base==='HO'?3600000:0;
      const value=numeric(r.valor_lectura);
      if(!duration||at<bounds.start||at+duration>bounds.end||at%duration!==0||!Number.isFinite(value)||value< -40||value>55){invalid++;continue;}
      const key=at;const status=r.codi_estat==='V'?'validated':r.codi_estat===undefined||r.codi_estat===''||r.codi_estat===' '||r.codi_estat==='T'?'provisional':'invalid';
      if(intervals.has(key)){duplicates++;continue;}
      if(status==='provisional')provisional++;if(status==='invalid')invalid++;
      intervals.set(key,{startAt:new Date(at).toISOString(),endAt:new Date(at+duration).toISOString(),durationMinutes:duration/60000,value,status});
    }
    const values=[...intervals.values()].sort((a,b)=>a.startAt.localeCompare(b.startAt));
    let end=bounds.start,covered=0,validated=0,overlap=false;
    for(const p of values){const start=Date.parse(p.startAt),finish=Date.parse(p.endAt);if(start<end)overlap=true;const n=Math.max(0,finish-Math.max(start,end));covered+=n;if(p.status==='validated')validated+=n;end=Math.max(end,finish);}
    const reasons=[];if(covered!==bounds.end-bounds.start)reasons.push('missing-intervals');
    if(validated!==bounds.end-bounds.start)reasons.push('not-fully-validated');
    if(invalid||duplicates||overlap)reasons.push('invalid-duplicate-or-overlap');
    return {code,name:m.nom_estacio,latitude,longitude,elevation,date,records:values.length,
      coverage:covered/(bounds.end-bounds.start),validatedCoverage:validated/(bounds.end-bounds.start),
      provisional,invalid,duplicates,complete:reasons.length===0,reasons,intervals:values,
      target:'temperature-over-SH-or-HO-period-start-labelled-UTC',instantaneousComparable:false,trainingAllowed:false};
  });
  return {schema:1,kind:'fonta-xema-candidate-audit',receivedAt,date,attribution:XEMA_ATTRIBUTION,terms:XEMA_TERMS,
    reuseApproval:'pending-specific-terms-clarification',automatedCollectionAllowed:false,stations};
}
