import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [project,meteoAI,worker,serviceWorker,roadmap]=await Promise.all([
  readFile(new URL('../project.json',import.meta.url),'utf8'),
  readFile(new URL('../src/features/meteo-ai.js',import.meta.url),'utf8'),
  readFile(new URL('../worker/index.js',import.meta.url),'utf8'),
  readFile(new URL('../service-worker.js',import.meta.url),'utf8'),
  readFile(new URL('../ROADMAP.md',import.meta.url),'utf8')
]);

assert.equal(JSON.parse(project).version,'22.42.17');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-42-17-fonta-regional-v1'));
assert.ok(meteoAI.includes('everydayAdviceAnswer')&&meteoAI.includes('hourlyRainAnswer'));
assert.ok(worker.includes('values.slice(0,72)'));
assert.ok(worker.includes('No inventis valors, fonts ni alertes'));
assert.ok(roadmap.includes('# Roadmap viu')&&!roadmap.match(/- \[x\]/i));

console.log('Test V22.4: Meteo IA quotidiana i context horari preparats');
