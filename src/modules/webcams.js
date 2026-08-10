import { CONFIG } from '../core/config.js';

export function initWebcam() {
  document.querySelectorAll('#webcam-image, #hero-webcam-image').forEach(image => {
    image.addEventListener('error', () => {
      if (!image.src.startsWith(CONFIG.fallbackWebcam)) image.src = CONFIG.fallbackWebcam;
    });
  });
}
