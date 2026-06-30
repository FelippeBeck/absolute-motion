import { generateJSON } from "../lib/anthropic.js";
import { has } from "../lib/mode.js";

export type Brief = {
  product: string; desc?: string; audience?: string; objective: string;
  style: string; tone: string; format: string; duration: number; lang: string;
  voice: string; brandContext?: string; landingUrl?: string;
};

// "Recipes" de estilo: travam o visual de cada estilo viral nos prompts de imagem.
// (a sacada do mercado — estilos de animação que convertem em anúncios.)
export const STYLE_RECIPES: Record<string, string> = {
  "Claymation": "claymation stop-motion, handmade plasticine textures, subtle fingerprints, tactile clay surfaces, soft studio key light",
  "Pixar 3D style": "Pixar-style 3D render, glossy subsurface materials, expressive rounded characters, cinematic depth of field, warm lighting",
  "Anime": "2D anime cel-shading, bold clean linework, vibrant flat colors, dramatic speed lines, expressive highlights",
  "Paper Cutout": "layered paper cutout collage, construction-paper textures, soft drop shadows, handcrafted craft aesthetic",
  "LEGO": "LEGO brick-built world, plastic minifigure characters, visible studs and bricks, glossy toy-photography lighting",
  "Wes Anderson": "Wes Anderson aesthetic, perfect symmetry, pastel color palette, centered composition, whimsical retro production design",
  "Retro Cartoon": "retro rubber-hose cartoon, bold outlines, halftone textures, vintage 1950s color grade",
  "Surreal 3D": "surreal 3D, morphing organic shapes, dreamy gradients, abstract floating elements",
  "Miniature": "tilt-shift miniature diorama, tiny handcrafted set, macro lens, shallow depth of field",
  "Realistic / Photographic": "photorealistic product render, studio lighting, ultra detailed, shallow depth of field",
  "Motion Graphics": "flat 2D motion graphics, bold geometric shapes, kinetic typography, clean vector style",
  "3D Pixar style": "Pixar-style 3D render, glossy subsurface materials, expressive rounded characters, cinematic depth of field, warm lighting",
};
export const styleHint = (style: string) => STYLE_RECIPES[style] || `${style} animation style, premium consistent look`;

// Lê o texto da landing page do produto (best-effort) para o motor entender o negócio.
async function fetchLandingText(url?: string): Promise<string> {
  if (!url || !/^https?:\/\//i.test(url)) return "";
  try {
    const ctrl = AbortSignal.timeout?.(8000);
    const res = await fetch(url, { signal: ctrl as any });
    if (!res.ok) return "";
    const html = await res.text();
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2500);
  } catch { return ""; }
}

export type Scene = {
  n: number; dur: number; keyframe: string; motion: string; narracao: string; legenda: string;
};

export type CreativePackage = {
  analysis: { resumo: string; traits: string[]; publico: string; angulo: string };
  concept: { titulo: string; bigIdea: string; gancho: string; cta: string; tomNotas: string };
  scenes: Scene[];
  audio: { voz: string; musica: string; sfx: string[]; hashtags: string[]; dicaPlataforma: string };
};

const scenesFor = (sec: number) => (sec <= 15 ? 3 : sec <= 30 ? 4 : 5);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Evento de streaming do storyboard (consumido por SSE no /preview/stream).
export type CreativeEvent =
  | { type: "analysis"; analysis: CreativePackage["analysis"] }
  | { type: "concept"; concept: CreativePackage["concept"] }
  | { type: "scene"; scene: Scene }
  | { type: "audio"; audio: CreativePackage["audio"] };

// Roda o motor criativo completo. Se `onEvent` for passado, emite cada parte
// conforme fica pronta (análise → conceito → cenas uma a uma → áudio), dando o
// efeito de "a IA pensando ao vivo" no frontend.
export async function buildCreativePackage(
  b: Brief,
  firstPhoto?: { mediaType: string; base64: string },
  onEvent?: (e: CreativeEvent) => void | Promise<void>
): Promise<CreativePackage> {
  const pkg = has.anthropic() ? await realPackage(b, firstPhoto) : mockCreativePackage(b);

  if (onEvent) {
    await onEvent({ type: "analysis", analysis: pkg.analysis });
    await sleep(120);
    await onEvent({ type: "concept", concept: pkg.concept });
    await sleep(120);
    for (const scene of pkg.scenes) { await onEvent({ type: "scene", scene }); await sleep(180); }
    await onEvent({ type: "audio", audio: pkg.audio });
  }
  return pkg;
}

