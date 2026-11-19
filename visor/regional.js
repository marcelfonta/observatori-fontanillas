const bounds = [[40.4,0],[43.6,4.5]];
const api = 'https://fonta-meteo.marcelfonta.workers.dev/meteofrance/map';
const mercator = lat => Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));

// The provider sends EPSG:4326. Leaflet positions the overlay in Web Mercator.
function project(image) {
  const canvas=document.createElement('canvas');
  canvas.width=image.naturalWidth;
  canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d');
  const south=mercator(bounds[0][0]), north=mercator(bounds[1][0]);
  for(let y=0;y<canvas.height;y++){
    const m=north+(south-north)*(y+.5)/canvas.height;
    const lat=(2*Math.atan(Math.exp(m))-Math.PI/2)*180/Math.PI;
    const row=Math.min(canvas.height-1,Math.floor((bounds[1][0]-lat)*canvas.height/(bounds[1][0]-bounds[0][0])));
    ctx.drawImage(image,0,row,canvas.width,1,0,y,canvas.width,1);
  }
  return canvas.toDataURL();
}
export function regionalLayer(map) {
  const cache=new Map();
  let visible=[], controller, split=0.5;
  function position(){
    if(visible.length!==2)return;
    const divider=map.getContainer().getBoundingClientRect().left+map.getSize().x*split;
    visible.forEach((layer,i)=>{
      const image=layer.getElement(), rect=image.getBoundingClientRect();
      const cut=Math.max(0,Math.min(rect.width,divider-rect.left));
      const fraction=rect.width ? cut/rect.width*100 : 50;
      image.style.clipPath=i===0 ? `inset(0 ${100-fraction}% 0 0)` : `inset(0 0 0 ${fraction}%)`;
    });
  }
  map.on('move zoom resize viewreset',position);
  function clear(){
    controller?.abort();
    visible.forEach(layer=>layer.remove());
    visible=[];
  }
  async function read(model,variable,time,signal){
    const width=matchMedia('(max-width:750px)').matches?840:1500;
    const params=new URLSearchParams({model,layer:variable==='rain'?'precipitation':variable,time,width,height:Math.round(width*.71)});
    const key=params.toString();
    if(cache.has(key))return cache.get(key);
    const response=await fetch(api+'?'+key,{signal});
    if(!response.ok)throw new Error('Mapa no disponible');
    const url=URL.createObjectURL(await response.blob());
    try{
      const image=new Image();image.src=url;await image.decode();
      signal.throwIfAborted();
      const display=new Image();display.src=project(image);await display.decode();
      signal.throwIfAborted();
      if(cache.size>=8)cache.delete(cache.keys().next().value);
      cache.set(key,display);
      return display;
    }finally{URL.revokeObjectURL(url);}
  }
  async function show(model,variable,time){
    controller?.abort();
    const request=new AbortController();
    controller=request;
    const models=model==='compare'?['arome','arpege']:[model];
    try{
      const signal=AbortSignal.any([request.signal,AbortSignal.timeout(20000)]);
      const images=await Promise.all(models.map(name=>read(name,variable,time,signal)));
      if(request.signal.aborted)return false;
      const previous=visible;
      visible=images.map(image=>{
        const frame=image.cloneNode();
        return L.imageOverlay(frame,bounds,{opacity:.83,attribution:'Météo-France · Licence Ouverte'}).addTo(map);
      });
      position();
      previous.forEach(layer=>layer.remove());
      return true;
    }catch(error){
      if(request.signal.aborted)return false;
      clear();throw error;
    }
  }
  return {show,clear,setSplit(value){split=value/100;position();}};
}
