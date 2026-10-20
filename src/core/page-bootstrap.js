(() => {
  const pages = new Set(['inici','meteo-ia','estacio','prediccio','llarg-termini','videos','verificacio','cel','avisos','radar','webcams','terra','histories','centre-dades','medi-ambient','aprendre','contacte']);
  const legacy = new URLSearchParams(location.search).get('page');
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const pathPage = pathname === '/' || pathname === '/index.html' ? 'inici' : decodeURIComponent(pathname.slice(1));
  const requested = legacy || pathPage;
  document.documentElement.dataset.portalPage = pages.has(requested) ? requested : 'inici';
})();
