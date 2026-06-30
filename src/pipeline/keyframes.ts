import { generateImage } from "../lib/fal.js";
import type { Scene } from "./script.js";

// Gera a imagem-chave de cada cena. Passa a foto do produto (ou keyframe anterior)
// como referência para manter consistência visual entre cenas.
export async function renderKeyframes(
  scenes: Scene[],
  imageModel: string,
  productRefUrl?: string,
  onScene?: (idx: number, url: string) => Promise<void>
) {
  let cost = 0;
  let lastRef = productRefUrl;
  const urls: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const { url, cost: c } = await generateImage(imageModel, scenes[i].keyframe, lastRef);
    urls.push(url);
    lastRef = url;            // encadeia: a cena seguinte referencia a anterior
    cost += c;
    if (onScene) await onScene(i, url);
  }
  return { urls, cost };
}
