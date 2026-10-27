import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const indexPath=fileURLToPath(new URL('../../index.html',import.meta.url));
const openEnvironment=async page=>{
  await page.goto('/medi-ambient');
  await expect(page.locator('html')).toHaveAttribute('data-environment-viewers-ready','true',{timeout:15000});
  await page.locator('[data-environment-topic="water"]').click();
  await page.locator('#environment-tab-drought').scrollIntoViewIfNeeded();
};

test.beforeEach(async({page})=>{
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='127.0.0.1')return route.abort();
    if(['/histories/aiguat-4-octubre-2026','/resums/2026-09','/medi-ambient'].includes(url.pathname))return route.fulfill({path:indexPath,contentType:'text/html'});
    return route.continue();
  });
});

test('l’atles ambiental canvia de tema i conserva els enllaços directes',async({page})=>{
  await page.goto('/medi-ambient');
  await expect(page.locator('html')).toHaveAttribute('data-environment-viewers-ready','true',{timeout:15000});
  await page.locator('[data-environment-topic="air"]').click();
  await expect(page.locator('#environment-tab-air')).toBeVisible();
  await expect(page.locator('#environment-tab-fire')).toBeHidden();
  await page.locator('.environment-atlas-sources summary').click();
  await expect(page.getByText('Pol·len i espores',{exact:true})).toBeVisible();
  await expect(page.getByText('Coberta arbòria',{exact:true})).toBeHidden();
  await page.locator('[data-environment-topic="forest"]').click();
  await expect(page.getByText('Coberta arbòria',{exact:true})).toBeVisible();
  await page.locator('[data-environment-topic="water"]').click();
  await expect(page.locator('#environment-tab-drought')).toBeVisible();
  await expect(page.locator('#environment-panel-drought')).toContainText('manteniment');
});

test('l’atles manté els textos traduïts i els temes accessibles al mòbil',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/medi-ambient');
  await expect(page.locator('html')).toHaveAttribute('data-environment-viewers-ready','true',{timeout:15000});
  const selector=page.locator('#header-language-select');
  for(const [language,label,period] of [['es','Aire y salud','6 meses'],['en','Air and health','6 months'],['fr','Air et santé','6 mois']]){
    await selector.selectOption(language);
    await expect(page.locator('[data-environment-topic="air"]')).toHaveText(label);
    await expect(page.locator('[data-drought-period="6"]')).toHaveText(period);
  }
  await page.locator('[data-environment-topic="water"]').click();
  await expect(page.locator('.environment-drought-map')).toBeVisible();
  await page.locator('[data-environment-topic="sea"]').click();
  await expect(page.locator('#environment-tab-marine')).toBeVisible();
  const width=await page.locator('.environment-viewers').evaluate(node=>node.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(390);
});

test('una història editorial carrega els scripts des de la ruta profunda',async({page})=>{
  await page.route('**/camera/nord/timelapses/2026-10-04.mp4',route=>route.fulfill({status:404,json:{error:'Vídeo no disponible'}}));
  await page.goto('/histories/aiguat-4-octubre-2026');
  await expect(page.locator('#weather-story-detail h2')).toHaveText('La matinada dels 82,6 mm',{timeout:15000});
  await expect(page.locator('#weather-story-detail')).not.toContainText('Preparant la reconstrucció');
  await expect(page.locator('#weather-story-detail .weather-story__timeline time').first()).toContainText('00:05');
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(400);
  await expect(page.locator('[data-story-video]')).toBeHidden();
  await expect(page.locator('[data-story-video-status]')).toContainText('no disposa de timelapse publicat');
});

test('un resum permanent s’obre amb les dades visibles',async({page})=>{
  await page.goto('/resums/2026-09');
  await expect(page.locator('#monthly-summary .monthly-summary__hero h2')).toBeVisible({timeout:15000});
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(100);
});

