import { loadAlertHistory } from '../modules/alert-history.js';

async function bootAlertHistory() {
  try {
    await loadAlertHistory();
  } catch (error) {
    console.warn('No s\'ha pogut inicialitzar l\'historial d\'avisos.', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootAlertHistory, { once: true });
} else {
  bootAlertHistory();
}
