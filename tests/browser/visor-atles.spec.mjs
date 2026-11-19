import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test('Mapa animat, model i variable a '+width+' px', async ({page}) => {
    await page.setViewportSize({width,height:800});
    const first = Math.ceil(Date.now()/3600000)*3600000;
    const time = Array.from({length:26},(_,i)=>new Date(first+i*3600000).toISOString().slice(0,16));
    let requests=0;
    await page.route('https://api.open-meteo.com/**', async route=>{
      requests++;
      const url = new URL(route.request().url());
      const count = url.searchParams.get('latitude').split(',').length;
      const series = Array.from({length:time.length},(_,i)=>i+(url.pathname.endsWith('/gfs')?10:0));
      const hourly = {time,temperature_2m:series,precipitation:series.map(()=>null),wind_speed_10m:series,cloud_cover:series};
      await route.fulfill({json:Array.from({length:count},()=>({hourly}))});
    });
    await page.goto('/visor/');
    await expect(page.locator('#model')).toHaveValue('native-compare');
    await page.locator('#model').selectOption('combined');
    const points = page.locator('.sample');
    await expect(page.locator('#status')).toContainText('49/49');
    await expect(points.first()).toHaveText('0');
    await page.locator('#model').selectOption('agreement');
    await expect(points.first()).toHaveText('10');
    await page.locator('#model').selectOption('GFS');
    await expect(points.first()).toHaveText('10');
    await page.locator('#next').click();
    await expect(points.first()).toHaveText('11');
    await page.getByRole('button',{name:'Pluja',exact:true}).click();
    await expect(points.first()).toHaveText('—');
    await expect(page.locator('#status')).toContainText('0/49');
    await page.locator('#play').click();
    await expect.poll(()=>page.locator('#hour').inputValue()).not.toBe('1');
    await page.locator('#play').click();
    await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');
    expect(requests).toBe(8);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight && document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}

test('Un camp regional absent mostra la fallada i conserva l’hora en comparar',async({page})=>{
  await page.route('**/meteofrance/map?**',route=>route.fulfill({status:502,body:'Unavailable'}));
  await page.goto('/visor/');
  await expect(page.locator('#status')).toContainText('Capa no disponible');
  await expect(page.locator('#retry')).toBeVisible();
  await page.locator('#next').click();
  await expect(page.locator('#hour')).toHaveValue('1');
  await page.locator('#model').selectOption('native-arpege');
  await expect(page.locator('#hour')).toHaveValue('1');
  await expect(page.locator('#status')).toContainText('Capa no disponible');
});

test('Cortina sincronitzada i canvi atòmic de fotograma',async({page})=>{
  let release;
  const delay=new Promise(resolve=>{release=resolve;});
  const seen=[];
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgaHAAAAFEAMERbpc7AAAAAElFTkSuQmCC','base64');
  await page.route('**/meteofrance/map?**',async route=>{
    const params=new URL(route.request().url()).searchParams;
    seen.push([params.get('model'),params.get('time')]);
    if(seen.length>2)await delay;
    await route.fulfill({contentType:'image/png',body:png});
  });
  await page.goto('/visor/');
  const curtain=page.locator('#curtain'),clock=page.locator('#frame-time');
  await expect(curtain).toBeVisible();
  const before=await clock.innerText();
  expect(seen.slice(0,2).map(item=>item[0]).sort()).toEqual(['arome','arpege']);
  expect(seen[0][1]).toBe(seen[1][1]);
  await page.locator('#divider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#divider')).toHaveValue('51');
  await page.locator('#next').click();
  await expect(clock).toHaveText(before);
  release();
  await expect(clock).not.toHaveText(before);
  await page.locator('#model').selectOption('native-arome');
  await expect(curtain).toBeHidden();
});
