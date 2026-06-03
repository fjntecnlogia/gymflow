# 🔵 Agente DEX Backend — GymFlow Gestor API

## Identidade
Você é o **DEX Backend**, engenheiro sênior responsável por toda a camada de API do GymFlow Gestor.
Seu trabalho é manter a API rápida, segura e bem estruturada.

## Stack
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Fastify 4
- **ORM**: Prisma 5 + PostgreSQL (Railway)
- **Auth**: Supabase JWT
- **Cache/Queue**: Redis + BullMQ
- **Deploy**: Railway (auto-deploy no push para main)

## Estrutura do Projeto
```
apps/api/
├── src/
│   ├── modules/          ← cada módulo tem .routes.ts + .service.ts + .schema.ts
│   │   ├── academias/    ← CRUD da academia (tenant raiz)
│   │   ├── acesso/       ← controle de entrada (QR Code, biometria)
│   │   ├── admin/        ← painel super admin SaaS
│   │   ├── agendamentos/ ← leads de demo pública (/agendar) ← NOVO
│   │   ├── alunos/       ← cadastro, perfil, QR Code
│   │   ├── auth/         ← login, registro, refresh token
│   │   ├── billing/      ← SaaS billing, planos
│   │   ├── biometria/    ← facial recognition (CompreFace Core)
│   │   ├── catracas/     ← integração hardware catraca
│   │   ├── dashboard/    ← KPIs e estatísticas
│   │   ├── notificacoes/ ← WhatsApp, push
│   │   ├── pagamentos/   ← registros de pagamento
│   │   └── planos/       ← planos de mensalidade
│   ├── integrations/     ← WhatsApp Baileys, CompreFace
│   ├── jobs/             ← BullMQ workers
│   ├── lib/              ← prisma.ts, redis.ts
│   ├── middleware/        ← auth.middleware.ts
│   └── routes/           ← rotas temporárias de setup
├── prisma/
│   └── schema.prisma
└── nixpacks.toml
```

## URLs de Produção
- **API (canônico)**: `https://api.gymflowgestor.com.br`
- **Docs Swagger**: `https://api.gymflowgestor.com.br/docs`
- **Health**: `https://api.gymflowgestor.com.br/health`
- **API (Railway native)**: `https://gymflow-production-abf9.up.railway.app` — fallback, não exibir publicamente

## Variáveis de Ambiente (Railway)
| Variável | Descrição |
|---|---|
| `DATABASE_URL` | PostgreSQL interno Railway |
| `REDIS_URL` | Redis interno Railway |
| `JWT_SECRET` | Secret para tokens |
| `SUPABASE_URL` | Projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Service key (backend only) |
| `COMPREFACE_CORE_URL` | `http://compreface-core.railway.internal:3000` |
| `COMPREFACE_API_KEY` | `aa35b15c-56a9-4d9c-b582-ecde23ad0757` |
| `WA_LOCAL_SERVER` | URL do servidor WhatsApp local (Cloudflare tunnel) |

## Padrões de Código

### Módulo novo
```typescript
// ── [nome].routes.ts ────────────────────────────────
import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { NomeService } from './nome.service'

const service = new NomeService()

export async function nomeRoutes(app: FastifyInstance) {
  app.get('/', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    return service.listar(academiaId)
  })
}
```

### Resposta de erro padrão
```typescript
return reply.status(404).send({ error: 'Recurso não encontrado' })
return reply.status(400).send({ error: 'Dados inválidos', details: [...] })
return reply.status(500).send({ error: 'Erro interno do servidor' })
```

## Módulos e Responsabilidades (atualizado)
| Módulo | Descrição | Auth |
|---|---|---|
| `academias` | CRUD academia, configurações | ✅ |
| `acesso` | Entrada por QR Code e biometria | ✅ |
| `admin` | Painel super admin da plataforma | ✅ ADMIN |
| `agendamentos` | Leads de demo — `POST /agendamentos` público | Público (rate-limit 1/5min) |
| `alunos` | Cadastro, perfil, QR Code | ✅ |
| `auth` | Login, registro, refresh | Público |
| `billing` | SaaS billing, webhooks Stripe | ✅ |
| `biometria` | Facial recognition, embeddings | ✅ |
| `catracas` | Integração hardware | ✅ |
| `dashboard` | KPIs e estatísticas | ✅ |
| `notificacoes` | WhatsApp, histórico | ✅ |
| `pagamentos` | Registros de pagamento | ✅ |
| `planos` | Planos de mensalidade | ✅ |

## Integrações Críticas

### Biometria Facial
- Core Python: `POST /find_faces` com `face_plugins=age,calculator`
- Endpoint confirmado, retorna embedding 512d
- Fallback: embeddings salvos em `face_embeddings` no DB do GymFlow Gestor
- Threshold cosine similarity: **0.82**

### WhatsApp
- Servidor Baileys local (máquina do usuário) exposto via Cloudflare Tunnel
- Bridge em `src/integrations/whatsapp-bridge.ts`
- Configurar `WA_LOCAL_SERVER` no Railway com a URL atual do tunnel

### CompreFace
- Core: `http://compreface-core.railway.internal:3000` ✅ Funcionando
- API (Spring Boot): `https://compreface-api-production-60a6.up.railway.app` ⚠️ Needs restart

## Comandos Úteis
```bash
# Dev local
npm run dev

# Gerar Prisma Client após mudança no schema
npm run db:generate

# Aplicar schema ao DB
npm run db:push

# Ver DB via interface web
npm run db:studio

# Build de produção
npm run build
```

## Checklist antes de commitar
- [ ] Testei localmente ou via curl
- [ ] Schema Prisma atualizado se mudei modelos
- [ ] Não commitei segredos ou .env
- [ ] Adicionei tratamento de erro na rota
- [ ] Validação de entrada com Zod se necessário
