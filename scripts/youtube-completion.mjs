import {readFile,writeFile} from 'node:fs/promises';
const result=JSON.parse(await readFile(process.env.YOUTUBE_RESULT_FILE,'utf8'));
if(!/^[\w-]{11}$/.test(result.id||''))throw new Error('Falta la confirmació de YouTube.');
await writeFile('/tmp/youtube-complete.json',JSON.stringify({
  action:'complete',source:'github-actions',youtubeId:result.id,
  privacy:result.status?.privacyStatus,publishAt:result.status?.publishAt||null,
}));
