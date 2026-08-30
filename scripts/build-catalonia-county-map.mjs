import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const input=resolve(process.argv[2]||'');
const output=resolve(process.argv[3]||'worker/catalonia-counties.js');
if(!process.argv[2])throw new Error('Indica el GeoJSON oficial de comarques de l’ICGC.');

const geojson=JSON.parse(await readFile(input,'utf8'));
const points=[];
const collect=coordinates=>{
  if(typeof coordinates?.[0]==='number')points.push(coordinates);
  else for(const child of coordinates||[])collect(child);
};
for(const feature of geojson.features||[])collect(feature.geometry?.coordinates);
const minX=Math.min(...points.map(point=>point[0]));
const maxX=Math.max(...points.map(point=>point[0]));
const minY=Math.min(...points.map(point=>point[1]));
const maxY=Math.max(...points.map(point=>point[1]));
const width=500;
const height=420;
const padding=4;
const scale=Math.min((width-padding*2)/(maxX-minX),(height-padding*2)/(maxY-minY));
const offsetX=(width-(maxX-minX)*scale)/2;
const offsetY=(height-(maxY-minY)*scale)/2;
const project=([x,y])=>[offsetX+(x-minX)*scale,offsetY+(maxY-y)*scale];

const squaredSegmentDistance=(point,start,end)=>{
  let x=start[0];let y=start[1];
  let dx=end[0]-x;let dy=end[1]-y;
  if(dx!==0||dy!==0){
    const t=((point[0]-x)*dx+(point[1]-y)*dy)/(dx*dx+dy*dy);
    if(t>1){x=end[0];y=end[1];}
    else if(t>0){x+=dx*t;y+=dy*t;}
  }
  dx=point[0]-x;dy=point[1]-y;
  return dx*dx+dy*dy;
};

const simplifyStep=(points,first,last,tolerance,kept)=>{
  let maxDistance=tolerance;let index=0;
  for(let cursor=first+1;cursor<last;cursor++){
    const distance=squaredSegmentDistance(points[cursor],points[first],points[last]);
    if(distance>maxDistance){index=cursor;maxDistance=distance;}
  }
  if(maxDistance>tolerance){
    if(index-first>1)simplifyStep(points,first,index,tolerance,kept);
    kept.push(points[index]);
    if(last-index>1)simplifyStep(points,index,last,tolerance,kept);
  }
};

const simplify=ring=>{
  const projected=ring.map(project);
  const kept=[projected[0]];
  simplifyStep(projected,0,projected.length-1,0.8,kept);
  kept.push(projected.at(-1));
  return kept;
};

const pathForGeometry=geometry=>{
  const polygons=geometry?.type==='MultiPolygon'?geometry.coordinates:[geometry?.coordinates];
  return (polygons||[]).flatMap(polygon=>(polygon||[]).map(ring=>{
    const points=simplify(ring);
    return points.map(([x,y],index)=>`${index?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')+'Z';
  })).join('');
};

const counties=(geojson.features||[]).map(feature=>({
  id:Number(feature.properties?.CODICOMAR),
  name:String(feature.properties?.NOMCOMAR||''),
  path:pathForGeometry(feature.geometry),
})).filter(county=>Number.isInteger(county.id)&&county.path).sort((a,b)=>a.id-b.id);

const source='https://geoserveis.icgc.cat/vector01/rest/services/divisions_administratives_wfs/MapServer/13';
const rows=counties.map(county=>`  ${JSON.stringify(county)}`).join(',\n');
const result=`// Generat a partir dels límits comarcals oficials de l’ICGC.\n// Font: ${source}\nexport const CATALONIA_COUNTY_PATHS=Object.freeze([\n${rows}\n]);\n`;
await writeFile(output,result);
console.log(`Mapa generat: ${counties.length} comarques · ${Buffer.byteLength(result)} bytes`);
