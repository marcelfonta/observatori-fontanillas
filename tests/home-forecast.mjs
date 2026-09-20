import assert from 'node:assert/strict';
import {homeForecast} from '../src/core/home-forecast.js';
import {weatherSymbolKind,weatherSymbol,temperatureRange} from '../src/core/home-weather-symbol.js';
const time=Array.from({length:25},(_,h)=>h===24?'2026-09-21T00:00':`2026-09-20T${String(h).padStart(2,'0')}:00`);
const hourly={time,temperature_2m:time.map(()=>20),precipitation_probability:time.map(()=>0),weather_code:time.map(()=>0),wind_gusts_10m:time.map(()=>15)};
const now=new Date('2026-09-20T13:15:00Z');
assert.equal(homeForecast({hourly},now).periods.length,2);
assert.equal(homeForecast({hourly},now).periods[0].timeLabel,'16:00–19:00');
assert.equal(homeForecast({hourly},new Date('2026-09-21T13:00Z')).available,false);
assert.equal(homeForecast(null,now).available,false);
hourly.precipitation_probability[17]=null;
assert.equal(homeForecast({hourly},now).periods[0].rainProbability,null);
assert.equal(homeForecast({hourly},now).periods[1].illumination,'unknown');
hourly.is_day=time.map((_,h)=>h<20?1:0);
assert.equal(homeForecast({hourly},now).periods[0].illumination,'day');
assert.equal(homeForecast({hourly},now).periods[1].illumination,'twilight');
assert.equal(homeForecast({hourly},new Date('2026-09-20T19:00Z')).periods[0].illumination,'night');
hourly.is_day[22]=null;
assert.equal(homeForecast({hourly},new Date('2026-09-20T19:00Z')).periods[0].illumination,'unknown');
assert.equal(temperatureRange(25,25),'25°');
assert.equal(temperatureRange(24.6,25.1),'25°');
assert.equal(temperatureRange(0,5),'0° – 5°');
assert.equal(temperatureRange(null,25),'— – 25°');
assert.equal(temperatureRange(null,null),'—');
const sparse=structuredClone(hourly);
sparse.is_day=time.map(()=>0);
for(const key of Object.keys(sparse))sparse[key].splice(21,1);
assert.equal(homeForecast({hourly:sparse},new Date('2026-09-20T18:00Z')).periods[0].illumination,'unknown');
for(const code of [null,undefined,'0',false,-1,999])assert.equal(weatherSymbolKind(code),'unknown');
for(const [kind,codes] of Object.entries({clear:[0],partly:[1,2],cloudy:[3],fog:[45,48],rain:[51,53,55,56,57,61,63,65,66,67,80,81,82],snow:[71,73,75,77,85,86],storm:[95,96,99]})){
  for(const code of codes){assert.equal(weatherSymbolKind(code),kind);assert.match(weatherSymbol(code),/aria-hidden="true"/);}
}
assert.notEqual(weatherSymbol(0,'day'),weatherSymbol(0,'night'));
assert.notEqual(weatherSymbol(0,'unknown'),weatherSymbol(0,'night'));
assert.match(weatherSymbol(0,'twilight'),/data-light="twilight"/);
assert.match(weatherSymbol(0,'twilight'),/M14 39a18 18/);
assert.doesNotMatch(weatherSymbol(0,'unknown'),/<circle cx="29" cy="26"/);
console.log('Portada: franges locals, absència de dades i hores passades correctes');
