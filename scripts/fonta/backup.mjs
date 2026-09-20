import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {exportArchive} from './export-archive.mjs';
import {uploadExport,restoreExport,REMOTE_BUDGET} from './remote-archive.mjs';
import {s3Transport} from './r2-s3.mjs';
import {readArchive} from './archive.mjs';
import {evaluateFonta} from '../../src/core/fonta-model.js';
import {hourlyReport} from './hourly-report.mjs';

export async function backupArchive({source,workspace,sourceCommit,snapshotAt,transport,commit=false}){
  if(!/^[a-f0-9]{40}$/.test(sourceCommit||'')||!Number.isFinite(Date.parse(snapshotAt)))throw new Error('Snapshot Git invàlid');
  // A new workspace prevents any local restore from overwriting an existing archive.
  await mkdir(workspace);
  const exported=join(workspace,'export'),restored=join(workspace,'restored');
  await exportArchive(source,exported,{createdAt:new Date(snapshotAt).toISOString()});
  const upload=await uploadExport(exported,transport,{commit});
  const result={schema:1,checkedAt:new Date().toISOString(),sourceCommit,snapshotAt,
    ...upload,restored:false,warning:upload.totalBytes>=REMOTE_BUDGET*0.8?'Arxiu R2 al 80%: cal revisar pressupost, no s’esborra res':null};
  if(commit){
    const verified=await restoreExport(upload.manifestId,restored,transport);
    const report=evaluateFonta(await readArchive(restored));
    if(report.productionEnabled!==false)throw new Error('Promoció inesperada');
    result.restored=true;result.verified=verified;
    result.report={status:report.status,captures:report.captureCount,pairedDays:report.pairedDays,productionEnabled:false};
    if(verified.runDays){
      const hourly=await hourlyReport(restored,join(restored,'single-runs'));
      result.hourly={pairedDays:hourly.pairedDays,promotionAllowed:hourly.promotionAllowed};
      if(hourly.promotionAllowed!==false)throw new Error('Promoció horària inesperada');
    }
  }
  // Receipt is evidence only, never an input to forecasting or a success before restore.
  await writeFile(join(workspace,'receipt.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  let transport;
  try{
    const [mode,source,workspace,...extra]=process.argv.slice(2);
    if(extra.length||!source||!workspace||!['plan','run'].includes(mode))throw new Error('Ús: plan|run SNAPSHOT_GIT DIRECTORI_NOU');
    const root=resolve(source);
    const sourceCommit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
    const snapshotAt=execFileSync('git',['-C',root,'show','-s','--format=%cI','HEAD'],{encoding:'utf8'}).trim();
    if(execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'}).trim())throw new Error('Snapshot Git modificat');
    transport=s3Transport({accountId:process.env.FONTA_R2_ACCOUNT_ID,accessKeyId:process.env.FONTA_R2_ACCESS_KEY_ID,
      secretAccessKey:process.env.FONTA_R2_SECRET_ACCESS_KEY,jurisdiction:process.env.FONTA_R2_JURISDICTION||'default'});
    console.log(JSON.stringify(await backupArchive({source:root,workspace:resolve(workspace),sourceCommit,snapshotAt,transport,commit:mode==='run'})));
  }catch(error){
    // Do not print provider errors, request headers, stack traces or secret values.
    console.error('Còpia Fonta R2 no completada: '+(error?.message?.startsWith('S3 R2')?error.message:'comprova credencials, integritat, límits i snapshot; cap dada eliminada'));
    process.exitCode=1;
  }finally{transport?.close();}
}
