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

## Estrutura

```
src/                 backend (Express)
  server.ts          rotas (preview/stream, projects, jobs, folders, team, export, billing…)
  pipeline/          script (Claude) · keyframes · video · narration · compose (FFmpeg) · run
  lib/               anthropic · fal · elevenlabs · storage(R2) · store(db/memória) · mode · music · sentry
frontend/src/        Dashboard.jsx (app) · Landing.jsx · main.jsx
supabase/schema.sql  schema do banco
Dockerfile           imagem do backend com FFmpeg (deploy)
```

## Deploy

- **Backend** (precisa de FFmpeg) → **Railway / Fly.io / Render** usando o `Dockerfile`. **Não** use Vercel.
- **Frontend** (estático) → Vercel / Netlify / Cloudflare Pages (`npm --prefix frontend run build`, publica `frontend/dist`).
- Em produção, as variáveis vão no painel da plataforma (não há `.env`).

## Contribuindo (time)

```bash
git checkout -b minha-feature
# ...alterações...
npm --prefix frontend run build   # garante que compila
git commit -am "feat: minha feature"
git push -u origin minha-feature  # abra um Pull Request no GitHub
```
