import assert from 'node:assert/strict';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { youtubeTokenRefreshFailure, youtubeUploadFailureReport } from '../scripts/youtube-upload.mjs';
import { youtubeWorkflowFailurePayload } from '../scripts/youtube-workflow-failure.mjs';

const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');
const authWorkflow = await readFile(new URL('../.github/workflows/youtube-auth-diagnostics.yml', import.meta.url), 'utf8');
const uploader = await readFile(new URL('../scripts/youtube-upload.mjs', import.meta.url), 'utf8');
assert.match(workflow, /SOCIAL_VIDEO_UPLOAD_URL/);
assert.match(workflow, /SOCIAL_VIDEO_UPLOAD_TOKEN/);
assert.match(workflow, /cron: '35 4 \* \* \*'/);
assert.match(workflow, /cron: '35 5 \* \* \*'/);
assert.match(workflow, /cron: '0 18 \* \* \*'/);
assert.match(workflow, /cron: '0 19 \* \* \*'/);
assert.match(workflow, /Valida la finestra horària de reserva/);
assert.match(workflow, /startsWith\(github\.event\.schedule, '0 '\)/);
assert.match(workflow, /SHOULD_SCHEDULE_PUBLICATION/);
assert.match(workflow, /inputs:\n\s+slot:/);
assert.match(workflow, /\n\s+schedule_publication:/);
assert.match(workflow, /if: env\.YOUTUBE_SHORT_SHOULD_RUN == 'true' && env\.SOCIAL_VIDEO_UPLOAD_URL != '' && env\.SOCIAL_VIDEO_UPLOAD_TOKEN != ''/);
assert.match(workflow, /continue-on-error: true/);
assert.match(workflow, /mati\) video_slot=morning/);
assert.match(workflow, /vespre\) video_slot=evening/);
assert.match(workflow, /TZ=Europe\/Madrid date \+%F/);
assert.match(workflow, /--data-binary @build\/youtube-short\/short\.mp4/);
assert.match(workflow, /Authorization: Bearer \$SOCIAL_VIDEO_UPLOAD_TOKEN/);
assert.match(workflow, /Coordina una sola execució per franja/);
assert.match(workflow, /YOUTUBE_SHORT_COORDINATION_ACTIVE/);
assert.match(workflow, /YOUTUBE_UPLOAD_ERROR_FILE/);
assert.match(workflow, /youtube-workflow-failure\.mjs/);
assert.match(workflow, /--data-binary @\/tmp\/youtube-short-failure\.json/);
assert.doesNotMatch(workflow, /instagram.*story|facebook.*story/i);
assert.doesNotMatch(uploader,/videos\?part=status&id=/);
assert.match(uploader,/const remoteStatus=result\.status/);
assert.match(uploader,/YouTube ha pujat el vídeo però no n’ha retornat l’estat final/);
assert.match(uploader,/remoteStatus\.privacyStatus/);
assert.match(uploader,/MINIMUM_SCHEDULING_MARGIN_MS=5\*60_000/);
assert.match(uploader,/almenys 5 minuts de marge/);
assert.match(uploader,/YOUTUBE_AUTH_CHECK_ONLY==='true'/);
assert.ok(uploader.indexOf("YOUTUBE_AUTH_CHECK_ONLY==='true'")<uploader.indexOf("readFile(resolve(process.env.VIDEO_FILE"),'El diagnòstic ha d’aturar-se abans de llegir o pujar cap vídeo.');
assert.match(authWorkflow,/workflow_dispatch:/);
assert.doesNotMatch(authWorkflow,/schedule:/);
assert.match(authWorkflow,/YOUTUBE_AUTH_CHECK_ONLY: 'true'/);
assert.match(authWorkflow,/node scripts\/youtube-upload\.mjs/);
assert.doesNotMatch(authWorkflow,/youtube-short\.mjs|ffmpeg|youtube-publish-at|SOCIAL_VIDEO_UPLOAD/);

const invalidGrant=youtubeTokenRefreshFailure(400,{error:'invalid_grant',error_description:'secret value must never be forwarded'});
assert.equal(invalidGrant.terminal,true);
assert.equal(invalidGrant.stage,'youtube-auth');
assert.equal(invalidGrant.failureCode,'oauth_invalid_grant');
assert.doesNotMatch(invalidGrant.message,/secret value/);
assert.equal(youtubeTokenRefreshFailure(503,{}).terminal,false);
const report=youtubeUploadFailureReport(invalidGrant);
assert.deepEqual(report,{stage:'youtube-auth',failureCode:'oauth_invalid_grant',terminal:true,error:'No s’ha pogut renovar el token de YouTube (400; invalid_grant).'});
const errorFile=`/tmp/youtube-upload-error-test-${process.pid}.json`;
await writeFile(errorFile,JSON.stringify(report));
try{
  assert.deepEqual(await youtubeWorkflowFailurePayload({
    FAILURE_STAGE:'youtube-upload',FAILURE_MESSAGE:'Fallada genèrica',YOUTUBE_UPLOAD_ERROR_FILE:errorFile,GITHUB_EVENT_NAME:'workflow_dispatch',
  }),{action:'fail',source:'github-workflow_dispatch',...report});
}finally{await unlink(errorFile).catch(()=>{});}

console.log('Còpia privada del Short per a Stories: correcta');
