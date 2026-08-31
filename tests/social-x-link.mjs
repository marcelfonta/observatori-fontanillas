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
const expectedOrder = ["['instagram','Instagram']", "['youtube','YouTube']", "['tiktok','TikTok']", "['facebook','Facebook']", "['x','X']", "['whatsapp','WhatsApp']", "['threads','Threads']", "['telegram','Telegram']", "['bluesky','Bluesky']"];
assert.deepEqual([...expectedOrder].sort((a,b)=>social.indexOf(a)-social.indexOf(b)), expectedOrder, 'Les xarxes no segueixen l’ordre de prioritat acordat.');
assert.ok(style.includes('.header-social>.social-link:nth-child(n+5){display:none}') && !style.includes('.header-social .social-link:nth-child(n+5){display:none}'), 'La regla de capçalera no ha d’amagar les opcions del desplegable mòbil.');
assert.ok(style.includes('.social-link--instagram,.header-social>.social-link--tiktok,.header-social>.social-link--youtube{display:inline-grid!important}'), 'La capçalera mòbil no prioritza Instagram, TikTok i YouTube.');
assert.ok(style.includes('.social-link--instagram{order:1}') && style.includes('.social-link--tiktok{order:2}') && style.includes('.social-link--youtube{order:3}'), 'Els accessos directes mòbils no segueixen l’ordre Instagram, TikTok i YouTube.');
assert.ok(index.includes('"https://x.com/meteo_fonta"') && seo.includes("'https://x.com/meteo_fonta'"), 'Falta X a les dades estructurades SEO.');

console.log('Test V22.29.1: X visible i capçalera social mòbil ordenada');
