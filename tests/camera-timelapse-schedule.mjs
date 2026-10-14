import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const generator=readFileSync('scripts/camera-timelapse.sh','utf8');
const installer=readFileSync('scripts/install-camera-timelapse-timer.sh','utf8');
const worker=readFileSync('worker/index.js','utf8');
const youtubeWorkflow=readFileSync('.github/workflows/youtube-camera-timelapse.yml','utf8');

assert.match(generator,/DATE="\$\(date -d yesterday \+%F\)"/);
assert.match(generator,/1\|3\|5\) AUTO_DAY=true/);
assert.match(generator,/camera\/nord\/timelapse-publish/);
assert.match(generator,/OUTPUT_TMP="\$OUTPUT\.part"/);
assert.match(generator,/mv "\$OUTPUT_TMP" "\$OUTPUT"/);
assert.match(installer,/OnCalendar=\*-\*-\* 00:20:00 Europe\/Madrid/);
assert.match(installer,/ExecStart=\$SOURCE yesterday --auto/);
assert.match(installer,/enable --now meteo-camera-timelapse\.timer/);
assert.match(installer,/Restart=on-failure/);
assert.match(installer,/StandardOutput=append:%h\/meteo-camera\/timelapse\.log/);
assert.match(installer,/OnCalendar=\*-\*-\* 00:20:00 Europe\/Madrid/);
assert.match(installer,/ExecStart=\$SOURCE yesterday --auto/);
assert.match(installer,/enable --now meteo-camera-timelapse\.timer/);
assert.match(installer,/publicació dilluns, dimecres i divendres/);
for(const channel of ["'instagram'", "'facebook'", "'tiktok'", "'youtube'"])assert.match(worker,new RegExp(channel));
assert.match(worker,/youtube-camera-timelapse\.yml/);
assert.match(worker,/publishBufferPublicVideo/);
assert.match(youtubeWorkflow,/YOUTUBE_PRIVACY_STATUS: public/);
assert.match(youtubeWorkflow,/camera\/nord\/timelapses\/\$TIMELAPSE_DATE\.mp4/);

console.log('Timelapse diari: preparació diària i publicació selectiva correctes.');
