const CACHE = 'observatori-fontanillas-v5.6.4';
const API_CACHE = 'fontanilles-api-v1';
const API_HOST = 'fonta-meteo.marcelfonta.workers.dev';
const API_TTL_MS = 30 * 60 * 1000; // 30 minuts
const APP_SHELL = [
  '/', '/index.html', '/site.webmanifest',
  '/css/variables.css', '/css/layout.css', '/css/style.css',
  '/js/api.js', '/js/app.js', '/js/config.js', '/js/utils.js', '/js/share.js',
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

// Estratègia "stale-while-revalidate" per a les crides a l'API del Worker:
// retorna immediatament la còpia en cache (si és fresca) i actualitza en background.
async function staleWhileRevalidate(event) {
  const request = event.request;
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  const cachedAt = cached ? Number(cached.headers.get('sw-cached-at')) || 0 : 0;
  const isFresh = cached && (Date.now() - cachedAt) < API_TTL_MS;

  const revalidate = fetch(request).then(async response => {
    if (response && response.ok) {
      const cloned = response.clone();
      const body = await cloned.blob();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cached-at', String(Date.now()));
      await cache.put(request, new Response(body, { status: cloned.status, statusText: cloned.statusText, headers }));
    }
    return response;
  }).catch(() => null);

  // Si hi ha una còpia fresca (< 30 min), la retornem de seguida i deixem que la
  // revalidació acabi en segon pla.
  if (cached && isFresh) {
    event.waitUntil(revalidate);
    return cached;
  }
  const network = await revalidate;
  if (network) return network;
  if (cached) return cached;
  return new Response(JSON.stringify({ error: 'Sense connexió i sense dades en cache.' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.hostname === API_HOST) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});
