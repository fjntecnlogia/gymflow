# GymFlow Gestor — Monorepo Context

SaaS de gestão para academias com QR Code, biometria facial e WhatsApp.

## Agentes do Projeto
| Área | Guia |
|---|---|
| 🔵 Backend API | `.docs/agents/backend.md` |
| 🟢 Frontend Web | `.docs/agents/frontend.md` |
| ⚙️ DevOps/Infra | `.docs/agents/devops.md` |
| 🏗️ Arquitetura | `.docs/agents/architecture.md` |
| 📣 Marketing | `.docs/agents/marketing.md` |

## Monorepo (Turborepo)
```
apps/
  api/      ← Fastify API (Railway)
  web/      ← Next.js (Vercel)
  mobile/   ← React Native (Expo)
packages/   ← shared types/utils
```

## URLs de Produção
- **Web (canônico)**: `https://gymflowgestor.com.br`
- **API (canônico)**: `https://api.gymflowgestor.com.br`
- **Web (Vercel native)**: `https://web-gules-phi-97.vercel.app` — fallback, não exibir publicamente
- **API (Railway native)**: `https://gymflow-production-abf9.up.railway.app` — fallback, não exibir publicamente

> Domínio principal: `gymflowgestor.com.br` (Registro.br, DNS no Cloudflare). Migração em curso — ver `.docs/agents/migration-runbook.md`.

## Regras Globais
- Commits em português, código em inglês
- Nunca commitar `.env` ou segredos
- Sempre testar antes de marcar como feito
- Multi-tenant: sempre filtrar por `academiaId`

## Estado dos Serviços
| Serviço | Status |
|---|---|
| API (gymflow) | ✅ Online |
| PostgreSQL | ✅ Online |
| Redis | ✅ Online |
| CompreFace Core | ✅ Online (`/find_faces?face_plugins=age,calculator`) |
| CompreFace API | ⚠️ 500 (precisa restart no Railway) |
| WhatsApp | ✅ Via bridge local + Cloudflare Tunnel |
