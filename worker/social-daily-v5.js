import {finiteNumber} from '../src/core/numeric.js';
import {temperatureTrendGeometry} from '../src/core/temperature-trend.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,d=0)=>finiteNumber(v)===null?'—':Number(v).toLocaleString('ca-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
export function dailySocialCardV5(data,glyph){
 const evening=data.period==='vespre',midday=data.period==='migdia';
 const forecast=Array.isArray(data.forecast)?data.forecast:[];
 const target=new Date(data.localDate+'T12:00Z');if(evening)target.setUTCDate(target.getUTCDate()+1);
 const date=Number.isFinite(target.getTime())?target.toISOString().slice(0,10):'';
 const day=forecast.find(d=>d.date===date);
 const parts=(day?.dayparts||[]).filter(p=>!midday||p.startHour>=14);
 const environment=data.environment?.date===date?data.environment:null;
 const uv=environment?.uv,air=environment?.air;
 const airLevel=finiteNumber(air?.value)===null?'no disponible':air.value<=20?'bona':air.value<=40?'raonable':air.value<=60?'moderada':air.value<=80?'dolenta':air.value<=100?'molt dolenta':'extrema';
 const trend=data.temperatureTrend,geometry=temperatureTrendGeometry(trend,{width:430,height:105,paddingX:5,paddingY:9});
 const rows=parts.map(p=>`<article><div class="part-time">${esc(p.label.toUpperCase())} · ${esc(p.timeLabel)} H</div><strong>${esc(p.condition)}</strong>${p.weatherCode!==null?`<div class="glyph">${glyph(p.weatherCode,p.id==='evening')}</div>`:''}<div class="values"><b>${num(p.min)}–${num(p.max)}°</b><span>Pluja ${num(p.rainProbability)}% · màx. horària</span></div></article>`).join('');
 return `<!doctype html><html lang="ca"><head><meta charset="utf-8"><style>
 *{box-sizing:border-box}body{margin:0;width:1080px;height:1350px;padding:68px 72px;color:#edf4eb;font-family:Arial,sans-serif;background:radial-gradient(ellipse at 76% 35%,#315c48,transparent 75%),#071a16;position:relative;overflow:hidden}
 .brand{display:flex;gap:22px;align-items:center;height:68px}.brand img{width:68px;height:68px;border-radius:18px}.brand b{font-size:32px}.brand small{display:block;font-size:20px;color:#a9bfb4;margin-top:6px}.date{margin-top:40px;color:#a6e5c0;font-size:26px}h1{margin:23px 0 25px;font-size:46px;letter-spacing:-1px;line-height:1.1}
 .hero{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center;height:194px}.temp{font-size:145px;font-weight:bold;letter-spacing:-6px;line-height:1}.observed{font-size:23px;color:#a6e5c0;margin-top:18px}.trend small{color:#a9bfb4;font-size:21px}.trend svg{display:block;width:430px;height:105px;margin:14px 0}.trend .extremes{font-size:23px;color:#a9bfb4}.stamp{font-size:24px;color:#a9bfb4;margin-top:24px;margin-bottom:36px}
 article{border-top:1px solid #ffffff30;height:${midday?191:153}px;position:relative;padding-top:20px;padding-right:0}.part-time{font-size:23px;color:#a6e5c0}article strong{display:block;font-size:${midday?34:29}px;line-height:1.12;margin-top:17px;max-width:760px;overflow-wrap:anywhere}.glyph{position:absolute;right:0;top:18px;width:68px;height:68px}.glyph svg{width:100%;height:100%}.values{display:flex;align-items:center;justify-content:space-between;margin-top:14px}.values b{font-size:${midday?45:35}px}.values span{font-size:25px;color:#92d8ed}
 .environment{border-top:1px solid #ffffff30;padding-top:22px;margin-top:8px}.environment h2{font-size:22px;font-weight:normal;margin:0 0 22px;color:#a6e5c0}.environment .columns{display:grid;grid-template-columns:1fr 1fr;gap:32px}.uv{font-size:26px;color:#a9bfb4}.air{font-size:32px;color:#92d8ed;font-weight:bold}.environment p{font-size:21px;color:#a9bfb4;margin:12px 0}.note{font-size:22px;color:#a9bfb4;margin-top:16px}.footer{position:absolute;bottom:70px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center;font-size:21px;color:#a9bfb4}.footer b{font-size:28px;color:#a6e5c0}.missing{font-size:30px;color:#a9bfb4;height:330px;padding-top:50px}
 ${!midday?'.date{margin-top:32px}h1{margin:20px 0}.stamp{margin-bottom:24px}article{height:143px}':''}
 </style></head><body data-social-format="cinematic-v5">
 <div class="brand"><img src="https://meteo.fontanillas.cat/assets/icons/icon-512.png" alt=""><div><b>Meteo Fontanillas</b><small>OBSERVATORI METEOROLÒGIC · SANT CELONI</small></div></div>
 <div class="date">${evening?'DEMÀ':'AVUI'} · ${esc(date)} · hora de Sant Celoni</div><h1>${midday?'Ara, i el que queda del dia.':evening?'Demà, franja a franja.':'El dia, franja a franja.'}</h1>
 <div class="hero"><div><div class="temp">${num(data.temperature,1)}°</div><div class="observed">OBSERVACIÓ FONTANILLAS · °C</div></div><div class="trend">${geometry?`<small>EVOLUCIÓ OBSERVADA · ${num(trend.hours)} H</small><svg viewBox="0 0 430 105"><path d="${geometry.path}" fill="none" stroke="#a6e5c0" stroke-width="3"/></svg><div class="extremes">Mín. ${num(trend.minimum,1)}° · màx. ${num(trend.maximum,1)}°</div>`:'<small>Històric no disponible</small>'}</div></div>
 <div class="stamp">Lectura real: ${esc(data.observationUpdated?String(data.observationUpdated).replace('T',' ').slice(0,16):'hora no disponible')}</div>
 <section class="parts">${rows||'<div class="missing">Previsió per franges no disponible.</div>'}</section>
 <section class="environment"><h2>PREVISIÓ AMBIENTAL · ${esc(environment?.period||'sense dades vigents')}</h2><div class="columns"><div><div class="uv">UV màx. previst: ${num(uv?.value,1)}</div><p>${uv?`Màxim horari a les ${esc(uv.peakTime.slice(11,16))} h`:'UV previst no disponible'}</p><p>CAMS global · Open-Meteo</p></div><div><div class="air">Aire: ${esc(airLevel)}</div><p>${air?`Índex europeu màxim: ${num(air.value)}`:'Sense dades de qualitat de l’aire'}</p><p>CAMS europeu · Open-Meteo</p></div></div></section>
 <div class="note">Estimacions de models, no lectures del sensor ni avisos oficials.</div>
 <div class="footer"><b>meteo.fontanillas.cat</b><span>OBSERVACIÓ I PREVISIÓ</span></div></body></html>`;
}
