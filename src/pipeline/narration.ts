import { synthesize, alignmentToCaptions } from "../lib/elevenlabs.js";
import type { Scene } from "./script.js";

// Gera a narração de todas as cenas e devolve mp3 + legendas com timestamps.
// Se nativeAudio do modelo de vídeo estiver ligado, esta etapa é opcional.
export async function renderNarration(scenes: Scene[], voiceLabel: string) {
  const fullText = scenes.map((s) => s.narracao).filter(Boolean).join("  ");
  if (!fullText.trim()) return null;
  const result = await synthesize(fullText, voiceLabel);
  const captions = alignmentToCaptions(result.alignment);
  return {
    audioBuffer: Buffer.from(result.audioBase64, "base64"),
    captions,
  };
}
