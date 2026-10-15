import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [index,guide]=await Promise.all([read('index.html'),read('docs/METEOFRANCE-OPERA.md')]);

assert.match(index,/https:\/\/www\.eumetnet\.eu\/observations\/weather-radar-network\//);
assert.match(index,/Xarxa europea OPERA/);
assert.match(guide,/T#169758/);
assert.match(guide,/CC-BY-4\.0/);
assert.match(guide,/secret de Cloudflare/);
assert.doesNotMatch(index,/METEOFRANCE_[A-Z_]+_API_KEY/);

console.log('OPERA: font oficial visible i activació segura preparada.');
