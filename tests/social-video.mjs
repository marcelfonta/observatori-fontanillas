import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const secret = 's'.repeat(32);
const key = 'shorts/2026-08-26/morning.mp4';
const expires = Math.floor(Date.now() / 1000) + 600;
const hmacKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
const signature = [...new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(`social-video:${key}:${expires}`)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
const objects = new Map();
const bucket = {
  async put(objectKey, body) { objects.set(objectKey, new Uint8Array(await new Response(body).arrayBuffer())); },
  async get(objectKey) {
    const body = objects.get(objectKey);
    return body ? { body:new Blob([body]).stream(), etag:'test-etag' } : null;
  },
};
const env = { SOCIAL_VIDEO_BUCKET:bucket, SOCIAL_VIDEO_UPLOAD_TOKEN:secret, SOCIAL_VIDEO_SIGNING_SECRET:secret, PUBLIC_WORKER_URL:'https://fonta-meteo.example' };
const context = { waitUntil() {} };

const upload = await worker.fetch(new Request(`https://fonta-meteo.example/admin/social-video-upload/${key}`, {
  method:'POST', headers:{ Authorization:`Bearer ${secret}`, 'Content-Type':'video/mp4', 'Content-Length':'4' }, body:new Uint8Array([1,2,3,4]),
}), env, context);
assert.equal(upload.status, 201);
assert.equal((await upload.json()).key, key);

const served = await worker.fetch(new Request(`https://fonta-meteo.example/social-video/${key}?expires=${expires}&sig=${signature}`), env, context);
assert.equal(served.status, 200);
assert.equal(served.headers.get('Content-Type'), 'video/mp4');
assert.equal(served.headers.get('Cache-Control'), 'private, no-store, max-age=0');
assert.deepEqual([...new Uint8Array(await served.arrayBuffer())], [1,2,3,4]);

const invalid = await worker.fetch(new Request(`https://fonta-meteo.example/social-video/${key}?expires=${expires}&sig=bad`), env, context);
assert.equal(invalid.status, 403);

console.log('Vídeos socials temporals: correcte');
