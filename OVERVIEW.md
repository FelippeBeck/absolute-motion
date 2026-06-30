# Absolute Motion — Visão Geral Completa

> Documento único de referência. Resume **o que é, como funciona, o que entrega,
> a stack, o design, o fluxo e o que falta para rodar de verdade**. Se abrir o
> projeto em qualquer lugar, comece por aqui.

---

## 1. O que é

SaaS que cria **anúncios animados** (vídeos ads, **100% animação — sem avatares/UGC**)
a partir de uma **foto do produto + briefing**. Do roteiro ao vídeo final, automatizado.

**Para quem:** gestores de tráfego, donos de e-commerce e agências que querem
criativos animados que "param o scroll" no Meta/TikTok/Reels/Shorts, em minutos, por centavos.

**Diferencial (oceano azul):** enquanto concorrentes focam em avatares humanos (que
caem no "uncanny valley"), aqui é **all-in em animação** — as "alucinações" da IA viram
estilo, não defeito. E o produto nasce **global** (locução IA em vários idiomas).

**Vantagem vs. "infoprodutos" do nicho:** muita gente vende um PDF ensinando a fazer
manualmente (Claude → Kling → ElevenLabs…). Aqui o **motor automatiza** esse ping-pong
de APIs — o cliente faz upload e recebe o vídeo pronto.

---

## 2. Stack (linguagens e serviços)

| Camada | Tecnologia | Para quê |
|---|---|---|
| Backend | **Node + Express + TypeScript** (rodado via `tsx`) | API + orquestração do pipeline |
| Frontend | **React 19 + Vite 6** (JSX) + React Router | Dashboard e Landing |
| Estilo | CSS-in-JS (inline) + Google Fonts (**Inter**) | UI monocromática |
| IA — roteiro | **Anthropic Claude** (`@anthropic-ai/sdk`) | script, cenas, prompts |
| IA — imagem/vídeo | **fal.ai** (`@fal-ai/client`) — FLUX/Seedream + Seedance/Kling/Veo/WAN | keyframes + image-to-video |
| IA — voz | **ElevenLabs** (REST) | narração + timestamps de legenda |
| Montagem | **FFmpeg** (`fluent-ffmpeg`) | concatena, mixa áudio/música, queima legenda, reframe |
| Banco | **Supabase** (Postgres) — `@supabase/supabase-js` | projetos, jobs, cenas, pastas, time, créditos |
| Storage | **Cloudflare R2** (S3-compatível) — `@aws-sdk/client-s3` | hospeda os vídeos/imagens |
| Pagamento | **Stripe** (opcional, dinâmico) | assinatura/créditos |
| Erros | **Sentry** (opcional, dinâmico) | monitoramento |
| Fila | em processo com concorrência (preparada p/ **Inngest/Trigger.dev**) | jobs assíncronos |
| Validação | **zod** | schema das requisições |

**Modo demo:** roda **sem nenhuma chave** — cada etapa cai num fallback de exemplo.
Conforme você preenche o `.env`, a etapa passa a usar o serviço real automaticamente
(detectado em `src/lib/mode.ts`). Sem Supabase, usa store **em memória**.

---

## 3. Como funciona — o fluxo de criação

```
Brief → Storyboard → Render → Publish
```

Pipeline técnico (orquestrado em `src/pipeline/run.ts`):

```
foto + briefing + landing page
  → Claude            roteiro + cenas + prompts (com "style recipe" travando o visual)
  → fal FLUX/Seedream keyframe de cada cena (encadeado p/ consistência do produto)
  → fal Seedance/Kling anima cada keyframe em clipe (image-to-video)
  → ElevenLabs        narração + timestamps  (+ música de fundo opcional)
  → FFmpeg            concatena + mixa áudio (ducking) + queima legenda
  → Cloudflare R2     upload → link do .mp4 final
```

- **Storyboard ao vivo (SSE):** as cenas aparecem uma a uma (`POST /preview/stream`).
- **Storyboard editável:** editar texto/ordem das cenas, adicionar/remover, timeline visual.
  O render usa **exatamente** o storyboard aprovado (não regenera).
- **Multi-formato:** exporta o vídeo pronto em 9:16 / 1:1 / 16:9 (reframe com blur-pad).
- **Créditos:** 1 crédito ≈ 1 segundo de vídeo; custo = `duração × nº de saídas`.

---

## 4. O que entrega

- **.mp4 final** pronto para Meta/TikTok/Reels/Shorts (download + export multi-formato).
- **Legenda + hashtags** geradas (copiar com 1 clique no bloco *Publish*).
- **Variações e regeneração** de cena (A/B test de ganchos/estilo).
- Organização: **projetos, pastas, fila de render, biblioteca de assets, time**.

