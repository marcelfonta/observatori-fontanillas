const CACHE = 'observatori-fontanillas-v5.5.1';
const APP_SHELL = [
  '/', '/index.html', '/site.webmanifest',
  '/css/variables.css', '/css/layout.css', '/css/style.css',
  '/js/api.js', '/js/app.js', '/js/config.js', '/js/utils.js',
  '/modules/astronomia.js', '/modules/avisos.js', '/modules/confort.js',
  '/modules/contacte.js', '/modules/estacio.js', '/modules/extrems.js',
  '/modules/grafiques.js', '/modules/historics.js', '/modules/models.js',
  '/modules/navigation.js', '/modules/prediccio.js', '/modules/qualitat.js',
  '/modules/radar.js', '/modules/resum.js', '/modules/situacio.js',
  '/modules/webcams.js',
  '/assets/icons/favicon-32.png', '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png', '/assets/icons/apple-touch-icon.png',
  '/assets/images/observatori-fontanillas-social.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('observatori-fontanillas-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const home = await cache.match('/index.html');
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
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});
