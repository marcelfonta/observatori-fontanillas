import { CONFIG } from '../core/config.js';

const banner = document.getElementById('app-update-banner');
const updateButton = document.getElementById('app-update-button');
const dismissButton = document.getElementById('app-update-dismiss');
let registration;
let reloading = false;
let deferredInstallPrompt = null;
const RELOAD_GUARD_KEY = 'fontanillas-sw-controller-reload';

const isInstalled = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);

function mountInstallExperience() {
  const mobileLayout = window.matchMedia?.('(max-width: 820px)').matches;
  if (isInstalled() || (!mobileLayout && !isIos() && !isAndroid() && !deferredInstallPrompt)) return;
  const footer = document.querySelector('footer.shell');
  if (!footer || document.getElementById('app-install-cta')) return;

  const section = document.createElement('section');
  section.id = 'app-install-cta';
  section.className = 'app-install-cta shell';
  section.setAttribute('aria-labelledby', 'app-install-title');
  section.innerHTML = `
    <div class="app-install-cta__icon" aria-hidden="true">↘</div>
    <div>
      <p class="eyebrow">Accés ràpid</p>
      <h2 id="app-install-title">Vols Meteo Fontanillas al mòbil?</h2>
      <p>Instal·la la web com una aplicació: no ocupa gaire espai i s’obre directament des de la pantalla d’inici.</p>
    </div>
    <button type="button" id="app-install-button">Instal·la l’app</button>`;
  footer.before(section);

  const dialog = document.createElement('dialog');
  dialog.className = 'app-install-dialog';
  dialog.setAttribute('aria-labelledby', 'app-install-dialog-title');
  dialog.innerHTML = `
    <form method="dialog">
      <button class="app-install-dialog__close" value="close" aria-label="Tancar">×</button>
      <p class="eyebrow">Instal·lació</p>
      <h2 id="app-install-dialog-title">Afegeix Meteo Fontanillas</h2>
      <ol id="app-install-steps"></ol>
      <button class="app-install-dialog__done" value="close">Entesos</button>
    </form>`;
  document.body.append(dialog);

  section.querySelector('#app-install-button')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice.outcome === 'accepted') section.remove();
      return;
    }
    const steps = dialog.querySelector('#app-install-steps');
    steps.innerHTML = isIos()
      ? '<li>Obre aquesta pàgina amb <strong>Safari</strong>.</li><li>Prem el botó <strong>Compartir</strong> <span aria-hidden="true">□↑</span>.</li><li>Tria <strong>Afegir a la pantalla d’inici</strong> i confirma.</li>'
      : '<li>Obre el menú del navegador <strong>⋮</strong>.</li><li>Tria <strong>Instal·la l’aplicació</strong> o <strong>Afegeix a la pantalla d’inici</strong>.</li><li>Confirma la instal·lació.</li>';
    dialog.showModal();
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  mountInstallExperience();
});
window.addEventListener('appinstalled', () => document.getElementById('app-install-cta')?.remove());
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountInstallExperience, { once: true });
else mountInstallExperience();

function showUpdate() {
  if (banner) banner.hidden = false;
}
function hideUpdate() {
  if (banner) banner.hidden = true;
}

async function checkForUpdate() {
  if (!registration) return;
  try { await registration.update(); } catch (error) { console.debug('Comprovació PWA no disponible.', error); }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Quan OneSignal està configurat, és l'únic responsable de registrar el
      // Worker compartit. Registrar-lo també aquí amb una URL sense els seus
      // paràmetres provocaria un bucle d'actualització i recàrrega.
      if (CONFIG.oneSignalAppId) registration = await navigator.serviceWorker.ready;
      else registration = await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
      if (registration.waiting) showUpdate();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
        });
      });
      await checkForUpdate();
    } catch (error) {
      console.warn('Mode instal·lable no disponible.', error);
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    const lastReload=Number(sessionStorage.getItem(RELOAD_GUARD_KEY)||0);
    if(Date.now()-lastReload<10000)return;
    reloading = true;
    sessionStorage.setItem(RELOAD_GUARD_KEY,String(Date.now()));
    window.location.reload();
  });

  updateButton?.addEventListener('click', () => {
    const worker = registration?.waiting;
    if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
    else window.location.reload();
  });
  dismissButton?.addEventListener('click', hideUpdate);

  window.addEventListener('pageshow', () => checkForUpdate());
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkForUpdate();
  });
}