test('la primera lectura mòbil manté metadades llegibles sense desbordament',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const fontSize=await page.locator('.home-now-card>footer span').first().evaluate(element=>parseFloat(getComputedStyle(element).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(12);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('el menú lateral conserva la posició després de canviar de pàgina',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/medi-ambient');
  const nav=page.locator('#portal-sidebar > nav');
  await nav.evaluate(element=>{element.scrollTop=element.scrollHeight;});
  await expect.poll(()=>nav.evaluate(element=>element.scrollTop)).toBeGreaterThan(100);
  const before=await nav.evaluate(element=>element.scrollTop);
  await expect.poll(()=>page.evaluate(()=>Number(sessionStorage.getItem('fontanillas:sidebar-scroll')))).toBeGreaterThanOrEqual(before-2);
  await page.reload();
  await expect.poll(()=>nav.evaluate(element=>element.scrollTop)).toBeGreaterThanOrEqual(before-2);
});

test('la sequera ofereix alternatives oficials i el mapa marí apunta a Copernicus',async({page})=>{
  await openEnvironment(page);
  await page.locator('#environment-tab-drought').click();
  await expect(page.locator('#environment-panel-drought')).toContainText('el visor de l’ACA era en manteniment');
  await expect(page.locator('#environment-panel-drought a[href="https://aca.gencat.cat/ca/laigua/portal-sequera/estat-actual/"]')).toBeVisible();
  await expect(page.locator('#environment-panel-drought iframe')).toHaveCount(0);
  await expect(page.locator('#environment-drought-image')).toHaveAttribute('src',/IPE6_1km_20260930_w\.png/);
  await page.locator('[data-drought-period="12"]').click();
  await expect(page.locator('#environment-drought-image')).toHaveAttribute('src',/IPE12_1km_20260930_w\.png/);
  await expect(page.locator('[data-drought-period="12"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('[data-environment-topic="sea"]').click();
  await page.locator('#environment-tab-marine').click();
  await expect(page.locator('#environment-panel-marine iframe')).toHaveAttribute('src','https://data.marine.copernicus.eu/viewer');
  await expect(page.locator('#environment-panel-marine .environment-marine-options a[href="https://data.marine.copernicus.eu/viewer"]')).toBeVisible();
  await expect(page.locator('#environment-panel-marine a[href="https://portus.puertos.es/?locale=es"]')).toBeVisible();
  await expect(page.locator('#environment-panel-marine')).toContainText('mesurada per boies');
});

test('al mòbil el mapa del mar s’obre en pantalla completa',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openEnvironment(page);
  await page.locator('[data-environment-topic="sea"]').click();
  await page.locator('#environment-tab-marine').click();
  await expect(page.locator('#environment-panel-marine .environment-viewer-mobile-launch')).toBeVisible();
  await expect(page.locator('#environment-panel-marine iframe')).not.toHaveAttribute('src',/.+/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('la fitxa ambiental mostra l’ICQA i les targetes de l’estació de Sant Celoni',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  const updated=`${parts.day}/${parts.month}/${parts.year} ${parts.hour}:00`;
  const contaminant=(abbr,valor,qualitat='bona')=>({abbr,dadesHoraries:[{hora:parts.hour,qualitat,valor}]});
  await page.route('**/territori/quaire/json/estat.json',route=>route.fulfill({json:{features:[{id:'ES1275A',properties:{localitat:'Sant Celoni',dataActualitzacio:updated,contaminants:[contaminant('NO2','26'),contaminant('O3','16','regular'),contaminant('PM10','17'),contaminant('PM2.5','8'),contaminant('SO2','3'),contaminant('H2S','1,2')]}}]}}));
  await page.goto('/medi-ambient');
  await expect(page.locator('#environment-no2')).toHaveText('26');
  await expect(page.locator('#environment-h2s')).toHaveText('1,2');
  await expect(page.locator('#environment-aqi')).toHaveText('Regular');
  await expect(page.locator('#environment-o3-level')).toHaveText('Regular');
  await expect(page.locator('#environment-official-status')).toContainText(updated);
  await expect(page.locator('.environment-model-source')).toContainText('Dades provisionals');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('la portada diferencia absència d’avisos de consulta fallida',async({page})=>{
  await page.route('**/alerts?**',route=>route.fulfill({json:{ok:true,alerts:[],checkedAt:new Date().toISOString()}}));
  await page.goto('/');
  await expect(page.locator('#quick-alert-title')).toHaveText('Sense avisos oficials actius ara');
  await page.evaluate(async()=>{const {renderAlertsUnavailable}=await import('/src/modules/avisos.js');renderAlertsUnavailable();});
  await expect(page.locator('#quick-alert-title')).toHaveText('Verificació no disponible');
});

test('el mapa d’estacions d’aire té font i alternativa oficial',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/src/features/environment.js',async route=>{
    await new Promise(resolve=>setTimeout(resolve,600));
    await route.continue();
  });
  await page.goto('/medi-ambient',{waitUntil:'domcontentloaded'});
  const tab=page.locator('#environment-tab-air');
  await tab.scrollIntoViewIfNeeded();
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page.locator('html')).toHaveAttribute('data-pending-environment-viewer','air');
  await expect(page.locator('#environment-panel-air')).toBeVisible();
  await expect(page.locator('#environment-air-stations-filter')).toHaveValue('all');
  await expect(page.locator('#environment-panel-air a')).toHaveAttribute('href',/visor-de-dades/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
