// Trilhas de fundo por "mood". As URLs vêm do .env (faixas royalty-free suas,
// idealmente hospedadas no R2). Sem URL configurada, o vídeo sai sem música.
const TRACKS: Record<string, string> = {
  none: "",
  cinematic: process.env.MUSIC_CINEMATIC || "",
  upbeat: process.env.MUSIC_UPBEAT || "",
  corporate: process.env.MUSIC_CORPORATE || "",
  chill: process.env.MUSIC_CHILL || "",
};

export function resolveMusic(mood?: string): string {
  return TRACKS[mood || "none"] || "";
}
