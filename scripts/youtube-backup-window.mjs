const TIME_ZONE='Europe/Madrid';
const PREPARATION_MINUTES={ mati:6*60+20, vespre:19*60+45 };
const BACKUP_DELAY_MINUTES=10;
const BACKUP_WINDOW_MINUTES=20;

function localMinutes(date) {
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:TIME_ZONE,
    hour:'2-digit',
    minute:'2-digit',
    hourCycle:'h23',
  }).formatToParts(date);
  const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return Number(values.hour)*60+Number(values.minute);
}

export function shouldRunScheduledBackup(slot,now=new Date()) {
  const preparation=PREPARATION_MINUTES[slot];
  if (!Number.isFinite(preparation)) throw new Error(`Franja de YouTube desconeguda: ${slot}.`);
  const current=localMinutes(now);
  const start=preparation+BACKUP_DELAY_MINUTES;
  return current>=start && current<start+BACKUP_WINDOW_MINUTES;
}

if (import.meta.main) {
  const slot=process.env.SHORT_SLOT === 'vespre' ? 'vespre' : 'mati';
  console.log(`YOUTUBE_SHORT_SHOULD_RUN=${shouldRunScheduledBackup(slot)?'true':'false'}`);
}
