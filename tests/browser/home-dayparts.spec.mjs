import {test,expect} from '@playwright/test';

// Synthetic forecasts only. Block external APIs and never trigger publishers.
for(const scenario of [
  {width:1440,hour:7,count:3,name:'desktop-three'},
  {width:1440,hour:18,count:2,name:'desktop-two'},
  {width:1440,hour:21,count:1,name:'desktop-one'},
  {width:768,hour:7,count:3,name:'tablet'},
  {width:390,hour:18,count:2,name:'mobile'},
  {width:320,hour:7,count:3,name:'narrow-missing',missing:true},
]){
  test('home dayparts '+scenario.name,async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await page.clock.install({time:new Date(`2026-09-20T${String(scenario.hour-2).padStart(2,'0')}:00:00Z`)});
    await page.setViewportSize({width:scenario.width,height:1000});
    await page.goto('/?page=inici');
    await expect(page.locator('#ara')).toBeVisible();
    await page.evaluate(async missing=>{
      const {renderHomeForecast}=await import('/src/features/home-forecast.js');
      const time=Array.from({length:25},(_,h)=>h===24?'2026-09-21T00:00':`2026-09-20T${String(h).padStart(2,'0')}:00`);
      renderHomeForecast({hourly:{time,
        temperature_2m:time.map((_,h)=>missing?null:h<19?25:24-(h-19)),
        weather_code:time.map((_,h)=>missing?null:h<12?66:h<19?2:0),
        precipitation_probability:time.map((_,h)=>missing?null:h<13?85:0),
        wind_gusts_10m:time.map(()=>missing?null:18),
        is_day:time.map((_,h)=>h>=7&&h<20?1:0),
      }});
    },!!scenario.missing);
    const block=page.locator('.home-dayparts'),cards=block.locator('article');
    await expect(cards).toHaveCount(scenario.count);
    await expect(block.locator('.home-dayparts__grid')).toHaveAttribute('data-count',String(scenario.count));
    await expect(block.locator('svg')).toHaveCount(scenario.count);
    await expect(block).not.toContainText('Europe/Madrid');
    if(scenario.missing){await expect(cards.first()).toContainText('Dades incompletes');await expect(block).not.toContainText('0%');}
    else if(scenario.hour===18){
      await expect(cards.first().locator('.home-daypart__temperature')).toHaveText('25°');
      await expect(cards.last()).toHaveAttribute('data-light','twilight');
      await expect(cards.last().locator('svg')).toHaveAttribute('data-light','twilight');
    }
    await block.scrollIntoViewIfNeeded();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width);
    expect(await block.evaluate(el=>[...el.querySelectorAll('h2,h3,p,dt,dd,strong,a')].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.textContent))).toEqual([]);
    if(scenario.width===1440){
      const grid=await block.locator('.home-dayparts__grid').boundingBox(),last=await cards.last().boundingBox();
      if(scenario.count===1){
        expect(last.width).toBeLessThanOrEqual(762);
        expect(Math.abs(last.x+last.width/2-grid.x-grid.width/2)).toBeLessThan(2);
      }else expect(Math.abs(grid.x+grid.width-last.x-last.width)).toBeLessThan(2);
      const gap=await block.evaluate(el=>el.getBoundingClientRect().top-el.previousElementSibling.getBoundingClientRect().bottom);
      expect(gap).toBeGreaterThanOrEqual(15);
    }
    await block.screenshot({path:info.outputPath('dayparts.png')});
    for(const lang of ['es','en','fr','ca']){
      await page.evaluate(async lang=>{const {setLanguage}=await import('/src/core/i18n.js');setLanguage(lang);},lang);
      await expect(cards).toHaveCount(scenario.count);
      await expect(block.locator('h2')).toHaveText({ca:'El que queda d’avui',es:'Lo que queda de hoy',en:'The rest of today',fr:'Le reste de la journée'}[lang]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(scenario.width);
      expect(await block.evaluate(el=>[...el.querySelectorAll('h2,h3,p,dt,dd,strong,a')].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.textContent))).toEqual([]);
    }
    await page.evaluate(async()=>{const {renderHomeForecast}=await import('/src/features/home-forecast.js');renderHomeForecast(null);});
    await expect(block.locator('#home-dayparts')).toHaveText('Predicció temporalment no disponible');
    await expect(block.locator('svg')).toHaveCount(0);
    await block.getByRole('link',{name:'Previsió completa →'}).click();
    await expect(page).toHaveURL(/page=prediccio/);
    expect(errors).toEqual([]);
  });
}
