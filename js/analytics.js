import { CONFIG } from './config.js';

const id = String(CONFIG.analyticsMeasurementId || '').trim();
const enabled = /^G-[A-Z0-9]+$/i.test(id);

window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };

export function trackEvent(name, params = {}) {
  if (!enabled) return;
  window.gtag('event', name, params);
}
window.observatoriTrack = trackEvent;

if (enabled) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  window.gtag('js', new Date());
  window.gtag('config', id, {
    anonymize_ip: true,
    transport_type: 'beacon'
  });
}
