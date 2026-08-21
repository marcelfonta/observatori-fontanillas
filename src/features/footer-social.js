import { CONFIG } from '../core/config.js';

const ICONS={
  instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.1"></circle><circle class="is-fill" cx="17.4" cy="6.7" r="1.15"></circle></svg>',
  facebook:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="is-fill" d="M13.7 21v-8h2.8l.4-3.1h-3.2v-2c0-.9.3-1.6 1.7-1.6H17V3.5c-.7-.1-1.5-.2-2.3-.2-2.3 0-4 1.4-4 4.1v2.5H8V13h2.7v8h3Z"></path></svg>',
  bluesky:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="is-fill" d="M12 10.2c-1.1-2.1-4-6-6.7-7.9C2.8.6 1.8.9 1.2 1.2.5 1.6.4 2.7.4 3.3c0 .7.4 5.9.7 6.7.9 3 4 4 6.8 3.5-4.8.8-9.1 2.8-3.5 9 6.2 6.4 7.6-1.4 7.6-5.4 0 4 1.4 11.8 7.6 5.4 5.6-6.2 1.3-8.2-3.5-9 2.8.5 5.9-.5 6.8-3.5.3-.8.7-6 .7-6.7 0-.6-.1-1.7-.8-2.1-.6-.3-1.6-.6-4.1 1.1-2.7 1.9-5.6 5.8-6.7 7.9Z"/></svg>',
  telegram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path class="is-fill" d="M21.5 3.1 2.9 10.3c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .8-.2 1-.4l2.3-2.2 4.8 3.5c.9.5 1.5.3 1.8-.8l3-14.2c.4-1.4-.5-2-1.5-1.6ZM9.4 13l9.3-5.9c.5-.3.9-.1.5.2l-7.7 7-.3 3.4L9.4 13Z"/></svg>',
  threads:'<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="17" text-anchor="middle" class="is-fill" font-size="15" font-weight="800">@</text></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 14 16M19 4 5 20" stroke-width="2.4"/></svg>',
  tiktok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v11a4 4 0 1 1-4-4M14 4c.5 3 2.2 4.5 5 4.7" stroke-width="2.2"/></svg>',
  whatsapp:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="11.5" r="8"/><path d="m6.2 17.2-1 3.3 3.5-1.1M9 8.3c1 3.2 2.4 4.6 5.7 5.7" stroke-width="1.8"/></svg>'
};

const NETWORKS=[['instagram','Instagram'],['facebook','Facebook'],['threads','Threads'],['x','X'],['bluesky','Bluesky'],['telegram','Telegram'],['tiktok','TikTok'],['whatsapp','WhatsApp']];

function socialLink(key,label,variant){
  const href=CONFIG.social?.[key];
  if(!href)return null;
  const link=document.createElement('a');
  link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.className=`social-link social-link--${variant} social-link--${key}`;
  link.setAttribute('aria-label',`${label} de Meteo Fontanillas (s’obre en una pestanya nova)`);
  link.title=label;
  link.innerHTML=`${ICONS[key]}<span>${label}</span>`;
  return link;
}

function mountSocialGroup(container,className,variant){
  if(!container||container.querySelector(`.${className}`))return;
  const group=document.createElement('nav');group.className=className;group.setAttribute('aria-label','Xarxes socials de Meteo Fontanillas');
  NETWORKS.forEach(([key,label])=>{const link=socialLink(key,label,variant);if(link)group.append(link);});
  if(group.children.length)container.append(group);
}

export function initFooterSocial(){
  const header=document.querySelector('.site-header');
  if(header){
    let slot=header.querySelector('.header-social-slot');
    if(!slot){slot=document.createElement('div');slot.className='header-social-slot';header.append(slot);}
    mountSocialGroup(slot,'header-social','header');
  }

  mountSocialGroup(document.querySelector('.portal-sidebar__social'),'sidebar-social','sidebar');

  document.querySelectorAll('footer.shell').forEach(footer=>{
    const copyright=[...footer.children].find(item=>item.tagName==='SPAN'&&item.textContent.includes('©'));
    if(copyright)copyright.classList.add('footer-copyright');
    mountSocialGroup(footer,'footer-social','footer');
  });
}
