import {test,expect} from '@playwright/test';

for(const width of [360,390,1280])test(`ambient: data UV i caducitat sense refrescar · ${width}`,async({page},info)=>{
 await page.clock.install({time:new Date('2026-09-20T08:10:00Z')});
 await page.setViewportSize({width,height:900});
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/src/app.js'||url.hostname!=='127.0.0.1')return route.abort();
  return route.continue();
 });
 await page.goto('/');
 await page.evaluate(async()=>{
  const section=document.getElementById('medi-ambient');
  document.body.replaceChildren(section);section.hidden=false;section.style.display='block';
  window.fetch=async()=>({ok:true,json:async()=>({current:{time:'2026-09-20T10:00',uv_index:4,european_aqi:0}})});
  const module=await import('/src/features/environment.js');
  await module.initEnvironment();module.updateEnvironmentStation({uv:0,updatedUtc:'2026-09-20T08:09:00Z'});
 });
 await expect(page.locator('#environment-uv')).toHaveText('0,0');
 await expect(page.locator('#environment-uv-source')).toHaveText('Sensor Fontanillas');
 await expect(page.locator('#environment-uv-time')).toContainText('10:09');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
 await page.screenshot({path:info.outputPath('ambient-fresh.png'),fullPage:true});
 await page.clock.fastForward(30*60_000);
 await expect(page.locator('#environment-uv')).toHaveText('4,0');
 await expect(page.locator('#environment-uv-source')).toHaveText('Estimació CAMS');
 await page.clock.fastForward(60*60_000);
 await expect(page.locator('#environment-uv')).toHaveText('—');
 await expect(page.locator('#environment-aqi')).toHaveText('—');
 await expect(page.locator('#environment-aqi-marker')).toBeHidden();
});
