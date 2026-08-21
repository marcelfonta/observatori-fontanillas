import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFile(resolve(root,file),'utf8');
const [worker,comparison,comparisonFeature,meteoAI,weatherApi,app]=await Promise.all([
  read('worker/index.js'),read('comparativa.html'),read('src/features/stations-comparison.js'),
  read('src/features/meteo-ai.js'),read('src/services/weather-api.js'),read('src/app.js')
]);

assert.ok(worker.includes('CREATE TABLE IF NOT EXISTS monitor_state'));
assert.ok(worker.includes('consecutive_failures')&&worker.includes('Weather Underground no respon'));
assert.ok(worker.includes('Weather Underground torna a funcionar'));
assert.ok(worker.includes('latestStoredObservation')&&worker.includes('d1-emergency'));
assert.ok(worker.includes('POST" && url.pathname === "/meteo-ai"'));
assert.ok(worker.includes('env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast"'));
assert.ok(worker.includes('CREATE TABLE IF NOT EXISTS ai_rate_limit'));
assert.ok(!comparison.includes('data-compare-period="today"'));
assert.ok(!comparison.includes('data-compare-period="24h"'));
assert.ok(comparison.includes('<span class="tag">Ara</span>'));
assert.ok(comparisonFeature.includes('/stations?period=now'));
assert.ok(meteoAI.includes('answerMeteoQuestionAdvanced')&&meteoAI.includes('needsAI:true'));
assert.ok(weatherApi.includes('fetchAdvancedMeteoAI'));
assert.ok(app.includes("label.textContent='Dades de suport'"));

console.log('Test V22.0.0: correcte');
