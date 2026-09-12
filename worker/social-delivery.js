// One atomic SQLite statement reserves a draft/channel across cron and admin.
// Reservations never expire into an automatic resend: a lost response may be a success.
export const CLAIM_DELIVERY_SQL = `INSERT INTO social_publications (draft_id,channel,status,error)
  SELECT ?,?,'pending','Reserva d’enviament; no repetir sense comprovació.'
  WHERE EXISTS (SELECT 1 FROM social_drafts WHERE id = ? AND status IN ('approved','partially_published','published'))
  AND NOT EXISTS (SELECT 1 FROM social_publications WHERE draft_id = ? AND channel = ? AND status IN ('published','pending','uncertain'))
  AND (? = 1 OR (
    (SELECT COUNT(*) FROM social_publications WHERE draft_id = ? AND channel = ?) < 4
    AND NOT EXISTS (SELECT 1 FROM social_publications WHERE draft_id = ? AND channel = ? AND (status = 'failed_terminal' OR response_code = 422))
  ))`;

export async function deliverSocialChannel(env, draft, channel, publisher, {manual=false,eligible=()=>true}={}) {
  const reservation=await env.DB.prepare(CLAIM_DELIVERY_SQL)
    .bind(draft.id,channel,draft.id,draft.id,channel,manual?1:0,draft.id,channel,draft.id,channel).run();
  if(reservation?.meta?.changes!==1)return {ok:false,skipped:true,reason:'channel_reserved_completed_or_exhausted'};
  const id=reservation.meta.last_row_id;
  if(!id)throw new Error('La reserva no ha retornat identificador; no s’envia res.');
  let dispatched=false;
  const beforeSend=async()=>{
    if(dispatched)throw new Error('Només es permet un enviament per reserva.');
    if(!eligible())throw Object.assign(new Error('El contingut ha perdut vigència durant la preparació.'),{retryable:false});
    const result=await env.DB.prepare("UPDATE social_publications SET error = 'Enviament iniciat; pendent de confirmació.' WHERE id = ? AND status = 'pending'").bind(id).run();
    if(result?.meta?.changes!==1)throw new Error('La reserva ja no és vàlida.');
    dispatched=true;
  };
  let details;
  try {
    details=await publisher(draft,env,beforeSend);
    if(!details?.remoteId)throw new Error('La plataforma no ha retornat cap identificador.');
  } catch(error) {
    const status=dispatched?'uncertain':error.retryable===false?'failed_terminal':'failed';
    const message=String(error.message||'Error sense detall').slice(0,500);
    await env.DB.prepare('UPDATE social_publications SET status = ?, error = ?, response_code = ?, remote_id = ? WHERE id = ? AND status = \'pending\'')
      .bind(status,message,error.responseCode||null,error.remoteId||null,id).run();
    return {ok:false,status,error:message,retryable:status==='failed',attemptId:id};
  }
  // A local recording failure is NOT a provider failure. Leave the reservation
  // blocked instead of writing a retryable failure after a successful remote send.
  try {
    const result=await env.DB.prepare("UPDATE social_publications SET status = 'published', remote_id = ?, response_code = ?, error = NULL, published_at = ? WHERE id = ? AND status = 'pending'")
      .bind(String(details.remoteId),details.responseCode||null,new Date().toISOString(),id).run();
    if(result?.meta?.changes!==1)return {ok:false,status:'uncertain',retryable:false,error:'Revisa el registre: la plataforma ha acceptat la publicació.',attemptId:id};
    return {ok:true,status:'published',attemptId:id};
  } catch {
    return {ok:false,status:'uncertain',retryable:false,error:'La plataforma ha acceptat la publicació però no s’ha pogut registrar. No es reenviarà.',attemptId:id};
  }
}

export async function confirmSocialDelivery(env, draftId, attemptId, remoteId) {
  if(!Number.isSafeInteger(attemptId)||attemptId<=0||typeof remoteId!=='string'||!remoteId.trim()||remoteId.length>500)return false;
  const result=await env.DB.prepare("UPDATE social_publications SET status = 'published', remote_id = ?, error = 'Confirmat manualment després de comprovar la plataforma.', published_at = ? WHERE id = ? AND draft_id = ? AND status IN ('pending','uncertain')")
    .bind(remoteId.trim(),new Date().toISOString(),attemptId,draftId).run();
  return result?.meta?.changes===1;
}
