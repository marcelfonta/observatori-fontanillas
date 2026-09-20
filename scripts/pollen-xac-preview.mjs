// One public GET, local preview only. No credentials, queues, cron or publishing.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from '@playwright/test';
import {XAC_STATIONS,validDate,pollenPreviewHtml} from './lib/xac-pollen.mjs';
const args=process.argv.slice(2),station=args[0],targetDate=args[1];
if(args.length!==2 || !XAC_STATIONS.includes(station) || !validDate(targetDate))throw Error('Ús: node scripts/pollen-xac-preview.mjs ESTACIO AAAA-MM-DD');
const response=await fetch(`https://aerobiologia.cat/api/v0/forecast/${station}/ca/xml`,{signal:AbortSignal.timeout(15000),redirect:'error'});
if(!response.ok)throw Error(`XAC HTTP ${response.status}`);
const xml=await response.text();
if(xml.length>300_000)throw Error('Resposta XAC massa gran');
const fetchedAt=new Date().toISOString();
const source=await readFile(new URL('./lib/xac-pollen.mjs',import.meta.url),'utf8');
const moduleUrl=`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',route=>route.abort());
  const data=await page.evaluate(async({moduleUrl,xml,station,targetDate})=>{
    const {parseXacPollen}=await import(moduleUrl);
    return parseXacPollen(xml,{station,targetDate});
  },{moduleUrl,xml,station,targetDate});
  data.fetchedAt=fetchedAt;
  const dir=resolve('build/pollen-xac-preview',`${station}-${targetDate}`);
  await mkdir(dir,{recursive:true});
  const html=pollenPreviewHtml(data);
  await writeFile(resolve(dir,'preview.json'),JSON.stringify(data,null,2));
  await writeFile(resolve(dir,'preview.html'),html);
  await page.setContent(html);
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Desbordament mòbil de la previsualització');
  await page.screenshot({path:resolve(dir,'preview-mobile.png'),fullPage:true});
  console.log(JSON.stringify({directory:dir,station,period:[data.start,data.end],targetDate,status:data.status,incomplete:data.incomplete,publishing:false}));
} finally { await browser.close(); }
