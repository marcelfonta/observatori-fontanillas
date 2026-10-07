import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../src/core/config.js',import.meta.url),'utf8');
const webcam=fs.readFileSync(new URL('../src/modules/webcams.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../css/portal.css',import.meta.url),'utf8');

assert.match(config,/cameraUrl:\s*'https:\/\/fonta-meteo\.marcelfonta\.workers\.dev\/camera\/nord\/latest\.jpg'/);
assert.match(html,/id="hero-webcam-image"[^>]+Vista actual cap al nord/);
assert.match(html,/data-webcam-status/);
assert.match(html,/data-webcam-time/);
assert.match(html,/class="webcam-fallback"/);
assert.match(webcam,/method:'HEAD'/);
assert.match(webcam,/x-captured-at/);
assert.match(webcam,/RECENT_MAX_MINUTES = 12/);
assert.match(webcam,/STALE_MAX_MINUTES = 30/);
assert.match(webcam,/setState\('unavailable'\)/);
assert.match(css,/\.hero-webcam-preview\.is-stale/);
assert.match(css,/\.webcam-frame\.is-unavailable/);

console.log('Portada de la càmera: imatge pròpia, frescor i reserva correctes');
