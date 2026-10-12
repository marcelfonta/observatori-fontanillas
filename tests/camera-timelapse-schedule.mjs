import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const generator=readFileSync('scripts/camera-timelapse.sh','utf8');
const installer=readFileSync('scripts/install-camera-timelapse-timer.sh','utf8');

assert.match(generator,/DATE="\$\(date -d yesterday \+%F\)"/);
assert.match(generator,/1\|3\|5\) AUTO_DAY=true/);
assert.match(generator,/camera\/nord\/timelapse-publish/);
assert.match(installer,/OnCalendar=\*-\*-\* 00:20:00 Europe\/Madrid/);
assert.match(installer,/ExecStart=\$SOURCE yesterday --auto/);
assert.match(installer,/enable --now meteo-camera-timelapse\.timer/);
assert.match(installer,/publicació dilluns, dimecres i divendres/);

console.log('Timelapse diari: preparació diària i publicació selectiva correctes.');
