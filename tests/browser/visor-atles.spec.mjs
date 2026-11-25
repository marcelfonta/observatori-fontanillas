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
      const hourly = {time,temperature_2m:series,precipitation:series.map((_,i)=>i===1?null:i===2?0:2.5),wind_speed_10m:series,cloud_cover:series};
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
    await page.getByRole('button',{name:'Pluja i neu',exact:true}).click();
    await expect(points.first()).toHaveText('—');
    await expect(city).toBeEmpty();
    await expect(page.locator('#status')).toContainText('0/49');
    await page.click('#next');
    await expect(city).toHaveText('0 mm');
    await expect(page.locator('#status')).toContainText('0 mm a totes les mostres disponibles');
    await page.click('#next');
    await expect(city).toHaveText('2,5 mm');
    await page.selectOption('#model','native-compare');
    await expect(city).toHaveText('2,5 mm');
    await expect(page.locator('#curtain')).toBeVisible();
    await page.getByRole('button',{name:'Vent',exact:true}).click();
    await expect(city).toHaveText('3 km/h');
    await page.getByRole('button',{name:'Núvols',exact:true}).click();
    await expect(city).toHaveText('3 %');
    await page.selectOption('#model','combined');
    await page.locator('#play').click();
    await expect.poll(()=>page.locator('#hour').inputValue()).not.toBe('3');
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
  await page.getByRole('button',{name:'Pluja i neu',exact:true}).click();
  await page.check('#original-image');
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
  await page.getByRole('button',{name:'Pluja i neu',exact:true}).click();
  await page.check('#original-image');
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
  await expect(page.locator('.pressure-label')).toHaveCount(6);
  const flow=page.locator('.wind-flow').first();
  await expect(flow).toHaveCSS('animation-name','wind-travel');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(flow).toHaveCSS('animation-name','none');
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
  await expect(page.locator('#hour')).toHaveAttribute('max','26');
  await expect(page.locator('#hour')).toHaveValue('1');
  await expect(page.locator('.sample')).toHaveCount(0);
  await page.click('#next');
  await expect(page.locator('#hour')).toHaveValue('2');
  await expect(page.locator('#title')).toHaveText('Previsió de precipitació');
  await page.click('#prev');
  await expect(page.locator('#title')).toHaveText('Radar observat');
  await page.click('#prev');
  await expect(page.locator('#hour')).toHaveValue('0');
  await page.click('#mode-models');
  await expect(page.locator('#model')).toHaveValue('GFS');
  await expect(page.locator('#hour')).toHaveValue('1');
  await expect(page.locator('.sample').first()).toHaveText('9');
});

test('El floc es distingeix de la pluja i el punt conserva la coordenada del toc',async({page})=>{
  const start=Math.ceil(Date.now()/3600000)*3600000;
  const time=[0,1].map(i=>new Date(start+i*3600000).toISOString().slice(0,16));
  await page.route('https://api.open-meteo.com/**',async route=>{
    const params=new URL(route.request().url()).searchParams;
    expect(params.get('hourly')).toContain('snowfall');
    const n=params.get('latitude').split(',').length;
    await route.fulfill({json:Array.from({length:n},()=>({hourly:{time,precipitation:[2,2],snowfall:[1,0]}}))});
  });
  await page.goto('/visor/');
  await page.getByRole('button',{name:'Pluja i neu'}).click();
  await expect(page.locator('.phase-symbol').first()).toHaveText('❄');
  const map=page.locator('#map');
  const bounds=await map.boundingBox();
  const target={x:Math.round(bounds.width*.6),y:Math.round(bounds.height*.5)};
  await map.click({position:target});
  const pin=page.locator('.selected-location');
  await expect(pin).toBeVisible();
  await expect(page.locator('.leaflet-popup')).toContainText('Punt seleccionat');
  await expect(page.locator('.leaflet-popup')).toContainText('Neu prevista');
  await page.click('#next');
  await expect(page.locator('.phase-snow')).toHaveCount(0);
  await expect(page.locator('.phase-rain')).toHaveCount(49);
  await expect(page.locator('.leaflet-popup')).toContainText('Sense neu prevista');
  await page.locator('.leaflet-popup-close-button').click();
  await expect(pin).toHaveCount(0);
});

test('Malla AROME, meteograma al punt i passades verificades',async({page})=>{
  const start=Math.ceil(Date.now()/3600000)*3600000;
  const iso=ms=>new Date(ms).toISOString().slice(0,16);
  const times=Array.from({length:25},(_,i)=>iso(start+i*3600000));
  const hourly={time:times,temperature_2m:times.map(()=>12),wind_speed_10m:times.map(()=>5),precipitation:times.map((_,i)=>i===3?2:0),cloud_cover:times.map(()=>30)};
  let boxes=0,points=0;
  await page.route('https://api.open-meteo.com/**',async route=>{
    const q=new URL(route.request().url()).searchParams;
    if(q.has('bounding_box')){
      boxes++;
      const cells=Array.from({length:81},(_,i)=>({latitude:41.65+Math.floor(i/9)*.01,longitude:2.45+(i%9)*.01,hourly}));
      return route.fulfill({json:cells.reverse()});
    }
    const n=q.get('latitude').split(',').length;
    if(n===1)points++;
    return route.fulfill({json:n===1?{hourly}:Array.from({length:n},()=>({hourly}))});
  });
  await page.goto('/visor/?malla=arome&lat=41.69&lon=2.49');
  await expect(page.locator('#status')).toContainText('81/81 punts amb dades · 8/8');
  expect(boxes).toBe(1);
  await page.locator('.sample').nth(40).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Meteograma · 24 h'}).click();
  const panel=page.locator('#outlook');
  await expect(panel).toContainText('2 mm de mediana');
  await expect(panel.locator('tbody tr')).toHaveCount(24);
  await panel.locator('select[name=model]').selectOption('GFS');
  await expect(panel.locator('thead')).toContainText('GFS');
  expect(points).toBe(0);
  await expect(panel.locator('.location')).toContainText('mostra carregada del mapa');
  await panel.locator('form button').click();
  await page.locator('#map').click({position:{x:300,y:220}});
  await page.getByRole('button',{name:'Meteograma · 24 h'}).click();
  await expect.poll(()=>points).toBe(8);
  await expect(panel).toContainText('2 mm de mediana');
  await panel.locator('form button').click();
  const midnight=Date.parse(new Date().toISOString().slice(0,10)+'T00:00Z');
  const timestamps=[1,2,3].flatMap(d=>[6,12,24].flatMap(h=>Array.from({length:12},(_,i)=>(midnight+(h-d*24)*3600000)/1000-i*300)));
  await page.route('**/history?days=5&resolution=raw',route=>route.fulfill({json:timestamps.map(epoch=>({epoch,temperature:10,windSpeed:5,rainIncrement:0}))}));
  await page.route('https://single-runs-api.open-meteo.com/**',route=>{
    const params=new URL(route.request().url()).searchParams;
    expect(params.has('start_date') || params.has('end_date')).toBe(false);
    const run=Date.parse(params.get('run')+'Z');
    return route.fulfill({json:{hourly:{time:[6,12,24].map(h=>iso(run+h*3600000)),temperature_2m:[11,12,13],precipitation:[0,0,0],wind_speed_10m:[5,5,5]}}});
  });
  await page.click('#verify-station');
  const station=page.locator('#station-skill');
  await expect(station.locator('tbody tr').first()).toContainText('1 (n=3)');
  await station.locator('select').selectOption('24');
  await expect(station.locator('tbody tr').first()).toContainText('3 (n=3)');
});
