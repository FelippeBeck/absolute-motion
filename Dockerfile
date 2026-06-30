# Backend do Absolute Motion (Express/Node) com FFmpeg para montar o vídeo final.
# Deploy: Railway / Fly.io / Render (NÃO Vercel — Vercel não roda FFmpeg).
FROM node:20-slim

# FFmpeg + fontes (drawtext precisa de fontconfig p/ as legendas)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências (inclui tsx para rodar TypeScript direto)
COPY package*.json ./
RUN npm ci

# Código
COPY . .

ENV NODE_ENV=production
# A porta vem da plataforma (Railway/Fly definem $PORT); cai em 8787 localmente.
EXPOSE 8787

CMD ["npx", "tsx", "src/server.ts"]
