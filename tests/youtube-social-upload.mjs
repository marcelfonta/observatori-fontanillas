import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/youtube-short-private.yml', import.meta.url), 'utf8');
assert.match(workflow, /SOCIAL_VIDEO_UPLOAD_URL/);
assert.match(workflow, /SOCIAL_VIDEO_UPLOAD_TOKEN/);
assert.match(workflow, /cron: '47 3 \* \* \*'/);
assert.match(workflow, /cron: '47 15 \* \* \*'/);
assert.match(workflow, /SHORT_SLOT: \$\{\{ github\.event_name == 'schedule' && \(github\.event\.schedule == '47 15 \* \* \*' && 'vespre' \|\| 'mati'\) \|\| inputs\.slot \|\| 'mati' \}\}/);
assert.match(workflow, /SHOULD_SCHEDULE_PUBLICATION/);
assert.match(workflow, /inputs:\n\s+slot:/);
assert.match(workflow, /\n\s+schedule_publication:/);
assert.match(workflow, /if: env\.SOCIAL_VIDEO_UPLOAD_URL != '' && env\.SOCIAL_VIDEO_UPLOAD_TOKEN != ''/);
assert.match(workflow, /continue-on-error: true/);
assert.match(workflow, /mati\) video_slot=morning/);
assert.match(workflow, /vespre\) video_slot=evening/);
assert.match(workflow, /TZ=Europe\/Madrid date \+%F/);
assert.match(workflow, /--data-binary @build\/youtube-short\/short\.mp4/);
assert.match(workflow, /Authorization: Bearer \$SOCIAL_VIDEO_UPLOAD_TOKEN/);
assert.match(workflow, /Coordina una sola execució per franja/);
assert.match(workflow, /YOUTUBE_SHORT_COORDINATION_ACTIVE/);
assert.doesNotMatch(workflow, /instagram.*story|facebook.*story/i);

console.log('Còpia privada del Short per a Stories: correcta');
