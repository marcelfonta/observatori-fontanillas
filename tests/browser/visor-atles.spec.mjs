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
    const points = page.locator('.sample');
    await expect(page.locator('#status')).toContainText('25/25');
    await expect(points.first()).toHaveText('0');
    await page.locator('#model').selectOption('GFS');
    await expect(points.first()).toHaveText('10');
    await page.locator('#next').click();
    await expect(points.first()).toHaveText('11');
    await page.getByRole('button',{name:'Pluja',exact:true}).click();
    await expect(points.first()).toHaveText('—');
    await expect(page.locator('#status')).toContainText('0/25');
    await page.locator('#play').click();
    await expect.poll(()=>page.locator('#hour').inputValue()).not.toBe('1');
    await page.locator('#play').click();
    await expect(page.locator('#play')).toHaveAttribute('aria-pressed','false');
    expect(requests).toBe(8);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight && document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
}
