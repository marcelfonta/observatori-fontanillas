import { test, expect } from '@playwright/test';

const preview = process.env.VISOR_PREVIEW_URL || 'https://9f449f47.visor-fontanillas.pages.dev';
test('Comprovació pública del visor amb fonts reals', async ({page}, info) => {
  test.skip(!preview, 'Indica el desplegament amb VISOR_PREVIEW_URL');
  test.setTimeout(210000);
  const problems = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = new URL(response.url());
      if (/open-meteo|rainviewer|workers\.dev/.test(url.hostname))
        console.log('Font', url.hostname, url.pathname, response.status());
    }
  });
  await page.setViewportSize({width:1280,height:800});
  const response = await page.goto(new URL('/?malla=arome&lat=41.69&lon=2.49', preview).href, {waitUntil:'domcontentloaded'});
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#status')).toContainText('81/81', {timeout:60000});
  await page.selectOption('#model','AROME HD');
  await expect(page.locator('#status')).toContainText('81/81', {timeout:30000});
  await page.locator('.sample').nth(40).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Meteograma · 24 h'}).click();
  await expect(page.locator('#outlook section')).toContainText('mm de mediana',{timeout:30000});
  await info.attach('Meteograma real', {body:await page.screenshot(),contentType:'image/png'});
  await page.locator('#outlook form button').click();
  await page.setViewportSize({width:390,height:844});
  await page.click('#mode-radar');
  await expect(page.locator('#hour')).toHaveAttribute('max',/^(2[5-9]|[3-9]\d|\d{3})$/,{timeout:30000});
  await page.click('#next');
  await expect(page.locator('#title')).toHaveText('Previsió de precipitació');
  await page.click('#mode-consensus');
  await page.click('#verify-station');
  await expect(page.locator('#station-skill tbody')).toContainText('(n=',{timeout:100000});
  await info.attach('Verificació real en mòbil', {body:await page.screenshot(),contentType:'image/png'});
  expect(problems).toEqual([]);
});
