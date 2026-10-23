export const PORTAL_PAGES = Object.freeze([
  'inici','meteo-ia','estacio','prediccio','llarg-termini','videos','verificacio','cel','avisos','radar','webcams','terra','histories','resums','centre-dades','medi-ambient','canvi-climatic','aprendre','observatori','contacte'
]);

const PAGE_SET = new Set(PORTAL_PAGES);

export function portalPageFromLocation(locationLike = globalThis.location) {
  const requested = new URLSearchParams(locationLike?.search || '').get('page');
  if (PAGE_SET.has(requested)) return requested;
  const pathname = String(locationLike?.pathname || '/').replace(/\/+$/, '') || '/';
  if (pathname === '/' || pathname === '/index.html') return 'inici';
  if(pathname.startsWith('/histories/'))return 'histories';
  if(pathname.startsWith('/resums/'))return 'resums';
  const page = decodeURIComponent(pathname.slice(1));
  return PAGE_SET.has(page) ? page : 'inici';
}

export function portalPageHref(page = 'inici', locationLike = globalThis.location) {
  const selected = PAGE_SET.has(page) ? page : 'inici';
  const params = new URLSearchParams(locationLike?.search || '');
  params.delete('page');
  const query = params.toString();
  const pathname = selected === 'inici' ? '/' : `/${selected}`;
  return `${pathname}${query ? `?${query}` : ''}`;
}

export function canonicalizeLegacyPortalUrl(page, locationLike = globalThis.location) {
  const params = new URLSearchParams(locationLike?.search || '');
  if (!params.has('page')) return false;
  const next = portalPageHref(page, locationLike) + (locationLike?.hash || '');
  globalThis.history?.replaceState?.({ portalPage:page }, '', next);
  return true;
}
