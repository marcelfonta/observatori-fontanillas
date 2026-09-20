import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {productionFixture} from '../fixtures/social-production.js';
import {socialCardHtml} from '../../worker/index.js';
const logo=await readFile(new URL('../../assets/icons/icon-512.png',import.meta.url));
for(const period of ['mati','migdia','vespre'])for(const stress of [false,true]){
 test(`production card ${period} ${stress?'missing-long':'regular'}`,async({page},info)=>{
  const {card}=productionFixture(period);
  if(stress){card.temperature=null;card.environment=null;card.forecast.forEach(d=>d.dayparts.forEach(p=>Object.assign(p,{condition:'Possibilitat de tempesta amb calamarsa',min:null,max:null,rainProbability:null})));}
  await page.route('**/*',r=>r.request().url().endsWith('/icon-512.png')?r.fulfill({body:logo,contentType:'image/png'}):r.abort());
  await page.setViewportSize({width:1080,height:1350});
  await page.setContent(socialCardHtml({kind:'daily_observation',payload:JSON.stringify(card)}));
  await page.evaluate(()=>document.fonts.ready);
  const errors=await page.evaluate(()=>{
   const rect=n=>n.getBoundingClientRect(),nodes=[...document.querySelectorAll('.brand b,.brand small,.date,h1,.temp,.observed,.trend small,.extremes,.stamp,.part-time,article strong,.values b,.values span,h2,.uv,.air,.environment p,.note,.footer b,.footer span')];
   const errors=[];
   for(const n of nodes){const r=rect(n);if(r.left<60||r.right>1020||r.top<60||r.bottom>1300||n.scrollWidth>n.clientWidth+1)errors.push('bounds: '+n.textContent);}
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=rect(nodes[i]),b=rect(nodes[j]);if(a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2)errors.push('overlap: '+nodes[i].textContent+' / '+nodes[j].textContent);}
   return errors;
  });
  await page.screenshot({path:info.outputPath('card.png')});
  expect(errors).toEqual([]);
  expect(await page.locator('.brand img').evaluate(n=>n.complete&&n.naturalWidth>0)).toBe(true);
 });
}
