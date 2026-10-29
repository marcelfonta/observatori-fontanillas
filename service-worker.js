const CACHE = 'observatori-fontanillas-v22-42-17-fonta-regional-v1-drought-map-v1-current-favicon-v1-morning-publication-0645-frances-colaboracions-extrems-v4-centre-dades-tabs-v1-records-v1-mobile-audit-v3-single-row-search-v1-astronomy-v2-audit-g-mobile-performance-accessibility-push-cleanup-environment-freshness-v2-fonta-lab-v3-home-dayparts-v3-long-range-readability-v2-aca-hydrology-v2-civil-protection-v1-arome-local-v2-meteofrance-direct-v2-camera-homepage-v1-multimodel-v1-firms-map-v1-arome-catalunya-v1-buffer-rate-limit-v1-opera-ready-v1-windy-explorer-v1-forecast-resilience-v1-earthquakes-v1-smart-home-v1-earth-center-v1-weather-stories-v1-verification-reputation-v1-connection-recovery-v1-weather-stories-date-v1-estofex-local-earth-viewer-v1-harmonie-nowcast-v1-earth-topographic-v1-earth-overlays-v1-earthquakes-all-week-v1-icgc-live-v1-audit-performance-reliability-v1-route-split-v1-route-dom-v1-brand-light-v1-models-lcp-v1-deep-links-v1-models-route-v1-editorial-stories-v1-monthly-summary-v1-technical-quality-v1-education-sheet-v1-stellarium-pilot-v2-climate-page-v1-climate-history-v1-camera-co2-v1-webcam-panorama-v1-environment-stories-nav-v1-drought-fallback-v1-xvpca-air-v1-xvpca-icqa-v1-air-stations-map-alerts-v1-air-map-ready-v1-home-future-noaa-decade-v1-offline-first-v1-static-seo-v1-camera-domain-v2-local-context-v1-forecast-cleanup-v1-i18n-ui-v1-i18n-content-v1';
const API_CACHE = 'fontanilles-api-v2';
const API_HOST = 'fonta-meteo.marcelfonta.workers.dev';
const APP_SHELL = [
  '/src/core/forecast-dayparts.js',
  '/src/core/service-worker-registration.js',
  '/src/core/home-forecast.js',
  '/src/core/home-weather-symbol.js',
  '/src/features/home-forecast.js',
  '/src/core/numeric.js',
  '/src/core/recent-station-context.js',
  '/src/core/environment-freshness.js',
  '/src/core/xac-pollen.js',
  '/src/core/statistics.js',
  '/src/core/history-data.js',
  '/src/core/archive-coverage.js',
  '/src/core/ensemble-confidence.js',
  '/', '/index.html', '/models', '/canvi-climatic', '/metodologia', '/comparativa', '/municipis', '/historial-avisos', '/privacitat', '/condicions', '/xarxes', '/colaboracions', '/metodologia.html', '/comparativa.html', '/municipis.html', '/historial-avisos.html', '/privacitat.html', '/condicions.html', '/xarxes.html', '/colaboracions.html', '/site.webmanifest', '/site.es.webmanifest', '/site.en.webmanifest', '/site.fr.webmanifest',
  '/assets/data/climate/co2-annual-mlo.svg', '/assets/data/climate/co2-annual-mlo.csv',
  '/css/fonts.css', '/css/variables.css', '/css/layout.css', '/css/style.css', '/css/portal.css', '/css/standalone-languages.css', '/css/models-franca.css', '/css/models-franca-map.css', '/css/models-franca-portal.css', '/css/models-franca-ux.css',
  '/src/app.js', '/src/core/page-bootstrap.js', '/src/core/portal-routes.js', '/src/core/route-dom-pruner.js', '/src/core/config.js', '/src/core/dom.js', '/src/core/i18n.js', '/src/core/i18n-fr.js', '/src/core/i18n-ui-headings.js', '/src/core/i18n-content.js', '/src/core/i18n-metadata.js', '/src/core/alert-episodes.js', '/src/core/notification-preferences.js', '/src/data/meteorological-ephemerides.js', '/src/data/astronomical-calendar.js', '/src/data/learning-resources.js', '/src/data/editorial-stories.js', '/src/data/monthly-summaries.js', '/src/services/weather-api.js',
  '/src/features/analytics.js', '/src/features/push.js', '/src/features/pwa.js', '/src/features/share.js', '/src/features/models-franca.js',
  '/src/features/share-page.js', '/src/features/stations-comparison.js', '/src/features/municipality-explorer.js', '/src/features/alert-history-init.js', '/src/features/alert-history-page.js',
  '/src/features/portal-router.js', '/src/features/portal-shell.js', '/src/features/portal-static.js', '/src/features/static-language.js', '/src/features/header-tools.js', '/src/features/footer-social.js', '/src/features/home-density.js', '/src/features/home-now.js', '/src/features/earth-observation.js', '/src/features/estofex-local.js', '/src/features/weather-stories.js', '/src/features/monthly-summaries.js', '/src/features/forecast-verification.js', '/src/features/forecast-videos.js', '/src/features/data-center.js', '/src/features/environment.js', '/src/features/climate-page.js', '/src/features/meteo-ai.js', '/src/features/long-range.js', '/src/features/seasonal-outlook.js', '/src/features/learning.js', '/src/features/seo.js', '/src/features/night-sky-viewer.js',
  '/src/modules/alert-history.js', '/src/modules/astronomia.js', '/src/modules/avisos.js', '/src/modules/chart-loader.js', '/src/modules/confort.js',
  '/src/modules/contacte.js', '/src/modules/estacio.js', '/src/modules/extrems.js',
  '/src/modules/grafiques.js', '/src/modules/historics.js', '/src/modules/models.js', '/src/features/station-records.js',
  '/src/modules/navigation.js', '/src/modules/prediccio.js', '/src/modules/qualitat.js',
  '/src/modules/radar.js', '/src/modules/hydrology.js', '/src/modules/civil-protection.js', '/src/modules/resum.js', '/src/modules/situacio.js', '/src/modules/webcams.js',
  '/assets/icons/favicon-16.png', '/assets/icons/favicon-32.png', '/assets/icons/icon-192.png',
  '/assets/icons/icon-maskable-192.png',
  '/assets/icons/apple-touch-icon.png', '/assets/icons/apple-touch-icon-v21.png', '/assets/logos/observatori-symbol.svg', '/assets/logos/observatori-lockup.svg',
  '/assets/fonts/dm-sans-latin.woff2', '/assets/fonts/dm-sans-latin-ext.woff2', '/assets/fonts/manrope-latin.woff2', '/assets/fonts/manrope-latin-ext.woff2',
  '/assets/images/histories/aiguat-4-octubre-2026.png', '/assets/images/histories/vent-calor-6-agost-2026.png', '/assets/images/histories/contrast-termic-14-setembre-2026.png',
  '/assets/images/resums/2026-09.png',
  '/aula/analisi-aiguat-4-octubre-2026.html', '/aula/analisi-aiguat-4-octubre-2026-solucions.html', '/css/worksheet.css', '/assets/data/aula/aiguat-fontanillas-2026-10-04.csv', '/docs/stellarium-licenses.html',
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
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }
  if (url.pathname === '/administracio.html' || url.pathname === '/src/features/admin.js') {
    event.respondWith(fetch(event.request, { cache:'no-store' }));
    return;
  }
  event.respondWith(networkFirst(event.request, CACHE));
});
