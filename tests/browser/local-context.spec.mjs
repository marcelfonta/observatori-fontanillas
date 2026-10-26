import {test,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const indexPath=fileURLToPath(new URL('../../index.html',import.meta.url));

test.beforeEach(async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='127.0.0.1')return route.abort();
    if(['/estacio','/aprendre','/resums/2026-09'].includes(url.pathname))return route.fulfill({path:indexPath,contentType:'text/html'});
    return route.continue();
  });
});

test('el context de l’estació no inventa una normal climàtica',async({page})=>{
  await page.goto('/estacio');
  await expect(page.locator('#station-recent-context')).toBeVisible();
  await expect(page.locator('#station-recent-value')).toHaveText('Comparació pendent');
  await expect(page.locator('#station-recent-copy')).toContainText('80%');
});

test('el resum visual conserva els dies llegibles amb teclat',async({page})=>{
  await page.goto('/resums/2026-09');
  await expect(page.locator('.monthly-summary__metrics article')).toHaveCount(4);
  await expect(page.locator('.monthly-summary__chart>div')).toHaveCount(30);
  await page.locator('.monthly-summary__chart>div').first().focus();
  await expect(page.locator('.monthly-summary__chart>div').first()).toHaveAttribute('aria-label',/Dia 1: mínima/);
});

test('les tres guies locals es llegeixen al mòbil',async({page})=>{
  await page.goto('/aprendre');
  await expect(page.locator('.learning-microclimate article')).toHaveCount(3);
  await expect(page.locator('.learning-microclimate')).toBeVisible();
  await expect(page.locator('.learning-microclimate a[href="/avisos"]')).toBeVisible();
});
