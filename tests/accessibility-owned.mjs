import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [index,models,headerTools]=await Promise.all([
  read('index.html'),
  read('models-franca.html'),
  read('src/features/header-tools.js'),
]);

assert.match(index,/<a class="skip-link" href="#top">/);
assert.match(index,/<main id="top"[^>]+tabindex="-1"/);
assert.match(index,/hero-webcam-preview"[^>]+aria-labelledby="hero-webcam-status"/);
assert.match(index,/id="hero-webcam-status" data-webcam-status/);
assert.match(headerTools,/role="combobox"[^>]+aria-expanded="false"/);
assert.doesNotMatch(models,/id="model-map" aria-hidden="true"/);
assert.match(models,/id="model-map" aria-label="Mapa interactiu/);

console.log('Accessibilitat pròpia: salt, combobox, webcam i mapa verificats.');
