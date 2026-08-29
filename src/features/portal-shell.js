const icon=paths=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
const ICONS={
  inici:icon('<path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.5 10v9.5h13V10M9.5 19.5v-6h5v6"/>'),
  'meteo-ia':icon('<path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="m12 8 .7 1.6 1.8.7-1.8.7-.7 1.7-.7-1.7-1.8-.7 1.8-.7L12 8ZM17.5 4v3M16 5.5h3"/>'),
  estacio:icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2M5.7 7.2h12.6"/>'),
  prediccio:icon('<path d="M7.2 17.5h9.6a3.4 3.4 0 0 0 .2-6.8A5.3 5.3 0 0 0 7 9.5a4 4 0 0 0 .2 8Z"/><path d="M7 5.2V3.8M3.7 7 2.6 6M10.3 7l1.1-1"/>'),
  videos:icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9Z"/>'),
  verificacio:icon('<path d="M4 17.5V13M9.3 17.5V8.5M14.7 17.5V11M20 17.5V5"/><path d="m3.5 8.5 4-3 5 2.3 7-5"/>'),
  avisos:icon('<path d="M10.4 4.2 2.9 17.3a1.8 1.8 0 0 0 1.6 2.7h15a1.8 1.8 0 0 0 1.6-2.7L13.6 4.2a1.8 1.8 0 0 0-3.2 0Z"/><path d="M12 9v4.5M12 17h.01"/>'),
  cel:icon('<path d="M19.5 15.4A8.2 8.2 0 0 1 8.6 4.5 8.3 8.3 0 1 0 19.5 15.4Z"/><path d="M16.7 5.3v2.4M15.5 6.5h2.4"/>'),
  radar:icon('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><path d="M12 12 18.4 7.4M12 12v-8"/><circle cx="12" cy="12" r="1"/>'),
  webcams:icon('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 6 1.2-2h5.6L16 6"/><circle cx="12" cy="12.5" r="3.3"/>'),
  'centre-dades':icon('<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6M4.5 11.5v6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-6"/>'),
  comparar:icon('<path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/>'),
  municipis:icon('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4M8 11h6M11 8v6"/>'),
  'medi-ambient':icon('<path d="M19.5 4.5C12 4.7 6.2 8.4 6.2 14.2c0 3 2.2 5.3 5.2 5.3 5.9 0 8.1-6.3 8.1-15Z"/><path d="M4.2 20c2.8-5.7 6.8-9.3 12.2-11.8"/>'),
  aprendre:icon('<path d="m3.5 8.5 8.5-4 8.5 4-8.5 4-8.5-4Z"/><path d="M6.5 10.2v5.2c2.9 2.2 8.1 2.2 11 0v-5.2M20.5 8.5v6"/>'),
  contacte:icon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4.5 7 7.5 5.7L19.5 7"/>'),
  metodologia:icon('<circle cx="12" cy="12" r="9"/><path d="M12 10.8v5.5M12 7.5h.01"/>')
};
const NAV_ITEMS=[
  ['inici','Inici','./?page=inici'],['meteo-ia','Meteo IA','./?page=meteo-ia'],['estacio','Estació','./?page=estacio'],
  ['prediccio','Predicció','./?page=prediccio'],['videos','Predicció en vídeo','./?page=videos'],['verificacio','Predicció vs realitat','./?page=verificacio'],['avisos','Avisos','./?page=avisos'],
  ['cel','Cel de dia i de nit','./?page=cel'],['radar','Radar','./?page=radar'],['webcams','Webcams','./?page=webcams'],
  ['centre-dades','Centre de Dades','./?page=centre-dades'],['comparar','Comparar','./comparativa.html'],['municipis','El temps arreu','./municipis.html'],
  ['medi-ambient','Medi Ambient','./?page=medi-ambient'],['aprendre','Aprendre','./?page=aprendre'],['contacte','Contacte','./?page=contacte'],['metodologia','Metodologia','./metodologia.html']
];
const NAV_GROUPS=[
  ['Ara',['inici','meteo-ia','estacio','municipis']],
  ['Previsió i risc',['prediccio','videos','verificacio','avisos']],
  ['Explora',['cel','radar','webcams']],
  ['Dades i projecte',['centre-dades','comparar','medi-ambient','aprendre','contacte','metodologia']]
];
const PAGE_LABELS={inici:'Consulta ràpida','meteo-ia':'Meteo IA',estacio:'Dades de l’estació',prediccio:'Predicció meteorològica',videos:'Predicció en vídeo',verificacio:'Predicció vs realitat',cel:'Cel de dia i de nit',avisos:'Vigilància oficial',radar:'Radar meteorològic',webcams:'Webcams','centre-dades':'Centre de Dades',comparar:'Comparativa',municipis:'El temps arreu','medi-ambient':'Medi Ambient',aprendre:'Aprendre meteorologia',contacte:'Contacte',metodologia:'Metodologia'};

