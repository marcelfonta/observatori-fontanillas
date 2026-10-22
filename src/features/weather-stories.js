import { fetchAlertHistory } from '../services/weather-api.js';
import { normalizeArchive, rainTotal } from '../core/archive-coverage.js';
import { finiteNumber } from '../core/numeric.js';
import { getLocale } from '../core/i18n.js';
import { EDITORIAL_STORIES, editorialStoryById } from '../data/editorial-stories.js';

const WORKER='https://fonta-meteo.marcelfonta.workers.dev';
const DAY=86400000;
let archive=[];
let alerts=[];
let stories=[];
const routeStoryId=()=>decodeURIComponent(location.pathname.match(/^\/histories\/([^/]+)\/?$/)?.[1]||new URLSearchParams(location.search).get('story')||'');
let selectedId=typeof location==='undefined'?'':routeStoryId();

const escapeHtml=(value='')=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[character]);
const localDate=value=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date(value));
const fmt=(value,digits=1)=>new Intl.NumberFormat(getLocale(),{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value);
const hour=value=>new Intl.DateTimeFormat(getLocale(),{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(value);
export function formatStoryLongDate(value,locale=getLocale()){
  const date=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(date.getTime()))return 'Data no disponible';
  return new Intl.DateTimeFormat(locale,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'}).format(date);
}
const values=(items,key)=>items.map(item=>finiteNumber(item[key])).filter(value=>value!==null);

function alertOverlapsDate(alert,date){
  const start=new Date(alert.started_at||alert.created_at||0).getTime();
  const end=new Date(alert.expires_at||alert.ended_at||start).getTime();
  if(!Number.isFinite(start))return false;
  return localDate(start)<=date&&localDate(Math.max(start,end))>=date;
}

function storyForDay(date,items){
  const sorted=[...items].sort((a,b)=>a.t-b.t);
  const coverage=Math.min(100,Math.round(sorted.length/24*100));
  if(coverage<75)return null;
  const rain=rainTotal(sorted);
  const gusts=values(sorted,'windGust');
  const temperatures=values(sorted,'temperature');
  const rates=values(sorted,'rainRate');
  const gust=gusts.length?Math.max(...gusts):null;
  const high=temperatures.length?Math.max(...temperatures):null;
  const low=temperatures.length?Math.min(...temperatures):null;
  const range=high!==null&&low!==null?high-low:null;
  const signals=[rain>=.1?'rain':null,gust!==null&&gust>=35?'wind':null,range!==null&&range>=10?'thermal':null].filter(Boolean);
  if(!signals.length)return null;
  const kind=rain>=.1?'rain':gust!==null&&gust>=35?'wind':'thermal';
  const peak=[...sorted].sort((a,b)=>{
    const score=item=>(finiteNumber(item.rainRate)||0)*8+(finiteNumber(item.windGust)||0)+(Math.abs((finiteNumber(item.temperature)||0)-((high+low)/2||0))*2);
    return score(b)-score(a);
  })[0];
  const official=alerts.filter(alert=>alertOverlapsDate(alert,date));
  const title=kind==='rain'?`Jornada de pluja · ${fmt(rain)} mm`:kind==='wind'?`Vent destacat · ${fmt(gust,0)} km/h`:`Contrast tèrmic · ${fmt(range)} °C`;
  const summary=kind==='rain'
    ?`L’estació va registrar ${fmt(rain)} mm${rates.length?`, amb una intensitat màxima de ${fmt(Math.max(...rates))} mm/h`:''}.`
    :kind==='wind'?`La ratxa màxima observada va arribar als ${fmt(gust,0)} km/h.`
    :`La temperatura va oscil·lar entre ${fmt(low)} i ${fmt(high)} °C.`;
  return {id:date,date,kind,title,summary,items:sorted,rain,gust,high,low,range,coverage,official,peak,start:sorted[0],end:sorted.at(-1),score:(rain||0)*3+(gust||0)/5+(range||0)};
}

export function buildWeatherStories(history=[],alertItems=[],{now=Date.now()}={}){
  alerts=Array.isArray(alertItems)?alertItems:[];
  const cutoff=now-45*DAY;
  const groups=new Map();
  normalizeArchive(history).filter(item=>item.t>=cutoff).forEach(item=>{const key=localDate(item.t);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);});
  return [...groups].map(([date,items])=>storyForDay(date,items)).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
}

function metric(label,value,note){return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`;}

function editorialProfile(story){
  const maxRain=Math.max(1,...story.profile.map(item=>item[2]));const minTemp=Math.min(...story.profile.map(item=>item[1]));const maxTemp=Math.max(...story.profile.map(item=>item[1]));const span=Math.max(1,maxTemp-minTemp);
  return `<div class="weather-story__profile" role="img" aria-label="Evolució de temperatura i pluja en franges de tres hores">${story.profile.map(([label,temp,rain,gust])=>`<div><span class="weather-story__rain" style="height:${Math.round(rain/maxRain*100)}%"></span><i style="bottom:${Math.round((temp-minTemp)/span*75)+8}%"></i><small>${label} h</small><em>${fmt(temp)}° · ${fmt(rain)} mm · ${fmt(gust,0)} km/h</em></div>`).join('')}</div>`;
}

function renderDetail(story){
  const host=document.getElementById('weather-story-detail');if(!host)return;
  if(!story){host.innerHTML='<div class="weather-story__empty"><span aria-hidden="true">○</span><strong>Encara no hi ha cap episodi reconstruïble</strong><p>Cal una jornada amb pluja, vent destacat o contrast tèrmic i una cobertura mínima de dades.</p></div>';return;}
  const editorial=Boolean(story.narrative);const warning=story.official?.[0];
  const warningCopy=warning?`${warning.phenomenon||warning.title||'Fenomen meteorològic'} · nivell ${String(warning.level||'oficial').toLowerCase()}`:'No consta cap avís oficial coincident a l’historial disponible.';
  const video=`${WORKER}/camera/nord/timelapses/${story.date}.mp4`;
  host.innerHTML=`<header><div><p class="eyebrow">${escapeHtml(formatStoryLongDate(`${story.date}T12:00:00`))}</p><h2>${escapeHtml(story.title)}</h2><p>${escapeHtml(story.summary)}</p></div><span class="weather-story__status">${story.coverage}% cobertura horària</span></header>
    <div class="weather-story__metrics">${metric('Pluja',story.rain===null?'—':`${fmt(story.rain)} mm`,'Acumulació observada')}${metric('Ratxa',story.gust===null?'—':`${fmt(story.gust,0)} km/h`,'Màxima observada')}${metric('Temperatura',story.low===null?'—':`${fmt(story.low)}–${fmt(story.high)} °C`,'Interval observat')}</div>
    ${editorial?`<section class="weather-story__narrative"><p class="eyebrow">Peça editorial revisada</p><h3>${escapeHtml(story.subtitle)}</h3>${story.narrative.map(paragraph=>`<p>${escapeHtml(paragraph)}</p>`).join('')}${editorialProfile(story)}</section>`:''}
    <section class="weather-story__timeline" aria-label="Cronologia de l’episodi"><article><time>${hour(story.start.t)}</time><i></i><div><span>Inici de la cobertura</span><p>Primera observació disponible del dia.</p></div></article><article><time>${hour(story.peak.t)}</time><i></i><div><span>Moment més actiu</span><p>Pic combinat segons pluja, vent i canvi tèrmic observats.</p></div></article><article><time>${hour(story.end.t)}</time><i></i><div><span>Final de la cobertura</span><p>Darrera observació utilitzada en aquesta reconstrucció.</p></div></article></section>
    <div class="weather-story__evidence"><article><span>Observació</span><strong>Estació Fontanillas</strong><p>${story.sampleCount||story.items?.length||0} franges horàries amb timestamp local i valors conservats a l’arxiu.</p><a href="/centre-dades">Auditar les dades →</a></article><article class="is-context"><span>Context visual</span><strong>Timelapse, radar i Meteosat</strong><p>El vídeo del dia es mostra si està disponible; radar i satèl·lit s’obren sota demanda.</p><div><a href="/radar">Radar →</a><a href="/terra">Satèl·lit →</a></div></article><article class="${warning?'is-warning':'is-neutral'}"><span>Avís oficial</span><strong>${escapeHtml(warning?'Coincidència registrada':editorial?'Context verificat':'Sense coincidència')}</strong><p>${escapeHtml(editorial?story.officialSummary:warningCopy)}</p><a href="./historial-avisos.html">Historial oficial →</a></article></div>
    <figure class="weather-story__media"><video controls playsinline preload="metadata" data-story-video><source src="${video}" type="video/mp4"></video><figcaption><span><b>Timelapse del ${escapeHtml(story.date)}</b><small data-story-video-status>Comprovant si el derivat diari està disponible.</small></span><a href="${video}" target="_blank" rel="noreferrer">Obrir vídeo →</a></figcaption></figure>
    <footer><span>Generat a partir de dades existents; cap absència s’ha convertit en zero.</span><a href="/webcams">Arxiu de timelapses →</a></footer>`;
  const videoNode=host.querySelector('[data-story-video]');const status=host.querySelector('[data-story-video-status]');
  videoNode?.addEventListener('loadedmetadata',()=>{if(status)status.textContent='Vídeo diari disponible · reproducció manual.';},{once:true});
  videoNode?.addEventListener('error',()=>{videoNode.hidden=true;if(status)status.textContent='Aquest dia no disposa de timelapse publicat; la història manté les dades i les fonts.';},{once:true});
}

function render(){
  const detected=buildWeatherStories(archive,alerts).filter(story=>!EDITORIAL_STORIES.some(editorial=>editorial.date===story.date));stories=[...EDITORIAL_STORIES,...detected];
  if(!stories.some(story=>story.id===selectedId))selectedId=stories[0]?.id||'';
  const list=document.getElementById('weather-stories-list');const count=document.getElementById('weather-stories-count');
  if(count)count.textContent=`${EDITORIAL_STORIES.length} històries revisades${detected.length?` · ${detected.length} candidat${detected.length===1?'':'s'} automàtic${detected.length===1?'':'s'}`:''}`;
  if(list)list.innerHTML=stories.map(story=>story.narrative?`<a class="${story.id===selectedId?'is-active':''}" href="/histories/${story.id}" aria-current="${story.id===selectedId?'page':'false'}"><time>${escapeHtml(new Intl.DateTimeFormat(getLocale(),{day:'numeric',month:'short'}).format(new Date(`${story.date}T12:00:00`)))}</time><span><strong>${escapeHtml(story.title)}</strong><small>Peça revisada · ${story.sampleCount} franges</small></span></a>`:`<button type="button" class="${story.id===selectedId?'is-active':''}" data-weather-story="${story.id}" aria-pressed="${story.id===selectedId}"><time>${escapeHtml(new Intl.DateTimeFormat(getLocale(),{day:'numeric',month:'short'}).format(new Date(`${story.date}T12:00:00`)))}</time><span><strong>${escapeHtml(story.title)}</strong><small>${story.items.length} mostres · candidat automàtic</small></span></button>`).join('');
  renderDetail(stories.find(story=>story.id===selectedId));
}

export function updateWeatherStories({history=[]}={}){archive=Array.isArray(history)?history:[];render();}

export function initWeatherStories(){
  const root=document.getElementById('weather-stories');if(!root)return;
  const routed=editorialStoryById(routeStoryId());if(routed)selectedId=routed.id;
  root.addEventListener('click',event=>{const button=event.target.closest('[data-weather-story]');if(!button)return;selectedId=button.dataset.weatherStory;render();});
  fetchAlertHistory({page:1,pageSize:100}).then(payload=>{alerts=Array.isArray(payload.items)?payload.items:[];render();}).catch(()=>{alerts=[];render();});
  render();
}
