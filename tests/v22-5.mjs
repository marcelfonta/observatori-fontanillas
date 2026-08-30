import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [project,worker,admin,adminHtml,serviceWorker,roadmap]=await Promise.all([
  readFile(new URL('../project.json',import.meta.url),'utf8'),
  readFile(new URL('../worker/index.js',import.meta.url),'utf8'),
  readFile(new URL('../src/features/admin.js',import.meta.url),'utf8'),
  readFile(new URL('../administracio.html',import.meta.url),'utf8'),
  readFile(new URL('../service-worker.js',import.meta.url),'utf8'),
  readFile(new URL('../ROADMAP.md',import.meta.url),'utf8')
]);

assert.equal(JSON.parse(project).version,'22.23.1');
assert.ok(serviceWorker.includes('observatori-fontanillas-v22-23-1'));
assert.ok(worker.includes('recordOperationalState')&&worker.includes('adminOperationsSummary'));
assert.ok(worker.includes("'scheduler'")&&worker.includes("'push-alert'")&&worker.includes("'social-automatic'"));
assert.ok(worker.includes('Promise.allSettled(jobs)'));
assert.ok(worker.includes("monitor_state.consecutive_failures+1"));
assert.ok(worker.includes("event:'scheduled_job_failed'")&&worker.includes("event:'operational_state'"));
assert.ok(worker.includes("schedule:{ observationMinutes:STORAGE_INTERVAL_MINUTES"));
assert.ok(adminHtml.includes('admin-operations-pill')&&adminHtml.includes('admin-push-recipients'));
assert.ok(admin.includes('function renderOperations')&&admin.includes('social.schedule'));
assert.ok(admin.includes("retry-failed")&&admin.includes('Repetir només els errors'));
assert.ok(admin.includes("item.status==='failed'&&!publishedChannels.has(item.channel)"));
assert.ok(worker.includes('SOCIAL_AUTOMATIC_MAX_ATTEMPTS = 4')&&worker.includes('definitiveFailures.length'),'Els correus socials encara avisen abans d’esgotar els reintents.');
assert.ok(worker.includes('després de ${SOCIAL_AUTOMATIC_MAX_ATTEMPTS} intents'),'El correu definitiu no explica que els reintents s’han esgotat.');
assert.ok(roadmap.includes('V22.5.0 — Control operatiu i recuperació segura'));

console.log('Test V22.5: control operatiu persistent i reintents selectius preparats');
