/* Cinematic editorial pilot, not a physical simulation. Same immutable weather snapshot as v1. */
(() => {
const off=document.createElement('canvas');off.width=1080;off.height=1920;
const offCtx=off.getContext('2d');
const hourly=()=>data.forecast.hourly.time.map((time,i)=>({time,hour:Number(time.slice(11,13)),temperature:data.forecast.hourly.temperature_2m[i]})).filter(p=>p.time.startsWith(data.date)&&p.hour>=6&&p.hour<=23);

function backdrop(t,index){
 ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,H);
 const glow=ctx.createRadialGradient(800,790,30,610,840,1100);
 glow.addColorStop(0,index===2?'#284350':index===3?'#244535':'#325f48');glow.addColorStop(1,'#071a16');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 // Abstract contour ribbons are art, not a depiction of terrain or wind.
 ctx.save();ctx.lineWidth=1;for(let n=0;n<12;n++){
  ctx.strokeStyle=`rgba(166,229,192,${.035+n*.006})`;ctx.beginPath();
  for(let k=0;k<40;k++){const x=k*30,y=1000+n*40+Math.sin(k*.13+t*.055+n*.2)*100;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
 }ctx.restore();
 const shade=ctx.createLinearGradient(0,0,0,1920);shade.addColorStop(0,'#04130da6');shade.addColorStop(.3,'#04130d00');shade.addColorStop(.9,'#04130dbb');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
}
function identity(t,i){
 ctx.save();ctx.beginPath();ctx.roundRect(88,200,70,70,18);ctx.clip();ctx.drawImage(logo,88,200,70,70);ctx.restore();
 text('Meteo Fontanillas',180,230,34);text('SANT CELONI · BAIX MONTSENY',180,265,21,C.muted,'DM Sans');
 text(data.environmentEnabled?'PILOT 04':data.lunarEnabled?'PILOT 03':'PILOT 02',925,232,19,C.muted,'DM Sans',110,'right');
 const shownDate=i===3?String(data.current.updated).slice(0,10):data.date;
 const date=new Intl.DateTimeFormat('ca-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(shownDate+'T12:00Z'));
 text((data.edition==='evening'&&i!==3?'DEMÀ · ':'')+date.charAt(0).toUpperCase()+date.slice(1),88,341,29,C.mint,'DM Sans');
 const labels=['Matí','Tarda','Vespre','Estació','Tendència',data.environmentEnabled&&data.environment.selection.kind!=='rain'?'Ambient':'Pluja'];
 labels.forEach((label,j)=>{const x=88+j*140;round(x,1510,122,3,1.5,'#ffffff20');if(j<i)round(x,1510,122,3,1.5,C.mint);if(j===i)round(x,1510,122*clamp((t-j*5)/5),3,1.5,C.mint);text(label,x,1553,23,j===i?C.paper:C.muted,'DM Sans',128);});
 text('meteo.fontanillas.cat',88,1630,29,C.mint);
 text(i===3?'OBSERVACIÓ LOCAL · NO ÉS UN AVÍS OFICIAL':'PREVISIÓ · NO ÉS UN AVÍS OFICIAL',88,1673,22,C.muted,'DM Sans');
}
function badge(s,x=88,y=405,w=838){
 circle(x+5,y-9,4,C.mint);text(s,x+22,y,25,C.mint,'DM Sans',w-24);
}
function headline(lines,y=515,size=88){
 const arr=Array.isArray(lines)?lines:[lines];arr.forEach((s,i)=>text(s,88,y+i*(size+24),size,C.paper,'Manrope',838));
}
function titles(i){
 const p=data.day.dayparts[i];
 if(!p.complete||p.weatherCode===null)return ['La previsió,','amb dades parcials.'];
 if(i===0&&p.weatherCode===0)return ['Un matí','de sol.'];
 if(i===1&&p.weatherCode===0&&valid(p.max))return ['Una tarda de sol,',`fins a ${num(p.max)} graus.`];
 if(i===2&&p.weatherCode===0){const rows=hourly().filter(p=>p.hour>=19);if(rows.length===5&&rows.every(p=>valid(p.temperature))&&rows[0].temperature-rows.at(-1).temperature>=2)return ['El vespre,','amb menys graus.'];return ['Vespre serè.'];}
 return [i===0?'Comença el dia.':i===1?'Arriba la tarda.':'Arriba el vespre.'];
}
function orb(code,x,y,r,t,night){
 if(code!==0){icon(code,x,y,r*.9,t,night);return;}
 ctx.save();ctx.translate(x,y);
 if(night){
  const g=ctx.createRadialGradient(0,0,0,0,0,r*1.9);g.addColorStop(0,'#b3dbef26');g.addColorStop(1,'#b3dbef00');circle(0,0,r*1.9,g);
  // Conventional night icon, deliberately not a calculated lunar phase.
  ctx.beginPath();ctx.arc(0,0,r,-Math.PI/2,Math.PI/2,true);ctx.bezierCurveTo(-r*.2,r*.5,-r*.55,-r*.5,0,-r);ctx.fillStyle='#d0e8e7';ctx.fill();
 }else{
  const glow=ctx.createRadialGradient(0,0,r*.5,0,0,r*2.3);glow.addColorStop(0,'#f4d68b45');glow.addColorStop(1,'#f4d68b00');circle(0,0,r*2.3,glow);
  const body=ctx.createRadialGradient(-r*.4,-r*.45,0,0,0,r*1.2);body.addColorStop(0,'#fff8d3');body.addColorStop(.6,'#f5d78c');body.addColorStop(1,'#c99c53');circle(0,0,r,body);
  ctx.rotate(t*.08);for(let j=0;j<12;j++){ctx.rotate(Math.PI/6);line(0,-r*1.23,0,-r*1.32,'#f7dda78a',2.5);}
 }ctx.restore();
}
function thermal(i,t,local){
 const rows=hourly(),validRows=rows.filter(p=>valid(p.temperature));
 text('TEMPERATURA HORÀRIA PREVISTA',88,904,24,C.muted,'DM Sans',820);
 if(validRows.length<2){text('Corba no disponible',88,1045,32,C.muted);return;}
 const lo=Math.floor(Math.min(...validRows.map(p=>p.temperature)))-2,hi=Math.ceil(Math.max(...validRows.map(p=>p.temperature)))+2;
 const xy=p=>({x:100+(p.hour-6)/17*815,y:1100-(p.temperature-lo)/(hi-lo)*154});
 const p=data.day.dayparts[i],left=100+(p.startHour-6)/17*815,right=100+(Math.min(23,p.endHour)-6)/17*815;
 round(left,933,right-left,181,14,i===2?'#92d8ed10':'#a6e5c010');
 for(let k=0;k<3;k++)line(100,948+k*70,915,948+k*70,'#ffffff12');
 ctx.save();ctx.beginPath();ctx.rect(88,927,i===0?850*ease(local/1.1):850,205);ctx.clip();
 let prev=null;ctx.beginPath();for(const row of rows){if(!valid(row.temperature)){prev=null;continue;}const q=xy(row);prev?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);prev=row;}ctx.strokeStyle='#cfe3d53b';ctx.lineWidth=3;ctx.stroke();
 // Highlight only actual hourly samples inside this named daypart.
 const selected=rows.filter(q=>q.hour>=p.startHour&&q.hour<p.endHour);ctx.beginPath();prev=null;
 for(const row of selected){if(!valid(row.temperature)){prev=null;continue;}const q=xy(row);prev?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);prev=row;}ctx.strokeStyle=i===2?C.blue:C.mint;ctx.lineWidth=5;ctx.lineJoin='round';ctx.stroke();
 for(const row of selected){if(!valid(row.temperature))continue;const q=xy(row);circle(q.x,q.y,4,C.paper);}ctx.restore();
 const cursor=selected[Math.min(selected.length-1,Math.floor(clamp(local/5)*selected.length))];
 if(cursor&&valid(cursor.temperature)){
  const q=xy(cursor);ctx.save();ctx.setLineDash([3,7]);line(q.x,q.y+12,q.x,1111,'#cde9d666',1.5);ctx.restore();
  circle(q.x,q.y,9,C.ink);circle(q.x,q.y,5.5,C.paper);
  text(`${String(cursor.hour).padStart(2,'0')}:00 · ${num(cursor.temperature,1)}°`,925,904,25,C.mint,'DM Sans',270,'right');
 }
 ['06 h','12 h','19 h','23 h'].forEach((s,k)=>text(s,[100,388,723,915][k],1155,24,C.muted,'DM Sans',100,k===3?'right':'left'));
}
function forecast(i,t,local){
 const p=data.day.dayparts[i];badge(`${p.label.toUpperCase()}  /  ${p.timeLabel} H`);
 headline(titles(i));text(p.condition,88,707,34,C.mint,'DM Sans',838);
 // Large, expressive weather artwork, but no fabricated meteorological motion.
 if(i===2&&data.lunarEnabled){
  const m=data.moon;
  text('FASE LUNAR DEL DIA · USNO',88,758,22,C.blue,'DM Sans',570);
  text(m?m.label:'Fase lunar no disponible',88,801,32,C.paper,'Manrope',570);
  text(m?`${num(m.percent)}% il·luminada · referència 12 h locals`:'Sense dades verificades per a aquesta data',88,837,23,C.muted,'DM Sans',580);
  text('Esquema de fase; no indica visibilitat al cel.',88,869,21,C.muted,'DM Sans',580);
  if(m){
   const x=793,y=791,r=65;circle(x,y,r,'#203239');
   ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
   const light=ctx.createRadialGradient(x+15,y-20,0,x,y,r*1.5);light.addColorStop(0,'#f3f2df');light.addColorStop(1,'#a8c3c6');ctx.fillStyle=light;
   for(let row=-r;row<r;row+=.5){const [a,b]=window.moonSpan(row+.25,r,m.percent/100,m.waxing);if(b>a)ctx.fillRect(x+a,y+row,b-a,.6);}
   ctx.restore();
  }
 }else{
  orb(p.weatherCode,779,780,80,t,i===2);
  text('01 / 03'.replace('01','0'+(i+1)),88,810,25,C.muted,'DM Sans',210);
 }
 thermal(i,t,local);
 line(88,1199,926,1199,'#ffffff30');
 text(`${num(p.min)}–${num(p.max)}°`,82,1310,108,C.paper,'Manrope',470);
 text('Temperatura de la franja · °C',88,1356,26,C.muted,'DM Sans',470);
 text(`${num(p.rainProbability)}%`,608,1267,50,C.blue,'Manrope',280);
 text('Pluja · màx. horària',608,1303,25,C.muted,'DM Sans',315);
 text(`Ratxa màx. ${num(p.gust)} km/h`,608,1360,28,C.paper,'DM Sans',317);
 text('Open-Meteo · hora local · probabilitat horària, no de tota la franja',88,1440,24,C.muted,'DM Sans',838);
}
function measured(t,local){
 badge('ESTACIÓ FONTANILLAS  /  OBSERVACIÓ REAL');
 headline(['Això no és previsió.','És el que mesurem.'],515,75);
 text(`Lectura ${String(data.current.updated).slice(0,10).split('-').reverse().join('/')} · ${String(data.current.updated).slice(11,16)} h`,88,718,28,C.muted,'DM Sans');
 text(num(data.current.temperature,1)+'°',80,956,205,C.paper,'Manrope',700);
 text('TEMPERATURA REAL · °C',88,1012,24,C.mint,'DM Sans');
 const tr=data.trend;chart(tr?.points||[],{x:88,y:1090,w:838,h:227},ease(local/2.2),C.mint);
 text(tr?`${num(tr.hours,1)} h d’històric · mín. ${num(tr.minimum,1)}° · màx. ${num(tr.maximum,1)}°`:'Històric insuficient: no dibuixem una evolució inventada.',88,1440,27,C.muted,'DM Sans',838);
}
function nextDays(t,local){
 badge('LA TENDÈNCIA  /  TRES DIES');headline(['I després,','què ens espera?'],515,87);
 text('Màxima i mínima previstes · °C',88,704,28,C.muted,'DM Sans');
 data.days.slice(1,4).forEach((d,i)=>{
  const y=785+i*208;
  // A common vertical rail ties the three dates together, avoiding separate cards.
  line(100,y-22,100,y+148,'#a6e5c040',2);circle(100,y+7,6,C.mint);
  const label=new Intl.DateTimeFormat('ca-ES',{weekday:'long',day:'numeric',month:'short',timeZone:'Europe/Madrid'}).format(new Date(d.date+'T12:00Z'));
  text(label.charAt(0).toUpperCase()+label.slice(1),135,y+17,28,C.mint,'DM Sans',670);
  text(d.condition,135,y+75,35,C.paper,'Manrope',550);
  text(`${num(d.max)}° / ${num(d.min)}°`,135,y+141,45,C.paper,'Manrope',600);
  icon(d.weatherCode,842,y+79,46,t+i);
  if(i<2)line(135,y+174,926,y+174,'#ffffff1b');
 });
 text('Open-Meteo · tendència orientativa, subjecta a actualitzacions',88,1440,26,C.muted,'DM Sans');
}
function mapScene(t,local){
 badge('PRECIPITACIÓ  /  MODEL, NO RADAR');
 const r=data.rain;
 const available=r.available&&r.frames?.length===4&&r.points?.length>0;
 const allZero=available&&r.frames.every(f=>f.values.length===r.points.length&&f.values.every(v=>valid(v)&&v===0));
 headline(allZero?['El model no marca','pluja en aquests punts.']:['La pluja,','situada al mapa.'],515,73);
 if(!available){text('Mapa temporalment no disponible',88,910,40,C.muted);text('Consulta la previsió actualitzada a la web.',88,1080,30);return;}
 const fi=Math.min(3,Math.floor(local/1.25)),f=r.frames[fi];
 const bx=88,by=756,bw=838,bh=427,scale=2.15,ox=210,oy=80;
 text(f.time.slice(11,16)+' h',88,714,58,C.blue);text('Acumulació de l’hora anterior',370,707,26,C.muted,'DM Sans',550);
 round(bx,by,bw,bh,30,'#061813','#7bbf9933');ctx.save();ctx.beginPath();ctx.roundRect(bx,by,bw,bh,30);ctx.clip();
 ctx.translate(bx-ox*scale,by-oy*scale);ctx.scale(scale,scale);
 r.counties.forEach(c=>{const p=new Path2D(c.path);ctx.fillStyle=c.id===41?'#305846':'#16382d';ctx.fill(p);ctx.strokeStyle=c.id===41?'#bce5cb':'#658677';ctx.lineWidth=c.id===41?.95:.5;ctx.stroke(p);});
 r.points.slice(1).forEach((p,i)=>{const v=f.values[i+1];if(!valid(v))return;circle(p.x,p.y,v===0?1:4,v===0?'#b3d4be66':v<1?C.blue:v<5?C.mint:v<10?C.sun:'#ed985c');});
 const st=r.points[0];circle(st.x,st.y,4.5,C.ink);circle(st.x,st.y,2.6,C.paper);ctx.restore();
 const sx=bx+(st.x-ox)*scale,sy=by+(st.y-oy)*scale;
 line(sx+10,sy-5,sx+55,sy-30,C.paper,1.5);round(sx+50,sy-55,195,40,20,C.ink);text('Sant Celoni',sx+65,sy-27,23,C.paper,'DM Sans',170);
 r.frames.forEach((f,j)=>{const x=88+j*215;round(x,1210,194,46,23,j===fi?C.blue:'#ffffff09');text(f.time.slice(11,16),x+97,1242,25,j===fi?C.ink:C.muted,'DM Sans',175,'center');});
 text(`Sant Celoni: ${num(f.values[0],1)} mm / 1 h`,88,1310,33,C.paper,'Manrope',838);
 if(allZero)text('Punts mostrats: 0 mm en les quatre hores seleccionades.',88,1350,25,C.muted,'DM Sans');
 else {['<1','1–5','5–10','≥10'].forEach((label,i)=>{circle(98+i*175,1341,5,[C.blue,C.mint,C.sun,'#ed985c'][i]);text(label,115+i*175,1350,24,C.muted,'DM Sans',140);});text('mm / 1 h',926,1350,23,C.muted,'DM Sans',160,'right');}
 text('AROME HD via Open-Meteo · graella mostrejada · mapa ICGC',88,1391,23,C.muted,'DM Sans');
 text('El temps canvia. Segueix-ne l’evolució amb nosaltres.',88,1460,29,C.mint,'Manrope',838);
}
function verify(){
 const errors=boxes.filter(b=>b.x<76||b.x+b.width>946||b.y<185||b.y+b.height>1710);
 for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];if(x.x<y.x+y.width-2&&x.x+x.width>y.x+2&&x.y<y.y+y.height-2&&x.y+x.height>y.y+2)errors.push({overlap:[x.s,y.s]});}
 return errors;
}
function environmentScene(t,local){
 const s=data.environment.selection,m=s.metric,uv=s.kind==='uv',color=uv?C.sun:C.blue;
 badge(uv?'RADIACIÓ UV  /  PREVISIÓ':'QUALITAT DE L’AIRE  /  PREVISIÓ');
 headline(uv?['El sol també','demana protecció.']:['L’aire que','ens envolta.'],515,84);
 text(`Mostres de ${m.period} · hora local`,88,714,28,C.muted,'DM Sans');
 text(num(m.value,uv?1:0),80,929,186,color,'Manrope',450);
 text(uv?'ÍNDEX UV':'ÍNDEX EUROPEU AQI',88,981,28,color,'DM Sans');
 text('MÀXIM HORARI PREVIST',560,844,23,C.muted,'DM Sans',365);
 text(m.peakTime.slice(11,16)+' h',560,913,57,C.paper,'Manrope',365);
 text(uv?'No és el valor del sensor.':'Model regional, no sensor local.',560,965,24,C.muted,'DM Sans',365);
 const max=Math.max(uv?3:20,...m.rows.map(r=>r.value))*1.15;
 const x=r=>100+(r.hour-m.rows[0].hour)/(m.rows.at(-1).hour-m.rows[0].hour)*814;
 const y=r=>1185-r.value/max*135;
 line(100,1185,914,1185,'#ffffff28');
 ctx.save();ctx.beginPath();ctx.rect(88,1020,850*ease(local/1.4),180);ctx.clip();
 ctx.beginPath();m.rows.forEach((r,i)=>i?ctx.lineTo(x(r),y(r)):ctx.moveTo(x(r),y(r)));ctx.lineWidth=4;ctx.strokeStyle=color;ctx.stroke();
 m.rows.forEach(r=>circle(x(r),y(r),4,color));ctx.restore();
 text(m.rows[0].time.slice(11,16),100,1226,24,C.muted,'DM Sans',150);
 text(m.rows.at(-1).time.slice(11,16),914,1226,24,C.muted,'DM Sans',150,'right');
 text(uv?'A partir d’UV 3: ombra, roba i protecció solar.':'Consulta les recomanacions oficials de qualitat de l’aire.',88,1320,32,C.paper,'Manrope',838);
 text(uv?'CAMS global (~45 km) · Open-Meteo · consell OMS':'CAMS ENSEMBLE (~11 km) · Open-Meteo',88,1382,24,C.muted,'DM Sans',838);
 text('Estimació del model, no una mesura a peu de carrer.',88,1424,24,C.muted,'DM Sans',838);
}
window.renderMidday=()=>{
 canvas.height=1350;boxes=[];backdrop(0,0);
 ctx.drawImage(logo,72,68,68,68);text('Meteo Fontanillas',162,98,32);text('SANT CELONI · PILOT DE MIGDIA',162,130,21,C.muted,'DM Sans');
 text(data.date.split('-').reverse().join('/')+' · hora de Sant Celoni',72,202,26,C.mint,'DM Sans');
 text('Ara, i el que queda del dia.',72,274,46,C.paper,'Manrope',935);
 text(num(data.current.temperature,1)+'°',65,435,151,C.paper,'Manrope',700);
 text('OBSERVACIÓ FONTANILLAS · °C',72,484,23,C.mint,'DM Sans');
 text(`Lectura real: ${String(data.current.updated).replace('T',' ').slice(0,16)}`,72,525,25,C.muted,'DM Sans',935);
 const tr=data.trend,points=(tr?.points||[]).filter(p=>valid(p.temperature)&&valid(p.epoch));
 if(points.length>=2){
  text(`EVOLUCIÓ OBSERVADA · ${num(tr.hours)} H`,568,329,22,C.muted,'DM Sans',438);
  const min=Math.min(...points.map(p=>p.temperature)),max=Math.max(...points.map(p=>p.temperature)),duration=points.at(-1).epoch-points[0].epoch;
  ctx.beginPath();points.forEach((p,i)=>{const x=572+(p.epoch-points[0].epoch)/Math.max(1,duration)*426,y=429-(p.temperature-min)/Math.max(1,max-min)*70;i&&p.epoch-points[i-1].epoch<=7200?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.strokeStyle=C.mint;ctx.lineWidth=3;ctx.stroke();
  text(`Mín. ${num(tr.minimum,1)}° · màx. ${num(tr.maximum,1)}°`,568,484,24,C.muted,'DM Sans',438);
 }
 // The 14:00 image never repeats the morning. The afternoon is recomputed
 // by the collector from 14:00, not the full 12–19 part.
 (data.middayParts||data.day.dayparts.slice(1)).forEach((p,i)=>{
  const y=601+i*191;line(72,y-30,1008,y-30,'#ffffff26');
  text(`${p.label.toUpperCase()} · ${p.timeLabel} H`,72,y+10,24,C.mint,'DM Sans',935);
  text(p.condition,72,y+64,35,C.paper,'Manrope',700);
  text(`${num(p.min)}–${num(p.max)}°`,72,y+122,47,C.paper,'Manrope',380);
  text(`Pluja ${num(p.rainProbability)}% · màx. horària`,490,y+112,26,C.blue,'DM Sans',515);
  if(i===0||p.weatherCode>=3)icon(p.weatherCode,931,y+46,34,0,false);
 });
 const s=data.environment.midday;
 line(72,971,1008,971,'#ffffff26');
 text('PREVISIÓ AMBIENTAL · MOSTRES 14–23 H',72,1014,24,C.mint,'DM Sans',935);
 text(`UV màx. ${num(s.uv?.value,1)}`,72,1081,38,C.sun,'Manrope',450);
 const airLevel=!s.air?'—':s.air.value<=20?'bona':s.air.value<=40?'raonable':s.air.value<=60?'moderada':s.air.value<=80?'dolenta':s.air.value<=100?'molt dolenta':'extrema';
 text(`Qualitat ${airLevel}`,560,1081,38,C.blue,'Manrope',448);
 text(s.uv?.value>=3?'Protecció solar a partir d’UV 3':s.uv?'Màxim de les mostres horàries':'UV previst no disponible',72,1122,23,C.muted,'DM Sans',450);
 text(s.air?`Índex europeu màxim: ${num(s.air.value)}`:'Aire previst no disponible',560,1122,23,C.muted,'DM Sans',448);
 text('CAMS global (~45 km)',72,1158,23,C.muted,'DM Sans',450);
 text('CAMS ENSEMBLE (~11 km)',560,1158,23,C.muted,'DM Sans',448);
 text('Models via Open-Meteo · no són lectures del sensor.',72,1204,24,C.muted,'DM Sans',935);
 text('meteo.fontanillas.cat',72,1264,29,C.mint);
 text('PREVISUALITZACIÓ · NO PUBLICADA',1008,1264,21,C.muted,'DM Sans',410,'right');
 const errors=boxes.filter(b=>b.x<55||b.x+b.width>1015||b.y<60||b.y+b.height>1300);
 for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];if(x.x<y.x+y.width-2&&x.x+x.width>y.x+2&&x.y<y.y+y.height-2&&x.y+x.height>y.y+2)errors.push({overlap:[x.s,y.s]});}
 return {errors,boxes:[...boxes]};
};
function single(i,local,t){
 if(canvas.height!==H)canvas.height=H;
 boxes=[];backdrop(t,i);if(i<3)forecast(i,t,local);else if(i===3)measured(t,local);else if(i===4)nextDays(t,local);else if(data.environmentEnabled&&data.environment.selection.kind!=='rain')environmentScene(t,local);else mapScene(t,local);identity(t,i);
 return {errors:verify(),boxes:[...boxes]};
}
window.renderPilot=(t,override)=>{
 if(override)data=override;const i=Math.min(5,Math.floor(t/5)),local=t-i*5;
 let previous=null;if(i>0&&local<.32){previous=single(i-1,4.99,t-.001);offCtx.drawImage(canvas,0,0);}
 const current=single(i,local,t);
 if(previous){ctx.save();ctx.globalAlpha=1-ease(local/.32);ctx.drawImage(off,0,0);ctx.restore();current.errors.push(...previous.errors);}
 return current;
};
})();