// Pacote real via Claude.
async function realPackage(b: Brief, firstPhoto?: { mediaType: string; base64: string }): Promise<CreativePackage> {
  const brand = b.brandContext ? ` ${b.brandContext}` : "";
  const n = scenesFor(b.duration);
  const recipe = styleHint(b.style);
  const landing = await fetchLandingText(b.landingUrl);
  const landingCtx = landing ? ` Conteúdo da landing page do produto (use p/ entender o negócio): "${landing}".` : "";

  const analysis = await generateJSON(
    `Diretor criativo de anúncios ANIMADOS (sem pessoas reais). Produto: "${b.product}". Descrição: "${b.desc || "—"}". Público: "${b.audience || "definir"}".${brand}${landingCtx}
Retorne SOMENTE JSON: {"resumo":"1 frase","traits":["3 traços visuais p/ consistência"],"publico":"1 frase","angulo":"gancho de venda mais forte"}`,
    firstPhoto
  );

  const concept = await generateJSON(
    `Diretor criativo. Produto: ${analysis.resumo}. Ângulo: ${analysis.angulo}. Objetivo: ${b.objective}. Tom: ${b.tone}. Estilo: ${b.style}. Idioma: ${b.lang}.
Anúncio de ${b.duration}s. SOMENTE JSON: {"titulo":"","bigIdea":"","gancho":"fala 0-2s","cta":"","tomNotas":""}. Gancho/cta no idioma ${b.lang}.`
  );

  const sceneData = await generateJSON(
    `Diretor de animação. Big idea: "${concept.bigIdea}". Produto: ${analysis.resumo}. Traços a MANTER: ${analysis.traits.join("; ")}.${brand} Formato: ${b.format}. Idioma: ${b.lang}. Gancho: "${concept.gancho}". CTA: "${concept.cta}".
ESTILO VISUAL OBRIGATÓRIO em TODA cena (style recipe): ${recipe}. O produto deve aparecer consistente em todas as cenas.
EXATAMENTE ${n} cenas somando ~${b.duration}s. Cada "keyframe" DEVE conter a style recipe acima. Prompts EM INGLÊS, narração/legenda no idioma ${b.lang}. SOMENTE JSON:
{"cenas":[{"n":1,"dur":5,"keyframe":"english image prompt with the style recipe","motion":"english i2v prompt","narracao":"","legenda":""}]}`
  );

  const audio = await generateJSON(
    `Produtor de áudio + growth. Tom: ${b.tone}. Idioma: ${b.lang}. Voz: ${b.voice}. Produto: ${analysis.resumo}.
SOMENTE JSON: {"voz":"","musica":"","sfx":["",""],"hashtags":["","","","",""],"dicaPlataforma":""}`
  );

  return { analysis, concept, scenes: sceneData.cenas, audio };
}

// ── Pacote de exemplo (modo demo, sem ANTHROPIC_API_KEY) ─────────────────────
function mockCreativePackage(b: Brief): CreativePackage {
  const n = scenesFor(b.duration);
  const per = Math.max(3, Math.round(b.duration / n));
  const product = b.product || "seu produto";
  const r = styleHint(b.style);

  const beats = [
    { kf: `${r} — hero shot of ${product} floating, dramatic rim lighting, swirling particles, dark backdrop`, mo: "slow push-in, particles drifting upward, subtle product rotation", nar: `Conheça ${product}.`, leg: "Espera só…" },
    { kf: `${r} — close-up of ${product} key feature, vivid accent color splash`, mo: "macro reveal, light sweep across the surface", nar: `Feito para quem não aceita menos.`, leg: "Isso muda tudo" },
    { kf: `${r} — scene of ${product} in use, dynamic environment, energetic composition`, mo: "fast dolly, energetic camera move, confetti burst", nar: `Resultados que você sente.`, leg: "Resultado de verdade" },
    { kf: `${r} — hero pack-shot of ${product} centered with bold logo space and CTA area`, mo: "final settle, gentle glow pulse on the logo", nar: `${product}. Garanta o seu.`, leg: "Garanta o seu" },
    { kf: `${r} — grand finale of ${product} with brand colors, premium lighting, clean negative space`, mo: "camera pull-back, sparkle accents", nar: `Comece hoje.`, leg: "Comece hoje" },
  ];

  const scenes: Scene[] = Array.from({ length: n }, (_, i) => ({
    n: i + 1,
    dur: per,
    keyframe: beats[Math.min(i, beats.length - 1)].kf,
    motion: beats[Math.min(i, beats.length - 1)].mo,
    narracao: beats[Math.min(i, beats.length - 1)].nar,
    legenda: beats[Math.min(i, beats.length - 1)].leg,
  }));

  return {
    analysis: {
      resumo: `${product} — ${b.desc || "anúncio animado de alta conversão"}.`,
      traits: [`Estilo ${b.style}`, "Paleta vibrante consistente", "Iluminação premium"],
      publico: b.audience || "público-alvo a definir",
      angulo: "transformar desejo em ação com um gancho visual forte",
    },
    concept: {
      titulo: `${product}: a virada`,
      bigIdea: `Mostrar ${product} como a escolha óbvia em ${b.duration}s de pura animação.`,
      gancho: "Você nunca viu isso antes…",
      cta: "Garanta o seu agora",
      tomNotas: `Tom ${b.tone}, ritmo de anúncio para ${b.format}.`,
    },
    scenes,
    audio: {
      voz: b.voice || "Locução premium",
      musica: "Trilha cinematográfica crescente, batida moderna",
      sfx: ["whoosh", "impact", "sparkle"],
      hashtags: ["#ads", "#animation", "#motion", "#branding", `#${product.replace(/\s+/g, "").toLowerCase()}`],
      dicaPlataforma: "Reels/TikTok: gancho nos primeiros 2s, legendas grandes, CTA no fim.",
    },
  };
}
