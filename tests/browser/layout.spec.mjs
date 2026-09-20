import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {buildSlideSvg,datedKicker,forecastDaypartContent} from '../../scripts/youtube-short.mjs';
const logo=(await readFile(new URL('../../assets/icons/icon-512.png',import.meta.url))).toString('base64');
test.beforeEach(async({page})=>{
  // Deterministic, non-publishing checks: no external API, telemetry or social calls.
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
});
for(const month of ['01','05','09','12']){
  test('video: data i text dins del marc '+month,async({page},info)=>{
    await page.setViewportSize({width:1080,height:1920});
    const svg=buildSlideSvg({title:'Vespre',kicker:datedKicker('DEMÀ','2026-'+month+'-23'),edition:'EDICIÓ VESPRE · 22 DE SETEMBRE DEL 2026',logoData:logo,weatherCode:95,footer:'Open-Meteo · previsió horària orientativa',
      content:forecastDaypartContent({id:'evening',timeLabel:'19:00–24:00',condition:'Possibilitat de tempesta',min:17,max:25,rainProbability:99,gust:125,complete:true})});
    await page.setContent('<style>body{margin:0}svg text{font-family:"DejaVu Sans",sans-serif}</style>'+svg);
    await page.evaluate(()=>document.fonts.ready);
    const errors=await page.locator('svg').evaluate(svg=>{
      const texts=[...svg.querySelectorAll('text')],errors=[];
      for(const node of texts){const b=node.getBBox();if(b.x<0||b.y<0||b.x+b.width>1080||b.y+b.height>1920)errors.push(node.textContent);}
      const pill=svg.querySelector('rect[y="272"]'),label=svg.querySelector('text[y="313"]');
      if(label.getBBox().x+label.getBBox().width>Number(pill.getAttribute('x'))+Number(pill.getAttribute('width'))-12)errors.push('Data fora de la pastilla');
      return errors;
    });
    expect(errors).toEqual([]);
    await page.screenshot({path:info.outputPath('video.png')});
  });
}
for(const sample of ['alert','monthly','weekly','drought','event','astronomy']){
  test('targeta social: '+sample,async({page},info)=>{
    await page.setViewportSize({width:1080,height:1350});
    await page.goto('/tests/visual-social-cards.html?sample='+sample);
    await expect(page.locator('body')).toContainText('Fontanillas');
    await page.evaluate(()=>document.fonts.ready);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1080);
    const clipped=await page.evaluate(()=>[...document.querySelectorAll('h1,h2,p')].filter(n=>n.scrollWidth>n.clientWidth+2).map(n=>n.textContent));
    expect(clipped).toEqual([]);
    await page.screenshot({path:info.outputPath(sample+'.png'),fullPage:true});
  });
}
for(const width of [360,390,768]){
  test('portada mòbil '+width,async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height:844});
    await page.goto('/?page=inici');
    await expect(page.locator('#ara')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({path:info.outputPath('home.png')});
    expect(errors).toEqual([]);
  });
}
test('Meteo IA: quatre preguntes i desplegable accessible',async({page})=>{
  await page.goto('/?page=meteo-ia');
  await expect(page.locator('.meteo-ai-guide > .meteo-ai-suggestions > button')).toHaveCount(4);
  await expect(page.locator('.meteo-ai-more')).not.toHaveAttribute('open');
  await page.locator('.meteo-ai-more summary').click();
  await expect(page.locator('.meteo-ai-more button')).toHaveCount(10);
  await expect(page.locator('.meteo-ai-more button').first()).toBeVisible();
});
test('portada: franges amb dades de prova i errors sense zeros inventats',async({page},info)=>{
  await page.clock.install({time:new Date('2026-09-20T05:00:00Z')});
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?page=inici');
  await page.evaluate(async()=>{
    const {renderHomeForecast}=await import('/src/features/home-forecast.js');
    const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const times=Array.from({length:24},(_,h)=>date+'T'+String(h).padStart(2,'0')+':00');
    renderHomeForecast({hourly:{time:times,temperature_2m:times.map(()=>21),weather_code:times.map(()=>3),precipitation_probability:times.map(()=>50),wind_gusts_10m:times.map(()=>20)}});
  });
  await page.locator('.home-dayparts').scrollIntoViewIfNeeded();
  await expect(page.locator('#home-dayparts article').first()).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:info.outputPath('dayparts-mobile.png')});
  await page.evaluate(async()=>{const {renderHomeForecast}=await import('/src/features/home-forecast.js');renderHomeForecast(null);});
  await expect(page.locator('#home-dayparts')).toHaveText('Predicció temporalment no disponible');
});
