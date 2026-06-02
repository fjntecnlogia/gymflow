# GymFlow Gestor API — Backend Agent Context

Você está trabalhando no **backend da API do GymFlow Gestor**.
Leia o guia completo em: `../../.docs/agents/backend.md`

## Contexto Rápido
- **Stack**: Fastify 4 + Prisma 5 + PostgreSQL + Redis
- **URL Produção (canônico)**: `https://api.gymflowgestor.com.br`
- **URL Railway native**: `https://gymflow-production-abf9.up.railway.app` — fallback
- **Deploy**: Railway auto-deploy no push para `main`
- **Nota importante**: A URL `gymflow-api-production.up.railway.app` é um serviço morto. Não usar.

## Regras desta pasta
1. Cada módulo em `src/modules/` tem `.routes.ts` + `.service.ts`
2. Auth sempre via `authMiddleware` — nunca expor dados sem autenticação
3. Sempre filtrar por `academiaId` (multi-tenant)
4. Usar `prisma` de `../../lib/prisma` (singleton)
5. Zod para validação de entrada

## Endpoints críticos confirmados funcionando
- `POST /biometria/alunos/:id/face` — cadastrar face (usa CompreFace Core `/find_faces?face_plugins=age,calculator`)
- `POST /biometria/reconhecer` — identificar face
- `POST /acesso/qrcode` — liberar por QR Code
- `GET /dashboard/overview` — KPIs da academia

## Não tocar sem consultar ARCH
- `prisma/schema.prisma` — mudanças de schema
- `src/middleware/auth.middleware.ts` — lógica de auth
- `src/lib/prisma.ts` — singleton do cliente
