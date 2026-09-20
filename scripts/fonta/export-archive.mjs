import {readFile,writeFile,readdir,mkdir,lstat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readArchive} from './archive.mjs';
import {readRunDirectory} from './hourly-report.mjs';
const capture=/^\d{4}-\d{2}-\d{2}-(am|pm)\.json$/;
const runFile=/^single-runs\/\d{4}-\d{2}-\d{2}\/(probe|ecmwf_ifs025|icon_eu|meteofrance_arome_france)\.json$/;
const hash=data=>createHash('sha256').update(data).digest('hex');
async function runNames(directory){
  const root=join(directory,'single-runs');
  try{const s=await lstat(root);if(!s.isDirectory()||s.isSymbolicLink())throw new Error('Directori v2 invàlid');}catch(e){if(e.code==='ENOENT')return [];throw e;}
  const days=await readdir(root,{withFileTypes:true});
  if(days.length>90)throw new Error('Massa dies v2');
  const names=[];
  for(const d of days){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d.name)||!d.isDirectory()||d.isSymbolicLink())throw new Error('Directori v2 invàlid');
    await readRunDirectory(join(root,d.name));
    for(const n of await readdir(join(root,d.name))){const name='single-runs/'+d.name+'/'+n;if(!runFile.test(name))throw new Error('Fitxer v2 inesperat');names.push(name);}
  }
  return names;
}
async function sourceNames(directory){return [...(await readdir(directory)).filter(n=>capture.test(n)),...await runNames(directory)].sort();}
async function regular(path,max=12*1024*1024){
  const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.size>max)throw new Error('Fitxer no regular o massa gran');
  return readFile(path);
}
export function validateManifest(manifest){
  const legacy=manifest.schema===1&&manifest.kind==='fonta-portable-captures';
  const research=manifest.schema===2&&manifest.kind==='fonta-portable-research';
  if((!legacy&&!research)||!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.length>(legacy?180:540))throw new Error('Manifest invàlid');
  const names=manifest.files.map(f=>f.name);
  if(names.some(n=>typeof n!=='string'||!(capture.test(n)||(research&&runFile.test(n))))||new Set(names).size!==names.length||names.filter(n=>capture.test(n)).length>180||new Set(names.filter(n=>runFile.test(n)).map(n=>n.split('/')[1])).size>90)throw new Error('Noms de captura invàlids');
  if(manifest.files.some(f=>!Number.isSafeInteger(f.bytes)||f.bytes<=0||f.bytes>12*1024*1024||!/^[a-f0-9]{64}$/.test(f.sha256))||
    manifest.files.reduce((s,f)=>s+f.bytes,0)!==manifest.bytes||manifest.bytes>100*1024*1024)throw new Error('Pressupost o mida incorrectes');
  return manifest;
}
export async function verifyExport(directory){
  const manifest=validateManifest(JSON.parse(await regular(join(directory,'manifest.json'),1024*1024)));
  const names=manifest.files.map(f=>f.name);
  const actual=[...(await readdir(directory)).filter(n=>n!=='single-runs'),...await runNames(directory)].sort();
  if(JSON.stringify(actual)!==JSON.stringify([...names,'manifest.json'].sort()))throw new Error('Fitxers absents o inesperats');
  let bytes=0;
  for(const f of manifest.files){
    const data=await regular(join(directory,f.name));
    if(data.length!==f.bytes||hash(data)!==f.sha256)throw new Error('Hash de fitxer incorrecte: '+f.name);
    bytes+=data.length;
  }
  if(bytes!==manifest.bytes||bytes>100*1024*1024)throw new Error('Pressupost o mida incorrectes');
  await readArchive(directory);
  return {verified:true,captures:names.filter(n=>capture.test(n)).length,runDays:new Set(names.filter(n=>runFile.test(n)).map(n=>n.split('/')[1])).size,bytes};
}
export async function exportArchive(source,destination,{createdAt=new Date().toISOString()}={}){
  if(typeof createdAt!=='string'||!Number.isFinite(Date.parse(createdAt)))throw new Error('Data d’exportació invàlida');
  source=resolve(source);destination=resolve(destination);
  const names=await sourceNames(source);
  if(!names.length||names.filter(n=>capture.test(n)).length>180)throw new Error('Nombre de captures invàlid');
  const files=[];let bytes=0;
  for(const name of names){const data=await regular(join(source,name));bytes+=data.length;files.push({name,bytes:data.length,sha256:hash(data)});}
  if(bytes>100*1024*1024)throw new Error('Pressupost pilot excedit');
  await readArchive(source);
  await mkdir(dirname(destination),{recursive:true});await mkdir(destination);
  for(const f of files){
    const data=await regular(join(source,f.name));
    if(hash(data)!==f.sha256)throw new Error('Origen modificat durant exportació');
    await mkdir(dirname(join(destination,f.name)),{recursive:true});
    await writeFile(join(destination,f.name),data,{flag:'wx'});
  }
  if(JSON.stringify(await sourceNames(source))!==JSON.stringify(names))throw new Error('Arxiu modificat durant exportació');
  const research=names.some(n=>runFile.test(n));
  await writeFile(join(destination,'manifest.json'),JSON.stringify({schema:research?2:1,kind:research?'fonta-portable-research':'fonta-portable-captures',createdAt,
    bytes,files,excluded:['status.json','single-runs-status.json','.git','secrets'],restore:'Verify first; regenerate status with the reviewed reporting code.'},null,2)+'\n',{flag:'wx'});
  return verifyExport(destination);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [mode,source,destination,...extra]=process.argv.slice(2);
  if(extra.length||!source||(mode==='export'&&!destination)||(mode==='verify'&&destination)||!['export','verify'].includes(mode))throw new Error('Ús: export ORIGEN DESTINACIÓ_NOVA | verify DIRECTORI');
  console.log(JSON.stringify(mode==='export'?await exportArchive(source,destination):await verifyExport(source)));
}
