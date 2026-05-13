FROM node:20-alpine AS base
RUN npm install -g turbo

FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune --scope=@gymflow/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

FROM installer AS runner
WORKDIR /app
COPY --from=builder /app/out/full/ .
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npm run build

EXPOSE 3001
CMD ["node", "apps/api/dist/server.js"]
