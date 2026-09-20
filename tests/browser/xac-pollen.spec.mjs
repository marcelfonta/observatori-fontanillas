import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {xacFixture} from '../fixtures/xac-pollen.js';
const moduleUrl=`data:text/javascript;base64,${Buffer.from(await readFile(new URL('../../scripts/lib/xac-pollen.mjs',import.meta.url),'utf8')).toString('base64')}`;
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
  expect(result.original.referenceApproved).toBe(false);
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
