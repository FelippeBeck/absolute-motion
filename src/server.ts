import "./env.js"; // carrega .env antes de tudo
import express from "express";
import { z } from "zod";
import { store } from "./lib/store.js";
import { modeSummary, has } from "./lib/mode.js";
import { uploadBuffer } from "./lib/storage.js";
import { generateVideo, generateImage } from "./lib/fal.js";
import { reframe, compose } from "./pipeline/compose.js";
import { renderNarration } from "./pipeline/narration.js";
import { resolveMusic } from "./lib/music.js";
import { initSentry, captureError } from "./lib/sentry.js";
import { getUid } from "./lib/auth.js";
import { enqueue } from "./queue.js";
import { buildCreativePackage, type Brief } from "./pipeline/script.js";
import { regenerateScene } from "./pipeline/regenerate.js";

const app = express();

// Stripe webhook precisa do corpo CRU (raw) para verificar a assinatura — por isso
// vem ANTES do express.json(). Credita o usuário quando o pagamento confirma.
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!has.stripe() || !process.env.STRIPE_WEBHOOK_SECRET) return res.json({ demo: true });
  try {
    const mod = "stripe";
    const Stripe = (await import(mod)).default as any;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET!);
    if (event.type === "checkout.session.completed" || event.type === "invoice.paid") {
      const obj: any = event.data.object;
      const userId = obj.client_reference_id || obj.metadata?.userId;
      const credits = Number(obj.metadata?.credits || 0);
      if (userId && credits) await store.grantCredits(String(userId), credits);
    }
    res.json({ received: true });
  } catch (e: any) { captureError(e); res.status(400).send(`Webhook Error: ${e?.message}`); }
});

app.use(express.json({ limit: "25mb" }));

