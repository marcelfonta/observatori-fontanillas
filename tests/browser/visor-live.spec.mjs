import { test, expect } from '@playwright/test';

import { readFileSync } from 'node:fs';

function requestedPreview(){
  if(process.env.VISOR_PREVIEW_URL)return process.env.VISOR_PREVIEW_URL;
  if(process.env.GITHUB_EVENT_NAME!=='pull_request')return;
  const {pull_request:pr}=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  return pr?.body?.match(/^Previsualització per a la prova pública: (https:\/\/[a-z0-9-]+\.visor-fontanillas\.pages\.dev)\s*$/m)?.[1];
}
const preview=requestedPreview();
test('Comprovació pública del visor amb fonts reals', async ({page}, info) => {
  test.skip(!preview, 'Indica el desplegament amb VISOR_PREVIEW_URL');
  test.setTimeout(420000);
  const problems = [];
  page.on('pageerror', error => problems.push(error.message));
  page.on('response', async response => {
    if (response.status() >= 400) {
      const url = new URL(response.url());
      if (/open-meteo|rainviewer|workers\.dev/.test(url.hostname))
        console.log('Font', url.hostname, url.pathname, url.searchParams.get('models') || '', response.status(), (await response.json().catch(()=>null))?.reason || '');
    }
  });
  await page.setViewportSize({width:1280,height:800});
  const response = await page.goto(new URL('/?malla=arome&lat=41.69&lon=2.49', preview).href, {waitUntil:'domcontentloaded'});
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#status')).toContainText('81/81', {timeout:165000});
  await page.selectOption('#model','AROME HD');
  await expect(page.locator('#status')).toContainText('81/81', {timeout:165000});
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
  for(const lead of ['12','24']){
    await page.selectOption('#station-skill select',lead);
    await expect(page.locator('#station-skill tbody')).toContainText('(n=');
  }
  console.log('Verificació a 24 h', await page.locator('#station-skill tbody').innerText());
  await info.attach('Verificació real en mòbil', {body:await page.screenshot(),contentType:'image/png'});
  expect(problems).toEqual([]);
});
