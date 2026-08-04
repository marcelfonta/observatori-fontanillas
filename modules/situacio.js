import { format, setText } from '../js/utils.js';

const state={ current:undefined, forecast:undefined, alerts:undefined };

function finite(value){const number=Number(value);return Number.isFinite(number)?number:null;}
function max(values){const safe=values.map(finite).filter(value=>value!==null);return safe.length?Math.max(...safe):null;}
function sum(values){return values.reduce((total,value)=>total+(finite(value)||0),0);}

function setCard(name,level,title,copy){
  const card=document.querySelector(`[data-situation="${name}"]`);
  if(card)card.dataset.level=level;
  setText(`situation-${name}-title`,title);
  setText(`situation-${name}-copy`,copy);
  return {level,title,copy};
}

function alertReading(payload){
  if(payload===undefined)return setCard('alert','pending','Comprovant avisos','Consultant AEMET per al Prelitoral de Barcelona');
  if(!payload?.ok)return setCard('alert','unknown','Verificació no disponible','Cal consultar el canal oficial abans de prendre decisions');
  if(!payload.active)return setCard('alert','good','Sense avisos actius','Darrera comprovació oficial del Prelitoral de Barcelona');
  const labels={yellow:'Avís groc actiu',orange:'Avís taronja actiu',red:'Avís vermell actiu',unknown:'Avís oficial actiu'};
  const plurals={yellow:'avisos grocs actius',orange:'avisos taronges actius',red:'avisos vermells actius',unknown:'avisos oficials actius'};
  const phenomena=[...new Set((payload.alerts||[]).map(entry=>entry.phenomenon).filter(Boolean))];
  const copy=phenomena.length?phenomena.join(' i '):'Consulta el detall oficial actualitzat';
  const title=Number(payload.active)>1?`${payload.active} ${plurals[payload.maxLevel]||plurals.unknown}`:(labels[payload.maxLevel]||labels.unknown);
  return setCard('alert',payload.maxLevel||'high',title,copy);
}

function forecastIndices(forecast,hours){
  if(!forecast?.hourly?.time)return [];
  const now=Date.now();
  let start=forecast.hourly.time.findIndex(value=>new Date(value).getTime()>=now-1800000);
  if(start<0)start=0;
  return Array.from({length:hours+1},(_,offset)=>start+offset).filter(index=>forecast.hourly.time[index]);
}

function rainReading(forecast){
  if(forecast===undefined)return setCard('rain','pending','Calculant pluja','Esperant la previsió horària');
  if(!forecast?.hourly)return setCard('rain','unknown','Previsió no disponible','Es tornarà a comprovar automàticament');
  const indices=forecastIndices(forecast,3);
  const chance=max(indices.map(index=>forecast.hourly.precipitation_probability?.[index])) || 0;
  const amount=sum(indices.map(index=>forecast.hourly.precipitation?.[index]));
  if(chance>=70||amount>=2)return setCard('rain','high',`${format(chance,0)}% de pluja`,`${format(amount,1)} mm previstos en les pròximes 3 hores`);
  if(chance>=35||amount>=0.2)return setCard('rain','moderate','Pluja possible',`${format(chance,0)}% màxim · ${format(amount,1)} mm previstos`);
  return setCard('rain','good','Sense senyal de pluja imminent',`${format(chance,0)}% màxim en les pròximes 3 hores`);
}

function humidex(current){
  const temperature=finite(current?.temperature); const dewPoint=finite(current?.dewPoint);
  if(temperature===null||dewPoint===null)return finite(current?.feelsLike);
  const vapor=6.11*Math.exp(5417.753*(1/273.16-1/(dewPoint+273.15)));
  return temperature+0.5555*(vapor-10);
}

function thermalReading(current,forecast){
  if(current===undefined)return setCard('thermal','pending','Analitzant confort','Esperant les dades de l’estació');
  const value=humidex(current); const indices=forecastIndices(forecast,6);
  const forecastUv=max(indices.map(index=>forecast?.hourly?.uv_index?.[index]));
  const uv=Math.max(finite(current?.uv)||0,forecastUv||0);
  if(uv>=8)return setCard('thermal','high',`UV ${format(uv,0)} · risc molt alt`,'Protecció solar reforçada i poca exposició al migdia');
  if(value!==null&&value>=40)return setCard('thermal','high',`Xafogor ${format(value,0)} °C eq.`,'Calor opressiva: hidratació i descans freqüents');
  if(uv>=6)return setCard('thermal','moderate',`UV ${format(uv,0)} · risc alt`,'Protecció solar necessària durant les hores centrals');
  if(value!==null&&value>=30)return setCard('thermal','moderate',`Xafogor ${format(value,0)} °C eq.`,'Sensació de calor notable per temperatura i humitat');
  const apparent=finite(current?.feelsLike) ?? finite(current?.temperature);
  return setCard('thermal','good',apparent===null?'Confort estable':`Sensació ${format(apparent,1)} °C`,'Sense indicador tèrmic destacat ara mateix');
}

function windReading(current,forecast){
  if(current===undefined)return setCard('wind','pending','Calculant vent','Esperant les dades de l’estació');
  const indices=forecastIndices(forecast,6);
  const future=max(indices.map(index=>forecast?.hourly?.wind_gusts_10m?.[index]));
  const gust=Math.max(finite(current?.windGust)||0,future||0);
  if(gust>=60)return setCard('wind','high',`Ratxes fins a ${format(gust,0)} km/h`,'Vent fort ara o durant les pròximes 6 hores');
  if(gust>=35)return setCard('wind','moderate',`Ratxes fins a ${format(gust,0)} km/h`,'Vent a seguir durant les pròximes hores');
  const sunset=forecast?.daily?.sunset?.[0] ? new Date(forecast.daily.sunset[0]) : null;
  const untilSunset=sunset&&!Number.isNaN(sunset.getTime())?(sunset.getTime()-Date.now())/3600000:null;
  if(untilSunset!==null&&untilSunset>0&&untilSunset<8){
    return setCard('wind','good','Vent poc destacat',`Posta de sol a les ${new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit'}).format(sunset)}`);
  }
  return setCard('wind','good','Vent poc destacat',`Ratxa màxima pròxima de ${format(gust,0)} km/h`);
}

function render(){
  const alert=alertReading(state.alerts);
  const rain=rainReading(state.forecast);
  const thermal=thermalReading(state.current,state.forecast);
  const wind=windReading(state.current,state.forecast);
  const ready=[state.current,state.forecast,state.alerts].every(value=>value!==undefined);
  setText('situation-status',ready?'Lectura actualitzada':'Completant lectura');
  const important=[alert,rain,thermal,wind].filter(item=>['red','orange','yellow','high','moderate','unknown'].includes(item.level));
  if(important.length){
    const headlines=important.slice(0,2).map(item=>item.title.replace(/[.\s]+$/,'')).join(' · ');
    setText('situation-summary',`${headlines}. La resta d’indicadors no presenta canvis més rellevants.`);
  }else{
    setText('situation-summary','Situació tranquil·la: sense avisos oficials, sense pluja imminent i sense riscos destacats en els indicadors principals.');
  }
}

export function updateSituation(partial={}){Object.assign(state,partial);render();}
