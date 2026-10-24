import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const indexPath=fileURLToPath(new URL('../../index.html',import.meta.url));

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
  await page.reload();
  await expect.poll(()=>nav.evaluate(element=>element.scrollTop)).toBeGreaterThanOrEqual(before-2);
});

test('els visors de sequera i temperatura del mar apunten a les fonts vigents',async({page})=>{
  await page.goto('/medi-ambient');
  await page.locator('#environment-tab-drought').click();
  await expect(page.locator('#environment-panel-drought iframe')).toHaveAttribute('src','https://aplicacions.aca.gencat.cat/visseq/');
  await page.locator('#environment-tab-marine').click();
  await expect(page.locator('#environment-panel-marine iframe')).toHaveAttribute('src','https://data.marine.copernicus.eu/viewer');
});

test('al mòbil el mapa del mar s’obre en pantalla completa',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/medi-ambient');
  await page.locator('#environment-tab-marine').click();
  await expect(page.locator('#environment-panel-marine .environment-viewer-mobile-launch')).toBeVisible();
  await expect(page.locator('#environment-panel-marine iframe')).not.toHaveAttribute('src',/.+/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
