import assert from 'node:assert/strict';
import { portalPageFromPath, routeSeo } from '../functions/_middleware.js';

assert.equal(portalPageFromPath('/'),'inici');
assert.equal(portalPageFromPath('/index.html'),'inici');
assert.equal(portalPageFromPath('/prediccio/'),'prediccio');
assert.equal(portalPageFromPath('/models'),null,'La pàgina especialitzada de models no ha de passar pel shell del portal.');
assert.equal(portalPageFromPath('/desconegut'),null);

const expected={
  prediccio:'Predicció del temps a Sant Celoni',
  avisos:'Avisos meteorològics per a Sant Celoni',
  radar:'Radar meteorològic i llamps a Catalunya',
  terra:'Observació de la Terra · NASA, ESA i EUMETSAT'
};

for(const [page,title] of Object.entries(expected)){
  const meta=routeSeo(page,'ca');
  assert.ok(meta.title.startsWith(title),`${page} ha de conservar un títol específic i descriptiu.`);
  assert.equal(meta.url,`https://meteo.fontanillas.cat/${page}`);
  assert.equal(meta.schema['@graph'].find(item=>item['@type']==='WebPage').url,meta.url);
  assert.equal(meta.schema['@graph'].find(item=>item['@type']==='BreadcrumbList').itemListElement.length,2);
}

const french=routeSeo('radar','fr');
assert.equal(french.lang,'fr');
assert.equal(french.locale,'fr_FR');
assert.equal(french.url,'https://meteo.fontanillas.cat/radar?lang=fr');
assert.match(french.title,/Radar météo/);

const fallback=routeSeo('desconegut','xx');
assert.equal(fallback.page,'inici');
assert.equal(fallback.lang,'ca');

console.log('✓ metadades de servidor pròpies per ruta');
