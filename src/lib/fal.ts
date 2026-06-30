import { fal } from "@fal-ai/client";
import { has } from "./mode.js";

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY });

// Mapa de modelos de vídeo (endpoints do fal) + custo aproximado por segundo (USD).
export const VIDEO_ENDPOINTS: Record<string, { endpoint: string; usdPerSec: number }> = {
  "seedance-2.0":      { endpoint: "bytedance/seedance-2.0/image-to-video",            usdPerSec: 0.10 },
  "seedance-2.0-mini": { endpoint: "bytedance/seedance-2.0-mini/image-to-video",       usdPerSec: 0.073 },
  "kling-3.0":         { endpoint: "fal-ai/kling-video/v3/omni/image-to-video",        usdPerSec: 0.12 },
  "kling-2.5-turbo":   { endpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video", usdPerSec: 0.07 },
  "veo-3.1":           { endpoint: "fal-ai/veo/3.1/image-to-video",                    usdPerSec: 0.40 },
  "wan-2.5":           { endpoint: "fal-ai/wan/2.5/image-to-video",                    usdPerSec: 0.05 },
};

// Constraints por modelo de vídeo — garante que só mandamos params válidos.
type ModelConstraints = {
  minSec: number; maxSec: number;
  aspects: string[];
  resolutions: string[];
  supportsEndFrame: boolean;
};

const VIDEO_CONSTRAINTS: Record<string, ModelConstraints> = {
  "seedance-2.0":      { minSec: 5, maxSec: 10, aspects: ["9:16", "16:9", "1:1"], resolutions: ["720p", "1080p"],        supportsEndFrame: true },
  "seedance-2.0-mini": { minSec: 5, maxSec: 10, aspects: ["9:16", "16:9", "1:1"], resolutions: ["720p", "1080p"],        supportsEndFrame: false },
  "kling-3.0":         { minSec: 5, maxSec: 10, aspects: ["9:16", "16:9", "1:1"], resolutions: ["720p", "1080p"],        supportsEndFrame: true },
  "kling-2.5-turbo":   { minSec: 5, maxSec: 10, aspects: ["9:16", "16:9", "1:1"], resolutions: ["720p", "1080p"],        supportsEndFrame: false },
  "veo-3.1":           { minSec: 5, maxSec: 8,  aspects: ["9:16", "16:9", "1:1"], resolutions: ["720p", "1080p"],        supportsEndFrame: false },
  "wan-2.5":           { minSec: 3, maxSec: 5,  aspects: ["9:16", "16:9", "1:1"], resolutions: ["480p", "720p", "1080p"], supportsEndFrame: false },
};

function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)); }

// Chamada ao fal com mensagem de erro amigável (ex.: 403 = sem saldo/billing).
async function falSubscribe(endpoint: string, args: any): Promise<any> {
  try {
    return await fal.subscribe(endpoint, args);
  } catch (e: any) {
    const msg = String(e?.message || e?.body?.detail || e);
    if (/forbidden|403|unauthor|payment|balance|insufficient|credit|exhaust/i.test(msg)) {
      throw new Error("fal.ai recusou (403/Forbidden). Verifique a FAL_KEY e adicione saldo em fal.ai/dashboard/billing — o fal exige saldo pré-pago para gerar.");
    }
    throw new Error("fal.ai: " + msg.slice(0, 180));
  }
}

export const IMAGE_ENDPOINTS: Record<string, { endpoint: string; usdPerImage: number }> = {
  "flux-dev":   { endpoint: "fal-ai/flux/dev",     usdPerImage: 0.025 },
  "flux-pro":   { endpoint: "fal-ai/flux-pro",     usdPerImage: 0.05 },
  "seedream-4": { endpoint: "fal-ai/seedream/v4",  usdPerImage: 0.03 },
};

// Sample público usado como clipe/vídeo de exemplo no modo demo (sem FAL_KEY).
const DEMO_VIDEO =
  process.env.DEMO_VIDEO_URL ||
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

function placeholderImage(prompt: string) {
  const label = encodeURIComponent((prompt || "scene").split(/[,.]/)[0].slice(0, 28).trim());
  return `https://placehold.co/720x1280/0a0a0a/ff5c00.png?text=${label}`;
}

// Gera uma imagem (keyframe). Retorna URL hospedada pelo fal — ou placeholder no demo.
export async function generateImage(modelId: string, prompt: string, refImageUrl?: string) {
  if (!has.fal()) return { url: placeholderImage(prompt), cost: 0 };

  const m = IMAGE_ENDPOINTS[modelId] ?? IMAGE_ENDPOINTS["flux-dev"];
  const input: Record<string, unknown> = { prompt, image_size: "portrait_16_9", num_images: 1 };
  if (refImageUrl) input.image_url = refImageUrl; // referência p/ consistência (image-to-image)
  const res: any = await falSubscribe(m.endpoint, { input });
  return { url: res.data.images?.[0]?.url as string, cost: m.usdPerImage };
}

// Anima uma imagem (image-to-video). Suporta start/end frame e áudio nativo.
// Valida e ajusta os parâmetros de acordo com os constraints do modelo escolhido.
export async function generateVideo(
  modelId: string,
  opts: { imageUrl: string; prompt: string; durationSec: number; aspectRatio: string; nativeAudio: boolean; endImageUrl?: string; resolution?: string }
) {
  if (!has.fal()) return { url: DEMO_VIDEO, cost: 0 };

  const effectiveModel = VIDEO_ENDPOINTS[modelId] ? modelId : "seedance-2.0";
  const m = VIDEO_ENDPOINTS[effectiveModel];
  const c = VIDEO_CONSTRAINTS[effectiveModel] ?? VIDEO_CONSTRAINTS["seedance-2.0"];

  // Clamp duração nos limites do modelo
  const dur = clamp(opts.durationSec, c.minSec, c.maxSec);
  // Aspect ratio: valida ou cai no primeiro suportado
  const aspect = c.aspects.includes(opts.aspectRatio) ? opts.aspectRatio : c.aspects[0];
  // Resolução: valida ou cai na mais alta suportada
  const rawRes = opts.resolution === "4k" ? "2160p" : opts.resolution === "720p" ? "720p" : "1080p";
  const res = c.resolutions.includes(rawRes) ? rawRes : c.resolutions[c.resolutions.length - 1];

  const input: Record<string, unknown> = {
    image_url: opts.imageUrl,
    prompt: opts.prompt,
    duration: String(dur),
    aspect_ratio: aspect,
    resolution: res,
    generate_audio: opts.nativeAudio,
  };
  if (opts.endImageUrl && c.supportsEndFrame) input.end_image_url = opts.endImageUrl;

  const result: any = await falSubscribe(m.endpoint, { input, logs: true });
  return { url: result.data.video?.url as string, cost: m.usdPerSec * dur };
}
