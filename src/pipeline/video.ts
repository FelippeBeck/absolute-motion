import { generateVideo } from "../lib/fal.js";
import type { Scene } from "./script.js";

// Anima cada keyframe em um clipe (image-to-video).
export async function renderClips(
  scenes: Scene[],
  keyframeUrls: string[],
  videoModel: string,
  aspectRatio: string,
  nativeAudio: boolean,
  onScene?: (idx: number, url: string) => Promise<void>,
  resolution?: string
) {
  let cost = 0;
  const urls: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const { url, cost: c } = await generateVideo(videoModel, {
      imageUrl: keyframeUrls[i],
      prompt: scenes[i].motion,
      durationSec: scenes[i].dur,
      aspectRatio,
      nativeAudio,
      resolution,
    });
    urls.push(url);
    cost += c;
    if (onScene) await onScene(i, url);
  }
  return { urls, cost };
}
