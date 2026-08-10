const CACHE = 'observatori-fontanillas-v19-0-2';
const API_CACHE = 'fontanilles-api-v2';
const API_HOST = 'fonta-meteo.marcelfonta.workers.dev';
const APP_SHELL = [
  '/', '/index.html', '/metodologia.html', '/comparativa.html', '/historial-avisos.html', '/privacitat.html', '/site.webmanifest',
  '/css/variables.css', '/css/layout.css', '/css/style.css', '/css/portal.css',
  '/src/app.js', '/src/core/config.js', '/src/core/dom.js', '/src/core/notification-preferences.js', '/src/data/meteorological-ephemerides.js', '/src/services/weather-api.js',
  '/src/features/analytics.js', '/src/features/push.js', '/src/features/pwa.js', '/src/features/share.js',
  '/src/features/share-page.js', '/src/features/stations-comparison.js', '/src/features/alert-history-init.js', '/src/features/alert-history-page.js',
  '/src/features/portal-router.js', '/src/features/portal-shell.js', '/src/features/portal-static.js', '/src/features/data-center.js', '/src/features/environment.js', '/src/features/meteo-ai.js', '/src/features/long-range.js', '/src/features/learning.js', '/src/features/seo.js',
  '/src/modules/alert-history.js', '/src/modules/astronomia.js', '/src/modules/avisos.js', '/src/modules/confort.js',
  '/src/modules/contacte.js', '/src/modules/estacio.js', '/src/modules/extrems.js',
  '/src/modules/grafiques.js', '/src/modules/historics.js', '/src/modules/models.js',
  '/src/modules/navigation.js', '/src/modules/prediccio.js', '/src/modules/qualitat.js',
  '/src/modules/radar.js', '/src/modules/resum.js', '/src/modules/situacio.js', '/src/modules/webcams.js',
  '/assets/icons/favicon-16.png', '/assets/icons/favicon-32.png', '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png', '/assets/icons/icon-maskable-192.png', '/assets/icons/icon-maskable-512.png',
  '/assets/icons/apple-touch-icon.png', '/assets/logos/observatori-symbol.svg', '/assets/logos/observatori-lockup.svg',
  '/assets/images/observatori-fontanillas-social-v12-2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key =>
        (key.startsWith('observatori-fontanillas-') && key !== CACHE) ||
        (key.startsWith('fontanilles-api-') && key !== API_CACHE)
      ).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName = CACHE) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const home = await caches.open(CACHE).then(c => c.match('/index.html'));
      if (home) return home;
    }
    return new Response('Sense connexió i sense una còpia local disponible.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.hostname === API_HOST) {
    if (url.pathname.startsWith('/admin/')) {
      event.respondWith(fetch(event.request, { cache:'no-store' }));
      return;
    }
    // V6.0: sempre prova primer la xarxa. Això evita dades meteorològiques congelades
    // durant 30 minuts quan la PWA torna del segon pla a iPhone.
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/administracio.html' || url.pathname === '/src/features/admin.js') {
    event.respondWith(fetch(event.request, { cache:'no-store' }));
    return;
  }
  event.respondWith(networkFirst(event.request, CACHE));
});
