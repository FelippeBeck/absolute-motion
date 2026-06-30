import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Chama o Claude e devolve JSON parseado (com tolerância a cercas ```).
export async function generateJSON(prompt: string, image?: { mediaType: string; base64: string }) {
  const content: Anthropic.MessageParam["content"] = image
    ? [
        { type: "image", source: { type: "base64", media_type: image.mediaType as any, data: image.base64 } },
        { type: "text", text: prompt },
      ]
    : prompt;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
  return JSON.parse(s >= 0 && e >= 0 ? clean.slice(s, e + 1) : clean);
}
