// Detecta quais serviços estão realmente configurados.
// Isso permite rodar a plataforma inteira em "modo demo" (sem nenhuma chave),
// mostrando o fluxo ponta a ponta com dados de exemplo. Conforme você preenche
// as chaves no .env, cada etapa passa a usar o serviço real automaticamente.

function filled(v?: string) {
  if (!v) return false;
  const s = v.trim();
  if (!s) return false;
  // ignora placeholders comuns do .env.example
  return !/^(sk-ant-x|fal-key-x|eleven-x|xxxx|whsec_x|sk_test_x|sk-xxx|your_|todo|changeme|https:\/\/xxxx)/i.test(s);
}

export const has = {
  anthropic: () => filled(process.env.ANTHROPIC_API_KEY),
  fal: () => filled(process.env.FAL_KEY),
  elevenlabs: () => filled(process.env.ELEVENLABS_API_KEY),
  supabase: () => filled(process.env.SUPABASE_URL) && filled(process.env.SUPABASE_SERVICE_KEY),
  r2: () =>
    filled(process.env.R2_ACCOUNT_ID) &&
    filled(process.env.R2_ACCESS_KEY_ID) &&
    filled(process.env.R2_SECRET_ACCESS_KEY),
  stripe: () => filled(process.env.STRIPE_SECRET_KEY),
  // Sem fal não há como gerar imagem/vídeo de verdade → render simulada.
  demoRender: () => !filled(process.env.FAL_KEY),
};

// Resumo legível pro log de boot e pro endpoint /health.
export function modeSummary() {
  return {
    anthropic: has.anthropic(),
    fal: has.fal(),
    elevenlabs: has.elevenlabs(),
    supabase: has.supabase(),
    r2: has.r2(),
    // true quando falta o essencial pra render real (imagem/vídeo)
    demo: !has.fal(),
  };
}
