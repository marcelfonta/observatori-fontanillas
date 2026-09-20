import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from '@playwright/test';
import {daypartWeatherLabel} from '../../src/core/forecast-dayparts.js';
import {normalizeMoon,moonSpan} from './lunar.mjs';
import {summarizeEnvironment,chooseEnvironmentScene,environmentalCaption,secondaryUv} from './environment.mjs';
const environment=process.argv.includes('--environment');
const evening=process.argv.includes('--evening');
if(evening&&!environment)throw Error('--evening requires --environment');
const root=resolve(environment?'build/social-pilot-environment':'build/social-pilot');await mkdir(root,{recursive:true});
const lunar=environment||process.argv.includes('--lunar');
const v2=lunar||process.argv.includes('--v2');
const output=environment?resolve(root,evening?'v5-evening':'v5-rain-priority'):lunar?resolve(root,'v3-lunar'):v2?resolve(root,'v2'):root;await mkdir(output,{recursive:true});
const data=JSON.parse(await readFile(resolve(root,'data.json'),'utf8'));
if(evening){
 data.edition='evening';data.day=data.days[1];data.date=data.day.date;data.days=data.days.slice(1);
 const frames=data.rain.byDate?.[data.date]||[];data.rain={...data.rain,frames,available:frames.length===4&&frames.some(f=>f.values.some(v=>v!==null))};
}
if(environment){
 // Re-evaluate both editions, including old snapshots with a stored UV scene.
 // This offline design pilot deliberately uses the original collection clock.
 const e=data.environment,options={date:data.date,now:Date.parse(e.retrievedAt),retrievedAt:e.retrievedAt};
 e.summary=summarizeEnvironment(e.raw,options);e.summary.uv=summarizeEnvironment(e.uvRaw,options).uv;
 e.selection=chooseEnvironmentScene({summary:e.summary,forecast:data.forecast,alerts:e.alerts,now:options.now,retrievedAt:e.retrievedAt});
 e.secondaryUv=secondaryUv(e.summary,options);
 e.caption=environmentalCaption(e.summary,e.selection,options);
}
if(lunar){const saved=JSON.parse(await readFile(resolve(root,evening?'lunar-evening.json':'lunar.json'),'utf8'));data.lunarEnabled=true;data.moon=normalizeMoon(saved.raw,data.date);}
const b64=async f=>(await readFile(resolve(root,f))).toString('base64');
data.logo=await b64('logo.png');data.fonts={manrope:await b64('Manrope.ttf'),dm:await b64('DM-Sans.ttf')};
const browser=await chromium.launch({headless:true});
let encoder;
try {
const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',r=>r.abort()); // Offline: cannot contact or publish to any service.
await page.setContent('<!doctype html><html lang="ca"><title>Pilot Meteo Fontanillas</title><style>body{margin:0;background:#071a16}canvas{display:block}</style><canvas aria-label="Pilot de previsió meteorològica"></canvas></html>');
await page.addScriptTag({content:await readFile(new URL('./scene.js',import.meta.url),'utf8')});
if(v2)await page.addScriptTag({content:await readFile(new URL('./scene-v2.js',import.meta.url),'utf8')});
if(lunar)await page.addScriptTag({content:`window.moonSpan=${moonSpan.toString()};`});
await page.evaluate(d=>window.initPilot(d),data);
const times=[2.5,7.5,12.5,18.2,22.5,28.2];
for(const [i,t]of times.entries()){
 const result=await page.evaluate(t=>window.renderPilot(t),t);if(result.errors.length)throw Error('Layout: '+JSON.stringify(result.errors));
 await page.screenshot({path:resolve(output,`scene-${i+1}.png`)});
}
if(environment&&!evening){
 const result=await page.evaluate(()=>window.renderMidday());
 if(result.errors.length)throw Error('Midday layout: '+JSON.stringify(result.errors));
 await page.locator('canvas').screenshot({path:resolve(output,'midday.png')});
 await writeFile(resolve(output,'caption.txt'),data.environment.caption||'Mapa de precipitació a l’escena final. UV secundari no disponible.');
}
// Long captions, missing numbers and dangerous weather are synthetic QA, never editorial data.
let stressCases=0;
for(const code of [3,45,61,66,71,95,null])for(const part of [0,1,2]){
 const fixture=structuredClone(data);fixture.day.dayparts[part]={...fixture.day.dayparts[part],weatherCode:code,condition:code===null?'Previsió no disponible':'Possibilitat de '+daypartWeatherLabel(code).toLowerCase(),min:null,max:null,rainProbability:null,gust:null,complete:false};
 const result=await page.evaluate(({d,t})=>window.renderPilot(t,d),{d:fixture,t:part*5+2.5});
 if(result.errors.length)throw Error('Stress layout: '+JSON.stringify(result.errors));
 if(result.boxes.some(b=>b.s==='0%'))throw Error('Missing probability became zero');
 stressCases++;
}
if(v2)for(const available of [false,true]){
 const fixture=structuredClone(data);fixture.rain.available=available;fixture.rain.frames.forEach(f=>f.values=f.values.map(()=>null));
 if(environment)fixture.environment.selection={kind:'rain',reason:'synthetic-map-check'};
 const result=await page.evaluate(d=>window.renderPilot(28.2,d),fixture);
 if(result.errors.length)throw Error('Missing map layout: '+JSON.stringify(result.errors));
 if(result.boxes.some(b=>/no marca|0,0 mm|Punts mostrats: 0/.test(b.s)))throw Error('Missing rain presented as dry');
 stressCases++;
}
if(environment){
 for(const kind of ['uv','air'])for(const value of [0,3,60,101,999]){
  const fixture=structuredClone(data),metric=structuredClone(fixture.environment.summary[kind==='uv'?'uv':'air']);
  if(!metric)continue;metric.value=value;metric.rows.forEach(r=>r.value=value);
  fixture.environment.selection={kind,metric,reason:'SYNTHETIC-QA-NOT-FOR-PUBLICATION'};
  const result=await page.evaluate(d=>window.renderPilot(28.2,d),fixture);
  if(result.errors.length)throw Error('Environmental layout: '+JSON.stringify(result.errors));
  if(!result.boxes.some(b=>b.s==='PRECIPITACIÓ  /  MODEL, NO RADAR'))throw Error('Environment displaced rain map');
  stressCases++;
 }
 for(const value of [null,0,6.4,14,999]){
  const fixture=structuredClone(data);
  fixture.environment.secondaryUv=value===null?null:{value,peakTime:fixture.date+'T14:00'};
  const result=await page.evaluate(d=>window.renderPilot(7.5,d),fixture);
  if(result.errors.length)throw Error('Secondary UV layout: '+JSON.stringify(result.errors));
  const uv=result.boxes.find(b=>b.s.startsWith('UV màx. previst:'));
  if((value===null&&uv)||(value!==null&&!uv))throw Error('Secondary UV missing-data contract');
  if(uv&&uv.height>35)throw Error('UV lost secondary hierarchy');
  stressCases++;
 }
 if(!evening){
  for(const missing of [true,false]){
   const fixture=structuredClone(data);fixture.environment.midday={uv:missing?null:fixture.environment.midday.uv,air:null};
   fixture.middayParts.forEach(p=>{p.condition='Possibilitat de tempesta amb calamarsa';p.min=null;p.max=null;p.rainProbability=null;});
   const result=await page.evaluate(d=>{window.renderPilot(2.5,d);return window.renderMidday();},fixture);
   if(result.errors.length)throw Error('Midday missing layout: '+JSON.stringify(result.errors));stressCases++;
  }
 }
 await page.evaluate(d=>window.renderPilot(2.5,d),data);
}
await page.evaluate(d=>window.renderPilot(2.5,d),data);
if(lunar){
 for(const moon of [null,...[0,50,100].map(percent=>({...data.moon,percent}))]){
  const fixture={...data,moon};const result=await page.evaluate(d=>window.renderPilot(12.5,d),fixture);
  if(result.errors.length)throw Error('Lunar layout: '+JSON.stringify(result.errors));
  if(!moon&&!result.boxes.some(b=>b.s==='Fase lunar no disponible'))throw Error('Missing lunar fallback');
  stressCases++;
 }
 await page.evaluate(d=>window.renderPilot(2.5,d),data);
}
const report={version:environment?5:lunar?3:v2?2:1,environment:data.environment?.selection,secondaryUv:data.environment?.secondaryUv,moon:data.moon,date:data.date,capturedAt:data.capturedAt,resolution:'1080x1920',duration:30,scenes:6,safeTextBounds:{left:76,right:946,top:185,bottom:1710},syntheticStressCases:stressCases,pageErrors:errors,publishing:false};
if(errors.length)throw Error(errors.join('\n'));
if(!process.argv.includes('--stills')){
 const ff=spawn('ffmpeg',['-y','-hide_banner','-loglevel','warning','-f','image2pipe','-framerate','30','-vcodec','mjpeg','-i','pipe:0','-i',resolve(root,'music.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-af','afade=t=in:st=0:d=0.8,afade=t=out:st=28.8:d=1.2','-t','30','-movflags','+faststart',resolve(output,'meteo-fontanillas-pilot.mp4')],{stdio:['pipe','inherit','inherit']});
 encoder=ff;
 const done=once(ff,'close');
 for(let f=0;f<900;f++){
  const jpg=await page.evaluate(t=>{const r=window.renderPilot(t);if(r.errors.length)throw Error(JSON.stringify(r.errors));return document.querySelector('canvas').toDataURL('image/jpeg',.94).split(',')[1];},f/30);
  if(!ff.stdin.write(Buffer.from(jpg,'base64')))await once(ff.stdin,'drain');
  if(f%150===0)console.log(`Render ${f/30}/30 s`);
 }
 ff.stdin.end();const [code]=await done;if(code!==0)throw Error('ffmpeg failed '+code);
 report.validatedFrames=900;
}
await writeFile(resolve(output,process.argv.includes('--stills')?'validation-stills.json':'validation.json'),JSON.stringify(report,null,2));
console.log('Pilot validated; no publication performed.');
} finally {
 if(encoder&&encoder.exitCode===null)encoder.kill('SIGTERM');
 await browser.close();
}
