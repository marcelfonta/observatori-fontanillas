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
  oneSignalAppId: '', // Ex.: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  foregroundRefreshMinMs: 30 * 1000
};
