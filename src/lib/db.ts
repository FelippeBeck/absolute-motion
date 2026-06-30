import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase lazy — só inicializa quando realmente for usado.
// O acesso ao banco é mediado pelo `store` (src/lib/store.ts), que cai num
// fallback em memória quando o Supabase não está configurado. Por isso este
// módulo só é tocado quando SUPABASE_URL/KEY existem.
let _db: SupabaseClient | null = null;

function getDb(): SupabaseClient {
  if (_db) return _db;
  let url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || url.startsWith("https://xxxx")) {
    throw new Error("Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_SERVICE_KEY no .env");
  }
  // Tolera URL informada só como "ref" (sem https:// e .supabase.co).
  if (!/^https?:\/\//i.test(url)) url = `https://${url.replace(/\/+$/, "")}.supabase.co`;
  _db = createClient(url, key, { auth: { persistSession: false } });
  return _db;
}

/** Proxy exportado para manter compatibilidade com `db.from(...)`. */
export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
