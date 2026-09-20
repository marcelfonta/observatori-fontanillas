import {homeForecast} from '../core/home-forecast.js';
import {weatherSymbol,weatherSymbolKind,temperatureRange} from '../core/home-weather-symbol.js';
import {t,getLocale,translateDocument} from '../core/i18n.js';
let latest=null,languageBound=false;
const value=(n,unit)=>Number.isFinite(n)?Math.round(n)+unit:'—';
function element(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
}
export function renderHomeForecast(data){
  latest=data;
  const host=document.getElementById('home-dayparts'),date=document.getElementById('home-dayparts-date');
  if(!host)return;
  if(!languageBound){document.addEventListener('observatori:language-change',()=>renderHomeForecast(latest));languageBound=true;}
  const view=homeForecast(data);
  if(date)date.textContent=new Intl.DateTimeFormat(getLocale(),{timeZone:'Europe/Madrid',weekday:'long',day:'numeric',month:'long'}).format(new Date(view.date+'T12:00:00Z'))+' · Sant Celoni';
  host.replaceChildren();
  if(!view.available||!view.periods.length){
    host.append(element('p','home-dayparts__empty',t(view.available?'Jornada gairebé acabada':'Predicció temporalment no disponible')));return;
  }
  for(const part of view.periods){
    const card=element('article','home-daypart');
    card.dataset.weather=weatherSymbolKind(part.weatherCode);
    const top=element('div','home-daypart__top'),heading=element('div');
    heading.append(element('h3',null,t(part.label)),element('small','home-daypart__hours',part.timeLabel));
    const icon=element('div','home-daypart__symbol');
    icon.innerHTML=weatherSymbol(part.weatherCode,part.illumination);
    top.append(heading,icon);
    const condition=element('p','home-daypart__condition',t(part.condition));
    const temperature=element('strong','home-daypart__temperature',temperatureRange(part.min,part.max));
    const metrics=element('dl','home-daypart__metrics');
    for(const [label,reading] of [['Pluja · màx. horària',value(part.rainProbability,'%')],['Ratxa màxima',value(part.gust,' km/h')]]){
      const metric=element('div');metric.append(element('dt',null,t(label)),element('dd',null,reading));metrics.append(metric);
    }
    card.append(top,condition,temperature,metrics);
    if(!part.complete)card.append(element('small','home-daypart__missing',t('Dades incompletes')));
    host.append(card);
  }
  translateDocument(host);
}
