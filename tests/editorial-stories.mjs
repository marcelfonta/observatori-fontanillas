import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { EDITORIAL_STORIES, editorialStoryById } from '../src/data/editorial-stories.js';
import { portalPageFromLocation } from '../src/core/portal-routes.js';

assert.equal(EDITORIAL_STORIES.length, 3);
assert.equal(new Set(EDITORIAL_STORIES.map(story => story.id)).size, 3);

for (const story of EDITORIAL_STORIES) {
  assert.ok(story.narrative.length >= 2);
  assert.equal(story.profile.length, 8);
  assert.ok(story.coverage >= 90);
  assert.ok(story.sampleCount >= 22);
  assert.equal(editorialStoryById(story.id), story);

  const image = await stat(new URL(`../assets/images/histories/${story.id}.png`, import.meta.url));
  assert.ok(image.size > 10_000);
  assert.equal(portalPageFromLocation({ pathname: `/histories/${story.id}`, search: '' }), 'histories');
}

assert.equal(EDITORIAL_STORIES[0].rain, 82.55);
assert.equal(EDITORIAL_STORIES[1].gust, 59.9);
assert.equal(EDITORIAL_STORIES[2].range, 19.4);

const [html, sitemap, redirects, roadmap, worker] = await Promise.all(
  ['index.html', 'sitemap.xml', '_redirects', 'ROADMAP.md', 'service-worker.js']
    .map(file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')),
);

for (const story of EDITORIAL_STORIES) {
  assert.match(sitemap, new RegExp(`/histories/${story.id}`));
  assert.match(worker, new RegExp(`${story.id}\\.png`));
}

assert.match(redirects, /\/histories\/\*/);
assert.match(html, /id="guia-boira-valles-oriental"/);
assert.match(html, /Manual de Meteocat sobre boira/);
assert.doesNotMatch(roadmap, /\*\*Editorial:\*\*/);

console.log('Editorial: tres històries permanents, imatges socials i guia local correctes');
