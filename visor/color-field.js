// These stops drive both the raster and its legend. Rain is an hourly total.
export const palettes = {
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
export function paintField(pixels, size, values, variable) {
  const stops = palettes[variable], min=stops[0][0], max=stops.at(-1)[0];
  pixels.fill(0);
  for (let y=0;y<size;y++) {
    const gy=4*(1-y/(size-1)), row=Math.min(3,Math.floor(gy)), dy=gy-row;
    for (let x=0;x<size;x++) {
      const gx=4*x/(size-1), col=Math.min(3,Math.floor(gx)), dx=gx-col;
      const pos=row*5+col;
      let value;
      if (variable==='rain') {
        // Preserve wet/dry boundaries of the samples. Do not create a rain band between them.
        value=values[Math.round(gy)*5+Math.round(gx)];
      } else {
        const a=values[pos],b=values[pos+1],c=values[pos+5],d=values[pos+6];
        if (![a,b,c,d].every(Number.isFinite)) continue;
        value=(1-dy)*(a*(1-dx)+b*dx)+dy*(c*(1-dx)+d*dx);
      }
      if (!Number.isFinite(value)) continue;
      const bin=Math.max(0,Math.min(255,Math.round((value-min)*255/(max-min))));
      const color=lookup[variable][bin], offset=(y*size+x)*4;
      pixels[offset]=color[0]; pixels[offset+1]=color[1]; pixels[offset+2]=color[2]; pixels[offset+3]=255;
    }
  }
}
