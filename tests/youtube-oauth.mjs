import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const env={
  ADMIN_TOKEN:'a'.repeat(32),
  YOUTUBE_CLIENT_ID:'youtube-client-id',
  YOUTUBE_CLIENT_SECRET:'youtube-client-secret',
};
const context={waitUntil(){}};
const start=await worker.fetch(new Request('https://fonta-meteo.marcelfonta.workers.dev/oauth/youtube/start'),env,context);
assert.equal(start.status,302);
assert.match(start.headers.get('cache-control'),/no-store/);
assert.match(start.headers.get('set-cookie'),/HttpOnly/);
const authorization=new URL(start.headers.get('location'));
assert.equal(authorization.origin,'https://accounts.google.com');
assert.equal(authorization.searchParams.get('scope'),'https://www.googleapis.com/auth/youtube.upload');
assert.equal(authorization.searchParams.get('access_type'),'offline');
assert.equal(authorization.searchParams.get('prompt'),'consent');
assert.equal(authorization.searchParams.get('redirect_uri'),'https://fonta-meteo.marcelfonta.workers.dev/oauth/youtube/callback');

const state=authorization.searchParams.get('state');
const cookie=start.headers.get('set-cookie').split(';')[0];
const originalFetch=global.fetch;
global.fetch=async(url,options)=>{
  assert.equal(url,'https://oauth2.googleapis.com/token');
  assert.equal(options.method,'POST');
  assert.match(String(options.body),/grant_type=authorization_code/);
  return Response.json({access_token:'temporary',refresh_token:'refresh-token-test',scope:'https://www.googleapis.com/auth/youtube.upload'});
};
const callback=await worker.fetch(new Request(`https://fonta-meteo.marcelfonta.workers.dev/oauth/youtube/callback?code=test-code&state=${encodeURIComponent(state)}`,{headers:{Cookie:cookie}}),env,context);
global.fetch=originalFetch;
assert.equal(callback.status,200);
assert.match(await callback.text(),/YOUTUBE_REFRESH_TOKEN/);

const rejected=await worker.fetch(new Request(`https://fonta-meteo.marcelfonta.workers.dev/oauth/youtube/callback?code=test-code&state=${encodeURIComponent(state)}`),env,context);
assert.equal(rejected.status,403);

console.log('Test OAuth YouTube: correcte');
