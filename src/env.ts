// Carrega o .env para process.env ANTES de qualquer outro módulo ler as chaves.
// Por isso este é o PRIMEIRO import do server.ts. Em produção (Railway/Fly), as
// variáveis vêm da plataforma e não há .env — o try/catch cobre esse caso.
import { existsSync } from "node:fs";

if (typeof (process as any).loadEnvFile === "function" && existsSync(".env")) {
  try { (process as any).loadEnvFile(".env"); } catch { /* ignora */ }
}
