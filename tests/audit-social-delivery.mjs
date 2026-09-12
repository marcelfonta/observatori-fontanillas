import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import worker, { publishAutomaticSocialDraft, recoverIncompleteDailySocialDraft, recoverIncompleteSpecialSocialDraft, recoverIncompleteOfficialAlertDraft } from '../worker/index.js';
import { deliverSocialChannel, confirmSocialDelivery } from '../worker/social-delivery.js';
import { socialDeliveryState } from '../src/features/admin.js';

const source=await readFile(new URL('../worker/index.js',import.meta.url),'utf8');
const sqlite=new DatabaseSync(':memory:');
for(const match of source.matchAll(/const CREATE_[A-Z_]+ = `([\s\S]*?)`;/g))sqlite.exec(match[1]);
let failConfirmation=false;
const DB={prepare(sql){let values=[];return {
  bind(...args){values=args;return this;},
  async run(){
    if(failConfirmation&&sql.startsWith("UPDATE social_publications SET status = 'published'"))throw new Error('Simulated D1 failure');
    const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};
  },
  async all(){return {results:sqlite.prepare(sql).all(...values)};},
  async first(){return sqlite.prepare(sql).get(...values)||null;},
};},async batch(items){sqlite.exec('BEGIN');try{const result=[];for(const item of items)result.push(await item.run());sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
let next=1;
function draft(kind='station_event',channels=['telegram'],payload={}){
  const id=next++;
  const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
  const key=kind==='daily_observation'?`daily:${date}:${id}`:`test:${id}`;
  sqlite.prepare("INSERT INTO social_drafts (id,dedupe_key,kind,status,channels,title,body,payload,created_at) VALUES (?,?,?,'approved',?,'Prova local','Contingut de prova sense enviament real',?,datetime('now','-5 minutes'))").run(id,key,kind,JSON.stringify(channels),JSON.stringify({localDate:date,...payload}));
  return sqlite.prepare('SELECT * FROM social_drafts WHERE id = ?').get(id);
}
const rows=id=>sqlite.prepare('SELECT * FROM social_publications WHERE draft_id = ? ORDER BY id').all(id);
const success=async(draft,env,beforeSend)=>{await beforeSend();return {remoteId:'remote-test',responseCode:200};};
const originalFetch=globalThis.fetch;
try{
  globalThis.fetch=async()=>{throw new Error('Unexpected external request');};
  for(const channel of ['facebook','instagram','telegram','bluesky','threads','x']){
    const item=draft('station_event',[channel]);let sends=0;
    let release;const gate=new Promise(resolve=>{release=resolve;});
    const publisher=async(d,e,beforeSend)=>{await beforeSend();sends++;await gate;return {remoteId:'remote-test'};};
    const automatic=deliverSocialChannel({DB},item,channel,publisher);
    const manual=await deliverSocialChannel({DB},item,channel,publisher,{manual:true});
    assert.equal(manual.skipped,true);release();assert.equal((await automatic).ok,true);
    assert.equal(sends,1,`${channel}: concurrent cron/admin must send once`);
    assert.equal((await deliverSocialChannel({DB},item,channel,publisher)).skipped,true);
    assert.equal(rows(item.id).length,1);
  }
  const uncertain=draft();let uncertainSends=0;
  const lost=await deliverSocialChannel({DB},uncertain,'telegram',async(d,e,beforeSend)=>{await beforeSend();uncertainSends++;throw new Error('Timeout after remote acceptance');});
  assert.equal(lost.status,'uncertain');
  assert.equal((await deliverSocialChannel({DB},uncertain,'telegram',success,{manual:true})).skipped,true);
  assert.equal(uncertainSends,1);
  assert.equal(await confirmSocialDelivery({DB},uncertain.id,lost.attemptId,''),false);
  assert.equal(await confirmSocialDelivery({DB},uncertain.id+100,lost.attemptId,'remote-known'),false);
  assert.equal(await confirmSocialDelivery({DB},uncertain.id,lost.attemptId,'remote-known'),true);
  assert.equal(rows(uncertain.id)[0].remote_id,'remote-known');
  assert.equal((await deliverSocialChannel({DB},uncertain,'telegram',success)).skipped,true);

  const localFailure=draft();failConfirmation=true;
  assert.equal((await deliverSocialChannel({DB},localFailure,'telegram',success)).status,'uncertain');
  failConfirmation=false;
  assert.equal(rows(localFailure.id)[0].status,'pending');
  assert.equal((await deliverSocialChannel({DB},localFailure,'telegram',success)).skipped,true);

  const safeFailure=draft();
  const preparation=async()=>{throw new Error('Image not ready, no public request made');};
  for(let i=0;i<4;i++)assert.equal((await deliverSocialChannel({DB},safeFailure,'telegram',preparation)).status,'failed');
  assert.equal((await deliverSocialChannel({DB},safeFailure,'telegram',success)).skipped,true);
  assert.equal(rows(safeFailure.id).length,4);
  assert.equal((await deliverSocialChannel({DB},safeFailure,'telegram',success,{manual:true})).ok,true);
  const terminal=draft();
  assert.equal((await deliverSocialChannel({DB},terminal,'telegram',async()=>{throw Object.assign(new Error('Definitive preparation failure'),{retryable:false});})).status,'failed_terminal');
  assert.equal((await deliverSocialChannel({DB},terminal,'telegram',success)).skipped,true);
  const expiredDuringPreparation=draft();
  assert.equal((await deliverSocialChannel({DB},expiredDuringPreparation,'telegram',success,{eligible:()=>false})).status,'failed_terminal');
  const discarded=draft();sqlite.prepare("UPDATE social_drafts SET status='discarded' WHERE id=?").run(discarded.id);
  assert.equal((await deliverSocialChannel({DB},discarded,'telegram',success)).skipped,true);

  // Actual recovery queries, not mocks: skip expired/exhausted candidates in the same pass.
  sqlite.prepare("UPDATE social_drafts SET status='discarded'").run();
  for(let i=0;i<12;i++){
    const item=draft();
    for(let j=0;j<4;j++)sqlite.prepare("INSERT INTO social_publications (draft_id,channel,status) VALUES (?,'telegram','failed')").run(item.id);
  }
  const reachable=draft();
  assert.equal(await recoverIncompleteSpecialSocialDraft({DB}),null,'Bounded batch of ten');
  assert.equal((await recoverIncompleteSpecialSocialDraft({DB})).draft.id,reachable.id,'Next batch progresses beyond ten exhausted candidates');
  sqlite.prepare("UPDATE social_drafts SET status='discarded'").run();
  const dailyGood=draft('daily_observation');const dailyBlocked=draft('daily_observation');
  sqlite.prepare("INSERT INTO social_publications (draft_id,channel,status) VALUES (?,'telegram','uncertain')").run(dailyBlocked.id);
  assert.equal((await recoverIncompleteDailySocialDraft({DB})).draft.id,dailyGood.id);
  const now=new Date();const localDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(now);
  const officialGood=draft('official_alert',['telegram'],{source:'Meteocat',issuedAt:now.toISOString(),targetDate:localDate,expires:new Date(now.getTime()+3600000).toISOString()});
  const officialExpired=draft('official_alert',['telegram'],{source:'Meteocat',issuedAt:now.toISOString(),targetDate:localDate,expires:new Date(now.getTime()-1).toISOString()});
  assert.equal((await recoverIncompleteOfficialAlertDraft({DB})).draft.id,officialGood.id);
  assert.equal(sqlite.prepare('SELECT status FROM social_drafts WHERE id=?').get(officialExpired.id).status,'draft');
  sqlite.prepare("UPDATE social_drafts SET status='discarded'").run();
  const staleSpecial=draft('station_event',['telegram'],{localDate:'2020-01-01'});
  const currentSpecial=draft('monthly_summary');
  assert.equal((await recoverIncompleteSpecialSocialDraft({DB})).draft.id,currentSpecial.id);
  assert.equal(sqlite.prepare('SELECT status FROM social_drafts WHERE id=?').get(staleSpecial.id).status,'draft','Stale special drafts are held without being sent');

  // Exercise actual Telegram publisher + automatic orchestration with local HTTP responses.
  const real=draft('station_event',['telegram','bluesky']);let telegramSends=0;
  globalThis.fetch=async url=>{
    if(String(url).includes('/sendPhoto')){telegramSends++;return Response.json({ok:true,result:{message_id:99}});}
    throw new Error(`Unexpected request: ${new URL(url).hostname}`);
  };
  const env={DB,TELEGRAM_BOT_TOKEN:'local-test',TELEGRAM_CHANNEL_ID:'local-test',PUBLIC_WORKER_URL:'https://example.test',ADMIN_TOKEN:'a'.repeat(32)};
  const result=await publishAutomaticSocialDraft({draft:real},env);
  assert.equal(result.outcomes.find(o=>o.channel==='telegram').ok,true);
  assert.equal(result.outcomes.find(o=>o.channel==='bluesky').ok,false);
  assert.equal(sqlite.prepare('SELECT status FROM social_drafts WHERE id=?').get(real.id).status,'partially_published');
  await publishAutomaticSocialDraft({draft:real},env);assert.equal(telegramSends,1);
  const concurrentReal=draft();let entered,release;
  const sending=new Promise(resolve=>{entered=resolve;});const responseGate=new Promise(resolve=>{release=resolve;});
  globalThis.fetch=async url=>{assert.ok(String(url).includes('/sendPhoto'));telegramSends++;entered();await responseGate;return Response.json({ok:true,result:{message_id:100}});};
  const activeAutomatic=publishAutomaticSocialDraft({draft:concurrentReal},env);
  await sending;
  const manualRequest=new Request(`https://example.test/admin/social-drafts/${concurrentReal.id}/publish`,{method:'POST',headers:{Authorization:`Bearer ${env.ADMIN_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({channel:'telegram'})});
  const manualResponse=await worker.fetch(manualRequest,env,{});
  assert.equal(manualResponse.status,409,'Actual admin route respects the automatic reservation');
  release();await activeAutomatic;assert.equal(telegramSends,2);
  const unresolved=draft();
  const lostAttempt=await deliverSocialChannel({DB},unresolved,'telegram',async(d,e,send)=>{await send();throw new Error('Timeout');});
  const request=(body,token=env.ADMIN_TOKEN)=>new Request(`https://example.test/admin/social-drafts/${unresolved.id}/confirm-delivery`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await worker.fetch(request({confirmed:true,attemptId:lostAttempt.attemptId,remoteId:'remote-id'},'wrong'),env,{})).status,401);
  assert.equal((await worker.fetch(request({attemptId:lostAttempt.attemptId,remoteId:'remote-id'}),env,{})).status,400);
  const confirmed=await worker.fetch(request({confirmed:true,attemptId:lostAttempt.attemptId,remoteId:'remote-id'}),env,{});
  assert.equal(confirmed.status,200);assert.equal((await confirmed.json()).published,false);
  assert.equal(telegramSends,2,'Reconciliation never sends content');
  assert.match(socialDeliveryState({status:'uncertain'}),/incert/);
  assert.match(socialDeliveryState({status:'pending'}),/no es reenviarà/);
}finally{globalThis.fetch=originalFetch;sqlite.close();}
console.log('Auditoria B: reserva atòmica, errors incerts, conciliació i cua limitada verificats amb SQLite.');
