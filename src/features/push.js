import { CONFIG } from '../core/config.js';

const appId = String(CONFIG.oneSignalAppId || '').trim();
const button = document.getElementById('push-alert-button');
const status = document.getElementById('push-alert-status');

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function setState(label, text, active = false) {
  if (button) {
    const strong = button.querySelector('b');
    if (strong) strong.textContent = label;
    button.classList.toggle('is-active', active);
  }
  if (status) status.textContent = text;
}

if (button && status) {
  if (!appId) {
    setState('Activar avisos', 'Cal afegir l’App ID de OneSignal a src/core/config.js');
    button.addEventListener('click', () => alert('La web ja està preparada per a notificacions push. Falta afegir l’App ID de OneSignal a src/core/config.js.'));
  } else {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId,
          serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/push/onesignal/' },
          autoResubscribe: true,
          notificationClickHandlerMatch: 'origin',
          notificationClickHandlerAction: 'focus'
        });

        const refresh = () => {
          const supported = OneSignal.Notifications.isPushSupported();
          if (!supported) {
            setState('Avisos no compatibles', 'Aquest navegador no admet notificacions web push');
            button.disabled = true;
            return;
          }
          const optedIn = Boolean(OneSignal.User.PushSubscription.optedIn);
          if (optedIn) setState('Avisos activats', 'Rebràs només avisos meteorològics importants', true);
          else if (isIos() && !isStandalone()) setState('Activar avisos', 'A iPhone: afegeix primer la web a la pantalla d’inici');
          else setState('Activar avisos', 'Rep només avisos meteorològics importants');
        };

        OneSignal.User.PushSubscription.addEventListener('change', event => {
          refresh();
          if (event?.current?.optedIn && window.observatoriTrack) window.observatoriTrack('push_subscribed');
        });
        refresh();

        button.addEventListener('click', async () => {
          if (isIos() && !isStandalone()) {
            alert('A l’iPhone, Apple permet les notificacions web només quan la web està afegida a la pantalla d’inici. Obre Compartir → Afegir a la pantalla d’inici i torna a obrir l’Observatori des de la icona.');
            return;
          }
          try {
            if (OneSignal.User.PushSubscription.optedIn) {
              await OneSignal.User.PushSubscription.optOut();
            } else {
              await OneSignal.Notifications.requestPermission();
              await OneSignal.User.PushSubscription.optIn();
            }
            refresh();
          } catch (error) {
            console.warn('No s’han pogut actualitzar els avisos push.', error);
            setState('Activar avisos', 'No s’ha pogut completar la subscripció');
          }
        });
      } catch (error) {
        console.warn('OneSignal no s’ha pogut inicialitzar.', error);
        setState('Activar avisos', 'Servei push temporalment no disponible');
      }
    });
  }
}
