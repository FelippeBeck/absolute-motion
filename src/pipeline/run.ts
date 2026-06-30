import { store, updateJob, setJobProgress } from "../lib/store.js";
import { has } from "../lib/mode.js";
import { buildCreativePackage, type Brief } from "./script.js";
import { renderKeyframes } from "./keyframes.js";
import { renderClips } from "./video.js";
import { renderNarration } from "./narration.js";
import { compose } from "./compose.js";
import { resolveMusic } from "../lib/music.js";
import { uploadBuffer } from "../lib/storage.js";

// Tenta uma função N vezes com backoff — modelos de vídeo falham/demoram.
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 1500 * (i + 1))); }
  }
  throw lastErr;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Orquestra o job inteiro: criativo → keyframes → clipes → narração → montagem → upload.
export async function runJob(jobId: string) {
  const job = await store.getJob(jobId);
  if (!job) return;
  const project = await store.getProject(job.project_id);
  if (!project) return;

  const brief = project.brief as Brief;
  let totalCost = 0;

  try {
    await updateJob(jobId, { status: "running" });

    // 1. motor criativo — usa o storyboard JÁ APROVADO pelo usuário se veio no brief
    //    (edições manuais respeitadas); senão gera do zero com o Claude.
    const approved = (brief as any).scenes as { n: number; dur: number; keyframe: string; motion: string; narracao: string; legenda: string }[] | undefined;
    let pkg;
    if (approved?.length) {
      await setJobProgress(jobId, 20, "Usando storyboard aprovado");
      pkg = { concept: (brief as any).concept || {}, scenes: approved, analysis: {} as any, audio: {} as any };
    } else {
      await setJobProgress(jobId, 8, "Roteiro e cenas");
      pkg = await withRetry(() => buildCreativePackage(brief, undefined));
    }
    await store.updateProject(project.id, { concept: pkg.concept, status: "ready" });
    await store.replaceScenes(project.id, pkg.scenes.map((s) => ({
      idx: s.n, duration_sec: s.dur,
      keyframe_prompt: s.keyframe, motion_prompt: s.motion, narration: s.narracao, caption: s.legenda,
    })));

    // Modo demo (sem FAL_KEY): simula a render com progresso real, sem custo.
    if (has.demoRender()) {
      return await runDemoRender(jobId, project.id, pkg.scenes);
    }

    // 2. keyframes
    await setJobProgress(jobId, 30, "Gerando imagens-chave");
    const productRef = (brief as any).productRefUrl as string | undefined;
    const kf = await withRetry(() => renderKeyframes(pkg.scenes, job.image_model, productRef, async (idx, url) => {
      await store.updateSceneByIdx(project.id, pkg.scenes[idx].n, { keyframe_url: url, status: "keyframe" });
    }));
    totalCost += kf.cost;

    // 3. clipes (image-to-video)
    await setJobProgress(jobId, 55, "Animando cenas (image-to-video)");
    const clips = await withRetry(() => renderClips(pkg.scenes, kf.urls, job.video_model, brief.format, true, async (idx, url) => {
      await store.updateSceneByIdx(project.id, pkg.scenes[idx].n, { clip_url: url, status: "video" });
    }, (brief as any).resolution));
    totalCost += clips.cost;

    // 4. narração (pulada quando o usuário escolhe "só trilha")
    await setJobProgress(jobId, 78, "Narração e legendas");
    const narration = (brief as any).audioMode === "music"
      ? null
      : await renderNarration(pkg.scenes, brief.voice).catch(() => null);

    // 5. montagem final
    await updateJob(jobId, { status: "composing", progress: 88, step: "Montagem final (FFmpeg)" });
    const musicUrl = resolveMusic((brief as any).musicMood) || undefined;
    const finalBuffer = await compose({
      clipUrls: clips.urls,
      narrationBuffer: narration?.audioBuffer,
      captions: narration?.captions,
      musicUrl,
      aspectRatio: brief.format,
    });

    // 6. upload
    await setJobProgress(jobId, 96, "Publicando");
    const key = `outputs/${project.id}/${Date.now()}.mp4`;
    const outputUrl = await uploadBuffer(key, finalBuffer, "video/mp4");

    await updateJob(jobId, { status: "done", progress: 100, step: "Pronto", output_url: outputUrl, cost_usd: Number(totalCost.toFixed(4)) });
  } catch (err: any) {
    await updateJob(jobId, { status: "error", error: String(err?.message || err) });
  }
}

// Simulação de render para o modo demo: percorre as etapas com progresso real,
// preenche keyframes/clipes de exemplo e entrega um vídeo de amostra.
async function runDemoRender(jobId: string, projectId: string, scenes: { n: number; keyframe: string }[]) {
  const { generateImage, generateVideo } = await import("../lib/fal.js");

  await setJobProgress(jobId, 30, "Gerando imagens-chave (demo)");
  for (let i = 0; i < scenes.length; i++) {
    const { url } = await generateImage("flux-dev", scenes[i].keyframe);
    await store.updateSceneByIdx(projectId, scenes[i].n, { keyframe_url: url, status: "keyframe" });
    await setJobProgress(jobId, 30 + Math.round((i + 1) / scenes.length * 22), "Gerando imagens-chave (demo)");
    await sleep(700);
  }

  await setJobProgress(jobId, 55, "Animando cenas (demo)");
  let lastClip = "";
  for (let i = 0; i < scenes.length; i++) {
    const { url } = await generateVideo("seedance-2.0", { imageUrl: "", prompt: "", durationSec: 5, aspectRatio: "9:16", nativeAudio: true });
    lastClip = url;
    await store.updateSceneByIdx(projectId, scenes[i].n, { clip_url: url, status: "video" });
    await setJobProgress(jobId, 55 + Math.round((i + 1) / scenes.length * 25), "Animando cenas (demo)");
    await sleep(900);
  }

  await updateJob(jobId, { status: "composing", progress: 88, step: "Montagem final (demo)" });
  await sleep(1200);

  await updateJob(jobId, {
    status: "done",
    progress: 100,
    step: "Pronto (demo)",
    output_url: lastClip,
    cost_usd: 0,
  });
}
