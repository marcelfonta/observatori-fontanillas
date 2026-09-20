export function youtubeRecoveryEligibility(row, localDate, slot, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const minute = Number(parts.hour)*60+Number(parts.minute);
  const window = {mati:[365,495],vespre:[1185,1320]}[slot];
  if (!window || localDate !== today || minute < window[0] || minute > window[1]) return {allowed:false,reason:'Fora de la finestra de recuperació d’avui (màxim 90 minuts de retard).'};
  let detail;
  try { detail = typeof row?.detail === 'string' ? JSON.parse(row.detail || '{}') : row?.detail || {}; }
  catch { return {allowed:false,reason:'Registre no interpretable: cal revisió manual.'}; }
  if (!detail || typeof detail !== 'object') return {allowed:false,reason:'Registre no interpretable: cal revisió manual.'};
  if (row?.status !== 'down') return {allowed:false,reason:'Només es recuperen execucions fallides, mai completades o en curs.'};
  if (!['youtube-auth','forecast-api','video-render','publication-time'].includes(detail.stage) || detail.youtubeId) return {allowed:false,reason:'Resultat de pujada incert: cal conciliació manual a YouTube.'};
  if (Number(detail.recoveryCount || 0) >= 1) return {allowed:false,reason:'Ja s’ha intentat una recuperació manual; cal revisar-ne el resultat.'};
  return {allowed:true,reason:'Es comprovarà OAuth a GitHub abans de recuperar aquesta franja.'};
}
