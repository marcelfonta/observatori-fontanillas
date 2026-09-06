import assert from 'node:assert/strict';
import { summarizeRemoteHistory } from '../src/modules/historics.js';

const current = {
  updated:'2026-09-06 15:30:00',
  temperature:35.3,
  pressure:1017,
  humidity:34,
  source:'weather-underground'
};
const history = [
  { time:'2026-09-06 01:59:00', t:new Date('2026-09-06T01:59:00').getTime(), temperatureMin:23.1, temperatureMax:25.3 },
  { time:'2026-09-06 05:44:00', t:new Date('2026-09-06T05:44:00').getTime(), temperatureMin:20.6, temperatureMax:21.0 }
];

const context = summarizeRemoteHistory(current, history);
const currentTime = new Date('2026-09-06T15:30:00').getTime();
assert.equal(context.stats.maxTemperature, 35.3, 'La lectura actual ha de corregir una màxima històrica endarrerida.');
assert.equal(context.stats.maxTemperatureTime, currentTime, 'L’hora de la màxima ha de correspondre a la lectura actual quan aquesta guanya.');
assert.equal(context.stats.minTemperature, 20.6, 'La mínima històrica vàlida s’ha de conservar.');
assert.equal(context.stats.minTemperatureTime, history[1].t, 'L’hora de la mínima històrica s’ha de conservar.');
assert.equal(context.summary.high.temperature, 35.3, 'El resum del dia també ha d’incloure la lectura actual.');

const colder = summarizeRemoteHistory({ ...current, updated:'2026-09-06 06:00:00', temperature:19.8 }, history);
assert.equal(colder.stats.minTemperature, 19.8, 'La lectura actual també ha de corregir una mínima endarrerida.');
assert.equal(colder.stats.maxTemperature, 25.3, 'Una màxima històrica superior s’ha de conservar.');

console.log('Extrems del dia: la lectura en directe participa en la màxima i la mínima');
