import { runJob } from "./pipeline/run.js";
import { captureError } from "./lib/sentry.js";

// Fila em processo com CONCORRÊNCIA e retry. Para escala horizontal real, troque
// por Inngest / Trigger.dev / BullMQ (mesma interface `enqueue`): basta um adapter
// que receba o jobId e chame runJob — o estado do job já vive no `store`.
const queue: string[] = [];
const CONCURRENCY = Number(process.env.QUEUE_CONCURRENCY || 2);
let active = 0;

export function enqueue(jobId: string) {
  queue.push(jobId);
  pump();
}

function pump() {
  while (active < CONCURRENCY && queue.length) {
    const jobId = queue.shift()!;
    active++;
    runJob(jobId)
      .catch((e) => { console.error("job failed", jobId, e); captureError(e, { jobId }); })
      .finally(() => { active--; pump(); });
  }
}
