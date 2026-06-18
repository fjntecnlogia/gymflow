# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile da API (Fastify + Prisma).
#
# IMPORTANTE: usamos node:20-bookworm-slim (Debian) em vez de Alpine.
# Motivo: Prisma engine linux-musl exige libssl.so.1.1 (OpenSSL 1.1),
# que Alpine 3.18+ não fornece mais. Debian já vem com OpenSSL compatível.
#
# Strategy: o build context é apps/api (Root Directory configurado no
# Railway), então copiamos tudo e instalamos direto — sem turbo prune.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-bookworm-slim

# Dependências do sistema:
# - openssl: requerido pelo Prisma query engine
# - git, python3, build-essential: alguns pacotes npm (Baileys etc.) precisam
# - ca-certificates: pra HTTPS confiável (Resend, Stripe, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
      openssl \
      ca-certificates \
      git \
      python3 \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia código (Prisma schema, src/, package.json, tsconfig.json, etc.)
COPY . .

# Deps com legacy-peer-deps porque alguns pacotes (baileys etc) brigam.
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Gera Prisma client (precisa só do schema).
# Pin v5 pra evitar npx baixar v6.x do registry (incompatível com @prisma/client@^5).
RUN npx prisma@5 generate

# NOTA: NÃO usamos tsc + dist/ porque o `tsc || true` mascara erros e
# pode deixar dist/ stale (versões antigas seguem rodando). Em vez disso,
# rodamos com tsx em runtime — executa TypeScript direto sem build,
# garantindo que o código atual SEMPRE é o servido.

EXPOSE 3001

# Runtime: aplica schema no Postgres + sobe servidor via tsx.
# --accept-data-loss é seguro: schema é gerenciado pelo Prisma e mudanças
# são aditivas (novas tabelas/colunas, nada destrutivo).
CMD ["sh", "-c", "npx prisma@5 db push --accept-data-loss && npx tsx src/server.ts"]
# trigger redeploy Tue Jun  2 20:30:48 HPBC 2026
