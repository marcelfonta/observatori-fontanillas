export const CONFIG = {
  apiUrl: 'https://fonta-meteo.marcelfonta.workers.dev',
  refreshMs: 5 * 60 * 1000,
  alertsRefreshMs: 10 * 60 * 1000,
  forecastRefreshMs: 60 * 60 * 1000,
  historyCacheMs: 30 * 60 * 1000,
  locale: 'ca-ES',
  station: { latitude: 41.6906, longitude: 2.489, elevation: null },
  fallbackWebcam: 'https://www.alvar.cat/WebCam/Imatge-Camera.jpg',
  analyticsMeasurementId: '', // Ex.: G-XXXXXXXXXX
  cloudflareWebAnalyticsEnabled: true, // Activat al domini des del tauler de Cloudflare
  oneSignalAppId: '108a857e-d115-4fc9-85b4-0a84fb0936f4',
  social: {
    instagram: 'https://www.instagram.com/meteo_fontanillas/',
    facebook: 'https://www.facebook.com/meteofontanillas',
    bluesky: 'https://bsky.app/profile/meteofontanillas.bsky.social',
    telegram: 'https://t.me/meteofontanillas',
    threads: 'https://www.threads.com/@meteo_fontanillas',
    tiktok: 'https://www.tiktok.com/@meteo_fontanillas',
    whatsapp: 'https://whatsapp.com/channel/0029VbD9jmL4CrfajJnZIi25',
    youtube: 'https://www.youtube.com/@MeteoFontanillas'
  },
  googleSiteVerification: '', // Valor del meta-tag, només si es verifica per prefix d’URL
  searchConsoleVerified: true, // Propietat de domini verificada per DNS el 2026-08-10
  searchConsoleSitemapSubmitted: true, // Sitemap processat correctament: 13 URL descobertes
  pushPreferencesKey: 'fontanillas-alert-preferences-v1',
  foregroundRefreshMinMs: 30 * 1000
};