---

## 5. Telas (views do app)

| View | O que faz |
|---|---|
| **Explore** (Home) | Dados reais (vídeos criados, projetos, créditos), galeria de estilos e templates (abrem o Studio configurado), seus anúncios recentes |
| **Animation Studio** | Criação: foto + pitch → estilo/formato/duração → Generate (storyboard) → Render → Publish. "Advanced" esconde o que é técnico |
| **Projects** | Lista de projetos, filtro por pasta, mover para pasta, compartilhar |
| **Render Queue** | Status dos jobs em tempo real (progresso, modelo, abrir/favoritar) |
| **Assets Library** | Vídeos gerados (abas All/Images/Videos/Audio/Favorites) |
| **Tools** | Micro-ferramentas (ex.: *Animate Image* — anima 1 imagem) |
| **Team** | Convidar membros por e-mail, papéis (owner/editor/viewer) |
| **Settings** | Abas *Account & Billing* (plano/créditos/uso) e *Developer & API* (status das chaves) |

Menu da conta: Profile, Quick Start, Blog, **Switch Language (EN/PT/ES)**, App Download, Policies, Sign Out. Notificações/changelog no topo.

---

## 6. Design system (literalmente tudo)

**Princípio:** app **estritamente monocromático** — **branco, preto e cinza**. Sem cores
de destaque, sem fundos coloridos. (A *landing* de marketing usa um laranja `#FF5C00` como
acento; o **app** não.)

**Paleta do app** (`T` em `frontend/src/Dashboard.jsx`):

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#FFFFFF` | fundo principal |
| `bg2` | `#FAFAFA` | painéis / sidebar |
| `bg3` | `#F4F4F5` | hover / inputs / thumbs |
| `ink` | `#000000` | texto/elemento principal |
| `text` | `#171717` | texto padrão |
| `sub` | `#525252` | texto secundário |
| `muted` | `#A3A3A3` | dicas / ícones inativos |
| `line` | `#E5E5E5` | divisórias |
| `lineDark` | `#D4D4D8` | bordas fortes |
| `accentHover` | `#262626` | hover do botão preto |

**Tipografia:** **Inter** (400/500/600/700/800), via Google Fonts. `letter-spacing: -0.01em`;
títulos com `-0.02em`. Tamanhos: corpo 13px, labels 11px (uppercase), títulos 16–34px.

**Movimento (suave, cubic-bezier):** `fade` (menus), `pop` (cenas/modais), `view-enter`
(troca de tela), `card-hover` (elevação sutil), `CountUp` (stats contando), `blink` (cursor/live).
Scrollbar fina monocromática.

**Componentes-base:** `Btn` (preto/primário e contorno), `Input`, `TextArea`, `Select`,
`Segmented`, `Badge`, `IconBtn`, `Menu` (dropdown), `Modal`, `Spinner`, `Stepper`, `Logo`.
Ícones: SVG inline (objeto `IC`).

**Marca:** logo **monograma AM** (preto/branco) em `frontend/public/logo.svg`; favicon em
`frontend/public/favicon.svg`. Trocar o arquivo atualiza tudo.

**Formatos de vídeo:** 9:16 (1080×1920), 1:1 (1080×1080), 16:9 (1920×1080).

---

## 7. Estilos de animação (curadoria que converte) + recipes

Cada estilo tem uma **"recipe"** (em `src/pipeline/script.ts`) que **trava o visual** em todas as cenas:

Claymation · Pixar 3D · Anime · Paper Cutout · LEGO · Wes Anderson · Retro Cartoon ·
Surreal 3D · Miniature · Realistic/Photographic · Motion Graphics.

**Modelos selecionáveis:**
- Imagem: `flux-dev`, `flux-pro`, `seedream-4`.
- Vídeo: `seedance-2.0`, `seedance-2.0-mini`, `kling-3.0`, `kling-2.5-turbo`, `veo-3.1`, `wan-2.5`.

---

## 8. API (endpoints principais — `src/server.ts`)

