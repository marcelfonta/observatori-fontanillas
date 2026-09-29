import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {publicRegionalStatus,XEMA_DAILY_POLICY} from '../../src/core/fonta-xema-daily.js';

export function regionalStatusFromReceipt(receipt){
  const report=receipt?.report;
  if(receipt?.schema!==1||receipt.kind!=='fonta-xema-daily-receipt'||receipt.productionEnabled!==false||
    report?.productionEnabled!==false||report?.promotionAllowed!==false||!Number.isFinite(Date.parse(report.generatedAt))||
    !Number.isInteger(report.captureCount)||report.captureCount<0||!Number.isInteger(report.pairedStationDays)||report.pairedStationDays<0)throw new Error('Rebut regional no publicable');
  return publicRegionalStatus({schema:1,kind:'fonta-xema-daily-report',policy:XEMA_DAILY_POLICY,generatedAt:report.generatedAt,
    mode:'private-shadow',productionEnabled:false,captureCount:report.captureCount,pairedStationDays:report.pairedStationDays});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [input,output,...extra]=process.argv.slice(2);
  if(extra.length||!input||!output)throw new Error('Ús: REBUT_JSON SORTIDA_JSON');
  const receipt=JSON.parse(await readFile(resolve(input),'utf8'));
  await writeFile(resolve(output),JSON.stringify(regionalStatusFromReceipt(receipt),null,2)+'\n',{flag:'w'});
}
