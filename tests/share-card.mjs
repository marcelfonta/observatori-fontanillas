import assert from 'node:assert/strict';
import { buildShareCardModel } from '../src/features/share.js';

const current=buildShareCardModel({current:{temperature:24.6,feelsLike:24.2,humidity:58,windSpeed:7.1,rainToday:1.2},alerts:{ok:true,active:0}},'https://meteo.fontanillas.cat/?page=inici','Inici · Observatori Fontanillas','inici');
assert.equal(current.primary,'24,6 °C');
assert.match(current.secondary,/Humitat 58%/);
assert.ok(current.facts.includes('Avisos · cap d’actiu'));

const forecast=buildShareCardModel({forecast:{daily:{time:['2026-08-10'],weather_code:[61],temperature_2m_max:[26],temperature_2m_min:[17],precipitation_probability_max:[75],wind_gusts_10m_max:[32]}}},'https://meteo.fontanillas.cat/?page=prediccio','Predicció · Observatori Fontanillas','prediccio');
assert.equal(forecast.primary,'Pluja feble');
assert.match(forecast.secondary,/26,0 °C/);

const fallback=buildShareCardModel({},'https://meteo.fontanillas.cat/metodologia.html','Metodologia · Observatori Fontanillas','metodologia');
assert.equal(fallback.primary,'Dades locals i fonts contrastades');
assert.doesNotMatch(fallback.primary,/\d+[,.]\d+ °C/);

console.log('Test de targetes de compartició V18: correcte');
