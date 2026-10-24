import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const indexPath=fileURLToPath(new URL('../../index.html',import.meta.url));
const openEnvironment=async page=>{
  await page.goto('/medi-ambient');
  await page.locator('#environment-tab-drought').scrollIntoViewIfNeeded();
  await expect(page.locator('#environment-panel-fire img')).toHaveAttribute('src',/pla_alfa\.gif/,{timeout:15000});
};

test.beforeEach(async({page})=>{
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='127.0.0.1')return route.abort();
    if(['/histories/aiguat-4-octubre-2026','/medi-ambient'].includes(url.pathname))return route.fulfill({path:indexPath,contentType:'text/html'});
    return route.continue();
  });
});

test('una història editorial carrega els scripts des de la ruta profunda',async({page})=>{
  await page.goto('/histories/aiguat-4-octubre-2026');
  await expect(page.locator('#weather-story-detail h2')).toHaveText('La matinada dels 82,6 mm',{timeout:15000});
  await expect(page.locator('#weather-story-detail')).not.toContainText('Preparant la reconstrucció');
  await expect(page.locator('#weather-story-detail .weather-story__timeline time').first()).toContainText('00:05');
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
  await expect(page.locator('#environment-panel-drought')).toContainText('El mapa interactiu de l’ACA pot estar temporalment en manteniment');
  await expect(page.locator('#environment-panel-drought a[href="https://aca.gencat.cat/ca/laigua/portal-sequera/estat-actual/"]')).toBeVisible();
  await expect(page.locator('#environment-panel-drought iframe')).toHaveCount(0);
  await page.locator('#environment-tab-marine').click();
  await expect(page.locator('#environment-panel-marine iframe')).toHaveAttribute('src','https://data.marine.copernicus.eu/viewer');
});

test('al mòbil el mapa del mar s’obre en pantalla completa',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await openEnvironment(page);
  await page.locator('#environment-tab-marine').click();
  await expect(page.locator('#environment-panel-marine .environment-viewer-mobile-launch')).toBeVisible();
  await expect(page.locator('#environment-panel-marine iframe')).not.toHaveAttribute('src',/.+/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
