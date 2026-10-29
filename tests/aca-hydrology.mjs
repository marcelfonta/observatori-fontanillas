import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const root=resolve(import.meta.dirname,'..');
const [html,radar,hydrology,backend,serviceWorker,css]=await Promise.all([
  readFile(resolve(root,'index.html'),'utf8'),readFile(resolve(root,'src/modules/radar.js'),'utf8'),
  readFile(resolve(root,'src/modules/hydrology.js'),'utf8'),readFile(resolve(root,'worker/index.js'),'utf8'),
  readFile(resolve(root,'service-worker.js'),'utf8'),readFile(resolve(root,'css/portal.css'),'utf8'),
]);

for(const id of ['radar-tab-hydrology','radar-panel-hydrology','hydrology-map','hydrology-stations','hydrology-detail','hydrology-status'])if(!html.includes(`id="${id}"`))throw new Error(`Falta ${id} al visor hidrològic.`);
if(!html.includes('data-radar-mode="hydrology"')||!html.includes('https://aplicacions.aca.gencat.cat/sentilo-catalog-web/component/map'))throw new Error('Falta la pestanya o l’enllaç oficial de l’ACA.');
for(const kind of ['river','rain','reservoir'])if(!html.includes(`data-hydrology-kind="${kind}"`))throw new Error(`Falta el selector ${kind}.`);
for(const value of ['initHydrology',"mode==='hydrology'"])if(!radar.includes(value))throw new Error(`Radar: falta ${value}.`);
for(const value of ['/aca-hydrology','ACA_HYDROLOGY_STATIONS','CALC001210','082021-001-ANA002','public, max-age=300','encara no revisades ni validades'])if(!backend.includes(value))throw new Error(`Worker ACA: falta ${value}.`);
for(const value of ['PLUVIOMETREACA-EST','EMBASSAMENT-EST','082021-001-ANA001','CALC000152','CALC000168','mm/h','hm³'])if(!backend.includes(value))throw new Error(`Worker ACA: falta ${value}.`);
for(const value of ['CONFIG.apiUrl','/aca-hydrology','trend(series)','invalidateSize','Dades hidrològiques no disponibles'])if(!hydrology.includes(value))throw new Error(`Frontend ACA: falta ${value}.`);
if(!serviceWorker.includes("'/src/modules/hydrology.js'"))throw new Error('La PWA no inclou el mòdul hidrològic.');
if(!css.includes('.hydrology-layout')||!css.includes('#hydrology-map'))throw new Error('Falten els estils del visor hidrològic.');

const originalFetch=globalThis.fetch;
try {
  let stale=false;
  globalThis.fetch=async url=>{
    const path=String(url);
    if(path.includes('080826-002-ANA010'))return new Response('error',{status:503});
    const value=path.includes('CALC000145')?'90':path.includes('CALC000158')?'120':path.includes('EMBASSAMENT')?'65':path.includes('PLUVIOMETREACA')?'1.5':'12';
    const age=stale?7*60*60_000:30_000;
    return Response.json({observations:[{value,time:Date.now()-age-30_000},{value,time:Date.now()-age}]});
  };
  const rain=await worker.fetch(new Request('https://fonta-meteo.example/aca-hydrology?kind=rain'),{},{});
  assert.equal(rain.status,200);
  const rainData=await rain.json();
  assert.equal(rainData.kind,'rain');
  assert.equal(rainData.stations.length,4);
  assert.equal(rainData.stations.find(station=>station.id==='rain-sant-celoni').primary.unit,'mm/h');
  assert.equal(rainData.stations.find(station=>station.id==='rain-fogars').primary.current,null);
  const reservoirs=await worker.fetch(new Request('https://fonta-meteo.example/aca-hydrology?kind=reservoir'),{},{});
  const reservoirData=await reservoirs.json();
  assert.equal(reservoirData.stations.find(station=>station.id==='sau').primary.unit,'%');
  assert.equal(reservoirData.stations.find(station=>station.id==='sau').secondary.unit,'hm³');
  assert.equal(reservoirData.stations.find(station=>station.id==='sau').secondary.current,90);
  const rivers=await worker.fetch(new Request('https://fonta-meteo.example/aca-hydrology'),{},{});
  assert.equal((await rivers.json()).stations.length,2);
  stale=true;
  const staleRain=await worker.fetch(new Request('https://fonta-meteo.example/aca-hydrology?kind=rain'),{},{});
  assert.equal(staleRain.status,502);
} finally {globalThis.fetch=originalFetch;}

console.log('Integració ACA: correcta');
