import { getLanguage, initLanguage, setLanguage } from '../core/i18n.js';
import { initTranslatedMetadata } from '../core/i18n-metadata.js';

// Pages outside the portal shell share the same language preference and catalogue.
initLanguage();
initTranslatedMetadata();

const nav=document.createElement('nav');
nav.className='standalone-languages';
nav.setAttribute('aria-label','Idioma');
for(const [code,label] of [['ca','Català'],['es','Español'],['en','English'],['fr','Français']]){
  const button=document.createElement('button');
  button.type='button';
  button.textContent=label;
  button.dataset.i18nIgnore='';
  button.dataset.language=code;
  button.addEventListener('click',()=>setLanguage(code));
  nav.append(button);
}
document.body.prepend(nav);

function updateLanguage(){
  for(const button of nav.children)button.setAttribute('aria-pressed',button.dataset.language===getLanguage()?'true':'false');
}
document.addEventListener('observatori:language-change',updateLanguage);
updateLanguage();
