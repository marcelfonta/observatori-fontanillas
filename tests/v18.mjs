import assert from 'node:assert/strict';
import { meteorologicalEphemeridesForDate } from '../src/data/meteorological-ephemerides.js';
import { notificationPreferenceSummary, notificationTags } from '../src/core/notification-preferences.js';

const exact=meteorologicalEphemeridesForDate(new Date(2026,6,10),3);
assert.equal(exact[0].exact,true);
assert.equal(exact[0].year,1913);
assert.match(exact[0].url,/wmo\.int/);
const august=meteorologicalEphemeridesForDate(new Date(2026,7,10),3);
assert.ok(august.some(item=>item.date==='08-11'));
assert.ok(august.some(item=>item.date==='08-13'));
assert.ok(august.every(item=>item.source==='Meteocat'||item.source==='OMM'));

const orange=notificationTags({rain:true,wind:false,storm:false,snow:false,temperature:false,all:false,minLevel:'orange'});
assert.equal(orange.alert_rain,'1');
assert.equal(orange.alert_wind,'0');
assert.equal(orange.alert_level_yellow,'0');
assert.equal(orange.alert_level_orange,'1');
assert.equal(orange.alert_level_red,'1');
assert.match(notificationPreferenceSummary({rain:true,wind:false,storm:false,snow:false,temperature:false,minLevel:'red'}),/nivells vermell/);
const selected=notificationTags({rain:true,levels:['yellow','red']});
assert.equal(selected.alert_level_yellow,'1');
assert.equal(selected.alert_level_orange,'0');
assert.equal(selected.alert_level_red,'1');

console.log('Test V18 d’efemèrides i notificacions: correcte');
