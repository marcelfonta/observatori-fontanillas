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
    await expect(page.locator('#model')).toHaveValue('combined');
    await page.locator('#model').selectOption('native-compare');
    await expect(page.locator('#curtain')).toBeVisible();
    await expect(page.locator('#legend-title')).toHaveText('Temperatura a 2 m · °C');
    const city = page.locator('.city-label').filter({hasText:'Sant Celoni'}).locator('.city-temperature');
    await expect(city).toHaveText('0 °C');
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
    await expect(city).toHaveText('11 °C');
    await page.getByRole('button',{name:'Pluja',exact:true}).click();
    await expect(points.first()).toHaveText('—');
    await expect(city).toBeEmpty();
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
  await page.locator('#model').selectOption('native-compare');
  await page.getByRole('button',{name:'Pluja',exact:true}).click();
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
  await page.locator('#model').selectOption('native-compare');
  await page.getByRole('button',{name:'Pluja',exact:true}).click();
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

test('Capes GFS segueixen el fotograma i respecten les dades absents', async ({page}) => {
  const first = Math.ceil(Date.now()/3600000)*3600000;
  const time = [0,1].map(h => new Date(first+h*3600000).toISOString().slice(0,16));
  await page.route('**/api.open-meteo.com/**',async route => {
    const params = new URL(route.request().url()).searchParams;
    const count = params.get('latitude').split(',').length;
    await route.fulfill({json:Array.from({length:count},(_,i)=>({hourly:{
      time,wind_speed_10m:[12,null],wind_direction_10m:[0,null],pressure_msl:[1001+i%7,null],
      temperature_2m:[15,16],precipitation:[0,0],cloud_cover:[40,35]
    }}))});
  });
  await page.goto('/visor/');
  await page.selectOption('#model','combined');
  await page.locator('.synoptic-tools summary').click();
  await page.check('#wind-arrows');
  await page.check('#isobars');
  await expect(page.locator('.wind-vector')).toHaveCount(49);
  await expect(page.locator('.wind-vector g').first()).toHaveAttribute('transform','rotate(180 18 18)');
  await expect(page.locator('.pressure-label')).toHaveCount(3);
  await page.click('#next');
  await expect(page.locator('.wind-vector')).toHaveCount(0);
  await expect(page.locator('.pressure-label')).toHaveCount(0);
  await expect(page.locator('#synoptic-status')).toContainText('Sense pressió');
});

test('El radar reprodueix només observacions i restaura el model i l’hora',async({page})=>{
  const start=Math.ceil(Date.now()/3600000)*3600000;
  const time=[0,1,2].map(i=>new Date(start+i*3600000).toISOString().slice(0,16));
  await page.route('https://api.open-meteo.com/**',async route=>{
    const n=new URL(route.request().url()).searchParams.get('latitude').split(',').length;
    await route.fulfill({json:Array.from({length:n},()=>({hourly:{time,temperature_2m:[8,9,10]}}))});
  });
  await page.route('**/public/weather-maps.json',route=>route.fulfill({json:{
    host:'https://tilecache.rainviewer.com',radar:{past:[{time:1700000000,path:'/v2/radar/1700000000'},{time:1700000600,path:'/v2/radar/1700000600'}],nowcast:[{time:1700001200,path:'/v2/radar/1700001200'}]}
  }}));
  await page.route('**/v2/radar/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgaHAAAAFEAMERbpc7AAAAAElFTkSuQmCC','base64')}));
  await page.goto('/visor/');
  await expect(page.locator('#status')).toContainText('49/49');
  await page.click('#mode-models');
  await page.selectOption('#model','GFS');
  await page.click('#next');
  await page.click('#mode-radar');
  await expect(page.locator('#hour')).toHaveAttribute('max','1');
  await expect(page.locator('#hour')).toHaveValue('1');
  await expect(page.locator('.sample')).toHaveCount(0);
  await page.click('#prev');
  await expect(page.locator('#hour')).toHaveValue('0');
  await page.click('#mode-models');
  await expect(page.locator('#model')).toHaveValue('GFS');
  await expect(page.locator('#hour')).toHaveValue('1');
  await expect(page.locator('.sample').first()).toHaveText('9');
});
