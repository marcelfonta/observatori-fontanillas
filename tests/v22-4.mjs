import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [project,meteoAI,worker,serviceWorker,roadmap]=await Promise.all([
  readFile(new URL('../project.json',import.meta.url),'utf8'),
  readFile(new URL('../src/features/meteo-ai.js',import.meta.url),'utf8'),
  readFile(new URL('../worker/index.js',import.meta.url),'utf8'),
  readFile(new URL('../service-worker.js',import.meta.url),'utf8'),
  readFile(new URL('../ROADMAP.md',import.meta.url),'utf8')
]);

assert.equal(JSON.parse(project).version,'22.11.0');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-11-0'));
assert.ok(meteoAI.includes('everydayAdviceAnswer')&&meteoAI.includes('hourlyRainAnswer'));
assert.ok(meteoAI.includes("hourly.time?.slice(0,48)"));
assert.ok(worker.includes('preguntes quotidianes molt senzilles'));
assert.ok(roadmap.includes('V22.4.0 — Meteo IA més útil i entenedora'));

console.log('Test V22.4: Meteo IA quotidiana i context horari preparats');
