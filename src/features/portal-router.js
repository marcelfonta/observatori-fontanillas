const PAGES=new Set(['inici','estacio','prediccio','avisos','radar','webcams','centre-dades','medi-ambient','contacte']);
const LABELS={inici:'Consulta ràpida',estacio:'Dades de l’estació',prediccio:'Predicció i cel',avisos:'Vigilància oficial',radar:'Radar meteorològic',webcams:'Webcams', 'centre-dades':'Centre de Dades','medi-ambient':'Medi Ambient',contacte:'Contacte'};

export function initPortal(){
  const requested=new URLSearchParams(location.search).get('page')||'inici';
  const page=PAGES.has(requested)?requested:'inici';
  document.body.dataset.page=page;
  document.querySelectorAll('[data-portal-page]').forEach(section=>{section.hidden=!section.dataset.portalPage.split(/\s+/).includes(page);});
  document.querySelectorAll('[data-page-link]').forEach(link=>{const active=link.dataset.pageLink===page;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');});
  const label=document.getElementById('portal-page-label');if(label)label.textContent=LABELS[page]||'';
  const sidebar=document.getElementById('portal-sidebar'),button=document.getElementById('portal-menu-button'),backdrop=document.getElementById('portal-backdrop');
  const close=()=>{sidebar?.classList.remove('is-open');if(backdrop)backdrop.hidden=true;button?.setAttribute('aria-expanded','false');};
  button?.addEventListener('click',()=>{const open=!sidebar?.classList.contains('is-open');sidebar?.classList.toggle('is-open',open);if(backdrop)backdrop.hidden=!open;button.setAttribute('aria-expanded',String(open));});
  backdrop?.addEventListener('click',close);sidebar?.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
}
