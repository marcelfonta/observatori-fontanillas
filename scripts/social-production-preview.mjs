// Isolated image previews from the same dated snapshot as the video. No writes
// to Worker storage, no social credentials, no calls to publication endpoints.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {assertProductionSnapshot} from './social-production.mjs';
import {normalizeSocialForecast,summarizeForecastDayparts} from '../src/core/forecast-dayparts.js';
import {fetchSocialEnvironment} from '../src/core/social-environment.js';
import {socialCardHtml} from '../worker/index.js';
const root=resolve('build/youtube-short');
const data=JSON.parse(await readFile(resolve(root,'data.json'),'utf8'));assertProductionSnapshot(data);
const logo=await readFile(resolve(root,'logo.png'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1080,height:1350}});
 await page.route('**/*',r=>r.request().url().endsWith('/icon-512.png')?r.fulfill({body:logo,contentType:'image/png'}):r.abort());
 for(const period of data.slot==='mati'?['mati','migdia']:['vespre']){
  const forecast=normalizeSocialForecast(data.forecast);
  if(period==='migdia')forecast.find(d=>d.date===data.publicationDate).dayparts=summarizeForecastDayparts(data.forecast.hourly,data.publicationDate,{fromHour:14});
  const environment=period==='migdia'?await fetchSocialEnvironment({date:data.publicationDate,startHour:14}):data.environment.summary;
  const payload={socialFormat:'cinematic-v5',localDate:data.publicationDate,period,forecast,temperature:data.current.temperature,observationUpdated:data.current.updated,temperatureTrend:data.trend,environment};
  const html=socialCardHtml({kind:'daily_observation',payload:JSON.stringify(payload)});
  await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
  const overflows=await page.evaluate(()=>[...document.querySelectorAll('h1,h2,strong,p,.date,.stamp,.note,.air,.uv')].filter(n=>n.scrollWidth>n.clientWidth+1||n.getBoundingClientRect().bottom>1300).map(n=>n.textContent));
  if(overflows.length)throw Error('Image overflow: '+JSON.stringify(overflows));
  if(!await page.locator('.brand img').evaluate(n=>n.complete&&n.naturalWidth>0))throw Error('Logo missing');
  await page.screenshot({path:resolve(root,`image-${period}.png`)});
  await writeFile(resolve(root,`image-${period}.html`),html);
 }
 console.log('Production images previewed; no publications or storage writes.');
}finally{await browser.close();}
