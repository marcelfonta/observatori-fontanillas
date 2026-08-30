import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSlideSvg, weatherGlyph, weatherLabel, weatherTheme } from '../scripts/youtube-short.mjs';
import { sampleAt } from '../scripts/youtube-music.mjs';

assert.equal(weatherLabel(0),'Cel serè');
assert.equal(weatherLabel(1),'Poc ennuvolat');
assert.equal(weatherLabel(2),'Núvols i clarianes');
assert.equal(weatherLabel(3),'Cel cobert');
assert.equal(weatherLabel(61),'Pluja');
assert.equal(weatherLabel(95),'Tempesta');
assert.equal(weatherTheme(null).kind,'neutral');
assert.equal(weatherTheme(0).kind,'clear');
assert.equal(weatherTheme(61).kind,'rain');
assert.equal(weatherTheme(95).kind,'storm');
assert.doesNotMatch(weatherGlyph(0),/fill="#f1f8f5"/);
assert.match(weatherGlyph(61),/stroke="#66c7e8"/);
assert.match(weatherGlyph(95),/fill="#ffd166"/);
for(const code of [0,2,3,45,61,71,80,95]){
  const glyph=weatherGlyph(code);
  assert.match(glyph,/<rect x="-180" y="-180" width="360" height="360"/);
  assert.match(glyph,/transform="translate\(790 510\) scale\(1\)"/);
}
const svg=buildSlideSvg({title:'Prova',kicker:'Avui',content:'<text>24°</text>',footer:'Dades reals',weatherCode:61});
assert.match(svg,/width="1080" height="1920"/);
assert.match(svg,/METEO FONTANILLAS/);
assert.match(svg,/meteo\.fontanillas\.cat/);
assert.match(svg,/24°/);
assert.match(svg,/<title>Pluja<\/title>/);
const observation=buildSlideSvg({title:'Dades reals',kicker:'Observació',content:'<text>19°</text>',footer:'Estació',weatherCode:null});
assert.doesNotMatch(observation,/<title>/);
const trend=buildSlideSvg({title:'Tendència dels pròxims dies',kicker:'D’un cop d’ull',content:'',footer:'Web',weatherCode:0});
assert.match(trend,/>Tendència dels<\/text>/);
assert.match(trend,/>pròxims dies<\/text>/);
assert.doesNotMatch(trend,/pròxims…/);
const generator=await readFile(new URL('../scripts/youtube-short.mjs',import.meta.url),'utf8');
assert.doesNotMatch(generator,/\$\{weatherGlyph\(3,/);
const workflow=await readFile(new URL('../.github/workflows/youtube-short-private.yml',import.meta.url),'utf8');
assert.match(workflow,/xfade=transition=fade/);
assert.match(workflow,/zoompan=/);
assert.equal(sampleAt(0),0);
assert.ok(Math.abs(sampleAt(1.25))<=1);
assert.ok(Math.abs(sampleAt(12.5))>0.001);

console.log('Test del generador de Shorts: correcte');
