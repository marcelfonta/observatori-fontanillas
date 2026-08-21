import assert from 'node:assert/strict';
import { buildSlideSvg, weatherLabel } from '../scripts/youtube-short.mjs';

assert.equal(weatherLabel(0),'Cel serè');
assert.equal(weatherLabel(61),'Pluja');
assert.equal(weatherLabel(95),'Tempesta');
const svg=buildSlideSvg({title:'Prova',kicker:'Avui',content:'<text>24°</text>',footer:'Dades reals'});
assert.match(svg,/width="1080" height="1920"/);
assert.match(svg,/METEO FONTANILLAS/);
assert.match(svg,/meteo\.fontanillas\.cat/);
assert.match(svg,/24°/);

console.log('Test del generador de Shorts: correcte');
