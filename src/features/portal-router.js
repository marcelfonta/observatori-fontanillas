import { mountPortalShell } from './portal-shell.js';

const PAGES=new Set(['inici','estacio','prediccio','avisos','radar','webcams','centre-dades','medi-ambient','contacte']);
const LABELS={inici:'Consulta ràpida',estacio:'Dades de l’estació',prediccio:'Predicció i cel',avisos:'Vigilància oficial',radar:'Radar meteorològic',webcams:'Webcams', 'centre-dades':'Centre de Dades','medi-ambient':'Medi Ambient',contacte:'Contacte'};

export function initPortal(){
  const requested=new URLSearchParams(location.search).get('page')||'inici';
  const page=PAGES.has(requested)?requested:'inici';
  document.body.dataset.page=page;
  document.title=`${LABELS[page]} · Observatori Fontanillas`;
  mountPortalShell(page);
  document.querySelectorAll('[data-portal-page]').forEach(section=>{section.hidden=!section.dataset.portalPage.split(/\s+/).includes(page);});
  document.querySelectorAll('[data-page-link]').forEach(link=>{const active=link.dataset.pageLink===page;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');});
  const label=document.getElementById('portal-page-label');if(label)label.textContent=LABELS[page]||'';
}
