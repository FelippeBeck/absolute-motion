import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { downloadToBuffer } from "../lib/storage.js";

type Caption = { text: string; start: number; end: number };

// Resolução alvo por formato (re-encodamos tudo para isto, evitando erros de
// concat com clipes de tamanhos/codecs diferentes vindos de modelos distintos).
function dims(aspect: string) {
  if (aspect === "16:9") return { W: 1920, H: 1080 };
  if (aspect === "1:1") return { W: 1080, H: 1080 };
  return { W: 1080, H: 1920 }; // 9:16 padrão
}

function escapeDraw(t: string) {
  return t.replace(/\\/g, "\\\\").replace(/'/g, "’").replace(/:/g, "\\:").replace(/%/g, "\\%");
}

// Reenquadra um vídeo pronto para outro formato (multi-formato: 9:16/1:1/16:9),
// preenchendo as bordas com um fundo desfocado do próprio vídeo (estilo "blur pad").
export async function reframe(srcUrl: string, targetAspect: string): Promise<Buffer> {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "am-rf-"));
  const { W, H } = dims(targetAspect);
  try {
    const src = path.join(work, "src.mp4");
    await fs.writeFile(src, await downloadToBuffer(srcUrl));
    const out = path.join(work, "out.mp4");
    const fc = [
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:8,setsar=1[bg]`,
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p[v]`,
    ];
    await new Promise<void>((resolve, reject) => {
      ffmpeg().input(src).complexFilter(fc)
        .outputOptions(["-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-c:a", "copy", "-movflags", "+faststart"])
        .save(out).on("end", () => resolve()).on("error", reject);
    });
    return await fs.readFile(out);
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}

// Baixa clipes, normaliza, concatena, sobrepõe narração + música (com ducking)
// e legendas, exportando o MP4 final.
export async function compose(opts: {
  clipUrls: string[];
  narrationBuffer?: Buffer;
  captions?: Caption[];
  musicUrl?: string;
  aspectRatio: string;
}): Promise<Buffer> {
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "am-"));
  const { W, H } = dims(opts.aspectRatio);

  try {
    // 1. baixa clipes
    const clipPaths: string[] = [];
    for (let i = 0; i < opts.clipUrls.length; i++) {
      const buf = await downloadToBuffer(opts.clipUrls[i]);
      const p = path.join(work, `clip_${i}.mp4`);
      await fs.writeFile(p, buf);
      clipPaths.push(p);
    }

    // 2. áudios opcionais
    let narrPath: string | undefined;
    if (opts.narrationBuffer) { narrPath = path.join(work, "narr.mp3"); await fs.writeFile(narrPath, opts.narrationBuffer); }
    let musicPath: string | undefined;
    if (opts.musicUrl) { try { const m = await downloadToBuffer(opts.musicUrl); musicPath = path.join(work, "music.mp3"); await fs.writeFile(musicPath, m); } catch { /* segue sem música */ } }

    // 3. monta o grafo de filtros
    const filters: string[] = [];
    const vl: string[] = [];
    clipPaths.forEach((_, i) => {
      filters.push(`[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30,format=yuv420p[v${i}]`);
      vl.push(`[v${i}]`);
    });
    filters.push(`${vl.join("")}concat=n=${clipPaths.length}:v=1:a=0[vcat]`);

    // legendas queimadas
    let vout = "[vcat]";
    if (opts.captions?.length) {
      const draw = opts.captions
        .map((c) => `drawtext=text='${escapeDraw(c.text)}':fontcolor=white:fontsize=46:borderw=5:bordercolor=black:x=(w-text_w)/2:y=h-200:enable='between(t,${c.start.toFixed(2)},${c.end.toFixed(2)})'`)
        .join(",");
      filters.push(`[vcat]${draw}[vout]`);
      vout = "[vout]";
    }

    // índices dos inputs de áudio (após os clipes)
    const narrIdx = narrPath ? clipPaths.length : -1;
    const musicIdx = musicPath ? clipPaths.length + (narrPath ? 1 : 0) : -1;
    let aout = "";
    if (narrPath && musicPath) {
      filters.push(`[${narrIdx}:a]volume=1.0[na];[${musicIdx}:a]volume=0.22[ma];[na][ma]amix=inputs=2:duration=first:dropout_transition=2[aout]`);
      aout = "[aout]";
    } else if (narrPath) {
      aout = `${narrIdx}:a`;
    } else if (musicPath) {
      filters.push(`[${musicIdx}:a]volume=0.5[aout]`);
      aout = "[aout]";
    }

    // 4. comando final
    const outPath = path.join(work, "final.mp4");
    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg();
      clipPaths.forEach((p) => cmd.input(p));
      if (narrPath) cmd.input(narrPath);
      if (musicPath) cmd.input(musicPath);
      cmd.complexFilter(filters);
      const outOpts = ["-map", vout, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-movflags", "+faststart"];
      if (aout) outOpts.push("-map", aout, "-c:a", "aac", "-b:a", "192k", "-shortest");
      cmd.outputOptions(outOpts).save(outPath).on("end", () => resolve()).on("error", reject);
    });

    return await fs.readFile(outPath);
  } finally {
    await fs.rm(work, { recursive: true, force: true });
  }
}