// CORS: em produção usa APP_URL; em dev aceita qualquer origem.
const CORS_ORIGIN = process.env.APP_URL || "*";
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  if (_req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const photoSchema = z.object({ mediaType: z.string(), base64: z.string() }).optional();

const briefSchema = z.object({
  userId: z.string().default("local-user"),
  name: z.string().default("Novo anúncio"),
  product: z.string(),
  desc: z.string().optional(),
  audience: z.string().optional(),
  objective: z.string().default("Conversão / venda direta"),
  style: z.string().default("3D estilo Pixar"),
  tone: z.string().default("Divertido"),
  format: z.string().default("9:16"),
  duration: z.number().default(30),
  lang: z.string().default("Português (BR)"),
  voice: z.string().default("Locução premium"),
  brandContext: z.string().optional(),
  landingUrl: z.string().optional(),
  videoModel: z.string().default("seedance-2.0"),
  imageModel: z.string().default("flux-dev"),
  resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
  outputs: z.number().int().min(1).max(4).default(1),
  styleId: z.string().optional(),
  audioMode: z.enum(["narration", "music"]).default("narration"),
  musicMood: z.string().optional(),
  productRefUrl: z.string().optional(),
  endFrameUrl: z.string().optional(),
  folderId: z.string().optional(),
  photo: photoSchema,
  // storyboard aprovado/editado pelo usuário (renderiza estas cenas em vez de gerar de novo)
  scenes: z.array(z.object({
    n: z.number(), dur: z.number(),
    keyframe: z.string(), motion: z.string(),
    narracao: z.string().default(""), legenda: z.string().default(""),
  })).optional(),
  concept: z.any().optional(),
});

// 0) Status do servidor: mostra quais serviços estão ligados (real x demo).
app.get("/health", (_req, res) => res.json({ ok: true, ...modeSummary() }));

// 0b) Dados da conta (plano + créditos). Stub no modo demo.
app.get("/me", async (req, res) => {
  const userId = await getUid(req);
  const credits = await store.getCredits(userId);
  res.json({ userId, email: null, plan: "Pro", credits });
});

// 1) Pré-visualizar o pacote criativo (rápido, só Claude). Use no "WOW" da LP.
app.post("/preview", async (req, res) => {
  try {
    const b = briefSchema.parse(req.body);
    const pkg = await buildCreativePackage(b as unknown as Brief, b.photo);
    res.json(pkg);
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// 1b) Mesmo pacote, em streaming (SSE) — as cenas chegam uma a uma ("IA ao vivo").
app.post("/preview/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const send = (e: unknown) => res.write(`data: ${JSON.stringify(e)}\n\n`);
  try {
    const b = briefSchema.parse(req.body);
    const pkg = await buildCreativePackage(b as unknown as Brief, b.photo, (ev) => { send(ev); });
    send({ type: "done", package: pkg });
  } catch (e: any) {
    send({ type: "error", error: String(e?.message || e) });
  }
  res.end();
});

// 2) Criar projeto + enfileirar render completo do vídeo.
app.post("/projects", async (req, res) => {
  try {
    const b = briefSchema.parse(req.body);
    const userId = await getUid(req);
    // a foto não vai pro brief persistido (é pesada); só a URL de referência.
    const { photo, ...briefForStore } = b;

    const project = await store.createProject({
      user_id: userId, name: b.name, product: b.product, brief: briefForStore, folder_id: b.folderId ?? null,
    });
    const job = await store.createJob({
      project_id: project.id, user_id: userId,
      video_model: b.videoModel, image_model: b.imageModel,
    });

    await store.spendCredits(userId, (b.duration || 30) * (b.outputs || 1)); // 1 crédito ≈ 1s × saídas
    enqueue(job.id);
    res.json({ projectId: project.id, jobId: job.id });
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// 2b) Lista de projetos (alimenta a aba "Projects") com status do último job.
app.get("/projects", async (req, res) => {
  const userId = await getUid(req);
  const projects = await store.listProjects(userId, 40);
  const jobs = await store.listJobs(userId, 200);
  const latest = new Map<string, any>();
  for (const j of jobs) if (!latest.has(j.project_id)) latest.set(j.project_id, j);
  res.json(projects.map((p) => {
    const j = latest.get(p.id);
    return {
      id: p.id, name: p.name, product: p.product, createdAt: p.created_at,
      status: j?.status || p.status, progress: j?.progress || 0,
      outputUrl: j?.output_url, jobId: j?.id, folderId: p.folder_id || null,
    };
  }));
});

// ═══ Fluxo por ETAPAS (valida o output de cada estágio antes de avançar) ═══════

// E1) Rascunho: cria o projeto + persiste o storyboard aprovado, SEM renderizar.
app.post("/projects/draft", async (req, res) => {
  try {
    const b = briefSchema.parse(req.body);
    const userId = await getUid(req);
    const { photo, ...briefForStore } = b;
    const project = await store.createProject({ user_id: userId, name: b.name, product: b.product, brief: briefForStore, concept: b.concept, folder_id: b.folderId ?? null, status: "draft" });
    const scenes = (b.scenes || []).map((s) => ({ idx: s.n, duration_sec: s.dur, keyframe_prompt: s.keyframe, motion_prompt: s.motion, narration: s.narracao, caption: s.legenda, status: "pending" as const }));
    await store.replaceScenes(project.id, scenes);
    res.json({ projectId: project.id, scenes: await store.getScenes(project.id) });
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// E2) Gera os KEYFRAMES (imagens) de todas as cenas (encadeadas p/ consistência).
app.post("/projects/:id/keyframes", async (req, res) => {
  try {
    const project = await store.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "not found" });
    const brief: any = project.brief || {};
    const scenes = await store.getScenes(req.params.id);
    let lastRef: string | undefined = brief.productRefUrl;
    for (const s of scenes) {
      const { url } = await generateImage(brief.imageModel || "flux-dev", s.keyframe_prompt || "", lastRef);
      lastRef = url;
      await store.updateScene(s.id, { keyframe_url: url, status: "keyframe" });
    }
    res.json({ scenes: await store.getScenes(req.params.id) });
  } catch (e: any) { captureError(e); res.status(400).json({ error: String(e?.message || e) }); }
});

// E2b) Regera o keyframe de UMA cena.
app.post("/scenes/:id/keyframe", async (req, res) => {
  try {
    const scene = await store.getScene(req.params.id);
    if (!scene) return res.status(404).json({ error: "not found" });
    const project = await store.getProject(scene.project_id);
    const brief: any = project?.brief || {};
    const prompt = String(req.body?.keyframe || scene.keyframe_prompt || "");
    if (req.body?.keyframe) await store.updateScene(scene.id, { keyframe_prompt: prompt });
    const { url } = await generateImage(brief.imageModel || "flux-dev", prompt);
    await store.updateScene(scene.id, { keyframe_url: url, clip_url: null, status: "keyframe" });
    res.json(await store.getScene(scene.id));
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// E3) Anima os keyframes aprovados em CLIPES (image-to-video).
app.post("/projects/:id/animate", async (req, res) => {
  try {
    const project = await store.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "not found" });
    const brief: any = project.brief || {};
    const scenes = await store.getScenes(req.params.id);
    for (const s of scenes) {
      if (!s.keyframe_url) continue;
      const { url } = await generateVideo(brief.videoModel || "seedance-2.0", { imageUrl: s.keyframe_url, prompt: s.motion_prompt || "", durationSec: s.duration_sec || 5, aspectRatio: brief.format || "9:16", nativeAudio: true, resolution: brief.resolution });
      await store.updateScene(s.id, { clip_url: url, status: "video" });
    }
    res.json({ scenes: await store.getScenes(req.params.id) });
  } catch (e: any) { captureError(e); res.status(400).json({ error: String(e?.message || e) }); }
});

// E3b) Reanima UMA cena.
app.post("/scenes/:id/clip", async (req, res) => {
  try {
    const scene = await store.getScene(req.params.id);
    if (!scene?.keyframe_url) return res.status(400).json({ error: "scene has no keyframe" });
    const project = await store.getProject(scene.project_id);
    const brief: any = project?.brief || {};
    const { url } = await generateVideo(brief.videoModel || "seedance-2.0", { imageUrl: scene.keyframe_url, prompt: scene.motion_prompt || "", durationSec: scene.duration_sec || 5, aspectRatio: brief.format || "9:16", nativeAudio: true, resolution: brief.resolution });
    await store.updateScene(scene.id, { clip_url: url, status: "video" });
    res.json(await store.getScene(scene.id));
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// E4) PRODUÇÃO: narração + música + legendas + montagem → vídeo final + job "done".
app.post("/projects/:id/produce", async (req, res) => {
  try {
    const project = await store.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "not found" });
    const brief: any = project.brief || {};
    const scenes = await store.getScenes(req.params.id);
    const clipUrls = scenes.map((s) => s.clip_url).filter(Boolean) as string[];
    if (!clipUrls.length) return res.status(400).json({ error: "anime as cenas primeiro" });

    const narration = brief.audioMode === "music" ? null
      : await renderNarration(scenes.map((s) => ({ narracao: s.narration } as any)), brief.voice || "Locução premium").catch(() => null);

    let outputUrl: string;
    if (has.demoRender()) {
      outputUrl = clipUrls[clipUrls.length - 1]; // demo: usa o último clipe de amostra
    } else {
      const musicUrl = resolveMusic(brief.musicMood) || undefined;
      const buf = await compose({ clipUrls, narrationBuffer: narration?.audioBuffer, captions: narration?.captions, musicUrl, aspectRatio: brief.format || "9:16" });
      outputUrl = await uploadBuffer(`outputs/${project.id}/${Date.now()}.mp4`, buf, "video/mp4");
    }

    const total = scenes.reduce((a, s) => a + (s.duration_sec || 0), 0);
    await store.spendCredits(project.user_id, total);
    const job = await store.createJob({ project_id: project.id, user_id: project.user_id, video_model: brief.videoModel, image_model: brief.imageModel });
    await store.updateJob(job.id, { status: "done", progress: 100, step: "Pronto", output_url: outputUrl });
    await store.updateProject(project.id, { status: "ready" });
    res.json({ outputUrl, jobId: job.id });
  } catch (e: any) { captureError(e); res.status(400).json({ error: String(e?.message || e) }); }
});

// ── Pastas ───────────────────────────────────────────────────────────────────
app.get("/folders", async (req, res) => { res.json(await store.listFolders(await getUid(req))); });
app.post("/folders", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name obrigatório" });
  res.json(await store.createFolder({ user_id: await getUid(req), name }));
});
app.delete("/folders/:id", async (req, res) => { await store.deleteFolder(req.params.id); res.json({ ok: true }); });
app.patch("/projects/:id/folder", async (req, res) => { await store.updateProject(req.params.id, { folder_id: req.body?.folderId ?? null }); res.json({ ok: true }); });

// ── Time / colaboração ───────────────────────────────────────────────────────
app.get("/team", async (req, res) => { res.json(await store.listMembers(await getUid(req))); });
app.post("/team/invite", async (req, res) => {
  const email = String(req.body?.email || "").trim();
  if (!email.includes("@")) return res.status(400).json({ error: "e-mail inválido" });
  res.json(await store.addMember({ owner: await getUid(req), email, role: req.body?.role || "editor" }));
});
app.patch("/team/:id", async (req, res) => { await store.updateMember(req.params.id, String(req.body?.role || "editor")); res.json({ ok: true }); });
app.delete("/team/:id", async (req, res) => { await store.removeMember(req.params.id); res.json({ ok: true }); });

// ── Export multi-formato (reenquadra o vídeo pronto p/ 9:16 / 1:1 / 16:9) ─────
app.post("/projects/:id/export", async (req, res) => {
  try {
    const format = String(req.body?.format || "9:16");
    const jobs = await store.listJobs(undefined, 200);
    const job = jobs.find((j) => j.project_id === req.params.id && j.output_url);
    if (!job?.output_url) return res.status(404).json({ error: "vídeo final não encontrado" });
    try {
      const buf = await reframe(job.output_url, format);
      const url = await uploadBuffer(`exports/${req.params.id}/${format.replace(":", "x")}-${Date.now()}.mp4`, buf, "video/mp4");
      res.json({ url, format });
    } catch {
      // sem FFmpeg (ex.: modo demo) → devolve o original
      res.json({ url: job.output_url, format, note: "reframe indisponível (FFmpeg) — retornando original" });
    }
  } catch (e: any) { captureError(e); res.status(400).json({ error: String(e?.message || e) }); }
});

// ── Performance: registrar resultados reais e listar (ranking é calculado no front) ──
app.post("/metrics", async (req, res) => {
  try {
    const b = req.body || {};
    let project_name = b.projectName, style = b.style;
    if (b.projectId) { const p = await store.getProject(String(b.projectId)); if (p) { project_name = p.name; style = (p.brief as any)?.style || style; } }
    const num = (v: any) => Math.max(0, Number(v) || 0);
    const rec = await store.addMetric({
      user_id: await getUid(req), project_id: b.projectId || null,
      project_name: project_name || "Ad", style: style || "—", platform: String(b.platform || "Meta"),
      spend: num(b.spend), impressions: num(b.impressions), clicks: num(b.clicks), conversions: num(b.conversions), revenue: num(b.revenue),
    });
    res.json(rec);
  } catch (e: any) { captureError(e); res.status(400).json({ error: String(e?.message || e) }); }
});
app.get("/metrics", async (req, res) => { res.json(await store.listMetrics(await getUid(req))); });
app.delete("/metrics/:id", async (req, res) => { await store.deleteMetric(req.params.id); res.json({ ok: true }); });

// ── Webhook do fal (escala): fal chama isto quando um job assíncrono termina ──
app.post("/webhooks/fal", async (req, res) => {
  // Scaffold: em produção, mapeie request_id → cena/job e atualize o store.
  console.log("[fal webhook]", req.body?.request_id || "", req.body?.status || "");
  res.json({ ok: true });
});

// 3) Status do job (front faz polling a cada ~3s).
app.get("/jobs/:id", async (req, res) => {
  const data = await store.getJob(req.params.id);
  if (!data) return res.status(404).json({ error: "not found" });
  res.json({ status: data.status, step: data.step, progress: data.progress, outputUrl: data.output_url, cost: data.cost_usd, error: data.error });
});

// 3b) Lista de jobs recentes (alimenta a Render Queue).
app.get("/jobs", async (req, res) => {
  const userId = await getUid(req);
  const jobs = await store.listJobs(userId, 30);
  const projects = await Promise.all(jobs.map((j) => store.getProject(j.project_id)));
  res.json(jobs.map((j, i) => ({
    id: j.id, projectId: j.project_id, project: projects[i]?.name || projects[i]?.product || "Projeto",
    model: j.video_model, status: j.status, progress: j.progress, step: j.step,
    outputUrl: j.output_url, cost: j.cost_usd, createdAt: j.created_at,
  })));
});

// 4) Buscar projeto completo (cenas + concept).
app.get("/projects/:id", async (req, res) => {
  const project = await store.getProject(req.params.id);
  const scenes = await store.getScenes(req.params.id);
  res.json({ project, scenes });
});

// 5) Upload da foto do produto → URL hospedada (R2) ou data URL (demo).
app.post("/upload", async (req, res) => {
  try {
    const { mediaType, base64, name } = req.body || {};
    if (!base64 || !mediaType) return res.status(400).json({ error: "mediaType e base64 obrigatórios" });
    const ext = (mediaType.split("/")[1] || "png").replace("jpeg", "jpg");
    const key = `uploads/${Date.now()}-${(name || "product").replace(/[^a-z0-9.]/gi, "_")}.${ext}`;
    const url = await uploadBuffer(key, Buffer.from(base64, "base64"), mediaType);
    res.json({ url });
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// 6) Captura de lista de espera (fake door / LP).
app.post("/waitlist", async (req, res) => {
  const email = String(req.body?.email || "").trim();
  if (!email.includes("@")) return res.status(400).json({ error: "invalid email" });
  await store.addWaitlist(email, req.body?.source || "landing");
  res.json({ ok: true });
});

// 7) Regerar uma única cena (barato — só essa cena).
app.post("/scenes/:id/regenerate", async (req, res) => {
  try {
    const r = await regenerateScene(req.params.id, {
      videoModel: req.body.videoModel || "seedance-2.0",
      imageModel: req.body.imageModel || "flux-dev",
      aspectRatio: req.body.format || "9:16",
      brandContext: req.body.brandContext,
      lang: req.body.lang || "Português (BR)",
      style: req.body.style || "3D estilo Pixar",
    });
    res.json(r);
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// 8) Micro-ferramenta: anima uma imagem (image-to-video) sem gerar o anúncio inteiro.
app.post("/tools/animate", async (req, res) => {
  try {
    const userId = String(req.body?.userId || "local-user");
    const prompt = String(req.body?.prompt || "subtle cinematic camera move");
    const videoModel = String(req.body?.videoModel || "seedance-2.0");
    const format = String(req.body?.format || "9:16");
    const durationSec = Number(req.body?.durationSec || 5);

    let imageUrl: string | undefined = req.body?.imageUrl;
    if (!imageUrl && req.body?.photo?.base64) {
      const { mediaType, base64 } = req.body.photo;
      const ext = (mediaType?.split("/")[1] || "png").replace("jpeg", "jpg");
      imageUrl = await uploadBuffer(`uploads/${Date.now()}.${ext}`, Buffer.from(base64, "base64"), mediaType);
    }
    if (!imageUrl) return res.status(400).json({ error: "envie imageUrl ou photo" });

    const out = await generateVideo(videoModel, { imageUrl, prompt, durationSec, aspectRatio: format, nativeAudio: true });
    await store.spendCredits(userId, durationSec);
    res.json({ url: out.url, cost: out.cost });
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

// 9) Checkout de créditos (Stripe). Sem chave → resposta de demonstração.
app.post("/billing/checkout", async (req, res) => {
  const plan = String(req.body?.plan || "pro");
  if (!has.stripe()) return res.json({ demo: true, message: "Stripe não configurado — preencha STRIPE_SECRET_KEY.", plan });
  try {
    const mod = "stripe";
    const Stripe = (await import(mod)).default as any; // dependência opcional
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const prices: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER || "",
      pro: process.env.STRIPE_PRICE_PRO || "",
    };
    const creditsByPlan: Record<string, number> = { starter: 150, pro: 900 };
    const userId = await getUid(req);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: prices[plan] || prices.pro, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId, credits: String(creditsByPlan[plan] || 0) },
      subscription_data: { metadata: { userId, credits: String(creditsByPlan[plan] || 0) } },
      success_url: (process.env.APP_URL || "http://localhost:5173") + "/?billing=success",
      cancel_url: (process.env.APP_URL || "http://localhost:5173") + "/?billing=cancel",
    });
    res.json({ url: session.url });
  } catch (e: any) { res.status(400).json({ error: String(e?.message || e) }); }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, async () => {
  await initSentry();
  const m = modeSummary();
  console.log(`Absolute Motion backend on :${port}`);
  console.log(
    `  serviços → claude:${m.anthropic ? "on" : "demo"} fal:${m.fal ? "on" : "demo"} ` +
    `11labs:${m.elevenlabs ? "on" : "off"} supabase:${m.supabase ? "on" : "memória"} r2:${m.r2 ? "on" : "demo"}`
  );
  if (m.demo) console.log("  ⚠ modo DEMO: render simulada (preencha FAL_KEY p/ gerar vídeo real).");
});
