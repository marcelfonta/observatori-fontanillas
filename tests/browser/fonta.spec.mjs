import {test,expect} from '@playwright/test';
const url='https://raw.githubusercontent.com/marcelfonta/observatori-fontanillas/fonta-data/status.json';
const sample=()=>({schema:1,station:'ISANTC198',mode:'shadow',productionEnabled:false,latestCaptureAt:new Date().toISOString(),captureCount:12,pairedDays:8,evaluatedDays:0,targetDate:'2026-09-21',forecast:[{model:'icon_eu',max:27.5,min:16}],scores:{}});
const detailed=()=>{const report=sample(),at=report.latestCaptureAt;return {...report,prospective:{days:0},diagnostics:{schema:1,asOf:at,firstCaptureAt:at,execution:{event:'workflow_dispatch'},
  budget:{captureCount:12,captureLimit:180,bytes:1234567,byteLimit:104857600,reviewNeeded:false},
  progress:{trainingDays:7,trainingRequired:30,backtestDays:0,prospectiveDays:0,exploratoryRequired:14},
  sources:[{model:'icon_eu',state:'available',receivedAt:at,modelRunAt:null}],latestFailures:[],
  quality:{accepted:9,rejected:1,recent:[{date:'2026-09-19',coverage:.8,samples:240,expectedSamples:288,maxGapMinutes:65,eligible:false,reasons:['coverage','gap']}]},
  recentCaptures:[{id:'example-pm',capturedAt:at,issueState:'outside-window'}]}};};
for(const width of [360,390,1280])test(`Fonta: laboratori ${width}`,async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:900});
  await page.route(url,r=>r.fulfill({json:detailed()}));
  await page.goto('/fonta.html');
  await expect(page.getByRole('heading',{level:1})).toContainText('Fonta');
  const group=page.locator('.portal-nav-group').filter({has:page.locator('p',{hasText:'Previsió i risc'})});
  await expect(group.locator('a').last()).toHaveAttribute('data-page-link','fonta');
  await expect(page.locator('#fonta-captures')).toHaveText('—');
  await page.getByRole('button',{name:'Consultar l’arxiu actual'}).click();
  await expect(page.locator('#fonta-captures')).toHaveText('12');
  await expect(page.locator('#fonta-forecasts')).toContainText('27,5° / 16°');
  await expect(page.locator('#fonta-monitor')).toContainText('Entrenament disponible: 7 / 30 dies');
  await expect(page.locator('#fonta-prospective')).toContainText('Encara no hi ha resultats');
  await page.getByText('Qualitat dels darrers dies observats (màxim 14)',{exact:true}).click();
  await expect(page.locator('#fonta-monitor')).toContainText('buit superior a 20 min');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  if(width<700){
    await page.locator('#portal-menu-button').click();
    await expect.poll(async()=>Math.round((await page.locator('#portal-sidebar').boundingBox()).x)).toBeGreaterThanOrEqual(0);
    await page.locator('[data-page-link="fonta"]').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-page-link="fonta"]')).toBeInViewport();
    await page.screenshot({path:info.outputPath('fonta-menu.png')});await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
  await page.screenshot({path:info.outputPath('fonta-lab.png'),fullPage:true});
  expect(errors).toEqual([]);
});
test('Fonta: diagnòstic degradat, caducat, antic i connexió perduda',async({page})=>{
  await page.setViewportSize({width:390,height:900});
  let payload=detailed(),offline=false;await page.route(url,r=>offline?r.abort():r.fulfill({json:payload}));await page.goto('/fonta.html');
  payload.diagnostics.sources[0].state='missing';payload.diagnostics.budget.reviewNeeded=true;
  await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-monitor')).toHaveAttribute('data-state','review');
  await expect(page.locator('#fonta-monitor')).toContainText('migració');
  await page.getByText('Fonts i hora de recepció',{exact:true}).click();await expect(page.locator('#fonta-monitor')).toContainText('desconeguda');
  payload.latestCaptureAt='2020-01-01T00:00:00Z';await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-monitor')).toHaveAttribute('data-state','stale');
  await expect(page.locator('#fonta-forecasts')).toBeEmpty();
  payload=sample();await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-monitor')).toContainText('encara no inclou');
  await expect(page.locator('#fonta-monitor')).not.toHaveAttribute('data-state','review');
  payload=detailed();payload.prospective={days:2,max:{mae:0},min:{mae:null}};await page.locator('#fonta-refresh').click();
  await expect(page.locator('#fonta-prospective')).toContainText('MAE màxima: 0 °C · MAE mínima: — °C');
  payload.pairedProspective={schema:1,protocol:'fonta-paired-daily-v1',holdout:false,promotionAllowed:false,frozenDays:3,days:2,scores:{fonta:{max:{mae:0,bias:0,rmse:0},min:{mae:1,bias:-1,rmse:1}}}};
  await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-prospective')).toContainText('3 dies amb tots els comparadors congelats; 2 dies');
  await page.getByText('Comparadors congelats · resultats exploratoris',{exact:true}).click();
  await expect(page.locator('#fonta-prospective tbody tr').last()).toContainText('0');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  offline=true;await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-monitor')).toContainText('Diagnòstic no disponible');
  await expect(page.locator('#fonta-forecasts')).toBeEmpty();await expect(page.locator('#fonta-prospective')).toHaveText('Resultats prospectius no disponibles.');
});
test('Fonta: caducitat, absències i recuperació segura',async({page})=>{
  let payload=sample();await page.route(url,r=>r.fulfill({json:payload}));await page.goto('/fonta.html');
  payload={...payload,latestCaptureAt:'2020-01-01T00:00:00Z'};
  await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-status')).toContainText('desactualitzat');await expect(page.locator('#fonta-forecasts')).toBeEmpty();
  payload={...sample(),productionEnabled:true};await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-status')).toContainText('No s’ha pogut');await expect(page.locator('#fonta-captures')).toHaveText('—');
  payload={...sample(),evaluatedDays:14,scores:{fonta:{max:{mae:0},min:{mae:null}}}};await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-scores tbody tr').last()).toContainText('0');await expect(page.locator('#fonta-scores tbody tr').last()).toContainText('—');
});
test('Fonta: caduca amb la pàgina oberta sense noves consultes',async({page})=>{
  const payload=detailed(),now=new Date(payload.latestCaptureAt);let requests=0;
  await page.clock.install({time:now});await page.route(url,r=>{requests++;return r.fulfill({json:payload});});
  await page.goto('/fonta.html');await page.locator('#fonta-refresh').click();await expect(page.locator('#fonta-forecasts article')).toHaveCount(1);
  await page.clock.fastForward(31*3600000);await expect(page.locator('#fonta-forecasts')).toBeEmpty();
  await expect(page.locator('#fonta-monitor')).toHaveAttribute('data-state','stale');expect(requests).toBe(1);
});
