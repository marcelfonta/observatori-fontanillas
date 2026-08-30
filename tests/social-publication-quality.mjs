import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const worker=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');

assert.match(worker,/function socialWeatherEmoji\(code\)/);
assert.match(worker,/function socialForecastSummary\(day, slot\)/);
assert.match(worker,/socialForecastFocus\(forecast,slot\)/);
assert.match(worker,/function socialWeatherGlyphSvg\(code\)/);
assert.match(worker,/viewBox="-180 -180 360 360" preserveAspectRatio="xMidYMid meet"/);
assert.match(worker,/class="forecast-symbol"/);
assert.match(worker,/Predicció d’avui/);
assert.match(worker,/async function socialReelCaption/);
assert.match(worker,/caption:await socialReelCaption/);
assert.match(worker,/text:bufferTikTokCaption\(localDate, slot, socialForecastFocus/);
assert.match(worker,/text:bufferXCaption\(localDate, slot, draft, socialForecastFocus/);

console.log('Qualitat meteorològica de les publicacions socials: correcta');
