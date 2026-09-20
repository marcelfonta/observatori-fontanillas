/* Original canvas art direction. Offline preview only; all weather comes from PILOT_DATA. */
const C={ink:'#071a16',paper:'#edf4eb',mint:'#a6e5c0',muted:'#a9bfb4',blue:'#92d8ed',sun:'#f4d68b'};
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const W=1080,H=1920;
canvas.width=W;canvas.height=H;
let data,logo,boxes=[];
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>1-Math.pow(1-clamp(v),3);
const num=(v,d=0)=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('ca-ES',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const valid=v=>typeof v==='number'&&Number.isFinite(v);
function text(s,x,y,size=32,color=C.paper,font='Manrope',max=820,align='left'){
 s=String(s);ctx.font=`${size}px "${font}"`;while(ctx.measureText(s).width>max&&size>23){size--;ctx.font=`${size}px "${font}"`;}
 const metrics=ctx.measureText(s),width=metrics.width;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y);
 boxes.push({s,x:align==='right'?x-width:align==='center'?x-width/2:x,y:y-metrics.actualBoundingBoxAscent,width,height:metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent});
 return size;
}
function multiline(s,x,y,size=80,max=800,lineHeight=90){
 const words=s.split(' ');let line='',lines=[];ctx.font=`${size}px Manrope`;
 for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>max&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);
 if(lines.length>2&&size>45)return multiline(s,x,y,size-4,max,lineHeight-4);
 for(const [i,l]of lines.entries())text(l,x,y+i*lineHeight,size,C.paper,'Manrope',max);
}
function round(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function line(x,y,x2,y2,color,width=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function background(t,night=false){
 ctx.fillStyle=C.ink;ctx.fillRect(0,0,W,H);
 const glow=ctx.createRadialGradient(900,760,20,600,800,1150);glow.addColorStop(0,night?'#23413e':'#285b45');glow.addColorStop(1,C.ink);ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=C.mint;ctx.lineWidth=1;
 for(let n=0;n<8;n++){ctx.beginPath();for(let i=0;i<30;i++){const x=i*45,y=870+n*39+Math.sin(i/5+t*.07+n*.25)*72; i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.restore();
}
function chrome(t,index){
 ctx.save();ctx.beginPath();ctx.roundRect(86,200,76,76,18);ctx.clip();ctx.drawImage(logo,86,200,76,76);ctx.restore();text('Meteo Fontanillas',184,237,35);text('SANT CELONI · BAIX MONTSENY',184,269,20,C.muted,'DM Sans');
 const date=new Intl.DateTimeFormat('ca-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(data.date+'T12:00Z'));
 text(date.charAt(0).toUpperCase()+date.slice(1),88,348,28,C.mint,'DM Sans');
 text('PILOT',926,234,19,C.muted,'DM Sans',100,'right');
 const labels=['Matí','Tarda','Vespre','Estació','Tendència','Pluja'];
 labels.forEach((label,i)=>{const x=88+i*140;round(x,1512,122,4,2,'#3b564b');if(i<index)round(x,1512,122,4,2,C.mint);if(i===index)round(x,1512,122*clamp((t-i*5)/5),4,2,C.mint);text(label,x,1554,22,i===index?C.paper:C.muted,'DM Sans',126);});
 text('meteo.fontanillas.cat',88,1640,28,C.mint,'Manrope');text(index===3?'OBSERVACIÓ LOCAL · NO ÉS UN AVÍS OFICIAL':'PREVISIÓ · NO ÉS UN AVÍS OFICIAL',88,1682,21,C.muted,'DM Sans');
}
function icon(code,x,y,r,t,night=false){
 if(code===null||code===undefined){text('—',x,y,54,C.muted,'DM Sans',r*2,'center');return;}
 ctx.save();ctx.translate(x,y);ctx.scale(r/120,r/120);
 const clear=code===0,partly=code===1||code===2,cloud=!clear;
 if(clear||partly){ctx.save();if(partly)ctx.translate(-45,-35);
  if(night){ctx.beginPath();ctx.arc(0,0,68,-Math.PI/2,Math.PI/2,true);ctx.bezierCurveTo(-12,35,-36,-33,0,-68);ctx.fillStyle='#d0e8e7';ctx.fill();}
  else {const glow=ctx.createRadialGradient(0,0,40,0,0,115);glow.addColorStop(0,'#f4d68b44');glow.addColorStop(1,'#f4d68b00');circle(0,0,115,glow);circle(0,0,55,C.sun);ctx.rotate(t*.10);for(let i=0;i<12;i++){ctx.rotate(Math.PI/6);line(0,-76,0,-92,C.sun,4);}}
  ctx.restore();
 }
 if(cloud){ctx.translate(Math.sin(t*.5)*5,0);ctx.fillStyle=C.paper;ctx.beginPath();ctx.moveTo(-75,42);ctx.bezierCurveTo(-132,42,-138,-38,-76,-38);ctx.bezierCurveTo(-66,-105,39,-109,62,-32);ctx.bezierCurveTo(136,-32,138,49,77,49);ctx.closePath();ctx.fill();
 if(code>=51&&code<=67||code>=80&&code<=82||code>=95){for(let i=0;i<5;i++){const yy=75+((t*48+i*17)%65);line(-74+i*34,yy,-81+i*34,yy+14,C.blue,4);}}
 if(code===45||code===48){for(let i=0;i<3;i++)line(-105+i*7,75+i*22,100-i*12,75+i*22,C.muted,5);}
 if(code>=71&&code<=77||code===85||code===86){for(let i=0;i<4;i++)circle(-65+i*40,80+((t*17+i*13)%55),4,C.paper);}
 if(code>=95){ctx.beginPath();ctx.moveTo(8,57);ctx.lineTo(-17,99);ctx.lineTo(10,96);ctx.lineTo(-4,133);ctx.lineTo(49,82);ctx.lineTo(21,83);ctx.lineTo(38,57);ctx.fillStyle=C.sun;ctx.fill();}
 }
 ctx.restore();
}
function daypart(i,t,local){
 const p=data.day.dayparts[i];text('EL DIA, FRANJA A FRANJA',88,430,23,C.mint,'DM Sans');
 text(p.label,88,554,108);text(p.timeLabel+' h',90,608,32,C.muted,'DM Sans');
 text('0'+(i+1),932,571,118,'#ffffff12','Manrope',170,'right');
 const opacity=ease(local/.45);ctx.save();ctx.globalAlpha=opacity;
 icon(p.weatherCode,704,803+10*(1-opacity),133,t,i===2);
 multiline(p.condition,88,765,65,480,74);
 const headline=i===0&&data.day.dayparts.every(p=>p.weatherCode===0)?'El sol marca el dia.':i===1?'Així es presenta la tarda.':'La previsió, hora a hora.';
 text(headline,88,961,31,C.mint,'DM Sans');
 text(`${num(p.min)}–${num(p.max)}°`,80,1131,155,C.paper,'Manrope',810);
 text('Temperatura prevista dins la franja · °C',88,1180,28,C.muted,'DM Sans');
 line(88,1217,926,1217,'#ffffff28');
 text('PLUJA',88,1263,21,C.muted,'DM Sans');text(`${num(p.rainProbability)}%`,88,1330,52,C.blue);
 text('màxim horari',240,1327,25,C.muted,'DM Sans',225);
 text('RATXA MÀXIMA',564,1263,21,C.muted,'DM Sans');text(`${num(p.gust)} km/h`,564,1330,45,C.paper,'Manrope',355);
 text('Open-Meteo · hora local de Sant Celoni',88,1410,24,C.muted,'DM Sans');
 text('La probabilitat indicada no correspon a tota la franja.',88,1450,23,C.muted,'DM Sans');ctx.restore();
}
function chart(points,box,progress,color,{epoch=true}={}){
 const ps=points.filter(p=>valid(p.temperature)&&valid(p.epoch));if(ps.length<2){text('Històric no disponible',box.x,box.y+70,30,C.muted);return;}
 const lo=Math.floor(Math.min(...ps.map(p=>p.temperature)))-1,hi=Math.ceil(Math.max(...ps.map(p=>p.temperature)))+1;
 const xmin=ps[0].epoch,xmax=ps.at(-1).epoch;
 const xy=p=>({x:box.x+(p.epoch-xmin)/Math.max(1,xmax-xmin)*box.w,y:box.y+box.h-(p.temperature-lo)/(hi-lo)*box.h});
 for(let j=0;j<3;j++){const yy=box.y+j*box.h/2;line(box.x,yy,box.x+box.w,yy,'#ffffff1b');text(num(hi-j*(hi-lo)/2)+'°',box.x,yy-15,24,C.muted,'DM Sans');}
 ctx.save();ctx.beginPath();ctx.rect(box.x-8,box.y-8,(box.w+16)*clamp(progress),box.h+16);ctx.clip();
 ctx.beginPath();let prev=null;
 for(const p of ps){const q=xy(p);if(!prev||p.epoch-prev.epoch>7200)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);prev=p;}
 ctx.strokeStyle=color;ctx.lineWidth=5;ctx.lineJoin='round';ctx.stroke();ctx.restore();
 const shown=ps[Math.min(ps.length-1,Math.floor((ps.length-1)*progress))],q=xy(shown);circle(q.x,q.y,11,C.ink);circle(q.x,q.y,6,C.paper);
 const label=v=>new Intl.DateTimeFormat('ca-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(v*1000));
 text(label(xmin),box.x,box.y+box.h+42,24,C.muted,'DM Sans',320);text(label(xmax),box.x+box.w,box.y+box.h+42,24,C.muted,'DM Sans',320,'right');
}
function observation(t,local){
 text('OBSERVACIÓ · NO ÉS PREVISIÓ',88,430,23,C.mint,'DM Sans');multiline('El temps que\nhem mesurat.'.replace('\n',' '),88,553,83,800,94);
 text('Estació Fontanillas · lectura '+String(data.current.updated).slice(11,16)+' h',88,718,28,C.muted,'DM Sans');
 text(num(data.current.temperature,1)+'°',80,951,196,C.paper,'Manrope',840);
 text('TEMPERATURA REAL · °C',88,1006,23,C.mint,'DM Sans');
 const tr=data.trend;chart(tr?.points||[],{x:88,y:1110,w:838,h:220},ease(local/2.6),C.mint);
 text(tr?`${num(tr.hours,1)} h d’observacions · mín. ${num(tr.minimum,1)}° · màx. ${num(tr.maximum,1)}°`:'Sense prou lectures per dibuixar l’evolució',88,1450,27,C.muted,'DM Sans');
}
function trend(t,local){
 text('TENDÈNCIA · PROPERS DIES',88,430,23,C.mint,'DM Sans');multiline('I després\nd’avui?'.replace('\n',' '),88,553,92,780,100);
 text('Màxima i mínima diàries previstes',88,688,29,C.muted,'DM Sans');
 data.days.slice(1,4).forEach((d,i)=>{const y=746+i*211;
  round(88,y,838,189,28,'#ffffff08','#ffffff22');
  const label=new Intl.DateTimeFormat('ca-ES',{weekday:'short',day:'numeric',month:'short',timeZone:'Europe/Madrid'}).format(new Date(d.date+'T12:00Z'));
  text(label.toUpperCase(),117,y+47,23,C.mint,'DM Sans',350);text(d.condition,117,y+97,31,C.paper,'Manrope',495);text('Màx. / mín.',117,y+145,24,C.muted,'DM Sans');
  text(`${num(d.max)}° / ${num(d.min)}°`,876,y+149,41,C.paper,'Manrope',300,'right');icon(d.weatherCode,822,y+63,32,t+i);
 });
 text('Open-Meteo · la previsió es pot actualitzar',88,1450,27,C.muted,'DM Sans');
}
function rain(t,local){
 text('PRECIPITACIÓ · EVOLUCIÓ PREVISTA',88,430,23,C.blue,'DM Sans');text('La pluja, al mapa.',88,547,76,C.paper,'Manrope',830);
 const rain=data.rain;if(!rain.available){text('Mapa temporalment no disponible',88,800,40,C.muted);text('Consulta la previsió actualitzada a la web.',88,960,29);return;}
 const index=Math.min(3,Math.floor(local/1.25)),f=rain.frames[index],hour=f.time.slice(11,16);
 text(hour+' h',88,641,68,C.blue);text('Acumulació de l’hora anterior',88,685,27,C.muted,'DM Sans',830);
 round(88,710,838,490,30,'#061813','#ffffff25');ctx.save();ctx.beginPath();ctx.roundRect(88,710,838,490,30);ctx.clip();
 // Geographic geometry from ICGC. Coarse samples are circles, never fake radar fields.
 const scale=2.2;ctx.translate(88-210*scale,710-72*scale);ctx.scale(scale,scale);
 rain.counties.forEach(c=>{const p=new Path2D(c.path);ctx.fillStyle=c.id===41?'#254e40':'#15372d';ctx.fill(p);ctx.strokeStyle='#638976';ctx.lineWidth=.55;ctx.stroke(p);});
 rain.points.slice(1).forEach((p,i)=>{const v=f.values[i+1];if(v===null)return;if(v<.05){circle(p.x,p.y,.6,'#9ebdaa66');return;}circle(p.x,p.y,4,v<1?'#92d8ed':v<5?'#a6e5c0':v<10?'#f4d68b':'#ed985c');});
 const st=rain.points[0];circle(st.x,st.y,3.8,C.paper);ctx.strokeStyle=C.ink;ctx.lineWidth=1.5;ctx.stroke();
 ctx.restore();
 // Label in canvas coordinates, tied to the real station point.
 const px=88+(st.x-210)*scale,py=710+(st.y-72)*scale;
 round(px-66,py+18,206,36,18,C.ink);text('SANT CELONI',px-48,py+43,20,C.paper,'DM Sans',190);
 text(`Sant Celoni · ${num(f.values[0],1)} mm en 1 h`,88,1247,31,C.paper,'Manrope',838);
 ['<1','1–5','5–10','≥10'].forEach((v,i)=>{circle(102+i*176,1293,6,[C.blue,C.mint,C.sun,'#ed985c'][i]);text(v,120+i*176,1302,23,C.muted,'DM Sans',135);});text('mm / 1 h',926,1302,23,C.muted,'DM Sans',170,'right');
 text('AROME HD via Open-Meteo · punts mostrejats · mapa ICGC',88,1362,23,C.muted,'DM Sans');
 text('És un model de previsió, no una imatge de radar.',88,1405,25,C.muted,'DM Sans');
 text('Segueix-nos per veure com evoluciona.',88,1460,29,C.mint,'Manrope',840);
}
window.initPilot=async payload=>{
 data=payload;const a=new FontFace('Manrope','url(data:font/ttf;base64,'+payload.fonts.manrope+')'),b=new FontFace('DM Sans','url(data:font/ttf;base64,'+payload.fonts.dm+')');
 await Promise.all([a.load(),b.load()]);document.fonts.add(a);document.fonts.add(b);
 logo=new Image();logo.src='data:image/png;base64,'+payload.logo;await logo.decode();
};
window.renderPilot=(t,override)=>{
 if(override)data=override;boxes=[];const i=Math.min(5,Math.floor(t/5)),local=t-i*5;
 background(t,i===2);ctx.save();
 // Quiet reveal rather than a flash or zoom; typography stays stationary after 0.35 s.
 ctx.globalAlpha=.45+.55*ease(local/.35);ctx.translate(0,12*(1-ease(local/.35)));
 if(i<3)daypart(i,t,local);else if(i===3)observation(t,local);else if(i===4)trend(t,local);else rain(t,local);
 ctx.restore();chrome(t,i);
 const errors=boxes.filter(b=>b.x<76||b.x+b.width>946||b.y<185||b.y+b.height>1710);
 for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){
  const x=boxes[a],y=boxes[b];if(x.x<y.x+y.width-2&&x.x+x.width>y.x+2&&x.y<y.y+y.height-2&&x.y+x.height>y.y+2)errors.push({overlap:[x.s,y.s]});
 }
 return {errors,boxes};
};
