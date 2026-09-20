import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export function scheduleEvidence(runs,now=new Date().toISOString()){
  if(!Array.isArray(runs)||!Number.isFinite(Date.parse(now)))throw new Error('Evidència invàlida');
  const ordered=runs.filter(r=>r.event==='schedule'&&Number.isFinite(Date.parse(r.createdAt))&&r.createdAt<=now).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const latest=ordered[0];
  return {checkedAt:now,scope:'last-50-workflow-runs',scheduledRunsObserved:ordered.length,
    status:!latest?'not-observed-in-window':latest.status!=='completed'?'pending':latest.conclusion==='success'?'latest-scheduled-success':'latest-scheduled-needs-review',
    latestScheduled:latest?{id:latest.databaseId,createdAt:latest.createdAt,status:latest.status,conclusion:latest.conclusion,headSha:latest.headSha}:null,
    guaranteesFutureRuns:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  // Read-only metadata through the user's existing gh login; never read or print tokens.
  const runs=JSON.parse(execFileSync('gh',['run','list','--repo','marcelfonta/observatori-fontanillas','--workflow','fonta-shadow.yml','--limit','50','--json','databaseId,event,status,conclusion,createdAt,headSha'],{encoding:'utf8',timeout:30000}));
  console.log(JSON.stringify(scheduleEvidence(runs),null,2));
}
