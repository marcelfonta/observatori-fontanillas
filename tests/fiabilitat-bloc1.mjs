import assert from 'node:assert/strict';
import { classifyAlertWindows } from '../src/modules/avisos.js';
import { groupAlertEpisodes } from '../src/core/alert-episodes.js';
import { rainSampleCopy } from '../src/features/forecast-verification.js';
import { stationIdentity, pressureComparisonNote } from '../src/features/stations-comparison.js';
import { sunHeightLabel } from '../src/modules/astronomia.js';

const now=new Date('2026-09-07T10:00:00+02:00');
const windows=classifyAlertWindows([
  {level:'yellow',starts:'2026-09-07T08:00:00+02:00',expires:'2026-09-07T14:00:00+02:00'},
  {level:'orange',starts:'2026-09-07T18:00:00+02:00',expires:'2026-09-07T23:00:00+02:00'},
  {level:'orange',starts:'2026-09-08T08:00:00+02:00',expires:'2026-09-08T18:00:00+02:00'},
],now);
assert.equal(windows.now.length,1,'Només l’avís vigent ara ha de comptar com a actiu.');
assert.equal(windows.today.length,1);
assert.equal(windows.tomorrow.length,1);

const aemetWindows=classifyAlertWindows([{
  level:'orange',
  description:'Aviso de temperatura máxima de nivel naranja de 13:00 07-09-2026 CEST (UTC+2) a 20:59 07-09-2026 CEST (UTC+2).',
}],now);
assert.equal(aemetWindows.today.length,1,'Cal interpretar les hores reals que AEMET publica dins la descripció RSS.');
assert.equal(aemetWindows.now.length,0,'Un avís d’AEMET que encara no ha començat no pot comptar com a actiu ara.');

const dstWindows=classifyAlertWindows([
  {starts:'2026-10-25T08:00:00+01:00',expires:'2026-10-25T12:00:00+01:00'},
],new Date('2026-10-24T00:30:00+02:00'));
assert.equal(dstWindows.tomorrow.length,1,'El canvi d’hora no pot desplaçar un avís de demà a la franja equivocada.');

const grouped=groupAlertEpisodes([
  {source:'Meteocat',level:'yellow',phenomenon:'Calor',started_at:'2026-09-07T08:00:00Z',expires_at:'2026-09-07T18:00:00Z',description:'Primera emissió'},
  {source:'Meteocat',level:'orange',phenomenon:'Calor',started_at:'2026-09-07T09:00:00Z',expires_at:'2026-09-07T20:00:00Z',description:'Actualització'},
  {source:'AEMET',level:'yellow',phenomenon:'Calor',started_at:'2026-09-07T08:00:00Z',expires_at:'2026-09-07T18:00:00Z'},
]);
assert.equal(grouped.length,2,'No s’han de barrejar organismes diferents.');
assert.equal(grouped.find(item=>item.source==='Meteocat').updates,2);
assert.equal(grouped.find(item=>item.source==='Meteocat').level,'orange','L’episodi conserva el nivell màxim.');

assert.equal(rainSampleCopy({wetDays:0,dryDays:14}),'14 dies secs · encara cap dia amb pluja');
assert.match(stationIdentity({stationId:'ISANTC198'}),/ISANTC198 · altitud no facilitada/);
assert.match(pressureComparisonNote({}),/orientativa/);
assert.equal(sunHeightLabel(10.4),'Sol baix');
assert.equal(sunHeightLabel(45),'Sol alt');

console.log('Test del bloc 1 de fiabilitat: correcte');
