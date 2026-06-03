# GymFlow Gestor API — Backend Agent Context

Você está trabalhando no **backend da API do GymFlow Gestor**.
Leia o guia completo em: `../../.docs/agents/backend.md`

## Contexto Rápido
- **Stack**: Fastify 4 + Prisma 5 + PostgreSQL + Redis
- **URL Produção (canônico)**: `https://api.gymflowgestor.com.br`
- **URL Railway native**: `https://gymflow-production-abf9.up.railway.app` — fallback
- **Deploy**: Railway auto-deploy no push para `main`

## ⚠️ ATENÇÃO — Service Railway correto

Existem **DOIS services Railway com nomes parecidos**. Cuide pra não cair no errado:

| Service | Service ID | Domain native | Status |
|---|---|---|---|
| ✅ **`gymflow`** (USE ESTE) | `c16ddead-f971-483a-8228-84aa76dde7da` | `gymflow-production-abf9.up.railway.app` → `api.gymflowgestor.com.br` | **ATIVO** |
| 🔴 `gymflow-api` (NÃO USE) | `384ea7b7-0dae-4df2-b686-d9564981685e` | `gymflow-api-production.up.railway.app` | MORTO (HTTP 502) |

**Sempre use `--service gymflow` nos comandos:**
```bash
railway link --project gymflow --environment production --service gymflow
railway variables --service gymflow --kv | grep ENV_NAME
railway up --service gymflow --detach            # do root do monorepo
railway logs --service gymflow --lines 100
```

**Como descobrir qual service está ativo (caso a estrutura mude):**
```bash
# Testar HTTP no domain de cada service. O que responder 200 é o ativo.
curl -I https://gymflow-api-production.up.railway.app/health    # MORTO (502)
curl -I https://gymflow-production-abf9.up.railway.app/health   # ATIVO (200)
```

## Como rodar deploy manual do backend
Do **root do monorepo** (não de apps/api):
```bash
cd <root>/gymflow
railway up --service gymflow --detach
```
O `Dockerfile` em `apps/api/Dockerfile` (Debian Slim + OpenSSL) é usado automaticamente.
O start command vem de `apps/api/railway.toml` (`tsx src/server.ts` em runtime).

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
