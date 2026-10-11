import assert from 'node:assert/strict';
import { ensembleDayConfidence } from '../src/core/ensemble-confidence.js';

const hourly={time:['2026-10-13T00:00','2026-10-13T12:00']};
for(let member=1;member<=10;member++){
  hourly[`temperature_2m_member${member}`]=[12+member/10,20+member/10];
  hourly[`precipitation_member${member}`]=member<=8?[.1,.2]:[0,0];
  hourly[`wind_gusts_10m_member${member}`]=[20+member,25+member];
}
const confidence=ensembleDayConfidence({hourly},'2026-10-13');
assert.equal(confidence.level,'high');
assert.equal(confidence.members,10);
assert.equal(confidence.rainWetShare,.8);
assert.equal(ensembleDayConfidence({hourly},'2026-10-14'),null);
