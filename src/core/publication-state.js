// A configured secret or an accepted dispatch is not proof of publication.
export function publicationState(run, now = new Date()) {
  if (!run) return {label:'Encara no comprovat', tone:'is-muted'};
  const detail = run.detail || {};
  if (run.status === 'down') return {label:detail.terminal ? 'Bloquejat · cal intervenció' : 'Error · cal revisar', tone:'is-error'};
  if (detail.stage === 'sent' || detail.status === 'sent') return {label:'Publicació confirmada', tone:'is-ok'};
  if (detail.stage === 'completed') {
    if (detail.youtubeId && detail.privacy === 'public') return {label:'Publicació confirmada', tone:'is-ok'};
    if (detail.publishAt) return {label:Date.parse(detail.publishAt) > now.getTime() ? 'Programada a YouTube' : 'Hora prevista passada · comprova YouTube', tone:'is-warning'};
    return {label:'Procés completat · visibilitat no verificada', tone:'is-warning'};
  }
  if (detail.stage === 'scheduled' || detail.stage === 'submitted' || detail.status === 'scheduled') return {label:'Programada · lliurament pendent', tone:'is-warning'};
  if (run.status === 'running' || detail.stage === 'in_progress') return {label:'En preparació', tone:'is-warning'};
  if (run.status === 'dispatching' || ['dispatched','awaiting_github'].includes(detail.stage)) return {label:'Execució sol·licitada · pendent', tone:'is-warning'};
  return {label:'Estat no confirmat', tone:'is-warning'};
}
