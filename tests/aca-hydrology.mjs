import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const [html,radar,hydrology,backend,serviceWorker,css]=await Promise.all([
  readFile(resolve(root,'index.html'),'utf8'),readFile(resolve(root,'src/modules/radar.js'),'utf8'),
  readFile(resolve(root,'src/modules/hydrology.js'),'utf8'),readFile(resolve(root,'worker/index.js'),'utf8'),
  readFile(resolve(root,'service-worker.js'),'utf8'),readFile(resolve(root,'css/portal.css'),'utf8'),
]);

for(const id of ['radar-tab-hydrology','radar-panel-hydrology','hydrology-map','hydrology-stations','hydrology-detail','hydrology-status'])if(!html.includes(`id="${id}"`))throw new Error(`Falta ${id} al visor hidrològic.`);
if(!html.includes('data-radar-mode="hydrology"')||!html.includes('https://aplicacions.aca.gencat.cat/aetr/vishid/'))throw new Error('Falta la pestanya o l’enllaç oficial de l’ACA.');
for(const value of ['initHydrology',"mode==='hydrology'"])if(!radar.includes(value))throw new Error(`Radar: falta ${value}.`);
for(const value of ['/aca-hydrology','ACA_HYDROLOGY_STATIONS','CALC001210','082021-001-ANA002','public, max-age=300','encara no revisades ni validades'])if(!backend.includes(value))throw new Error(`Worker ACA: falta ${value}.`);
for(const value of ['CONFIG.apiUrl','/aca-hydrology','trend(series)','invalidateSize','Dades hidrològiques no disponibles'])if(!hydrology.includes(value))throw new Error(`Frontend ACA: falta ${value}.`);
if(!serviceWorker.includes("'/src/modules/hydrology.js'"))throw new Error('La PWA no inclou el mòdul hidrològic.');
if(!css.includes('.hydrology-layout')||!css.includes('#hydrology-map'))throw new Error('Falten els estils del visor hidrològic.');

console.log('Integració ACA: correcta');
