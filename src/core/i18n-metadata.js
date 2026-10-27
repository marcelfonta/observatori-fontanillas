import { getLanguage, t } from './i18n.js';

// Static pages have no portal SEO controller. Keep their browser and sharing
// metadata aligned with the language chosen in the page.
export function initTranslatedMetadata(){
  const originalTitle=document.title;
  const ogLocale=document.querySelector('meta[property="og:locale"]');
  const fields=[...document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]')]
    .map(element=>[element,element.content]);
  function update(){
    document.title=t(originalTitle);
    for(const [element,source] of fields)element.content=t(source);
    if(ogLocale)ogLocale.content={ca:'ca_ES',es:'es_ES',en:'en_GB',fr:'fr_FR'}[getLanguage()]||'ca_ES';
  }
  document.addEventListener('observatori:language-change',update);
  update();
}
