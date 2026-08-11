import { CONFIG } from '../core/config.js';

const ICONS={
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.1"></circle><circle class="is-fill" cx="17.4" cy="6.7" r="1.15"></circle></svg>',
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="is-fill" d="M13.7 21v-8h2.8l.4-3.1h-3.2v-2c0-.9.3-1.6 1.7-1.6H17V3.5c-.7-.1-1.5-.2-2.3-.2-2.3 0-4 1.4-4 4.1v2.5H8V13h2.7v8h3Z"></path></svg>'
};

export function initFooterSocial(){
  document.querySelectorAll('footer.shell').forEach(footer=>{
    if(footer.querySelector('.footer-social'))return;
    const group=document.createElement('nav');
    group.className='footer-social';
    group.setAttribute('aria-label','Xarxes socials de Meteo Fontanillas');
    [['instagram','Instagram'],['facebook','Facebook']].forEach(([key,label])=>{
      const href=CONFIG.social?.[key];
      if(!href)return;
      const link=document.createElement('a');
      link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.className=`footer-social__link footer-social__link--${key}`;
      link.setAttribute('aria-label',`${label} de Meteo Fontanillas (s’obre en una pestanya nova)`);
      link.innerHTML=`${ICONS[key]}<span>${label}</span>`;
      group.append(link);
    });
    if(group.children.length)footer.append(group);
  });
}
