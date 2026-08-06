const banner = document.getElementById('app-update-banner');
const updateButton = document.getElementById('app-update-button');
const dismissButton = document.getElementById('app-update-dismiss');
let registration;
let reloading = false;

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
      registration = await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
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
    reloading = true;
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
