import { getLanguage, setLanguage, t } from '../core/i18n.js';
import { searchMunicipalities } from '../services/weather-api.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));

export function initHeaderTools(){
  const header=document.querySelector('.site-header');
  if(!header||header.querySelector('.header-tools'))return;

  const tools=document.createElement('div');
  tools.className='header-tools';
  tools.innerHTML=`<form class="header-place-search" role="search" autocomplete="off">
    <label class="sr-only" for="header-place-query">${t('Cerca el teu municipi')}</label>
    <span aria-hidden="true">⌕</span>
    <input id="header-place-query" type="search" minlength="2" maxlength="80" placeholder="${t('Cerca el teu municipi')}" aria-autocomplete="list" aria-controls="header-place-suggestions" data-i18n-placeholder />
    <div id="header-place-suggestions" class="header-place-suggestions" role="listbox" hidden></div>
  </form>
  <label class="header-language"><span aria-hidden="true">◎</span><span class="sr-only">${t('Idioma')}</span><select aria-label="${t('Idioma')}" data-i18n-label><option value="ca">CA</option><option value="es">ES</option><option value="en">EN</option><option value="fr">FR</option></select></label>`;
  const socialSlot=header.querySelector('.header-social-slot');
  header.insertBefore(tools,socialSlot||null);

  const form=tools.querySelector('form');
  const input=tools.querySelector('input');
  const suggestions=tools.querySelector('.header-place-suggestions');
  const select=tools.querySelector('select');
  let candidates=[];
  let timer;
  let requestNumber=0;
  let activeIndex=-1;

  select.value=getLanguage();
  select.addEventListener('change',()=>setLanguage(select.value));
  document.addEventListener('observatori:language-change',()=>{select.value=getLanguage();});

  const close=()=>{suggestions.hidden=true;activeIndex=-1;input.setAttribute('aria-expanded','false');};
  const focusOption=index=>{
    const options=[...suggestions.querySelectorAll('[role="option"]')];
    if(!options.length)return;
    activeIndex=(index+options.length)%options.length;
    options.forEach((option,itemIndex)=>option.setAttribute('aria-selected',String(itemIndex===activeIndex)));
    options[activeIndex].focus();
  };
  const openPlace=place=>{
    if(!place)return;
    const url=new URL('./municipis.html',window.location.href);
    url.searchParams.set('municipi',place.name);
    url.searchParams.set('lat',place.latitude);
    url.searchParams.set('lon',place.longitude);
    window.location.assign(url.href);
  };
  const render=items=>{
    candidates=items.slice(0,8);
    suggestions.innerHTML=candidates.map((place,index)=>`<button type="button" role="option" data-place-index="${index}" aria-selected="false"><b>${escapeHtml(place.name)}</b><small>${escapeHtml([place.admin2||place.admin1,place.country].filter(Boolean).join(' · '))}</small></button>`).join('');
    suggestions.hidden=!candidates.length;
    input.setAttribute('aria-expanded',String(Boolean(candidates.length)));
  };
  const search=async()=>{
    const query=input.value.trim();
    const currentRequest=++requestNumber;
    if(query.length<2){render([]);return;}
    form.classList.add('is-loading');
    try{
      const items=await searchMunicipalities(query,getLanguage());
      if(currentRequest===requestNumber)render(items);
    }catch{if(currentRequest===requestNumber)render([]);}
    finally{if(currentRequest===requestNumber)form.classList.remove('is-loading');}
  };

  input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,260);});
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'&&!suggestions.hidden){event.preventDefault();focusOption(0);}
    if(event.key==='Escape')close();
  });
  suggestions.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();focusOption(activeIndex+1);}
    if(event.key==='ArrowUp'){event.preventDefault();if(activeIndex<=0)input.focus();else focusOption(activeIndex-1);}
    if(event.key==='Escape'){close();input.focus();}
  });
  suggestions.addEventListener('click',event=>openPlace(candidates[Number(event.target.closest('[data-place-index]')?.dataset.placeIndex)]));
  form.addEventListener('submit',event=>{event.preventDefault();if(candidates[0])openPlace(candidates[0]);else search();});
  document.addEventListener('click',event=>{if(!tools.contains(event.target))close();});
}
