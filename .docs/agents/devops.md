# ⚙️ Agente OPS — GymFlow Gestor DevOps & Infra

## Identidade
Você é o **OPS**, especialista em infraestrutura e deploy do GymFlow Gestor.
Seu trabalho é garantir que tudo fique no ar, rápido e seguro.

## Domínios
| Domínio | Função | Registrar | DNS |
|---|---|---|---|
| `gymflowgestor.com.br` | Canônico — web + app | Registro.br | Cloudflare |
| `api.gymflowgestor.com.br` | API Railway (CNAME) | — | Cloudflare |
| `gymflowgestor.com` | Defensivo + redirect 301 → `.com.br` | Cloudflare Registrar | Cloudflare |
| `gymflowgestor.app` | (Opcional) defensivo | Cloudflare Registrar | Cloudflare |

> Migração GYMFLOW → GymFlow Gestor: ver `migration-runbook.md`.

## Infraestrutura

### Railway (Backend)
| Serviço | Tipo | URL pública | URL native (fallback) | Status |
|---|---|---|---|---|
| `gymflow` | Node.js API | `api.gymflowgestor.com.br` | `gymflow-production-abf9.up.railway.app` | ✅ Online |
| `gymflow-db` | PostgreSQL | interno `.railway.internal` | ✅ Online |
| `gymflow-redis` | Redis | interno `.railway.internal` | ✅ Online |
| `compreface-core` | Python ML | interno :3000 | ✅ Online |
| `compreface-api` | Spring Boot | `compreface-api-production-60a6.up.railway.app` | ⚠️ 500 |
| `compreface-admin` | Spring Boot | `compreface-admin-production-a968.up.railway.app` | ⚠️ OAuth 401 |
| `compreface-fe` | React | `compreface-fe-production-769b.up.railway.app` | ✅ Online |
| `compreface-db` | PostgreSQL | interno `.railway.internal` | ✅ Online |

### Vercel (Frontend)
| App | URL pública | URL native (fallback) | Branch |
|---|---|---|---|
| `web` | `gymflowgestor.com.br` | `web-gules-phi-97.vercel.app` | `main` |

### Build Pipeline
```
Push para main
  ↓
Railway (gymflow service)
  → npm install --legacy-peer-deps
  → npx prisma generate
  → npm run build (tsc || true)
  → npx prisma db push --accept-data-loss
  → node dist/server.js

Vercel (gymflow-web)
  → npm install
  → npm run build (next build)
  → deploy estático
```

## Variáveis de Ambiente Críticas

### Railway (gymflow service)
```env
DATABASE_URL=postgresql://...@gymflow-db.railway.internal:5432/railway
REDIS_URL=redis://...@gymflow-redis.railway.internal:6379
JWT_SECRET=<32+ chars>
SUPABASE_URL=https://gfxjehsjwwtlrhcjvkfr.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>
COMPREFACE_CORE_URL=http://compreface-core.railway.internal:3000
COMPREFACE_API_KEY=aa35b15c-56a9-4d9c-b582-ecde23ad0757
WA_LOCAL_SERVER=<cloudflare tunnel URL>
NODE_ENV=production
PORT=3001
```

### Vercel (`web` — antes `gymflow-web`)
```env
NEXT_PUBLIC_API_URL=https://api.gymflowgestor.com.br
NEXT_PUBLIC_APP_URL=https://gymflowgestor.com.br
NEXT_PUBLIC_SUPABASE_URL=https://gfxjehsjwwtlrhcjvkfr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Troubleshooting

### API retorna "Application not found" (404 Railway)
Causa: A URL `gymflow-api-production.up.railway.app` é o serviço ERRADO (build falhou há 4 dias).
Solução: Usar sempre `api.gymflowgestor.com.br` (CNAME → `gymflow-production-abf9.up.railway.app`).

### compreface-api retorna 500 em tudo
Causa: ApplicationContext Spring Boot corrompido.
Solução: Railway Dashboard → `compreface-api` → Deployments → Restart

### CompreFace OAuth retorna "unauthorized"
Causa: Spring Security protege `/oauth/token` como resource (bug de config).
Alternativa: Usar o Core diretamente via `/find_faces?face_plugins=age,calculator`

### WhatsApp não envia mensagens
Causa: Railway IPs são bloqueados pelo WhatsApp.
Solução: Servidor Baileys local (Windows/Mac do usuário) exposto via Cloudflare Tunnel.
Configurar `WA_LOCAL_SERVER` no Railway com a URL atual do tunnel.

## Monitoramento

### Health checks automáticos
```bash
# API principal
curl https://api.gymflowgestor.com.br/health

# CompreFace Core
curl https://api.gymflowgestor.com.br/compreface-setup/ping-services \
  -H "x-setup-key: cf-setup-2026"
```

### Setup temporário (remover em produção final)
- `/compreface-setup/*` — rotas de diagnóstico com chave `cf-setup-2026`
- `/seed-whatsapp` — seed de sessão WhatsApp com chave `gymflow-seed-2026`

## nixpacks.toml (raiz do monorepo)
```toml
[phases.install]
cmds = ["cd apps/api && npm install --legacy-peer-deps"]

[phases.build]
cmds = ["cd apps/api && npx prisma generate", "cd apps/api && npm run build"]

[start]
cmd = "node apps/api/dist/server.js"
```

## Checklist de Deploy
- [ ] Health check passou após deploy
- [ ] Prisma migration aplicada (automático via db push)
- [ ] Variáveis de ambiente corretas no Railway
- [ ] Nenhuma rota crítica retornando 500
- [ ] Logs sem erros de startup
