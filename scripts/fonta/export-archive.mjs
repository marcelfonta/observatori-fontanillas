import {readFile,writeFile,readdir,mkdir,lstat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {readArchive} from './archive.mjs';
const capture=/^\d{4}-\d{2}-\d{2}-(am|pm)\.json$/;
const hash=data=>createHash('sha256').update(data).digest('hex');
async function regular(path,max=12*1024*1024){
  const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.size>max)throw new Error('Fitxer no regular o massa gran');
  return readFile(path);
}
export async function verifyExport(directory){
  const manifest=JSON.parse(await regular(join(directory,'manifest.json'),1024*1024));
  if(manifest.schema!==1||manifest.kind!=='fonta-portable-captures'||!Array.isArray(manifest.files)||manifest.files.length>180)throw new Error('Manifest invàlid');
  const names=manifest.files.map(f=>f.name);
  if(names.some(n=>typeof n!=='string'||!capture.test(n))||new Set(names).size!==names.length)throw new Error('Noms de captura invàlids');
  const actual=(await readdir(directory)).sort();
  if(JSON.stringify(actual)!==JSON.stringify([...names,'manifest.json'].sort()))throw new Error('Fitxers absents o inesperats');
  let bytes=0;
  for(const f of manifest.files){
    const data=await regular(join(directory,f.name));
    if(data.length!==f.bytes||hash(data)!==f.sha256)throw new Error('Hash de fitxer incorrecte: '+f.name);
    bytes+=data.length;
  }
  if(bytes!==manifest.bytes||bytes>100*1024*1024)throw new Error('Pressupost o mida incorrectes');
  await readArchive(directory);
  return {verified:true,captures:names.length,bytes};
}
export async function exportArchive(source,destination){
  source=resolve(source);destination=resolve(destination);
  const names=(await readdir(source)).filter(n=>capture.test(n)).sort();
  if(!names.length||names.length>180)throw new Error('Nombre de captures invàlid');
  const files=[];let bytes=0;
  for(const name of names){const data=await regular(join(source,name));bytes+=data.length;files.push({name,bytes:data.length,sha256:hash(data)});}
  if(bytes>100*1024*1024)throw new Error('Pressupost pilot excedit');
  await readArchive(source);
  await mkdir(dirname(destination),{recursive:true});await mkdir(destination);
  for(const f of files){
    const data=await regular(join(source,f.name));
    if(hash(data)!==f.sha256)throw new Error('Origen modificat durant exportació');
    await writeFile(join(destination,f.name),data,{flag:'wx'});
  }
  if(JSON.stringify((await readdir(source)).filter(n=>capture.test(n)).sort())!==JSON.stringify(names))throw new Error('Arxiu modificat durant exportació');
  await writeFile(join(destination,'manifest.json'),JSON.stringify({schema:1,kind:'fonta-portable-captures',createdAt:new Date().toISOString(),
    bytes,files,excluded:['status.json','.git','secrets'],restore:'Verify first; regenerate status with the reviewed reporting code.'},null,2)+'\n',{flag:'wx'});
  return verifyExport(destination);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [mode,source,destination,...extra]=process.argv.slice(2);
  if(extra.length||!source||(mode==='export'&&!destination)||(mode==='verify'&&destination)||!['export','verify'].includes(mode))throw new Error('Ús: export ORIGEN DESTINACIÓ_NOVA | verify DIRECTORI');
  console.log(JSON.stringify(mode==='export'?await exportArchive(source,destination):await verifyExport(source)));
}
