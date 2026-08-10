import { mountPortalShell } from './portal-shell.js';
mountPortalShell(document.body.dataset.portalStatic||'');
const clock=document.querySelector('.site-header time');
const updateClock=()=>{if(clock)clock.textContent=new Intl.DateTimeFormat('ca-ES',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'Europe/Madrid'}).format(new Date());};
if(document.getElementById('connection-label'))document.getElementById('connection-label').textContent='Informació';
updateClock();setInterval(updateClock,1000);
