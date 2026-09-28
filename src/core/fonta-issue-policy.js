// Prospective issue policy v2. GitHub schedules are not execution guarantees:
// keep the first complete daytime capture, but never accept a late/evening run.
export const FONTA_ISSUE_POLICY=Object.freeze({
  id:'fonta-first-prospective-08-18z-v2',
  startHourUtc:8,
  endHourUtc:18,
});

const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

export function fontaIssueState(instant){
  if(!validTime(instant))throw new Error('Instant de captura invàlid');
  const hour=new Date(instant).getUTCHours();
  return {
    policy:FONTA_ISSUE_POLICY.id,
    eligible:hour>=FONTA_ISSUE_POLICY.startHourUtc&&hour<FONTA_ISSUE_POLICY.endHourUtc,
    hourUtc:hour,
  };
}

// The archive keeps one daytime and one evening file. This boundary is wider
// than the old 12 UTC split so a delayed 08:10 cron does not consume the PM slot.
export function fontaArchiveSlot(instant){
  if(!validTime(instant))throw new Error('Instant de captura invàlid');
  return new Date(instant).getUTCHours()<FONTA_ISSUE_POLICY.endHourUtc?'am':'pm';
}

export function isCurrentFontaIssue(capture){
  return capture?.issuePolicy===FONTA_ISSUE_POLICY.id&&fontaIssueState(capture.capturedAt).eligible;
}
