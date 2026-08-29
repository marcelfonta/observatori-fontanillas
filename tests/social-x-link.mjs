import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [config, social, style, index, seo] = await Promise.all([
  readFile(new URL('../src/core/config.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/footer-social.js', import.meta.url), 'utf8'),
  readFile(new URL('../css/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/features/seo.js', import.meta.url), 'utf8'),
]);

assert.ok(config.includes("x: 'https://x.com/meteo_fonta'"), 'Falta el perfil públic d’X a la configuració.');
assert.ok(social.includes("x:'<svg") && social.includes("['x','X']"), 'Falta la icona o la xarxa X a la navegació social.');
assert.ok(style.includes('.social-link--instagram,.header-social>.social-link--tiktok,.header-social>.social-link--youtube{display:inline-grid!important}'), 'La capçalera mòbil no prioritza Instagram, TikTok i YouTube.');
assert.ok(index.includes('"https://x.com/meteo_fonta"') && seo.includes("'https://x.com/meteo_fonta'"), 'Falta X a les dades estructurades SEO.');

console.log('Test V22.22.0: X visible i capçalera social mòbil ordenada');
