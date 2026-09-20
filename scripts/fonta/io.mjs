import {createHash} from 'node:crypto';
export const sha256=data=>createHash('sha256').update(data).digest('hex');
export async function boundedBody(response,maxBytes){
  const chunks=[];let length=0;
  for await(const chunk of response.body){length+=chunk.length;if(length>maxBytes)throw new Error('Resposta massa gran');chunks.push(chunk);}
  return Buffer.concat(chunks);
}
export async function publicSource(url,{maxBytes=2*1024*1024,fetcher=fetch}={}){
  const response=await fetcher(url,{signal:AbortSignal.timeout(25000),redirect:'error'});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const raw=JSON.parse(await boundedBody(response,maxBytes));
  return {url,receivedAt:new Date().toISOString(),hashFormat:'JSON.stringify',sha256:sha256(JSON.stringify(raw)),raw};
}
export function checkSource(s){
  if(!s||s.hashFormat!=='JSON.stringify'||!Number.isFinite(Date.parse(s.receivedAt))||sha256(JSON.stringify(s.raw))!==s.sha256)throw new Error('Integritat de font incorrecta');
}
