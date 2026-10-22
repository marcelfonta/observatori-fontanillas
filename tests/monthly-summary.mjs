import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {MONTHLY_SUMMARIES,monthlySummaryById} from '../src/data/monthly-summaries.js';
import {portalPageFromLocation} from '../src/core/portal-routes.js';

assert.equal(MONTHLY_SUMMARIES.length,1);
const summary=MONTHLY_SUMMARIES[0];
assert.equal(summary.id,'2026-09');
assert.equal(monthlySummaryById(summary.id),summary);
assert.equal(summary.daily.length,30);
assert.equal(new Set(summary.daily.map(day=>day[0])).size,30);
assert.deepEqual(summary.metrics,{mean:23.2,low:12.2,lowAt:'10 de setembre · 07 h',high:37.8,highAt:'6 de setembre · 12 h',rain:30.98,rainDays:4,gust:45.4,gustAt:'8 de setembre · 13 h',coverage:95.8,observations:697});
assert.equal(Number(summary.daily.reduce((total,day)=>total+day[3],0).toFixed(2)),summary.metrics.rain);
assert.ok(summary.daily.every(day=>day.length===6&&day.every(Number.isFinite)&&day[5]>0&&day[5]<=100));
assert.match(summary.quality.join(' '),/No és una normal climàtica/);
assert.equal(portalPageFromLocation({pathname:'/resums/2026-09',search:''}),'resums');

const image=await stat(new URL('../assets/images/resums/2026-09.png',import.meta.url));
assert.ok(image.size>10_000);

const [html,sitemap,redirects,roadmap,worker]=await Promise.all(
  ['index.html','sitemap.xml','_redirects','ROADMAP.md','service-worker.js']
    .map(file=>readFile(new URL(`../${file}`,import.meta.url),'utf8')),
);
assert.match(html,/id="monthly-summary"/);
assert.match(sitemap,/\/resums\/2026-09/);
assert.match(redirects,/\/resums\/\*/);
assert.match(worker,/assets\/images\/resums\/2026-09\.png/);
assert.match(roadmap,/El primer resum mensual permanent és `\/resums\/2026-09`/);
assert.doesNotMatch(roadmap,/\*\*Climatologia:\*\*/);

globalThis.location={pathname:'/resums/2026-09',search:''};
const {buildSeoStructuredGraph,seoPageUrl}=await import('../src/features/seo.js');
assert.equal(seoPageUrl('resums'),'https://meteo.fontanillas.cat/resums/2026-09');
const report=buildSeoStructuredGraph('resums')['@graph'].find(item=>item['@type']==='Report');
assert.equal(report?.headline,summary.title);
assert.match(report?.image||'',/assets\/images\/resums\/2026-09\.png$/);

console.log('Resum mensual: dades, ruta, SEO, qualitat i targeta social correctes');
