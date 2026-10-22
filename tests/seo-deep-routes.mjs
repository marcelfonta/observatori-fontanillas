import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {onRequest,portalRouteFromPath,routeSeo} from '../functions/_middleware.js';

const storyRoute=portalRouteFromPath('/histories/aiguat-4-octubre-2026');
assert.deepEqual(storyRoute,{page:'histories',storyId:'aiguat-4-octubre-2026'});
const story=routeSeo('histories','ca',storyRoute);
assert.match(story.title,/82,6 mm/);
assert.equal(story.url,'https://meteo.fontanillas.cat/histories/aiguat-4-octubre-2026');
assert.match(story.image,/assets\/images\/histories\/aiguat-4-octubre-2026\.png$/);
assert.equal(story.type,'article');
assert.ok(story.schema['@graph'].some(item=>item['@type']==='Article'));
assert.equal(story.schema['@graph'].find(item=>item['@type']==='WebPage').url,story.url);

const summaryRoute=portalRouteFromPath('/resums/2026-09');
assert.deepEqual(summaryRoute,{page:'resums',summaryId:'2026-09'});
const summary=routeSeo('resums','ca',summaryRoute);
assert.equal(summary.url,'https://meteo.fontanillas.cat/resums/2026-09');
assert.match(summary.image,/assets\/images\/resums\/2026-09\.png$/);
assert.ok(summary.schema['@graph'].some(item=>item['@type']==='Report'));

assert.equal(portalRouteFromPath('/histories/no-existeix'),null);
assert.equal(portalRouteFromPath('/resums/1900-01'),null);
let continued=false;
const missing=await onRequest({request:new Request('https://meteo.fontanillas.cat/resums/1900-01',{headers:{Accept:'text/html'}}),next:()=>{continued=true;}});
assert.equal(missing.status,404);
assert.equal(missing.headers.get('X-Robots-Tag'),'noindex');
assert.equal(continued,false);

const worker=await readFile(new URL('../_worker.js',import.meta.url),'utf8');
assert.match(worker,/env\.ASSETS\.fetch\(request\)/);
assert.match(worker,/onRequest/);
assert.match(worker,/\/api\/records/);
assert.match(worker,/\/api\/history/);

console.log('SEO profund: HTML edge, canònica, imatge, esquema i 404 verificats');
