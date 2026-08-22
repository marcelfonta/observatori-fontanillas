import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeObservation, initialCondition, initialSchema } from '../functions/_middleware.js';
import { answerMeteoQuestion } from '../src/features/meteo-ai.js';

const observation=normalizeObservation({updatedUtc:'2026-08-22T10:23:40Z',temperature:24.2,humidity:53,pressure:1015.2,windSpeed:1.1,windGust:1.4,rainToday:0,stale:false});
assert.equal(observation.temperature,24.2);
assert.equal(initialCondition(observation),'Observació en directe');
assert.equal(normalizeObservation({temperature:'sense dada'}),null);
const schema=initialSchema(observation);
assert.ok(schema['@graph'].some(item=>item['@type']==='Observation'));
assert.ok(schema['@graph'].find(item=>item['@type']==='Observation').measuredProperty.some(item=>item.name==='Temperatura'&&item.value===24.2));

for(const [question,pattern] of [['Com es forma la boira?',/núvol en contacte/i],['Què és una inversió tèrmica?',/aire fred/i],['Què és una ratxa de vent?',/màxim breu/i],['Què vol dir sensació tèrmica?',/percep el cos/i]]){
  const answer=await answerMeteoQuestion(question,{},{});
  assert.match(answer.body,pattern);
  assert.ok(!answer.needsAI,`${question} no hauria de dependre del model avançat`);
}

const verification=await readFile(new URL('../src/features/forecast-verification.js',import.meta.url),'utf8');
assert.ok(verification.includes('temperatureBias'));
assert.ok(verification.includes('item.forecast.gust'));
assert.ok(verification.includes('role="progressbar"'));
const admin=await readFile(new URL('../administracio.html',import.meta.url),'utf8');
assert.ok(admin.includes('data-integration="advancedAI"'));
const seo=await readFile(new URL('../src/features/seo.js',import.meta.url),'utf8');
assert.ok(seo.includes('observationFromInitialSchema'));
assert.ok(seo.includes("item?.['@type']==='Observation'"));

console.log('Test V22.1: primera càrrega, IA local i verificació correctes');
