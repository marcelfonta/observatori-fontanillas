import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker/index.js';

const timelapseScript = await readFile(new URL('../scripts/camera-timelapse.sh', import.meta.url), 'utf8');
assert.match(timelapseScript,/arxiu\/\$YEAR\/\$MONTH\/\$DAY/);
assert.match(timelapseScript,/--upload-preview/);
assert.match(timelapseScript,/Publicació automàtica: desactivada/);
assert.doesNotMatch(timelapseScript,/systemctl|crontab|buffer-video|social-video/);

const secret = 'camera-upload-secret-'.padEnd(48, 'x');
const objects = new Map();
const bucket = {
  async put(key, body, options = {}) {
    objects.set(key, {
      bytes:new Uint8Array(await new Response(body).arrayBuffer()),
      options,
    });
  },
  async get(key) {
    const object = objects.get(key);
    if (!object) return null;
    return {
      body:new Blob([object.bytes]).stream(),
      size:object.bytes.byteLength,
      etag:'camera-test-etag',
      customMetadata:object.options.customMetadata,
      writeHttpMetadata(headers) {
        headers.set('Content-Type', object.options.httpMetadata?.contentType || 'application/octet-stream');
      },
    };
  },
};
const env = {
  CAMERA_BUCKET:bucket,
  CAMERA_UPLOAD_TOKEN:secret,
  PUBLIC_WORKER_URL:'https://fonta-meteo.example',
};
const context = { waitUntil() {} };
const jpeg = new Uint8Array(2048).fill(7);
jpeg[0] = 0xff;
jpeg[1] = 0xd8;
jpeg[jpeg.length - 2] = 0xff;
jpeg[jpeg.length - 1] = 0xd9;
const capturedAt = new Date(Date.now() - 30_000).toISOString();

const unauthorized = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/upload', {
  method:'PUT',
  headers:{ 'Content-Type':'image/jpeg', 'Content-Length':String(jpeg.byteLength) },
  body:jpeg,
}), env, context);
assert.equal(unauthorized.status, 401);

const upload = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/upload', {
  method:'PUT',
  headers:{
    Authorization:`Bearer ${secret}`,
    'Content-Type':'image/jpeg',
    'Content-Length':String(jpeg.byteLength),
    'X-Captured-At':capturedAt,
  },
  body:jpeg,
}), env, context);
assert.equal(upload.status, 201);
assert.equal((await upload.json()).url, 'https://fonta-meteo.example/camera/nord/latest.jpg');

const served = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/latest.jpg'), env, context);
assert.equal(served.status, 200);
assert.equal(served.headers.get('Content-Type'), 'image/jpeg');
assert.equal(served.headers.get('Access-Control-Allow-Origin'), '*');
assert.equal(served.headers.get('X-Captured-At'), capturedAt);
assert.deepEqual(new Uint8Array(await served.arrayBuffer()), jpeg);

const branded = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/upload-branded', {
  method:'PUT',
  headers:{ Authorization:`Bearer ${secret}`, 'Content-Type':'image/jpeg', 'Content-Length':String(jpeg.byteLength), 'X-Captured-At':capturedAt },
  body:jpeg,
}), env, context);
assert.equal(branded.status, 201);
assert.equal((await branded.json()).url, 'https://fonta-meteo.example/camera/nord/latest-branded.jpg');
const servedBranded = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/latest-branded.jpg'), env, context);
assert.equal(servedBranded.status, 200);
assert.match(servedBranded.headers.get('Content-Disposition'), /-marca\.jpg/);
assert.ok(objects.has('nord/latest.jpg'));
assert.ok(objects.has('nord/latest-branded.jpg'));

const mp4 = new Uint8Array(4096).fill(0);
mp4.set([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
const timelapse = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/timelapse-upload', {
  method:'PUT',
  headers:{
    Authorization:`Bearer ${secret}`,
    'Content-Type':'video/mp4',
    'Content-Length':String(mp4.byteLength),
    'X-Timelapse-Date':'2026-10-07',
    'X-Timelapse-Frames':'96',
  },
  body:mp4,
}), env, context);
assert.equal(timelapse.status, 201);
const timelapsePayload = await timelapse.json();
assert.equal(timelapsePayload.publication, 'disabled');
assert.equal(timelapsePayload.url, 'https://fonta-meteo.example/camera/nord/timelapse-preview.mp4');
const servedTimelapse = await worker.fetch(new Request(timelapsePayload.url), env, context);
assert.equal(servedTimelapse.status, 200);
assert.equal(servedTimelapse.headers.get('Content-Type'), 'video/mp4');
assert.equal(servedTimelapse.headers.get('X-Automatic-Publication'), 'disabled');
assert.deepEqual(new Uint8Array(await servedTimelapse.arrayBuffer()), mp4);
assert.ok(objects.has('nord/timelapses/latest-preview.mp4'));

const invalid = new Uint8Array(2048).fill(1);
const rejected = await worker.fetch(new Request('https://fonta-meteo.example/camera/nord/upload', {
  method:'PUT',
  headers:{
    Authorization:`Bearer ${secret}`,
    'Content-Type':'image/jpeg',
    'Content-Length':String(invalid.byteLength),
  },
  body:invalid,
}), env, context);
assert.equal(rejected.status, 422);

console.log('Pujada segura de la càmera: correcte');
