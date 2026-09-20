import {homeForecast} from '../core/home-forecast.js';
import {t,translateDocument} from '../core/i18n.js';
let latest=null,languageBound=false;
const value=n=>Number.isFinite(n)?Math.round(n):'—';
export function renderHomeForecast(data){
  latest=data;
  const host=document.getElementById('home-dayparts'),date=document.getElementById('home-dayparts-date');
  if(!host)return;
  if(!languageBound){document.addEventListener('observatori:language-change',()=>renderHomeForecast(latest));languageBound=true;}
  const view=homeForecast(data);
  if(date)date.textContent=view.date+' · Europe/Madrid';
  host.replaceChildren();
  if(!view.available||!view.periods.length){
    const p=document.createElement('p');p.textContent=t(view.available?'Jornada gairebé acabada':'Predicció temporalment no disponible');host.append(p);return;
  }
  for(const part of view.periods){
    const card=document.createElement('article'),title=document.createElement('h3'),hours=document.createElement('small'),condition=document.createElement('p'),values=document.createElement('strong'),rain=document.createElement('span');
    title.textContent=t(part.label);hours.textContent=part.timeLabel;condition.textContent=t(part.condition);
    values.textContent=`${value(part.min)}° – ${value(part.max)}°`;
    rain.textContent=t('Pluja · màx. horària')+': '+value(part.rainProbability)+(Number.isFinite(part.rainProbability)?'%':'');
    card.append(title,hours,condition,values,rain);
    if(!part.complete){const missing=document.createElement('small');missing.textContent=t('Dades incompletes');card.append(missing);}
    host.append(card);
  }
  translateDocument(host);
}
