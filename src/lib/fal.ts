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
  const res: any = await fal.subscribe(m.endpoint, { input });
  return { url: res.data.images?.[0]?.url as string, cost: m.usdPerImage };
}

// Anima uma imagem (image-to-video). Suporta start/end frame e áudio nativo.
export async function generateVideo(
  modelId: string,
  opts: { imageUrl: string; prompt: string; durationSec: number; aspectRatio: string; nativeAudio: boolean; endImageUrl?: string; resolution?: string }
) {
  if (!has.fal()) return { url: DEMO_VIDEO, cost: 0 };

  const m = VIDEO_ENDPOINTS[modelId] ?? VIDEO_ENDPOINTS["seedance-2.0"];
  const input: Record<string, unknown> = {
    image_url: opts.imageUrl,
    prompt: opts.prompt,
    duration: String(opts.durationSec),
    aspect_ratio: opts.aspectRatio,
    resolution: opts.resolution === "4k" ? "2160p" : opts.resolution === "720p" ? "720p" : "1080p",
    generate_audio: opts.nativeAudio,
  };
  if (opts.endImageUrl) input.end_image_url = opts.endImageUrl;

  const res: any = await fal.subscribe(m.endpoint, { input, logs: true });
  return { url: res.data.video?.url as string, cost: m.usdPerSec * opts.durationSec };
}
