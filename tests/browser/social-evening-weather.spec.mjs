import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {productionFixture} from '../fixtures/social-production.js';
import {moonSpan} from '../../scripts/social-pilot/lunar.mjs';

const read=path=>readFile(new URL(`../../${path}`,import.meta.url));
const b64=async path=>(await read(path)).toString('base64');

test('el vespre conserva el temps al costat de la fase lunar',async({page},info)=>{
  const {snapshot}=productionFixture('vespre');
  const data={...snapshot,edition:'evening',pilot:false,lunarEnabled:true,environmentEnabled:false,
    moon:{label:'Gibosa creixent',percent:70,waxing:true},rain:{available:false,frames:[]},trend:null,
    logo:await b64('assets/icons/icon-512.png'),fonts:{manrope:await b64('assets/fonts/manrope-latin.woff2'),dm:await b64('assets/fonts/dm-sans-latin.woff2')}};
  await page.setViewportSize({width:1080,height:1920});
  await page.setContent('<!doctype html><html lang="ca"><style>body{margin:0}</style><canvas></canvas></html>');
  await page.addScriptTag({content:(await read('scripts/social-pilot/scene.js')).toString()});
  await page.addScriptTag({content:(await read('scripts/social-pilot/scene-v2.js')).toString()});
  await page.addScriptTag({content:`window.moonSpan=${moonSpan.toString()}`});
  await page.evaluate(payload=>window.initPilot(payload),data);
  for(const code of [0,2,3,45,61,71,95,null]){
    const fixture=structuredClone(data);
    fixture.day.dayparts[2].weatherCode=code;
    const result=await page.evaluate(payload=>window.renderPilot(12.5,payload),fixture);
    expect(result.errors,`codi ${code}`).toEqual([]);
    expect(result.boxes.some(box=>box.s==='TEMPS')).toBe(code!==null);
    expect(result.boxes.some(box=>box.s==='FASE LUNAR DEL DIA · USNO')).toBe(true);
  }
  await page.evaluate(payload=>window.renderPilot(12.5,payload),data);
  await page.screenshot({path:info.outputPath('vespre-temps-i-lluna.png')});
});
