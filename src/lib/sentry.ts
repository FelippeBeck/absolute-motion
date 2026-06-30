// Monitoramento de erros opcional (Sentry). Ativa só se SENTRY_DSN estiver no .env
// e o pacote @sentry/node estiver instalado — caso contrário, no-op.
let sentry: any = null;

export async function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || /^https:\/\/xxxx/i.test(dsn)) return;
  try {
    const mod = "@sentry/node";
    const S = await import(mod); // dependência opcional
    S.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV || "development" });
    sentry = S;
    console.log("  sentry: on");
  } catch {
    console.log("  sentry: DSN setado mas @sentry/node não instalado (npm i @sentry/node)");
  }
}

export function captureError(e: unknown, context?: Record<string, unknown>) {
  if (sentry) { try { sentry.captureException(e, context ? { extra: context } : undefined); } catch {} }
}
