import {test,expect} from '@playwright/test';
const url='https://raw.githubusercontent.com/marcelfonta/observatori-fontanillas/fonta-data/status.json';
const sample=()=>({schema:1,station:'ISANTC198',mode:'shadow',productionEnabled:false,latestCaptureAt:new Date().toISOString(),captureCount:12,pairedDays:8,evaluatedDays:0,targetDate:'2026-09-21',forecast:[{model:'icon_eu',max:27.5,min:16}],scores:{}});
for(const width of [360,390,1280])test(`Fonta: laboratori ${width}`,async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:900});
  await page.route(url,r=>r.fulfill({json:sample()}));
  await page.goto('/fonta.html');
  await expect(page.getByRole('heading',{level:1})).toContainText('Fonta');
  await expect(page.locator('#fonta-captures')).toHaveText('—');
  await page.getByRole('button',{name:'Consultar l’arxiu actual'}).click();
  await expect(page.locator('#fonta-captures')).toHaveText('12');
  await expect(page.locator('#fonta-forecasts')).toContainText('27,5° / 16°');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if(width<700){await page.locator('#portal-menu-button').click();await expect(page.locator('[data-page-link="fonta"]')).toBeVisible();await page.keyboard.press('Escape');}
  await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
  await page.screenshot({path:info.outputPath('fonta-lab.png'),fullPage:true});
  expect(errors).toEqual([]);
});
test('Fonta: caducitat, absències i recuperació segura',async({page})=>{
  let payload=sample();await page.route(url,r=>r.fulfill({json:payload}));await page.goto('/fonta.html');
  payload={...payload,latestCaptureAt:'2020-01-01T00:00:00Z'};
  await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-status')).toContainText('desactualitzat');await expect(page.locator('#fonta-forecasts')).toBeEmpty();
  payload={...sample(),productionEnabled:true};await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-status')).toContainText('No s’ha pogut');await expect(page.locator('#fonta-captures')).toHaveText('—');
  payload={...sample(),evaluatedDays:14,scores:{fonta:{max:{mae:0},min:{mae:null}}}};await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-scores tbody tr').last()).toContainText('0');await expect(page.locator('#fonta-scores tbody tr').last()).toContainText('—');
});
