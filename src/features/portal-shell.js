const NAV_ITEMS=[
  ['inici','⌂','Inici','./?page=inici'],['estacio','◉','Estació','./?page=estacio'],
  ['prediccio','☁','Predicció','./?page=prediccio'],['avisos','!','Avisos','./?page=avisos'],
  ['radar','◎','Radar','./?page=radar'],['webcams','▣','Webcams','./?page=webcams'],
  ['centre-dades','⌁','Centre de Dades','./?page=centre-dades'],['comparar','⇄','Comparar','./comparativa.html'],
  ['medi-ambient','♧','Medi Ambient','./?page=medi-ambient'],['contacte','↗','Contacte','./?page=contacte'],
  ['metodologia','i','Metodologia','./metodologia.html']
];
const PAGE_LABELS={inici:'Consulta ràpida',estacio:'Dades de l’estació',prediccio:'Predicció i cel',avisos:'Vigilància oficial',radar:'Radar meteorològic',webcams:'Webcams','centre-dades':'Centre de Dades',comparar:'Comparativa','medi-ambient':'Medi Ambient',contacte:'Contacte',metodologia:'Metodologia'};

export function mountPortalShell(activePage){
  document.body.classList.add('has-portal-shell');
  const header=document.querySelector('.site-header');
  if(header&&!document.getElementById('portal-menu-button')){
    const button=document.createElement('button');button.className='portal-menu-button';button.id='portal-menu-button';button.type='button';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','portal-sidebar');button.setAttribute('aria-label','Obrir el menú');button.textContent='☰';header.prepend(button);
  }
  if(header&&!header.querySelector('.header-context')){const context=document.createElement('p');context.className='header-context';context.textContent=PAGE_LABELS[activePage]||'';header.insertBefore(context,header.querySelector('.live-pill'));}
  let sidebar=document.getElementById('portal-sidebar');
  if(!sidebar){
    sidebar=document.createElement('aside');sidebar.className='portal-sidebar';sidebar.id='portal-sidebar';sidebar.setAttribute('aria-label','Seccions del portal');
    const nav=document.createElement('nav');
    NAV_ITEMS.forEach(([id,icon,label,href])=>{const link=document.createElement('a');link.href=href;link.dataset.pageLink=id;link.innerHTML=`<span aria-hidden="true">${icon}</span>${label}`;nav.append(link);});
    sidebar.append(nav);document.body.insertBefore(sidebar,document.querySelector('main'));
  }
  let backdrop=document.getElementById('portal-backdrop');
  if(!backdrop){backdrop=document.createElement('button');backdrop.className='portal-backdrop';backdrop.id='portal-backdrop';backdrop.type='button';backdrop.hidden=true;backdrop.setAttribute('aria-label','Tancar el menú');document.body.insertBefore(backdrop,document.querySelector('main'));}
  document.querySelectorAll('[data-page-link]').forEach(link=>{const active=link.dataset.pageLink===activePage;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  const button=document.getElementById('portal-menu-button');
  const close=()=>{sidebar.classList.remove('is-open');backdrop.hidden=true;button?.setAttribute('aria-expanded','false');document.body.classList.remove('has-portal-menu');};
  button?.addEventListener('click',()=>{const open=!sidebar.classList.contains('is-open');sidebar.classList.toggle('is-open',open);backdrop.hidden=!open;button.setAttribute('aria-expanded',String(open));document.body.classList.toggle('has-portal-menu',open);});
  backdrop.addEventListener('click',close);sidebar.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
}
