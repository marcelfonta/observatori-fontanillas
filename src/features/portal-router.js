import { mountPortalShell } from './portal-shell.js';
import { updateSeoMetadata } from './seo.js';

const PAGES=new Set(['inici','meteo-ia','estacio','prediccio','cel','avisos','radar','webcams','centre-dades','medi-ambient','contacte']);
const LABELS={inici:'Consulta ràpida','meteo-ia':'Meteo IA',estacio:'Dades de l’estació',prediccio:'Predicció meteorològica',cel:'Cel de dia i de nit',avisos:'Vigilància oficial',radar:'Radar meteorològic',webcams:'Webcams', 'centre-dades':'Centre de Dades','medi-ambient':'Medi Ambient',contacte:'Contacte'};

export function initPortal(){
  const requested=new URLSearchParams(location.search).get('page')||'inici';
  const page=PAGES.has(requested)?requested:'inici';
  document.body.dataset.page=page;
  updateSeoMetadata(page);
  mountPortalShell(page);
  document.querySelectorAll('[data-portal-page]').forEach(section=>{section.hidden=!section.dataset.portalPage.split(/\s+/).includes(page);});
  const visible=[...document.querySelectorAll('[data-portal-page]:not([hidden])')];
  document.querySelectorAll('[data-portal-page]').forEach(section=>section.classList.remove('is-page-start','is-page-content-start'));
  visible[0]?.classList.add('is-page-start');
  visible.find((section,index)=>index>0&&section.classList.contains('section-block'))?.classList.add('is-page-content-start');
  document.querySelectorAll('[data-page-link]').forEach(link=>{const active=link.dataset.pageLink===page;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');});
  const label=document.getElementById('portal-page-label');if(label)label.textContent=LABELS[page]||'';
}
