import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { has } from "./mode.js";

// Cloudflare R2 é compatível com a API S3. Inicializado lazy — no modo demo
// (sem chaves R2) caímos num data URL, então o app continua funcionando.
let _s3: S3Client | null = null;
function s3() {
  if (_s3) return _s3;
  _s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return _s3;
}

export async function uploadBuffer(key: string, body: Buffer, contentType: string) {
  if (!has.r2()) {
    // Fallback demo: devolve um data URL (ok para imagens/áudio pequenos).
    return `data:${contentType};base64,${body.toString("base64")}`;
  }
  await s3().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function downloadToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