export function mountPortalShell(activePage){
  document.body.classList.add('has-portal-shell');
  const header=document.querySelector('.site-header');
  header?.querySelector('.brand')?.remove();
  if(header&&!document.getElementById('portal-menu-button')){
    const button=document.createElement('button');button.className='portal-menu-button';button.id='portal-menu-button';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','portal-sidebar');button.setAttribute('aria-label','Obrir el menú');button.textContent='☰';header.prepend(button);
  }
  if(header&&!header.querySelector('.header-context')){const context=document.createElement('p');context.className='header-context';context.textContent=PAGE_LABELS[activePage]||'';header.append(context);}
  if(header){
    const button=header.querySelector('.portal-menu-button');
    const live=header.querySelector('.live-pill');
    const context=header.querySelector('.header-context');
    if(live)header.insertBefore(live,button?.nextSibling||header.firstChild);
    if(context)header.insertBefore(context,live?.nextSibling||header.firstChild);
  }
  let sidebar=document.getElementById('portal-sidebar');
  if(!sidebar){
    sidebar=document.createElement('aside');sidebar.className='portal-sidebar';sidebar.id='portal-sidebar';sidebar.setAttribute('aria-label','Seccions del portal');
    const brand=document.createElement('a');brand.className='portal-sidebar__brand';brand.href='./?page=inici';brand.setAttribute('aria-label','Fontanillas · Sant Celoni, inici');brand.innerHTML='<span class="portal-sidebar__brand-mark" aria-hidden="true"><img src="assets/images/observatori-fontanillas-avatar-v21.png" alt="" width="52" height="52" /></span><span class="portal-sidebar__brand-copy"><strong>Fontanillas</strong><small>Sant Celoni</small></span>';
    const nav=document.createElement('nav');
    NAV_GROUPS.forEach(([group,ids])=>{
      const section=document.createElement('div');section.className='portal-nav-group';
      const heading=document.createElement('p');heading.textContent=group;section.append(heading);
      ids.forEach(id=>{const [,label,href]=NAV_ITEMS.find(item=>item[0]===id);const link=document.createElement('a');link.href=href;link.dataset.pageLink=id;link.innerHTML=`<span aria-hidden="true">${ICONS[id]}</span>${label}`;section.append(link);});
      nav.append(section);
    });
    const footer=document.createElement('div');footer.className='portal-sidebar__footer';footer.innerHTML='<div class="portal-sidebar__copyright"><small>© 2026 Fontanillas</small><span>Observatori meteorològic local</span></div>';
    sidebar.append(brand,nav,footer);document.body.insertBefore(sidebar,document.querySelector('main'));
  }
  let backdrop=document.getElementById('portal-backdrop');
  if(!backdrop){backdrop=document.createElement('button');backdrop.className='portal-backdrop';backdrop.id='portal-backdrop';backdrop.type='button';backdrop.hidden=true;backdrop.setAttribute('aria-label','Tancar el menú');document.body.insertBefore(backdrop,document.querySelector('main'));}
  document.querySelectorAll('[data-page-link]').forEach(link=>{const active=link.dataset.pageLink===activePage;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  const button=document.getElementById('portal-menu-button');
  const close=()=>{const restoreFocus=sidebar.classList.contains('is-open')&&sidebar.contains(document.activeElement);sidebar.classList.remove('is-open');backdrop.hidden=true;button?.setAttribute('aria-expanded','false');document.body.classList.remove('has-portal-menu');if(restoreFocus)button?.focus();};
  button?.addEventListener('click',()=>{const open=!sidebar.classList.contains('is-open');sidebar.classList.toggle('is-open',open);backdrop.hidden=!open;button.setAttribute('aria-expanded',String(open));document.body.classList.toggle('has-portal-menu',open);if(open)requestAnimationFrame(()=>sidebar.querySelector('a')?.focus());});
  backdrop.addEventListener('click',close);sidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));document.addEventListener('keydown',event=>{if(event.key==='Escape')close();if(event.key==='Tab'&&sidebar.classList.contains('is-open')){const items=[...sidebar.querySelectorAll('a')];const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});

  if(!document.getElementById('portal-mobile-nav')){
    const mobile=document.createElement('nav');mobile.className='portal-mobile-nav';mobile.id='portal-mobile-nav';mobile.setAttribute('aria-label','Navegació principal mòbil');
    [['inici','Inici'],['estacio','Ara'],['municipis','Arreu'],['prediccio','Previsió'],['avisos','Avisos']].forEach(([id,label])=>{
      const [, ,href]=NAV_ITEMS.find(item=>item[0]===id);const link=document.createElement('a');link.href=href;link.dataset.mobilePage=id;link.innerHTML=`<span aria-hidden="true">${ICONS[id]}</span><b>${label}</b>`;mobile.append(link);
    });
    const more=document.createElement('button');more.type='button';more.id='portal-mobile-more';more.setAttribute('aria-label','Obrir totes les seccions');more.setAttribute('aria-controls','portal-sidebar');more.setAttribute('aria-expanded','false');more.innerHTML='<span aria-hidden="true">•••</span><b>Més</b>';
    more.addEventListener('click',()=>{button?.click();more.setAttribute('aria-expanded',button?.getAttribute('aria-expanded')||'false');});
    mobile.append(more);document.body.append(mobile);
  }
  document.querySelectorAll('[data-mobile-page]').forEach(link=>{const active=link.dataset.mobilePage===activePage;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  const primaryMobilePages=['inici','estacio','municipis','prediccio','avisos'];
  document.getElementById('portal-mobile-more')?.classList.toggle('is-active',!primaryMobilePages.includes(activePage));
}
