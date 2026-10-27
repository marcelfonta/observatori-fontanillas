import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { presentClimateCo2 } from '../src/features/climate-page.js';
import { seoPageUrl } from '../src/features/seo.js';
import { routeSeo } from '../functions/_middleware.js';

const now = new Date('2026-10-23T12:00:00Z');
const fresh = { co2:{ ppm:426.46, date:'2026-10-22', yearChangePpm:1.47, fresh:true } };
assert.match(presentClimateCo2(fresh, now).value, /426,46 ppm/);
assert.match(presentClimateCo2(fresh, now).detail, /Mauna Loa.*provisional/);
assert.equal(presentClimateCo2({co2:{...fresh.co2,date:'2026-10-18'}}, now), null);
assert.equal(presentClimateCo2({co2:{...fresh.co2,fresh:false}}, now), null);
assert.equal(presentClimateCo2({co2:{...fresh.co2,ppm:999}}, now), null);
assert.equal(presentClimateCo2({co2:{...fresh.co2,date:'bad'}}, now), null);

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert.match(html,/id="canvi-climatic"[^>]*data-portal-page="canvi-climatic"/);
assert.match(html,/id="climate-trend"/);
assert.match(html,/co2-annual-mlo\.svg/);
const annual=await readFile(new URL('../assets/data/climate/co2-annual-mlo.csv',import.meta.url),'utf8');
const rows=annual.trim().split('\n');
assert.equal(rows.length,68);
assert.equal(rows[1],'1959,315.98');
assert.equal(rows.at(-1),'2025,427.35');
assert.equal(seoPageUrl('canvi-climatic','en'),'https://meteo.fontanillas.cat/canvi-climatic?lang=en');
assert.equal(routeSeo('canvi-climatic','en').lang,'en');
assert.doesNotMatch(html,/id="guia-terratremols"/);
assert.match(html,/id="environment-panel-earthquakes"/);
console.log('Canvi climàtic: ruta, contingut i CO₂ recent verificats');
