import {readFile} from 'node:fs/promises';
import {evaluateTemperatureBias} from '../src/core/forecast-bias-experiment.js';
const path=process.argv[2];
if(!path)throw new Error('Ús: node scripts/forecast-bias-experiment.mjs export.json (només lectura local)');
const payload=JSON.parse(await readFile(path,'utf8'));
const rows=Array.isArray(payload)&&payload[0]?.results?payload.flatMap(result=>result.results):payload;
console.log(JSON.stringify(evaluateTemperatureBias(rows),null,2));
