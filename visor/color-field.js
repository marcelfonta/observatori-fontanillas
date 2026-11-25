// These stops drive both the raster and its legend. Rain is an hourly total.
export const palettes = {
  spreadTemperature:[[0,'#68be91'],[3,'#efda79'],[8,'#d68a6a'],[15,'#93478a']],
  spreadWind:[[0,'#68be91'],[8,'#efda79'],[20,'#d68a6a'],[40,'#93478a']],
  spreadClouds:[[0,'#68be91'],[20,'#efda79'],[50,'#d68a6a'],[100,'#93478a']],
  wetFraction:[[0,'#f1eee0'],[25,'#b3dfce'],[50,'#71b2c4'],[75,'#577db0'],[100,'#663d97']],
  temperature: [[-8,'#5840a0'],[0,'#306fc1'],[6,'#37a5bd'],[12,'#74bd78'],[18,'#f0d15c'],[24,'#ef9445'],[32,'#c33e48']],
  rain: [[0,'#e6efe8'],[0.1,'#93d8b6'],[1,'#43bac5'],[3,'#267dc4'],[8,'#6647b1'],[20,'#c33783']],
  wind: [[0,'#d1e9bc'],[10,'#80ccac'],[20,'#33a9b3'],[35,'#5980bd'],[50,'#ad61ab'],[75,'#dd565e']],
  clouds: [[0,'#ffe7a2'],[20,'#e9d9ac'],[40,'#c7c9bb'],[60,'#9babb8'],[80,'#75879e'],[100,'#4f607e']]
};
const channel = (hex,offset) => parseInt(hex.slice(offset,offset+2),16);
const lookup = {};
for (const [variable, stops] of Object.entries(palettes)) {
  const rgb = stops.map(([value,color])=>[value,[1,3,5].map(offset=>channel(color,offset))]);
  lookup[variable] = Array.from({length:256},(_,i)=>{
    const value = stops[0][0]+i*(stops.at(-1)[0]-stops[0][0])/255;
    let end = rgb.findIndex(([v])=>v>=value);
    if (end<0) end=rgb.length-1;
    const [b,high]=rgb[end], [a,low]=rgb[Math.max(0,end-1)];
    const t=b===a ? 0 : (value-a)/(b-a);
    return low.map((v,k)=>Math.round(v+(high[k]-v)*t));
  });
}
export function interpolateCell(a,b,c,d,dx,dy) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || !Number.isFinite(d)) return NaN;
  return (1-dy)*(a*(1-dx)+b*dx)+dy*(c*(1-dx)+d*dx);
}

export function paintField(pixels, size, values, variable) {
  const stops = palettes[variable], min=stops[0][0], max=stops.at(-1)[0];
  const side=Math.sqrt(values.length), last=side-1;
  pixels.fill(0);
  for (let y=0;y<size;y++) {
    const gy=last*(1-y/(size-1)), row=Math.min(last-1,Math.floor(gy)), dy=gy-row;
    for (let x=0;x<size;x++) {
      const gx=last*x/(size-1), col=Math.min(last-1,Math.floor(gx)), dx=gx-col;
      const pos=row*side+col;
      const value=interpolateCell(values[pos],values[pos+1],values[pos+side],values[pos+side+1],dx,dy);
      if (!Number.isFinite(value)) continue;
      const bin=Math.max(0,Math.min(255,Math.round((value-min)*255/(max-min))));
      const color=lookup[variable][bin], offset=(y*size+x)*4;
      pixels[offset]=color[0]; pixels[offset+1]=color[1]; pixels[offset+2]=color[2]; pixels[offset+3]=255;
    }
  }
}
