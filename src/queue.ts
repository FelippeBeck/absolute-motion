import { runJob } from "./pipeline/run.js";
import { captureError } from "./lib/sentry.js";
import { has } from "./lib/mode.js";

// ── Interface da fila ────────────────────────────────────────────────────────
// Duas implementações: em processo (dev/MVP) e Inngest (produção).
// Para usar Inngest: preencha INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY no .env
// e instale o pacote (npm i inngest). A troca é automática.

interface QueueAdapter {
  enqueue(jobId: string): void;
}

// ── In-process (padrão) ──────────────────────────────────────────────────────
// Fila em memória com concorrência. Para escala horizontal real, troque por
// Inngest / Trigger.dev / BullMQ (mesma interface `enqueue`).
class InProcessQueue implements QueueAdapter {
  private queue: string[] = [];
  private active = 0;
  private concurrency = Number(process.env.QUEUE_CONCURRENCY || 2);

  enqueue(jobId: string) {
    this.queue.push(jobId);
    this.pump();
  }

  private pump() {
    while (this.active < this.concurrency && this.queue.length) {
      const jobId = this.queue.shift()!;
      this.active++;
      runJob(jobId)
        .catch((e) => { console.error("job failed", jobId, e); captureError(e, { jobId }); })
        .finally(() => { this.active--; this.pump(); });
    }
  }
}

// ── Inngest (produção) ───────────────────────────────────────────────────────
// Dispara um evento que é consumido por uma function Inngest registrada em
// outro arquivo / deploy. A function chama runJob(jobId) lá.
class InngestQueue implements QueueAdapter {
  private client: any = null;

  private async getClient() {
    if (this.client) return this.client;
    const mod = "inngest";
    const { Inngest } = await import(mod);
    this.client = new Inngest({ id: "absolute-motion", eventKey: process.env.INNGEST_EVENT_KEY! });
    return this.client;
  }

  enqueue(jobId: string) {
    this.getClient()
      .then((client: any) => client.send({ name: "render/job.queued", data: { jobId } }))
      .catch((e: unknown) => {
        console.error("[inngest] falha ao enfileirar, executando localmente:", jobId);
        captureError(e, { jobId });
        // Fallback: roda localmente se Inngest falhar
        runJob(jobId).catch((err) => { console.error("job failed", jobId, err); captureError(err, { jobId }); });
      });
  }
}

// Auto-detecta qual adapter usar
const adapter: QueueAdapter = has.inngest() ? new InngestQueue() : new InProcessQueue();

export function enqueue(jobId: string) {
  adapter.enqueue(jobId);
}
