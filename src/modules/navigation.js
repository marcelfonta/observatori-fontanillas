const links = () => [...document.querySelectorAll('[data-section-link]')];
const MOBILE_VIEW_KEY = 'fontanillas-mobile-view';

function setActiveSection(id) {
  links().forEach(link=>{
    const active=link.dataset.sectionLink===id;
    link.classList.toggle('is-active',active);
    if(active)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
}

function initSectionTracking() {
  const ids=[...new Set(links().map(link=>link.dataset.sectionLink))];
  const sections=ids.map(id=>document.getElementById(id)).filter(Boolean);
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)setActiveSection(visible.target.id);
  },{rootMargin:'-22% 0px -62% 0px',threshold:[0,.05,.2]});
  sections.forEach(section=>observer.observe(section));
}

function applyMobileView(mode,persist=true) {
  const selected=mode==='essential'?'essential':'full';
  document.body.classList.toggle('is-essential-mobile',selected==='essential');
  document.querySelectorAll('[data-mobile-view]').forEach(button=>{
    const active=button.dataset.mobileView===selected;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  if(persist) {
    try { localStorage.setItem(MOBILE_VIEW_KEY,selected); } catch(error) { /* Preferència opcional. */ }
  }
}

function initMobileView() {
  let saved='full';
  try { saved=localStorage.getItem(MOBILE_VIEW_KEY)||'full'; } catch(error) { /* Preferència opcional. */ }
  applyMobileView(saved,false);
  document.querySelectorAll('[data-mobile-view]').forEach(button=>button.addEventListener('click',()=>applyMobileView(button.dataset.mobileView)));
  document.querySelectorAll('[data-requires-full]').forEach(link=>link.addEventListener('click',()=>applyMobileView('full')));
}

function initMobileMenu() {
  const button=document.getElementById('mobile-more-button');
  const menu=document.getElementById('mobile-more-menu');
  const close=document.getElementById('mobile-more-close');
  const backdrop=menu?.querySelector('.mobile-more__backdrop');
  let previousFocus=null;

  const hide=()=>{
    if(!menu)return;
    menu.hidden=true;
    menu.setAttribute('aria-hidden','true');
    document.body.classList.remove('has-mobile-menu');
    button?.setAttribute('aria-expanded','false');
    previousFocus?.focus?.();
  };
  const show=()=>{
    if(!menu)return;
    previousFocus=document.activeElement;
    menu.hidden=false;
    menu.setAttribute('aria-hidden','false');
    document.body.classList.add('has-mobile-menu');
    button?.setAttribute('aria-expanded','true');
    close?.focus();
  };

  button?.addEventListener('click',()=>menu?.hidden?show():hide());
  close?.addEventListener('click',hide);
  backdrop?.addEventListener('click',hide);
  menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',hide));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!menu?.hidden){hide();return;}
    if(event.key!=='Tab'||menu?.hidden)return;
    const focusable=[...menu.querySelectorAll('button,a[href]')].filter(item=>!item.disabled&&!item.classList.contains('mobile-more__backdrop'));
    if(!focusable.length)return;
    const first=focusable[0]; const last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
}

export function initNavigation() {
  initMobileView();
  initMobileMenu();
  initSectionTracking();
  links().forEach(link=>link.addEventListener('click',()=>setActiveSection(link.dataset.sectionLink)));
}

export function initWhenVisible(selector, callback, rootMargin='500px 0px') {
  const target=document.querySelector(selector);
  if(!target)return;
  if(!('IntersectionObserver' in window)){callback();return;}
  const observer=new IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    observer.disconnect();
    callback();
  },{rootMargin,threshold:0});
  observer.observe(target);
}
