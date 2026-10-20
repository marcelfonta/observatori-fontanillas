import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PORTAL_PAGES, portalPageFromLocation, portalPageHref } from '../src/core/portal-routes.js';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [redirects,bootstrap,sitemap,shell,worker]=await Promise.all([
  read('_redirects'),read('src/core/page-bootstrap.js'),read('sitemap.xml'),read('src/features/portal-shell.js'),read('service-worker.js')
]);

for(const page of PORTAL_PAGES){
  const pathname=page==='inici'?'/':`/${page}`;
  assert.equal(portalPageFromLocation({pathname,search:''}),page);
  assert.equal(portalPageFromLocation({pathname:'/',search:`?page=${page}`}),page);
  assert.equal(portalPageHref(page,{search:'?lang=fr'}),`${pathname}?lang=fr`);
  if(page!=='inici')assert.match(redirects,new RegExp(`^/${page}\\s+/\\s+200$`,'m'));
}

assert.equal(portalPageHref('prediccio',{search:'?page=avisos&lang=en'}),'/prediccio?lang=en');
assert.equal(portalPageFromLocation({pathname:'/radar/',search:''}),'radar');
assert.equal(portalPageFromLocation({pathname:'/desconeguda',search:''}),'inici');
assert.match(bootstrap,/location\.pathname/);
assert.match(shell,/portalPageHref/);
assert.match(worker,/portal-routes\.js/);
for(const page of ['prediccio','radar','avisos','terra']){
  assert.ok(sitemap.includes(`https://meteo.fontanillas.cat/${page}`));
  assert.ok(sitemap.includes(`https://meteo.fontanillas.cat/${page}?lang=fr`));
}

console.log('Rutes profundes: URL neta, compatibilitat antiga, idioma, sitemap i Cloudflare verificats.');
