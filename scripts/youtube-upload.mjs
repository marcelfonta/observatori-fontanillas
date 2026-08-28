import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const required=name=>{const value=process.env[name];if(!value)throw new Error(`Falta ${name}`);return value;};
const MINIMUM_SCHEDULING_MARGIN_MS=5*60_000;

async function main(){
  const clientId=required('YOUTUBE_CLIENT_ID');
  const clientSecret=required('YOUTUBE_CLIENT_SECRET');
  const refreshToken=required('YOUTUBE_REFRESH_TOKEN');
  const privacy=process.env.YOUTUBE_PRIVACY_STATUS||'private';
  if(!['private','unlisted','public'].includes(privacy))throw new Error('YOUTUBE_PRIVACY_STATUS no és vàlid.');
  const publishAt=String(process.env.YOUTUBE_PUBLISH_AT||'').trim();
  if(publishAt){
    const scheduledAt=new Date(publishAt);
    if(Number.isNaN(scheduledAt.getTime())||scheduledAt.getTime()-Date.now()<MINIMUM_SCHEDULING_MARGIN_MS)throw new Error('YOUTUBE_PUBLISH_AT ha de ser una data ISO vàlida amb almenys 5 minuts de marge.');
    if(privacy!=='private')throw new Error('Un Short programat a YouTube s’ha de pujar inicialment com a privat.');
  }
  const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:'refresh_token'})});
  const token=await tokenResponse.json();
  if(!tokenResponse.ok||!token.access_token)throw new Error(`No s’ha pogut renovar el token (${tokenResponse.status}).`);
  const video=await readFile(resolve('build/youtube-short/short.mp4'));
  const metadata=JSON.parse(await readFile(resolve('build/youtube-short/metadata.json'),'utf8'));
  const status={privacyStatus:privacy,selfDeclaredMadeForKids:false,...(publishAt?{publishAt}: {})};
  const init=await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',{method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json; charset=UTF-8','X-Upload-Content-Length':String(video.byteLength),'X-Upload-Content-Type':'video/mp4'},body:JSON.stringify({snippet:{title:metadata.title,description:metadata.description,tags:metadata.tags,categoryId:'28',defaultLanguage:'ca'},status})});
  if(!init.ok)throw new Error(`YouTube no ha iniciat la pujada (${init.status}): ${(await init.text()).slice(0,300)}`);
  const location=init.headers.get('location');
  if(!location)throw new Error('YouTube no ha retornat la URL de pujada.');
  const upload=await fetch(location,{method:'PUT',headers:{'Content-Type':'video/mp4','Content-Length':String(video.byteLength)},body:video});
  const result=await upload.json().catch(()=>({}));
  if(!upload.ok)throw new Error(`La pujada ha fallat (${upload.status}): ${JSON.stringify(result).slice(0,300)}`);
  if(!result.id)throw new Error('YouTube ha respost a la pujada però no ha retornat cap identificador de vídeo.');
  // videos.insert already returns the requested status part. Reusing it keeps
  // the OAuth permission limited to youtube.upload; videos.list would require
  // an additional read scope and can report a false failure after a real upload.
  const remoteStatus=result.status;
  if(!remoteStatus)throw new Error('YouTube ha pujat el vídeo però no n’ha retornat l’estat final.');
  if(remoteStatus.privacyStatus!==privacy)throw new Error(`YouTube confirma una privacitat inesperada (${remoteStatus.privacyStatus||'desconeguda'}).`);
  if(publishAt&&new Date(remoteStatus.publishAt||'').getTime()!==new Date(publishAt).getTime())throw new Error(`YouTube no confirma l’hora programada (${remoteStatus.publishAt||'absent'}).`);
  console.log(`Vídeo confirmat a YouTube com a ${privacy}${publishAt?` i programat per a ${publishAt}`:''}. ID: ${result.id}`);
}

main().catch(error=>{console.error(error);process.exitCode=1;});
