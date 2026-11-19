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
  let current,controller;
  function clear(){
    controller?.abort();
    if(current){current.remove();current=null;}
  }
  async function show(model,variable,time){
    clear();
    const request=new AbortController();
    controller=request;
    const width=matchMedia('(max-width:750px)').matches?840:1500;
    const params=new URLSearchParams({model,layer:variable==='rain'?'precipitation':variable,time,width,height:Math.round(width*.71)});
    const key=params.toString();
    let src=cache.get(key);
    if(!src){
      const response=await fetch(api+'?'+key,{signal:AbortSignal.any([request.signal,AbortSignal.timeout(20000)])});
      if(!response.ok)throw new Error('Mapa no disponible');
      const url=URL.createObjectURL(await response.blob());
      try{
        const image=new Image();image.src=url;await image.decode();
        if(request.signal.aborted)return false;
        src=project(image);
        if(cache.size>=8)cache.delete(cache.keys().next().value);
        cache.set(key,src);
      }finally{URL.revokeObjectURL(url);}
    }
    if(request.signal.aborted)return false;
    current=L.imageOverlay(src,bounds,{opacity:.83,attribution:'Météo-France · Licence Ouverte'}).addTo(map);
    return true;
  }
  return {show,clear};
}
