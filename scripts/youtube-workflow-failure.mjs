import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const clean=(value,limit)=>String(value||'').replace(/[\r\n]+/g,' ').slice(0,limit);

export async function youtubeWorkflowFailurePayload(env=process.env){
  const fallback={
    stage:clean(env.FAILURE_STAGE||'github-workflow',80),
    failureCode:'github_workflow_failed',
    terminal:false,
    error:clean(env.FAILURE_MESSAGE||'La preparació del Short no s’ha completat.',500),
  };
  let report=fallback;
  if(fallback.stage==='youtube-upload'){
    try{
      const parsed=JSON.parse(await readFile(resolve(env.YOUTUBE_UPLOAD_ERROR_FILE||'/tmp/youtube-upload-error.json'),'utf8'));
      report={
        stage:clean(parsed.stage||fallback.stage,80),
        failureCode:clean(parsed.failureCode||'youtube_upload_failed',80),
        terminal:parsed.terminal===true,
        error:clean(parsed.error||fallback.error,500),
      };
    }catch{}
  }
  return {
    action:'fail',
    source:`github-${clean(env.GITHUB_EVENT_NAME||'workflow',40)}`,
    ...report,
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  process.stdout.write(JSON.stringify(await youtubeWorkflowFailurePayload()));
}