| Método | Rota | Uso |
|---|---|---|
| GET | `/health` | status + quais serviços estão ligados (real x demo) |
| GET | `/me` | plano + créditos |
| POST | `/preview` · `/preview/stream` | storyboard (rápido / streaming SSE) |
| POST | `/projects` | cria projeto + enfileira render (aceita storyboard aprovado) |
| GET | `/projects` · `/projects/:id` | lista / detalhe (cenas) |
| PATCH | `/projects/:id/folder` | mover p/ pasta |
| POST | `/projects/:id/export` | exporta em outro formato (reframe) |
| GET | `/jobs` · `/jobs/:id` | fila / status do job (polling) |
| POST | `/upload` | foto do produto → URL (R2 ou data URL no demo) |
| GET/POST/DELETE | `/folders` | pastas |
| GET/POST/PATCH/DELETE | `/team` | membros/convites/papéis |
| POST | `/scenes/:id/regenerate` | regerar 1 cena |
| POST | `/tools/animate` | image-to-video avulso |
| POST | `/billing/checkout` | Stripe (ou demo) |
| POST | `/webhooks/fal` | webhook (escala) |

---

## 9. Estrutura do repositório

```
src/                 backend (Express/TS)
  server.ts          rotas + boot
  env.ts             carrega .env antes de tudo
  queue.ts           fila em processo (concorrência)
  pipeline/          script · keyframes · video · narration · compose · regenerate · run
  lib/               anthropic · fal · elevenlabs · storage · store · db · mode · music · sentry
frontend/
  src/Dashboard.jsx  o app inteiro (views, componentes, design system, i18n)
  src/Landing.jsx    página de marketing
  public/            logo.svg · favicon.svg
supabase/schema.sql  schema do banco
Dockerfile           backend + FFmpeg (deploy)
dev.mjs              sobe backend+frontend juntos (npm run dev:all)
.env / .env.example  variáveis (.env é ignorado pelo git)
README.md · SETUP.md · OVERVIEW.md (este)
```

---

## 10. Como rodar localmente

Pré-requisitos: **Node 20+**; **FFmpeg** só para render real (`brew install ffmpeg`).

```bash
npm run setup       # instala backend + frontend
cp .env.example .env  # preencha as chaves que tiver (ou rode em demo)
npm run dev:all     # backend :8787 + frontend http://localhost:5173
```

---

## 11. O que precisa para funcionar DE VERDADE (checklist)

As chaves vão **no `.env`** (nunca no `.env.example`). Onde pegar cada uma: ver `SETUP.md`.

1. `ANTHROPIC_API_KEY` — roteiro real (console.anthropic.com; +crédito em Billing).
2. `FAL_KEY` — **imagem + vídeo reais** (fal.ai; +saldo). *É o que tira do modo demo.*
3. `ELEVENLABS_API_KEY` — narração; **mapear os Voice IDs** em `src/lib/elevenlabs.ts` (hoje `TODO`).
4. `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (+ `ANON_KEY`) — banco; rodar `supabase/schema.sql`.
5. `R2_*` — Cloudflare R2 (bucket + token Read/Write) para hospedar os vídeos.
6. **FFmpeg** instalado no servidor → deploy do backend em **Railway/Fly/Render** com o `Dockerfile`. **Vercel não roda FFmpeg.**
7. (opcional) `STRIPE_*` (+ price IDs), `SENTRY_DSN`, `INNGEST_*`, `MUSIC_*`.

Verificação: `curl localhost:8787/health` deve mostrar `anthropic/fal/... = true`.

**Custo aproximado:** ~US$ 1,60–2,50 por vídeo de 30s (imagens + clipes + narração).
Travado por créditos para proteger a margem.

---

## 12. Deploy

- **Backend** (precisa de FFmpeg) → Railway/Fly/Render via `Dockerfile`. Variáveis no painel.
- **Frontend** (estático) → Vercel/Netlify/Cloudflare Pages: `npm --prefix frontend run build` publica `frontend/dist`. Configure `VITE_API_URL` para a URL do backend.

---

## 13. Roadmap / o que ainda falta (pós-MVP)

- **Auth real (Supabase)** — hoje o usuário é fixo `local-user`; com auth, Times/Pastas/Créditos viram por-usuário.
- **Stripe webhooks** — creditar automaticamente ao confirmar pagamento (checkout já existe).
- **Inngest/Trigger.dev** — ligar a fila durável (slots já no `.env`).
- **Performance/Analytics** — registrar resultados reais (gasto, CTR, ROAS) e ranquear estilos/ganchos; depois **integração Meta/TikTok** (publicar + puxar métricas automático).
- **i18n** — hoje cobre o "chrome"; estender para 100% das telas.
- **Tendências reais** no Explore (scraper TikTok) — quando houver, substitui qualquer dado de exemplo.

---

## 14. Resumo de uma frase

**Absolute Motion** = motor que transforma **foto + 1 frase** em **anúncio animado pronto**,
em minutos e por centavos — com estilos que convertem, fluxo simples (Brief→Storyboard→Render→Publish)
e arquitetura pronta para escalar (fila, créditos, storage, multi-idioma).
