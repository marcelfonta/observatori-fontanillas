"use strict";

const SHARE_TITLE_FALLBACK="Observatori Meteorològic Fontanillas";
const SHARE_TEXT="Consulta l’Observatori Meteorològic Fontanillas:";
const shareState={current:null,forecast:null,alerts:null};
const numeric=value=>value!==null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
const format=(value,digits=1)=>numeric(value)===null?'—':numeric(value).toLocaleString('ca-ES',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const weatherCodes={0:'Cel serè',1:'Poc ennuvolat',2:'Intervals de núvols',3:'Cel cobert',45:'Boira',48:'Boira gebradora',51:'Plugim',53:'Plugim',55:'Plugim intens',61:'Pluja feble',63:'Pluja',65:'Pluja intensa',71:'Neu feble',73:'Neu',75:'Neu intensa',80:'Ruixats',81:'Ruixats',82:'Ruixats forts',95:'Tempesta',96:'Tempesta amb calamarsa',99:'Tempesta forta'};

export function updateShareContext(patch){Object.assign(shareState,patch||{});}

export function buildShareCardModel(context={},url='',title=SHARE_TITLE_FALLBACK,page=''){
  const current=context.current||null;const daily=context.forecast?.daily||null;const alerts=context.alerts||null;
  const alertCount=alerts?.ok?(Number.isFinite(Number(alerts.active))?Number(alerts.active):(alerts.alerts||[]).length):null;
  const base={brand:'Observatori Fontanillas',place:'Sant Celoni · Baix Montseny',url,title:String(title||SHARE_TITLE_FALLBACK).replace(/\s*[|·–-]\s*Observatori.*$/i,''),label:'Consulta meteorològica',primary:'Dades locals i fonts contrastades',secondary:'Observació, predicció i avisos en un sol portal',facts:[]};
  if(page==='avisos'&&alertCount!==null){return {...base,label:'Vigilància oficial',primary:alertCount?`${alertCount} ${alertCount===1?'avís actiu':'avisos actius'}`:'Sense avisos actius',secondary:alertCount?`Nivell màxim · ${alerts.maxLevel||'consulta el detall'}`:'Darrera comprovació oficial disponible',facts:['AEMET · Meteocat','Consulta el detall abans de prendre decisions']};}
  if(page==='prediccio'&&daily?.time?.length){const code=numeric(daily.weather_code?.[0]);return {...base,label:'Predicció per a Sant Celoni',primary:weatherCodes[code]||'Temps variable',secondary:`Màx. ${format(daily.temperature_2m_max?.[0])} °C · Mín. ${format(daily.temperature_2m_min?.[0])} °C`,facts:[`Pluja · ${format(daily.precipitation_probability_max?.[0],0)}%`,`Ratxa · ${format(daily.wind_gusts_10m_max?.[0],0)} km/h`]};}
  if(current&&numeric(current.temperature)!==null){return {...base,label:'Observació en directe',primary:`${format(current.temperature)} °C`,secondary:`Sensació ${format(current.feelsLike)} °C · Humitat ${format(current.humidity,0)}%`,facts:[`Vent · ${format(current.windSpeed)} km/h`,`Pluja avui · ${format(current.rainToday)} mm`,alertCount===null?'Avisos · comprova la font oficial':alertCount?`Avisos · ${alertCount} actius`:'Avisos · cap d’actiu']};}
  return base;
}

function currentShareUrl(){return window.location.href.split('#')[0];}
function currentShareTitle(){return document.title||SHARE_TITLE_FALLBACK;}
function currentPage(){return document.body.dataset.page||new URL(currentShareUrl()).searchParams.get('page')||'inici';}
function openExternal(url){const popup=window.open(url,'_blank','noopener,noreferrer');if(popup)popup.opener=null;else window.location.href=url;}
async function copyText(text){if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return;}const textarea=document.createElement('textarea');textarea.value=text;textarea.setAttribute('readonly','');textarea.style.position='fixed';textarea.style.left='-9999px';document.body.append(textarea);textarea.select();document.execCommand('copy');textarea.remove();}

