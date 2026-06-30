# Absolute Motion

Plataforma SaaS que cria **anúncios animados** (vídeos ads, sem pessoas reais) a partir de
uma **foto do produto + briefing**. Do roteiro ao vídeo final, automatizado.

```
foto + briefing + landing page
      → Claude (roteiro, cenas, prompts)
      → fal FLUX/Seedream (imagens-chave no estilo escolhido)
      → fal Seedance/Kling (anima cada cena)
      → ElevenLabs (narração) + música + legendas
      → FFmpeg (montagem) → Cloudflare R2 (link do vídeo)
```

> Roda **100% sem chaves** em "modo demo" (com dados de exemplo). Conforme você preenche
> o `.env`, cada etapa passa a usar o serviço real automaticamente.

## Stack

- **Backend:** Node + Express + TypeScript (`src/`) — orquestra o pipeline.
- **Frontend:** React + Vite (`frontend/`) — o dashboard (Studio, Explore, Projects, Queue, Assets, Tools, Team, Settings).
- **Banco:** Supabase (fallback em memória quando não configurado).
- **Storage:** Cloudflare R2 · **IA:** Anthropic + fal.ai + ElevenLabs · **Pagamento:** Stripe.
- **Fila:** Em processo (dev) ou Inngest (produção) — auto-detecta via `.env`.
- **Auth:** Supabase Auth (JWT) — perfil criado automaticamente no signup.

## Rodar localmente

Pré-requisitos: **Node 20+** e (para render real) **FFmpeg** (`brew install ffmpeg`).

```bash
# 1) clonar e instalar tudo (backend + frontend)
npm run setup            # = npm install && npm --prefix frontend install

# 2) variáveis de ambiente
cp .env.example .env     # preencha as chaves que tiver (veja SETUP.md)

# 3) subir backend (:8787) e frontend (:5173) juntos
npm run dev:all
# abra http://localhost:5173
```

Sem nenhuma chave já funciona (modo demo). Para ligar a geração real, veja **[SETUP.md](SETUP.md)**.

> ⚠️ As chaves reais vão **no `.env`** (que é ignorado pelo git). O `.env.example` é só o
> modelo — nunca coloque chave real nele.

## Serviços e auto-detecção

O backend detecta automaticamente quais serviços estão configurados (`/health`):

| Serviço | Variável `.env` | Sem chave |
|---------|-----------------|-----------|
| Claude (roteiro) | `ANTHROPIC_API_KEY` | Pacote criativo de exemplo |
| fal.ai (imagem/vídeo) | `FAL_KEY` | Render simulada com progresso real |
| ElevenLabs (narração) | `ELEVENLABS_API_KEY` | Timestamps de demo (silêncio) |
| Supabase (banco) | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Store em memória |
| Cloudflare R2 (storage) | `R2_*` | Data URLs |
| Stripe (pagamento) | `STRIPE_SECRET_KEY` | Checkout demo |
| Inngest (fila) | `INNGEST_EVENT_KEY` | Fila em processo |
| Sentry (erros) | `SENTRY_DSN` | No-op |

### Vozes do ElevenLabs

As vozes usam IDs públicos como default (Rachel, Adam, Bella, Antoni, Elli).
Para usar vozes da sua conta, configure no `.env`:

```env
VOICE_ID_PREMIUM=seu_voice_id
VOICE_ID_ENERGETICA_MASC=seu_voice_id
VOICE_ID_ENERGETICA_FEM=seu_voice_id
VOICE_ID_CALMA_MASC=seu_voice_id
VOICE_ID_CALMA_FEM=seu_voice_id
```

### Modelos de vídeo suportados

Cada modelo tem validação automática de duração, aspect ratio e resolução:

| Modelo | Duração | Formatos | Resolução | End Frame |
|--------|---------|----------|-----------|-----------|
| `seedance-2.0` | 5–10s | 9:16, 16:9, 1:1 | 720p, 1080p | ✅ |
| `seedance-2.0-mini` | 5–10s | 9:16, 16:9, 1:1 | 720p, 1080p | ❌ |
| `kling-3.0` | 5–10s | 9:16, 16:9, 1:1 | 720p, 1080p | ✅ |
| `kling-2.5-turbo` | 5–10s | 9:16, 16:9, 1:1 | 720p, 1080p | ❌ |
| `veo-3.1` | 5–8s | 9:16, 16:9, 1:1 | 720p, 1080p | ❌ |
| `wan-2.5` | 3–5s | 9:16, 16:9, 1:1 | 480p–1080p | ❌ |

## Estrutura

```
src/                 backend (Express)
  server.ts          rotas (preview/stream, projects, jobs, folders, team, export, billing…)
  queue.ts           fila com adapter pattern (in-process / Inngest)
  pipeline/          script (Claude) · keyframes · video · narration · compose (FFmpeg) · run
  lib/               anthropic · fal · elevenlabs · storage(R2) · store(db/memória) · auth · mode · music · sentry
frontend/src/        Dashboard.jsx (app) · Landing.jsx · main.jsx
supabase/
  schema.sql         schema do banco (com RLS completo)
  migrations/        001_profile_trigger.sql (perfil automático no signup)
Dockerfile           imagem do backend com FFmpeg (deploy)
```

## Deploy

- **Backend** (precisa de FFmpeg) → **Railway / Fly.io / Render** usando o `Dockerfile`. **Não** use Vercel.
- **Frontend** (estático) → Vercel / Netlify / Cloudflare Pages (`npm --prefix frontend run build`, publica `frontend/dist`).
- Em produção, as variáveis vão no painel da plataforma (não há `.env`).
- Configure `APP_URL` para restringir CORS ao domínio do frontend em produção.

### Banco (Supabase)

1. Rode `supabase/schema.sql` no SQL Editor do Supabase.
2. Rode `supabase/migrations/001_profile_trigger.sql` para criar perfis automaticamente no signup.
3. O RLS cobre todas as tabelas — cada usuário só vê/edita os próprios dados.

### Fila durável (produção)

Para escala horizontal, preencha `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` no `.env`.
A fila troca automaticamente para Inngest. Sem essas chaves, usa fila em processo (ok para dev).

## Contribuindo (time)

```bash
git checkout -b minha-feature
# ...alterações...
npx tsc --noEmit                  # garante que compila (typecheck)
npm --prefix frontend run build   # garante que o front compila
git commit -am "feat: minha feature"
git push -u origin minha-feature  # abra um Pull Request no GitHub
```
