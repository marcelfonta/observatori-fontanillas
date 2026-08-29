import { LEARNING_RESOURCES } from '../data/learning-resources.js';

const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export function filterLearningResources(resources,{query='',level='all',topic='all'}={}){
  const needle=normalized(query).trim();
  return resources.filter(resource=>{
    const matchesLevel=level==='all'||resource.levels.includes(level);
    const matchesTopic=topic==='all'||resource.topics.includes(topic);
    const haystack=normalized([resource.title,resource.org,resource.description,...resource.languages,...resource.topics].join(' '));
    return matchesLevel&&matchesTopic&&(!needle||haystack.includes(needle));
  }).sort((a,b)=>Number(Boolean(b.featured))-Number(Boolean(a.featured))||a.title.localeCompare(b.title,'ca'));
}

function resourceCard(resource){
  const article=document.createElement('article');article.className='learning-resource';
  const top=document.createElement('div');top.className='learning-resource__top';
  const icon=document.createElement('span');icon.className='learning-resource__icon';icon.setAttribute('aria-hidden','true');icon.textContent=resource.icon;
  const identity=document.createElement('div');const org=document.createElement('small');org.textContent=resource.org;const title=document.createElement('h4');title.textContent=resource.title;identity.append(org,title);top.append(icon,identity);
  const description=document.createElement('p');description.textContent=resource.description;
  const meta=document.createElement('div');meta.className='learning-resource__meta';[resource.format,...resource.languages].forEach(value=>{const tag=document.createElement('span');tag.textContent=value;meta.append(tag);});
  const link=document.createElement('a');link.href=resource.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Obrir recurs ↗';link.setAttribute('aria-label',`Obrir ${resource.title} de ${resource.org} en una pestanya nova`);
  article.append(top,description,meta,link);return article;
}

export function initLearning(){
  const grid=document.getElementById('learning-resource-grid');if(!grid)return;
  const search=document.getElementById('learning-search');const level=document.getElementById('learning-level');const topic=document.getElementById('learning-topic');const count=document.getElementById('learning-result-count');const empty=document.getElementById('learning-empty');
  const render=()=>{const results=filterLearningResources(LEARNING_RESOURCES,{query:search?.value,level:level?.value,topic:topic?.value});grid.replaceChildren(...results.map(resourceCard));if(count)count.textContent=`${results.length} ${results.length===1?'recurs':'recursos'}`;if(empty)empty.hidden=results.length!==0;};
  [search,level,topic].forEach(control=>control?.addEventListener(control===search?'input':'change',render));
  document.getElementById('learning-reset')?.addEventListener('click',()=>{if(search)search.value='';if(level)level.value='all';if(topic)topic.value='all';render();search?.focus();});
  document.querySelectorAll('[data-learning-path]').forEach(button=>button.addEventListener('click',()=>{if(level)level.value=button.dataset.learningPath;if(topic)topic.value='all';if(search)search.value='';render();document.getElementById('learning-library-title')?.scrollIntoView({behavior:'smooth',block:'start'});}));
  document.querySelectorAll('[data-learning-topic]').forEach(button=>button.addEventListener('click',()=>{if(level)level.value='all';if(topic)topic.value=button.dataset.learningTopic;if(search)search.value='';render();document.getElementById('learning-library-title')?.scrollIntoView({behavior:'smooth',block:'start'});}));
  render();
}
