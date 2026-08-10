import assert from 'node:assert/strict';
import { alertHistoryCsv, buildAlertHistoryQuery } from '../src/features/alert-history-page.js';
import worker from '../worker/index.js';

const query=new URLSearchParams(buildAlertHistoryQuery({q:'vent fort',year:'2026',month:'08',level:'orange',source:'AEMET',phenomenon:'Vent'},3,50));
assert.equal(query.get('page'),'3');
assert.equal(query.get('pageSize'),'50');
assert.equal(query.get('q'),'vent fort');
assert.equal(query.get('year'),'2026');
assert.equal(query.get('month'),'08');
assert.equal(query.get('level'),'orange');
assert.equal(query.get('source'),'AEMET');
assert.equal(query.get('phenomenon'),'Vent');

const csv=alertHistoryCsv([{started_at:'2026-08-10T12:00:00Z',expires_at:'2026-08-10T18:00:00Z',level:'orange',phenomenon:'Vent',source:'AEMET',title:'Ratxes',description:'Ratxes de 80 km/h; precaució'}]);
assert.ok(csv.startsWith('\ufeff'));
assert.match(csv,/"Taronja"/);
assert.match(csv,/"Ratxes de 80 km\/h; precaució"/);

const statements=[];
const fakeDb={
  async batch(){return [];},
  prepare(sql){const statement={sql,bindings:[],bind(...values){this.bindings=values;statements.push(this);return this;},async first(){if(sql.includes('SUM(CASE'))return {total:6,severe:3,red:1,alert_days:4,latest:'2026-08-10T12:00:00Z',first:'2026-01-10T12:00:00Z'};return {total:6};},async all(){if(sql.includes('SELECT id,source'))return {results:[{id:6,source:'AEMET',level:'orange',phenomenon:'Vent',started_at:'2026-08-10T12:00:00Z'}]};if(sql.includes('COALESCE(NULLIF'))return {results:[{key:'Vent',count:4}]};if(sql.includes('AS value'))return {results:[]};return {results:[{key:'orange',count:3}]};}};return statement;}
};
const response=await worker.fetch(new Request('https://fonta-meteo.example/alert-history?page=3&pageSize=2&year=2026&level=orange'),{DB:fakeDb},{waitUntil(){}});
assert.equal(response.status,200);
const payload=await response.json();
assert.equal(payload.pagination.page,3);
assert.equal(payload.pagination.pageSize,2);
assert.equal(payload.pagination.total,6);
assert.equal(payload.pagination.totalPages,3);
assert.equal(payload.stats.topPhenomenon,'Vent');
assert.ok(statements.some(statement=>statement.bindings.at(-2)===2&&statement.bindings.at(-1)===4));

console.log('Test de l’historial d’avisos V18: correcte');
