import { getLocale, t } from '../core/i18n.js';

const MONTHLY_RELEASE_DAY=5;
const MONTHLY_RELEASE_HOUR=18;

const madridParts=date=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'
}).formatToParts(date).map(part=>[part.type,part.value]));

const addMonths=(year,month,amount)=>{
  const date=new Date(Date.UTC(year,month-1+amount,15,12));
  return {year:date.getUTCFullYear(),month:date.getUTCMonth()+1};
};

const monthName=({year,month},locale=getLocale())=>new Intl.DateTimeFormat(locale,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,15,12)));

export function seasonalPublicationState(now=new Date(),locale=getLocale()){
  const parts=madridParts(now);
  const year=Number(parts.year),month=Number(parts.month),day=Number(parts.day),hour=Number(parts.hour);
  const currentReleased=day>MONTHLY_RELEASE_DAY||(day===MONTHLY_RELEASE_DAY&&hour>=MONTHLY_RELEASE_HOUR);
  const edition=addMonths(year,month,currentReleased?0:-1);
  const next=addMonths(edition.year,edition.month,1);
  const editionName=monthName(edition,locale);
  const nextName=monthName(next,locale);
  const nextMonth=nextName.replace(/\s+d(?:e|el)\s+\d{4}$|\s+\d{4}$/,'');
  const nextMonthCa=/^[aeiouh]/i.test(nextMonth)?`d’${nextMonth}`:`de ${nextMonth}`;
  const language=locale.slice(0,2);
  const copy={
    ca:{available:`Darrera edició disponible: ${editionName}`,pending:`Nova edició prevista el 5 ${nextMonthCa}, a la tarda`},
    es:{available:`Última edición disponible: ${editionName}`,pending:`Nueva edición prevista el 5 de ${nextMonth}, por la tarde`},
    en:{available:`Latest available edition: ${editionName}`,pending:`New edition expected on 5 ${nextMonth}, in the afternoon`},
    fr:{available:`Dernière édition disponible : ${editionName}`,pending:`Nouvelle édition prévue le 5 ${nextMonth}, dans l’après-midi`}
  }[language]||null;
  return {edition,key:`${edition.year}-${String(edition.month).padStart(2,'0')}`,available:copy?.available||editionName,pending:copy?.pending||''};
}

function refreshSeasonalMaps(now=new Date()){
  const state=seasonalPublicationState(now);
  const period=document.getElementById('seasonal-outlook-period');
  if(period)period.innerHTML=`<strong>${state.available}</strong><span>${state.pending}</span>`;
  document.querySelectorAll('#seasonal-outlook img').forEach(image=>{
    const url=new URL(image.src,window.location.href);
    url.searchParams.set('edition',state.key);
    image.src=url.toString();
  });
}

export function initSeasonalOutlook(){
  refreshSeasonalMaps();
  const button=document.getElementById('seasonal-outlook-toggle');
  const more=document.getElementById('seasonal-outlook-more');
  if(!button||!more)return;
  button.addEventListener('click',()=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    const next=!expanded;
    button.setAttribute('aria-expanded',String(next));
    more.hidden=!next;
    button.querySelector('span').textContent=next?'−':'+';
    button.querySelector('b').textContent=t(next?'Amagar els mesos següents':'Veure els mesos següents');
  });
  document.addEventListener('observatori:language-change',()=>refreshSeasonalMaps());
}
