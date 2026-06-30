# Absolute Motion — Guia de Setup

A plataforma cria **anúncios animados** a partir de um briefing + foto do produto:

```
foto + briefing → Claude (roteiro/cenas) → fal (imagens) →
fal (anima cada cena) → ElevenLabs (narração) → FFmpeg (junta tudo) →
R2 (link do vídeo final)
```

## Rodar agora (modo demo, sem nenhuma chave)

O app roda 100% sem chaves: o motor criativo usa um pacote de exemplo, a render
é **simulada** com progresso real e entrega um vídeo de amostra. Serve para ver o
fluxo inteiro funcionando antes de pagar por qualquer API.

```bash
# 1) Backend (porta 8787)
npm install
npm run dev

# 2) Frontend (porta 5173) — em outro terminal
cd frontend
npm install
npm run dev
# abra http://localhost:5173
```

No app: envie uma foto → preencha o produto → **Gerar Storyboard** → **Renderizar Vídeo**.
O selo **"Modo Demo"** no topo confirma que nenhuma chave está ligada ainda.

> O canto inferior esquerdo (Engine Online/Offline) e a aba **Settings & API**
> mostram, em tempo real, quais serviços já saíram do modo demo.

## Ligar a geração de verdade

Copie `.env.example` para `.env` e preencha **só o que você tiver**. Cada chave
liga uma etapa; o resto continua em modo demo. Reinicie o backend após editar.

| # | Chave (.env) | Liga | Onde pegar | Custo |
|---|---|---|---|---|
| 1 | `ANTHROPIC_API_KEY` | Roteiro/cenas reais (Claude) | console.anthropic.com → API Keys | ~centavos/vídeo |
| 2 | `FAL_KEY` | Imagens + vídeo reais (sai do demo) | fal.ai/dashboard/keys | ~$1,50–2,50/vídeo |
| 3 | `ELEVENLABS_API_KEY` | Narração + legendas | elevenlabs.io → Settings → API Keys | centavos |
| 4 | `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Banco persistente (sem isso usa memória) | supabase.com → Project Settings → API | grátis p/ começar |
| 5 | `R2_*` | Hospeda o vídeo final | dash.cloudflare.com → R2 | ~grátis |

**Ordem recomendada:** comece pela **1 (Anthropic)** → storyboard de verdade. Depois
**2 (fal)** → vídeo real (este é o que faz "criar o ad" de fato). 3/4/5 são incrementais.

### Passos extras por serviço

- **fal (#2):** só preencher `FAL_KEY` já tira o app do modo demo e ativa a render real.
- **ElevenLabs (#3):** mapeie os IDs de voz reais da sua conta em
  [src/lib/elevenlabs.ts](src/lib/elevenlabs.ts) (hoje estão como `TODO_VOICE_ID`).
- **Supabase (#4):** rode [supabase/schema.sql](supabase/schema.sql) no SQL Editor.
- **R2 (#5):** crie um bucket e ajuste `R2_BUCKET` / `R2_PUBLIC_URL`.
- **FFmpeg:** necessário para a montagem real (`brew install ffmpeg`). Por isso o
  worker roda em Railway/Render/Fly — **não** na Vercel.

## Custo aproximado por vídeo (30s, ~4 cenas, em produção)

- Imagens (FLUX): ~$0,10
- Clipes (Seedance Mini): ~$1,46 (ou ~$2,00 no Seedance 2.0)
- Narração: centavos
- **Total ~ $1,60 a $2,50/vídeo.** Modelo escolhido por vídeo em `videoModel`.

## O que ainda falta para produção (pós-MVP)

- **Autenticação real** (hoje o `userId` é fixo). Ao ligar o Supabase, criar perfil
  no signup e usar o token do usuário.
- **Fila durável** (Inngest/Trigger.dev) no lugar da fila em memória ([src/queue.ts](src/queue.ts)).
- **Webhooks do fal** em vez de polling síncrono, para escala.
- **Validar os payloads do fal** por modelo (params variam entre Seedance/Kling/Veo).
- **Cobrança (Stripe)** e limite de créditos por plano.
