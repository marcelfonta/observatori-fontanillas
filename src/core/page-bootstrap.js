(() => {
  const pages = new Set(['inici','meteo-ia','estacio','prediccio','llarg-termini','videos','verificacio','cel','avisos','radar','webcams','terra','histories','resums','centre-dades','medi-ambient','canvi-climatic','aprendre','observatori','contacte']);
  const legacy = new URLSearchParams(location.search).get('page');
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const pathPage = pathname === '/' || pathname === '/index.html' ? 'inici' : pathname.startsWith('/histories/')?'histories':pathname.startsWith('/resums/')?'resums':decodeURIComponent(pathname.slice(1));
  const requested = legacy || pathPage;
  document.documentElement.dataset.portalPage = pages.has(requested) ? requested : 'inici';
})();
