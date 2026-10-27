import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { CONTENT_PHRASES } from '../src/core/i18n-content.js';
import { getTranslationCoverage } from '../src/core/i18n.js';

for (const [source, translations] of Object.entries(CONTENT_PHRASES)) {
  assert.ok(source.trim(), 'No hi pot haver claus buides al catàleg');
  for (const language of ['es', 'en', 'fr']) {
    assert.ok(typeof translations[language] === 'string' && translations[language].trim(), `Falta ${language}: ${source}`);
    const numbers=text=>(text.match(/\d+(?:[.,]\d+)?/g)||[]).map(value=>value.replace(',','.')).sort();
    assert.deepEqual(numbers(translations[language]),numbers(source),`S’ha canviat una xifra a ${language}: ${source}`);
  }
}
for (const [language, missing] of Object.entries(getTranslationCoverage().missing)) {
  assert.deepEqual(missing, [], `Falten traduccions ${language}`);
}

const result=spawnSync('python3',['scripts/audit-i18n-content.py'],{cwd:new URL('..',import.meta.url),encoding:'utf8'});
assert.equal(result.status,0,result.stderr);
const missing=JSON.parse(result.stdout);
assert.deepEqual(missing,{},'Hi ha textos o metadades públiques sense clau de traducció');

const cache=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
for(const path of ['/src/core/i18n-content.js','/src/core/i18n-metadata.js','/src/features/static-language.js','/css/standalone-languages.css']){
  assert.ok(cache.includes(`'${path}'`),`La PWA no desa ${path}`);
}
for(const language of ['es','en','fr']){
  const path=`site.${language}.webmanifest`;
  const manifest=JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'));
  assert.equal(manifest.lang,language);
  assert.ok(cache.includes(`'/${path}'`),`La PWA no desa ${path}`);
  assert.ok(manifest.shortcuts.every(item=>item.url.includes(`lang=${language}`)),`Els accessos de ${path} han de mantenir l’idioma`);
}
console.log(`Auditoria i18n: ${Object.keys(CONTENT_PHRASES).length} textos de contingut, 13 documents públics i quatre idiomes.`);
