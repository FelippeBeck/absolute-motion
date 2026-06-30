// Narração via ElevenLabs, com timestamps por caractere para sincronizar legenda.
import { has } from "./mode.js";

const BASE = "https://api.elevenlabs.io/v1";

// Vozes públicas do ElevenLabs como fallback. Customize no .env (VOICE_ID_*).
const VOICE_IDS: Record<string, string> = {
  "Energética masculina": process.env.VOICE_ID_ENERGETICA_MASC || "pNInz6obpgDQGcFmaJgB",  // Adam
  "Energética feminina":  process.env.VOICE_ID_ENERGETICA_FEM  || "EXAVITQu4vr4xnSDxMaL",  // Bella
  "Calma masculina":      process.env.VOICE_ID_CALMA_MASC      || "ErXwobaYiN019PkySvjV",  // Antoni
  "Calma feminina":       process.env.VOICE_ID_CALMA_FEM       || "MF3mGyEYCl7XYWbV9V6O",  // Elli
  "Locução premium":      process.env.VOICE_ID_PREMIUM         || "21m00Tcm4TlvDq8ikWAM",  // Rachel
};

export type NarrationResult = {
  audioBase64: string;                 // mp3
  alignment: { chars: string[]; startsSec: number[]; endsSec: number[] };
};

export async function synthesize(text: string, voiceLabel: string): Promise<NarrationResult> {
  // Sem chave → retorna silêncio + alinhamento fake (demo mode)
  if (!has.elevenlabs()) {
    const chars = text.split("");
    const step = 0.06;
    return {
      audioBase64: "",
      alignment: {
        chars,
        startsSec: chars.map((_, i) => i * step),
        endsSec: chars.map((_, i) => (i + 1) * step),
      },
    };
  }

  const voiceId = VOICE_IDS[voiceLabel] ?? VOICE_IDS["Locução premium"];
  // endpoint with-timestamps devolve áudio + alinhamento por caractere
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}/with-timestamps`, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return {
    audioBase64: data.audio_base64,
    alignment: {
      chars: data.alignment?.characters ?? [],
      startsSec: data.alignment?.character_start_times_seconds ?? [],
      endsSec: data.alignment?.character_end_times_seconds ?? [],
    },
  };
}

// Converte o alinhamento por caractere em blocos de legenda (estilo karaokê).
export function alignmentToCaptions(a: NarrationResult["alignment"], maxCharsPerLine = 24) {
  const lines: { text: string; start: number; end: number }[] = [];
  let buf = "", start = a.startsSec[0] ?? 0, end = 0;
  for (let i = 0; i < a.chars.length; i++) {
    buf += a.chars[i];
    end = a.endsSec[i] ?? end;
    if (buf.length >= maxCharsPerLine && a.chars[i] === " ") {
      lines.push({ text: buf.trim(), start, end });
      buf = ""; start = a.endsSec[i] ?? end;
    }
  }
  if (buf.trim()) lines.push({ text: buf.trim(), start, end });
  return lines;
}
