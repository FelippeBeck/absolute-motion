import { store } from "../lib/store.js";
import { has } from "../lib/mode.js";
import { generateJSON } from "../lib/anthropic.js";
import { generateImage, generateVideo } from "../lib/fal.js";

// Regera UMA cena: novo prompt criativo → novo keyframe → novo clipe.
// Barato (centavos) e é o que segura retenção: o usuário ajusta só o que ficou ruim.
export async function regenerateScene(sceneId: string, opts: { videoModel: string; imageModel: string; aspectRatio: string; brandContext?: string; lang: string; style: string }) {
  const scene = await store.getScene(sceneId);
  if (!scene) throw new Error("scene not found");

  // Novo texto criativo (Claude — ou variação simples no modo demo).
  let out: { keyframe: string; motion: string; narracao: string; legenda: string };
  if (has.anthropic()) {
    out = await generateJSON(
      `Reescreva APENAS esta cena de um anúncio animado, com uma variação mais forte. Estilo: ${opts.style}. Idioma narração/legenda: ${opts.lang}.${opts.brandContext ? " " + opts.brandContext : ""}
Cena atual — keyframe: "${scene.keyframe_prompt}", narração: "${scene.narration}".
Prompts em inglês, narração/legenda no idioma ${opts.lang}. SOMENTE JSON: {"keyframe":"","motion":"","narracao":"","legenda":""}`
    );
  } else {
    out = {
      keyframe: `${scene.keyframe_prompt} — alternate angle, bolder lighting, fresh composition`,
      motion: `${scene.motion_prompt || "subtle camera move"}, more dynamic energy`,
      narracao: scene.narration || "Nova variação da cena.",
      legenda: scene.caption || "Nova versão",
    };
  }

  await store.updateScene(sceneId, {
    keyframe_prompt: out.keyframe, motion_prompt: out.motion, narration: out.narracao, caption: out.legenda,
    status: "keyframe", keyframe_url: null, clip_url: null,
  });

  const img = await generateImage(opts.imageModel, out.keyframe);
  await store.updateScene(sceneId, { keyframe_url: img.url });

  const vid = await generateVideo(opts.videoModel, { imageUrl: img.url, prompt: out.motion, durationSec: scene.duration_sec, aspectRatio: opts.aspectRatio, nativeAudio: true });
  await store.updateScene(sceneId, { clip_url: vid.url, status: "done" });

  return { sceneId, keyframeUrl: img.url, clipUrl: vid.url, cost: img.cost + vid.cost };
}
