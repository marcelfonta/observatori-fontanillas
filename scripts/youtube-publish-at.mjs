const TIME_ZONE = 'Europe/Madrid';
const SLOT_TIMES = { mati:{ hour:7, minute:0 }, vespre:{ hour:20, minute:30 } };
const MINIMUM_SCHEDULING_MARGIN_MS = 5 * 60_000;
const LATE_PUBLICATION_WINDOW_MS = 90 * 60_000;

function partsInTimeZone(date) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone:TIME_ZONE,
    year:'numeric', month:'2-digit', day:'2-digit',
  }).formatToParts(date);
  return Object.fromEntries(values.filter(({ type }) => type !== 'literal').map(({ type, value }) => [type,Number(value)]));
}

function offsetAt(date) {
  const value = new Intl.DateTimeFormat('en-US', {
    timeZone:TIME_ZONE,
    timeZoneName:'longOffset',
  }).formatToParts(date).find(({ type }) => type === 'timeZoneName')?.value || '';
  const match = value.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`No s'ha pogut determinar el fus horari de ${TIME_ZONE}.`);
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === '+' ? 1 : -1) * minutes * 60_000;
}

function slotPublishAt(slot, now = new Date()) {
  const target = SLOT_TIMES[slot];
  if (!target) throw new Error(`Franja de YouTube desconeguda: ${slot}.`);
  const { year, month, day } = partsInTimeZone(now);
  const nominalUtc = Date.UTC(year, month - 1, day, target.hour, target.minute);
  // Les franges són després del canvi d'hora habitual; calculem l'offset per a
  // la mateixa hora local per conservar 07:00/20:30 tant a l'estiu com a l'hivern.
  const publishAt = new Date(nominalUtc - offsetAt(new Date(nominalUtc)));
  return publishAt;
}

export function plannedPublishAt(slot, now = new Date()) {
  const publishAt = slotPublishAt(slot, now);
  // GitHub may start a scheduled workflow late. Five minutes still leaves time
  // for the compact render/upload path while avoiding a publishAt already past.
  if (publishAt.getTime() - now.getTime() < MINIMUM_SCHEDULING_MARGIN_MS) {
    throw new Error(`No queda marge suficient per programar el Short de ${slot} (${publishAt.toISOString()}).`);
  }
  return publishAt;
}

export function youtubePublicationPlan(slot, now = new Date()) {
  const publishAt=slotPublishAt(slot,now);
  const delay=publishAt.getTime()-now.getTime();
  if(delay>=MINIMUM_SCHEDULING_MARGIN_MS)return {publishAt,privacy:'private',delaySeconds:0,late:false};
  if(delay>=0)return {publishAt:null,privacy:'public',delaySeconds:Math.ceil(delay/1000),late:false};
  if(delay>=-LATE_PUBLICATION_WINDOW_MS)return {publishAt:null,privacy:'public',delaySeconds:0,late:true};
  throw new Error(`La franja de ${slot} ha caducat i no es publicarà amb més de 90 minuts de retard.`);
}

if (import.meta.main) {
  const slot = process.env.SHORT_SLOT === 'vespre' ? 'vespre' : 'mati';
  const plan=youtubePublicationPlan(slot);
  console.log(`YOUTUBE_PUBLISH_AT=${plan.publishAt?.toISOString()||''}`);
  if(!plan.publishAt)console.log(`YOUTUBE_PRIVACY_STATUS=${plan.privacy}`);
  if(plan.delaySeconds)console.log(`YOUTUBE_PUBLISH_DELAY_SECONDS=${plan.delaySeconds}`);
  if(plan.late)console.log('YOUTUBE_LATE_PUBLICATION=true');
}
