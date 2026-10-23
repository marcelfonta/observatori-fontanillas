import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {socialCardHtml} from '../../worker/index.js';
import {buildDaypartSlides} from '../../scripts/youtube-short.mjs';

const date='2026-10-24';
const logo=await readFile(new URL('../../assets/icons/icon-512.png',import.meta.url));
const moon={date,label:'Gibosa creixent',percent:43};
const cases=[
  ['serè',0,'Cel serè'],['parcial',2,'Núvols i clarianes'],
  ['cobert',3,'Cel cobert'],['boira',45,'Boira'],
  ['pluja',61,'Pluja'],['neu',71,'Neu'],['tempesta',95,'Tempesta'],
  ['temps-absent',null,'Previsió no disponible'],
];
const part=(id,label,timeLabel,weatherCode,condition)=>({id,label,timeLabel,weatherCode,condition,min:12,max:16,rainProbability:20,gust:23,complete:true});
function day(code,condition){return {date,dayparts:[part('morning','Matí','06:00–12:00',1,'Poc ennuvolat'),part('afternoon','Tarda','12:00–19:00',2,'Núvols i clarianes'),part('evening','Vespre','19:00–24:00',code,condition)]};}
function card(code,condition,lunar=moon){return socialCardHtml({kind:'daily_observation',payload:JSON.stringify({socialFormat:'cinematic-v5',period:'vespre',localDate:'2026-10-23',temperature:15.2,observationUpdated:'2026-10-23T20:20:00',forecast:[day(code,condition)],moon:lunar})});}

test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.abort());
  await page.route('https://meteo.fontanillas.cat/assets/icons/icon-512.png',route=>route.fulfill({status:200,contentType:'image/png',body:logo}));
});

for(const [name,code,condition] of [...cases,['lluna-absent',0,'Cel serè']]){
  test(`targeta de vespre: ${name}`,async({page},info)=>{
    const lunar=name==='lluna-absent'?null:moon;
    await page.setViewportSize({width:1080,height:1350});
    await page.setContent(card(code,condition,lunar));
    await page.evaluate(()=>document.fonts.ready);
    const evening=page.locator('article').last();
    await expect(evening.locator('.moon-tag')).toContainText(lunar?'Gibosa creixent':'no disponible');
    if(code===null)await expect(evening.locator('.glyph')).toHaveCount(0);
    else await expect(evening.locator('.glyph')).toHaveCount(1);
    const boxes=await evening.evaluate(node=>{
      const article=node.getBoundingClientRect(),tag=node.querySelector('.moon-tag').getBoundingClientRect();
      const glyph=node.querySelector('.glyph')?.getBoundingClientRect();
      const label=node.querySelector('.moon-tag');
      return {article:{left:article.left,right:article.right,top:article.top,bottom:article.bottom},tag:{left:tag.left,right:tag.right,top:tag.top,bottom:tag.bottom,clipped:label.scrollWidth>label.clientWidth+2},glyph:glyph&&{left:glyph.left,right:glyph.right,top:glyph.top,bottom:glyph.bottom}};
    });
    expect(boxes.tag.left).toBeGreaterThanOrEqual(boxes.article.left);
    expect(boxes.tag.right).toBeLessThanOrEqual(boxes.article.right);
    expect(boxes.tag.bottom).toBeLessThanOrEqual(boxes.article.bottom);
    expect(boxes.tag.clipped).toBe(false);
    if(boxes.glyph)expect(boxes.tag.right).toBeLessThanOrEqual(boxes.glyph.left);
    await page.screenshot({path:info.outputPath(`meta-${name}.png`)});
  });
  test(`Short de vespre: ${name}`,async({page},info)=>{
    const lunar=name==='lluna-absent'?null:moon;
    const svg=buildDaypartSlides({day:day(code,condition),when:'Demà',edition:'EDICIÓ VESPRE',logoData:logo.toString('base64'),moon:lunar})[2];
    await page.setViewportSize({width:1080,height:1920});
    await page.setContent(`<style>body{margin:0;background:#071a16}svg{display:block}</style>${svg}`);
    await page.evaluate(()=>document.fonts.ready);
    await expect(page.locator('svg')).toContainText(lunar?'Gibosa creixent':'Fase lunar no disponible');
    const overflow=await page.locator('svg').evaluate(root=>[...root.querySelectorAll('text')].filter(node=>{const b=node.getBBox();return b.x<0||b.y<0||b.x+b.width>1080||b.y+b.height>1920;}).map(node=>node.textContent));
    expect(overflow).toEqual([]);
    await page.screenshot({path:info.outputPath(`short-${name}.png`)});
  });
}