function roundedRect(ctx,x,y,width,height,radius){const r=Math.min(radius,width/2,height/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+width,y,x+width,y+height,r);ctx.arcTo(x+width,y+height,x,y+height,r);ctx.arcTo(x,y+height,x,y,r);ctx.arcTo(x,y,x+width,y,r);ctx.closePath();}
function fitText(ctx,text,maxWidth,startSize,minSize=30){let size=startSize;while(size>minSize){ctx.font=`700 ${size}px system-ui,-apple-system,sans-serif`;if(ctx.measureText(text).width<=maxWidth)return size;size-=2;}return minSize;}

function drawShareCard(canvas,model){
  const ctx=canvas.getContext('2d');const width=canvas.width=1200;const height=canvas.height=630;
  const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,'#071712');gradient.addColorStop(.55,'#123427');gradient.addColorStop(1,'#286d55');ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
  ctx.globalAlpha=.13;ctx.fillStyle='#b6f2c8';ctx.beginPath();ctx.arc(1040,90,300,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  roundedRect(ctx,54,48,1092,534,34);ctx.fillStyle='rgba(4,18,13,.58)';ctx.fill();ctx.strokeStyle='rgba(174,239,193,.27)';ctx.lineWidth=2;ctx.stroke();
  roundedRect(ctx,88,82,76,76,20);ctx.fillStyle='rgba(137,214,163,.12)';ctx.fill();ctx.strokeStyle='rgba(174,239,193,.4)';ctx.stroke();
  ctx.fillStyle='#8be1a7';ctx.beginPath();ctx.moveTo(102,139);ctx.lineTo(126,102);ctx.lineTo(153,139);ctx.closePath();ctx.fill();ctx.fillStyle='#55a98b';ctx.beginPath();ctx.moveTo(122,139);ctx.lineTo(143,112);ctx.lineTo(159,139);ctx.closePath();ctx.fill();ctx.fillStyle='#f4c06c';ctx.beginPath();ctx.arc(145,95,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#f5faf6';ctx.font='700 31px system-ui,-apple-system,sans-serif';ctx.fillText(model.brand,186,111);ctx.fillStyle='#a9c1b5';ctx.font='500 21px system-ui,-apple-system,sans-serif';ctx.fillText(model.place,186,143);
  ctx.fillStyle='#8be1a7';ctx.font='800 18px system-ui,-apple-system,sans-serif';ctx.fillText(model.label.toUpperCase(),90,225);
  const primarySize=fitText(ctx,model.primary,860,86,48);ctx.fillStyle='#f7fbf8';ctx.font=`750 ${primarySize}px system-ui,-apple-system,sans-serif`;ctx.fillText(model.primary,88,320);
  ctx.fillStyle='#c2d5ca';ctx.font='500 27px system-ui,-apple-system,sans-serif';ctx.fillText(model.secondary,90,375);
  let factX=90;(model.facts||[]).slice(0,3).forEach(fact=>{ctx.font='700 18px system-ui,-apple-system,sans-serif';const boxWidth=Math.min(310,ctx.measureText(fact).width+34);roundedRect(ctx,factX,420,boxWidth,48,24);ctx.fillStyle='rgba(137,214,163,.11)';ctx.fill();ctx.strokeStyle='rgba(137,214,163,.24)';ctx.stroke();ctx.fillStyle='#d9ede0';ctx.fillText(fact,factX+17,451);factX+=boxWidth+12;});
  ctx.fillStyle='#91ad9f';ctx.font='600 17px system-ui,-apple-system,sans-serif';ctx.fillText(model.url.replace(/^https?:\/\//,'').slice(0,92),90,536);
  ctx.textAlign='right';ctx.fillStyle='#8be1a7';ctx.font='800 16px system-ui,-apple-system,sans-serif';ctx.fillText('DADES · CONTEXT · FONTS',1110,536);ctx.textAlign='left';
}

function canvasBlob(canvas){return new Promise(resolve=>canvas.toBlob(resolve,'image/png',.95));}
function downloadBlob(blob,filename){const href=URL.createObjectURL(blob);const link=document.createElement('a');link.href=href;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);}

function enhanceDialog(modal){
  const dialog=modal.querySelector('[role="dialog"]');if(!dialog||dialog.querySelector('.share-premium'))return;
  dialog.classList.add('share-dialog');const actions=[...dialog.children].find(child=>child.querySelector?.('[data-share]'));actions?.classList.add('share-actions');
  const intro=document.createElement('p');intro.className='share-intro';intro.textContent='Comparteix l’enllaç o una targeta visual amb les dades disponibles en aquest moment.';
  const premium=document.createElement('section');premium.className='share-premium';premium.innerHTML='<canvas id="share-card-canvas" width="1200" height="630" aria-label="Previsualització de la targeta meteorològica"></canvas><div class="share-premium__actions"><button type="button" data-share="card">Compartir targeta</button><button type="button" data-share="download-card">Descarregar PNG</button></div>';
  const title=dialog.querySelector('#share-title');title?.after(intro,premium);
}

export function initShare(){
  const modal=document.getElementById('shareModal');const shareBtn=document.getElementById('share-btn');const closeBtn=document.getElementById('share-close');if(!modal||!shareBtn)return false;if(shareBtn.dataset.shareReady==='1')return true;shareBtn.dataset.shareReady='1';enhanceDialog(modal);
  const canvas=modal.querySelector('#share-card-canvas');const model=()=>buildShareCardModel(shareState,currentShareUrl(),currentShareTitle(),currentPage());
  function openShare(event){event?.preventDefault?.();event?.stopPropagation?.();if(canvas)drawShareCard(canvas,model());modal.hidden=false;modal.style.display='flex';document.body.style.overflow='hidden';requestAnimationFrame(()=>modal.querySelector('[data-share="card"]')?.focus());}
  function closeShare(){modal.style.display='none';modal.hidden=true;document.body.style.overflow='';shareBtn.focus?.({preventScroll:true});}
  async function copyLink(){const text=`${SHARE_TEXT}\n${currentShareUrl()}`;try{await copyText(text);alert('Text i enllaç copiats!');}catch{alert(`No s’ha pogut copiar automàticament. Enllaç: ${currentShareUrl()}`);}closeShare();}
  async function getCardFile(){if(!canvas)return null;drawShareCard(canvas,model());const blob=await canvasBlob(canvas);if(!blob)return null;return typeof File==='function'?new File([blob],'observatori-fontanillas.png',{type:'image/png'}):blob;}
  async function shareCard(){const file=await getCardFile();const canShareFile=file&&typeof File==='function'&&file instanceof File&&navigator.share&&navigator.canShare?.({files:[file]});if(canShareFile){try{await navigator.share({title:currentShareTitle(),text:SHARE_TEXT,files:[file]});closeShare();return;}catch(error){if(error?.name==='AbortError')return;}}if(file)downloadBlob(file,'observatori-fontanillas.png');try{await copyText(`${SHARE_TEXT}\n${currentShareUrl()}`);}catch{}alert('Targeta descarregada i enllaç copiat.');closeShare();}
  async function nativeShare(){if(navigator.share){try{await navigator.share({title:currentShareTitle(),text:SHARE_TEXT,url:currentShareUrl()});closeShare();return;}catch(error){if(error?.name==='AbortError')return;}}await copyLink();}
  shareBtn.addEventListener('click',openShare);closeBtn?.addEventListener('click',closeShare);modal.addEventListener('click',event=>{if(event.target===modal)closeShare();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!modal.hidden)closeShare();});
  modal.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async()=>{const url=currentShareUrl();const title=currentShareTitle();switch(button.dataset.share){case'card':await shareCard();break;case'download-card':{const file=await getCardFile();if(file)downloadBlob(file,'observatori-fontanillas.png');break;}case'copy':await copyLink();break;case'whatsapp':openExternal(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`);closeShare();break;case'x':openExternal(`https://x.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(url)}`);closeShare();break;case'facebook':openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);closeShare();break;case'email':window.location.href=`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${SHARE_TEXT} ${url}`)}`;closeShare();break;case'instagram':case'tiktok':await shareCard();break;case'native':await nativeShare();break;}}));
  window.openShare=openShare;window.closeShare=closeShare;return true;
}
