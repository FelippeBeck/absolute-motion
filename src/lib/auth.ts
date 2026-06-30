import { has } from "./mode.js";

// Resolve o usuário da requisição. Com Supabase configurado, verifica o JWT do
// header Authorization (login real). Sem isso (demo), usa userId do body/query
// ou "local-user". Assim o app é multiusuário quando ligado e segue em demo enquanto não.
export async function getUid(req: any): Promise<string> {
  const authz: string | undefined = req.headers?.authorization;
  if (has.supabase() && authz?.startsWith("Bearer ")) {
    try {
      const { db } = await import("./db.js");
      const { data } = await (db as any).auth.getUser(authz.slice(7));
      if (data?.user?.id) return data.user.id as string;
    } catch { /* token inválido → cai no fallback */ }
  }
  return String(req.body?.userId || req.query?.userId || "local-user");
}
