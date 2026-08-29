const TIME_ZONE = 'Europe/Madrid';
const SLOT_TIMES = { mati:{ hour:7, minute:0 }, vespre:{ hour:20, minute:30 } };
const MINIMUM_SCHEDULING_MARGIN_MS = 5 * 60_000;

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

export function plannedPublishAt(slot, now = new Date()) {
  const target = SLOT_TIMES[slot];
  if (!target) throw new Error(`Franja de YouTube desconeguda: ${slot}.`);
  const { year, month, day } = partsInTimeZone(now);
  const nominalUtc = Date.UTC(year, month - 1, day, target.hour, target.minute);
  // Les franges són després del canvi d'hora habitual; calculem l'offset per a
  // la mateixa hora local per conservar 07:00/20:30 tant a l'estiu com a l'hivern.
  const publishAt = new Date(nominalUtc - offsetAt(new Date(nominalUtc)));
  // GitHub may start a scheduled workflow late. Five minutes still leaves time
  // for the compact render/upload path while avoiding a publishAt already past.
  if (publishAt.getTime() - now.getTime() < MINIMUM_SCHEDULING_MARGIN_MS) {
    throw new Error(`No queda marge suficient per programar el Short de ${slot} (${publishAt.toISOString()}).`);
  }
  return publishAt;
}

if (import.meta.main) {
  const slot = process.env.SHORT_SLOT === 'vespre' ? 'vespre' : 'mati';
  console.log(`YOUTUBE_PUBLISH_AT=${plannedPublishAt(slot).toISOString()}`);
}
