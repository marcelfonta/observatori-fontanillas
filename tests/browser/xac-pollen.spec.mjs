import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {xacFixture} from '../fixtures/xac-pollen.js';
const moduleUrl=`data:text/javascript;base64,${Buffer.from(await readFile(new URL('../../src/core/xac-pollen.js',import.meta.url),'utf8')).toString('base64')}`;
test('XAC: XML, dates, pòl·lens separats d’espores i absències',async({page})=>{
  const result=await page.evaluate(async({moduleUrl,xml})=>{
    const {parseXacPollen}=await import(moduleUrl);
    const parse=(source,date='2026-09-20',station='bellaterra')=>parseXacPollen(source,{station,targetDate:date});
    const original=parse(xml),missing=parse(xml.replace('<CUPR>0</CUPR>','<CUPR></CUPR>'));
    const bad=[xml.replace('<CUPR>0</CUPR>','<CUPR>true</CUPR>'),xml.replace('<CUPR>A</CUPR>','<CUPR>?</CUPR>')].map(s=>parse(s).incomplete);
    const rejected=[xml.replace('</current>',''),xml.replace('<CUPR>0</CUPR>','<CUPR>0</CUPR><CUPR>1</CUPR>'),xml.replace('CC BY-NC-SA 4.0','unknown'),xml.replace('ca="Nul"','ca="New scale"'),xml.replace('2026-09-21','2026-02-30'),`<!DOCTYPE reports>${xml}`].map(s=>{try{parse(s);return false;}catch{return true;}});
    let wrongStation=false;try{parse(xml,'2026-09-20','girona');}catch{wrongStation=true;}
    return {original,missing,bad,rejected,wrongStation,first:parse(xml,'2026-09-21').status,last:parse(xml,'2026-09-27').status,expired:parse(xml,'2026-09-28').status};
  },{moduleUrl,xml:xacFixture});
  expect(result.original.status).toBe('future');
  expect(result.original.publishing).toBe(false);
  expect(result.original.referenceApproved).toBe(true);
  expect(result.original.pollens[1]).toMatchObject({level:0,levelLabel:'Nul',trend:'A',trendLabel:'Augment'});
  expect(result.original.spores[0]).toMatchObject({level:4,name:'Alternària'});
  expect(result.original.pollens).toHaveLength(2);
  expect(result.missing.pollens[1].level).toBeNull();expect(result.missing.incomplete).toBe(true);
  expect(result.bad.every(Boolean)).toBe(true);expect(result.rejected.every(Boolean)).toBe(true);expect(result.wrongStation).toBe(true);
  expect(result.first).toBe('in-period');expect(result.last).toBe('in-period');expect(result.expired).toBe('expired');
});
for(const width of [360,390])test(`XAC: previsualització mòbil ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:844});
  const html=await page.evaluate(async({moduleUrl,xml})=>{const m=await import(moduleUrl);return m.pollenPreviewHtml(m.parseXacPollen(xml,{station:'bellaterra',targetDate:'2026-09-20'}));},{moduleUrl,xml:xacFixture});
  await page.setContent(html);
  await expect(page.getByRole('heading',{name:'Espores de fongs'})).toBeVisible();
  await expect(page.getByText('PREVISUALITZACIÓ LOCAL',{exact:false})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({path:info.outputPath('xac-preview.png'),fullPage:true});
});

for(const width of [390,1280])test(`XAC: integració web Bellaterra i Girona ${width}`,async({page},info)=>{
  await page.clock.install({time:new Date('2026-09-22T10:00:00Z')});
  await page.setViewportSize({width,height:1000});
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/src/app.js'||url.hostname!=='127.0.0.1')return route.abort();
    return route.continue();
  });
  await page.goto('/');
  const girona=xacFixture.replaceAll('Bellaterra','Girona').replaceAll('bellaterra','girona').replace('<URTI>1</URTI>','<URTI>3</URTI>');
  await page.evaluate(async({bellaterra,girona})=>{
    const section=document.getElementById('medi-ambient');document.body.replaceChildren(section);section.style.display='grid';
    window.fetch=async url=>String(url).includes('/pollen-xac')
      ? {ok:true,text:async()=>String(url).includes('girona')?girona:bellaterra}
      : {ok:true,json:async()=>({current:{time:'2026-09-22T12:00',european_aqi:18,uv_index:4}})};
    const module=await import('/src/features/environment.js');await module.initEnvironment();
  },{bellaterra:xacFixture,girona});
  await expect(page.locator('#xac-status')).toHaveText('Butlletí setmanal vigent');
  await expect(page.locator('[data-xac-station="primary"]')).toContainText('Bellaterra');
  await expect(page.locator('[data-xac-station="complement"]')).toContainText('Girona');
  await expect(page.locator('#xac-summary-title')).toContainText('Alternària');
  await expect(page.locator('.xac-method')).toContainText('Els nivells mai no es promitgen');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({path:info.outputPath('xac-web.png'),fullPage:true});
});
