import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {publicSource} from './io.mjs';
import {s3Transport} from './r2-s3.mjs';
import {readRegionalCaptures,uploadRegionalEvidence,REGIONAL_CAPTURE_LIMIT} from './regional-archive.mjs';
import {localDay,nextDay} from '../../src/core/fonta-model.js';
import {XEMA_DAILY_MODELS,evaluateRegionalDaily,normalizeXemaStations,regionalCapture,regionalForecastRequest,xemaDailyRequest,xemaStationMetadataRequest} from '../../src/core/fonta-xema-daily.js';

export async function collectRegionalSources({now=new Date().toISOString(),fetcher=fetch}={}){
  const today=localDay(now),start=nextDay(today,-10);
  const stations=await publicSource(xemaStationMetadataRequest(),{fetcher,maxBytes:256*1024});
  const catalog=normalizeXemaStations(stations.raw);
  const daily=await publicSource(xemaDailyRequest(start,today),{fetcher,maxBytes:1024*1024});
  const forecasts=[];
  for(const model of XEMA_DAILY_MODELS){
    const source=await publicSource(regionalForecastRequest(model,catalog),{fetcher,maxBytes:512*1024});
    forecasts.push({model,...source});
  }
  const capturedAt=new Date().toISOString();
  return regionalCapture({capturedAt,sources:{stations,daily,forecasts}});
}

export async function runRegionalCollection({mode='plan',workspace,transport,now=new Date().toISOString(),fetcher=fetch}){
  if(!['plan','run'].includes(mode)||!workspace)throw new Error('Execució regional invàlida');
  await mkdir(workspace);
  const existing=await readRegionalCaptures(transport);
  if(existing.captures.length>=REGIONAL_CAPTURE_LIMIT)throw new Error('Pilot regional complet: revisar abans de continuar');
  const today=localDay(now);
  if(existing.captures.some(capture=>localDay(capture.capturedAt)===today)){
    const receipt={schema:1,kind:'fonta-xema-daily-receipt',committed:false,uploaded:0,duplicateDay:true,productionEnabled:false};
    await writeFile(join(workspace,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});return receipt;
  }
  const capture=await collectRegionalSources({now,fetcher});
  const report=evaluateRegionalDaily([...existing.captures,capture],{now:capture.capturedAt});
  const receipt=await uploadRegionalEvidence(capture,report,transport,{commit:mode==='run',inventory:existing.inventory});
  receipt.report={captureCount:report.captureCount,pairedStationDays:report.pairedStationDays,productionEnabled:false,promotionAllowed:false};
  await writeFile(join(workspace,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  return receipt;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  let transport;
  try{
    const [mode,destination,...extra]=process.argv.slice(2);
    if(extra.length||!destination||!['plan','run'].includes(mode))throw new Error('Ús: plan|run DIRECTORI_NOU');
    transport=s3Transport({accountId:process.env.FONTA_R2_ACCOUNT_ID,accessKeyId:process.env.FONTA_R2_ACCESS_KEY_ID,
      secretAccessKey:process.env.FONTA_R2_SECRET_ACCESS_KEY,jurisdiction:process.env.FONTA_R2_JURISDICTION||'default'},{scope:'regional'});
    console.log(JSON.stringify(await runRegionalCollection({mode,workspace:resolve(destination),transport})));
  }catch(error){
    console.error('Captura regional Fonta no completada: '+(error?.message?.startsWith('S3 R2')?error.message:'comprova fonts, credencials, integritat i límits; cap previsió ni publicació modificada'));
    process.exitCode=1;
  }finally{transport?.close();}
}
