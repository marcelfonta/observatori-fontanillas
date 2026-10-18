import assert from 'node:assert/strict';
import { socialChannelContent, socialChannelPostText } from '../worker/index.js';

const draft={
  title:'Evolució de la pluja a Sant Celoni',
  body:'La pluja ha avançat de ponent a llevant durant la tarda.\n\nLa cronologia combina dades locals i context visual verificable.',
  source_url:'https://meteo.fontanillas.cat/?page=histories-meteorologiques',
};

const expectations={facebook:6000,instagram:2200,tiktok:300,youtube:3000,x:240,bluesky:300,threads:500,telegram:1000};
const versions=Object.fromEntries(Object.entries(expectations).map(([channel,limit])=>{
  const content=socialChannelContent(draft,channel);
  assert.equal(content.channel,channel);
  assert.equal(content.maxLength,limit);
  assert.ok(content.text.length>20);
  assert.ok(Array.from(content.text).length<=limit,`${channel} supera el límit`);
  assert.ok(content.format&&content.media,`${channel} no descriu el format`);
  return [channel,content];
}));

assert.match(versions.facebook.text,/Font i detall:/);
assert.match(versions.facebook.text,/histories-meteorologiques/);
assert.match(versions.instagram.text,/#MeteoFontanillas/);
assert.match(versions.instagram.text,/enllaç del perfil/);
assert.match(versions.tiktok.format,/Un sol fenomen/);
assert.doesNotMatch(versions.tiktok.text,/cronologia combina/);
assert.match(versions.youtube.text,/arxiu/);
assert.match(versions.bluesky.text,/Font i detall:/);
assert.notEqual(versions.facebook.text,versions.instagram.text);
assert.notEqual(versions.telegram.text,versions.threads.text);
assert.equal(socialChannelPostText(draft,'threads'),versions.threads.text);
assert.ok(Array.from(socialChannelPostText(draft,'facebook',120)).length<=120);

const oversized=socialChannelContent({...draft,body:'Núvols i pluja. '.repeat(500)},'bluesky');
assert.ok(Array.from(oversized.text).length<=300);
assert.match(oversized.text,/https:\/\/meteo\.fontanillas\.cat/,'La font s’ha de conservar quan cap dins del límit');

console.log('Social channel content: OK');
