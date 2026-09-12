import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const required=name=>{const value=process.env[name];if(!value)throw new Error(`Falta ${name}`);return value;};
const MINIMUM_SCHEDULING_MARGIN_MS=5*60_000;
const TERMINAL_OAUTH_ERRORS=new Set(['invalid_grant','invalid_client','unauthorized_client','deleted_client']);

export function youtubeTokenRefreshFailure(status,payload={}){
  const oauthError=/^[a-z0-9_.-]{1,80}$/i.test(String(payload?.error||''))?String(payload.error).toLowerCase():'';
  const terminal=status>=400&&status<500&&TERMINAL_OAUTH_ERRORS.has(oauthError);
  const failureCode=oauthError?`oauth_${oauthError}`:`oauth_http_${Number(status)||0}`;
  return Object.assign(new Error(`No s’ha pogut renovar el token de YouTube (${status}${oauthError?`; ${oauthError}`:''}).`),{
    stage:'youtube-auth',failureCode,terminal,
  });
}

export function youtubeUploadFailureReport(error){
  return {
    stage:String(error?.stage||'youtube-upload').slice(0,80),
    failureCode:String(error?.failureCode||'youtube_upload_failed').slice(0,80),
    terminal:error?.terminal===true,
    error:String(error?.message||'YouTube no ha completat la pujada.').replace(/[\r\n]+/g,' ').slice(0,500),
  };
}

export async function main(){
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
  const token=await tokenResponse.json().catch(()=>({}));
  if(!tokenResponse.ok||!token.access_token)throw youtubeTokenRefreshFailure(tokenResponse.status,token);
  const video=await readFile(resolve(process.env.VIDEO_FILE||'build/youtube-short/short.mp4'));
  const metadata=JSON.parse(await readFile(resolve(process.env.VIDEO_METADATA_FILE||'build/youtube-short/metadata.json'),'utf8'));
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
  if(process.env.YOUTUBE_RESULT_FILE)await writeFile(resolve(process.env.YOUTUBE_RESULT_FILE),JSON.stringify({id:result.id,status:remoteStatus},null,2));
  console.log(`Vídeo confirmat a YouTube com a ${privacy}${publishAt?` i programat per a ${publishAt}`:''}. ID: ${result.id}`);
}

async function runCli(){
  try{await main();}
  catch(error){
    const report=youtubeUploadFailureReport(error);
    const errorFile=resolve(process.env.YOUTUBE_UPLOAD_ERROR_FILE||'/tmp/youtube-upload-error.json');
    await writeFile(errorFile,JSON.stringify(report)).catch(writeError=>console.error(`No s’ha pogut desar el diagnòstic segur de YouTube: ${writeError.message}`));
    console.error(report.error);
    process.exitCode=1;
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await runCli();
