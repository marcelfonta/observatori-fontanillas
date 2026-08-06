import { initShare } from './share.js';

function bootShare() {
  try {
    initShare();
  } catch (error) {
    console.warn('No s\'ha pogut inicialitzar Compartir.', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootShare, { once: true });
} else {
  bootShare();
}
