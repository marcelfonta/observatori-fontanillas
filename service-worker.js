const CACHE = 'observatori-fontanillas-v6.0';
const API_CACHE = 'fontanilles-api-v2';
const API_HOST = 'fonta-meteo.marcelfonta.workers.dev';
const APP_SHELL = [
  '/', '/index.html', '/metodologia.html', '/site.webmanifest',
  '/css/variables.css', '/css/layout.css', '/css/style.css',
  '/js/api.js', '/js/app.js', '/js/config.js', '/js/utils.js', '/js/share.js',
  '/js/analytics.js', '/js/push.js', '/js/pwa.js',
  '/modules/astronomia.js', '/modules/avisos.js', '/modules/confort.js',
  '/modules/contacte.js', '/modules/estacio.js', '/modules/extrems.js',
  '/modules/grafiques.js', '/modules/historics.js', '/modules/models.js',
  '/modules/navigation.js', '/modules/prediccio.js', '/modules/qualitat.js',
  '/modules/radar.js', '/modules/resum.js', '/modules/situacio.js', '/modules/webcams.js',
  '/assets/icons/favicon-32.png', '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png', '/assets/icons/apple-touch-icon.png',
  '/assets/images/observatori-fontanillas-social.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
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
    // V6.0: sempre prova primer la xarxa. Això evita dades meteorològiques congelades
    // durant 30 minuts quan la PWA torna del segon pla a iPhone.
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request, CACHE));
});
