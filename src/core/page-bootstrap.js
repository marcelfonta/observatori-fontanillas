(() => {
  const pages = new Set(['inici','meteo-ia','estacio','prediccio','llarg-termini','videos','verificacio','cel','avisos','radar','webcams','centre-dades','medi-ambient','aprendre','contacte']);
  const requested = new URLSearchParams(location.search).get('page') || 'inici';
  document.documentElement.dataset.portalPage = pages.has(requested) ? requested : 'inici';
})();
