# GYMFLOW — Guia de Deploy Completo

## Pré-requisitos
- Conta no [Railway](https://railway.app) (grátis para começar)
- Conta no [Vercel](https://vercel.com) ← já configurado
- Conta no [Supabase](https://supabase.com) (grátis)
- Conta na [Efí Bank](https://efipay.com.br) (PIX)

---

## PASSO 1 — Supabase (Auth + JWT)

1. Acesse https://supabase.com → New Project
2. Nome: `gymflow` | Senha forte | Região: South America (São Paulo)
3. Aguarde ~2 minutos
4. Vá em **Settings → API**:
   - Copie `Project URL` → `SUPABASE_URL`
   - Copie `anon public` → `SUPABASE_ANON_KEY`
   - Copie `service_role secret` → `SUPABASE_SERVICE_KEY`
   - Copie `JWT Secret` → `SUPABASE_JWT_SECRET`

---

## PASSO 2 — Railway (API + PostgreSQL + Redis)

### Opção A — Via Dashboard (recomendado)

1. Acesse https://railway.app → New Project
2. **Deploy from GitHub** → conecte o repositório `gymflow`
3. Railway detecta automaticamente o `Dockerfile`
4. Clique em **+ New Service** → **Database** → PostgreSQL
5. Clique em **+ New Service** → **Database** → Redis

### Configurar variáveis no Railway:
```
Settings → Variables → Add Variable
```

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | Railway gera automaticamente (clique "copy" no PostgreSQL) |
| `REDIS_URL` | Railway gera automaticamente (clique "copy" no Redis) |
| `SUPABASE_URL` | Do passo 1 |
| `SUPABASE_SERVICE_KEY` | Do passo 1 |
| `JWT_SECRET` | Gere: `openssl rand -base64 32` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `EFI_CLIENT_ID` | Da Efí Bank |
| `EFI_CLIENT_SECRET` | Da Efí Bank |
| `PIX_CHAVE` | Seu email/CPF/CNPJ |
| `EVOLUTION_API_URL` | URL da sua instância Evolution |
| `EVOLUTION_API_KEY` | Chave da Evolution API |
| `WEB_URL` | URL do Vercel (preencher depois) |

### Rodar migrations após deploy:
```bash
# No terminal Railway (aba Deploy → View Logs → Shell)
cd apps/api && npx prisma migrate deploy
```

### Opção B — Via CLI (com token)
```powershell
$env:RAILWAY_TOKEN = "seu_token"
.\deploy-railway.ps1 -Token "seu_token"
```

**Obter token:** https://railway.app → Account Settings → Tokens → New Token

---

## PASSO 3 — Vercel (Web App)

### Via CLI (já autenticado):
```powershell
cd apps/web
vercel --prod
```

### Variáveis no Vercel:
```
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

### Ou via Dashboard:
1. Acesse https://vercel.com → seu projeto gymflow
2. **Settings → Environment Variables**
3. Adicione as 3 variáveis acima com os valores

---

## PASSO 4 — Configurar Webhook PIX

Após ter a URL da API no Railway (ex: `https://gymflow-api.railway.app`):

```bash
curl -X POST https://gymflow-api.railway.app/pagamentos/configurar-webhook \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://gymflow-api.railway.app/pagamentos/webhook/pix"}'
```

---

## PASSO 5 — Conectar WhatsApp (Evolution API)

1. Acesse `https://sua-evolution.com/manager`
2. Crie instância: `gymflow`
3. Escaneie QR Code com WhatsApp
4. Configure no Railway: `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`

---

## PASSO 6 — GitHub Actions CI/CD

1. Faça push para GitHub:
```bash
git remote add origin https://github.com/SEU_USUARIO/gymflow.git
git push -u origin main
```

2. Configure secrets no GitHub:
```
Repository → Settings → Secrets → Actions
```
| Secret | Valor |
|--------|-------|
| `RAILWAY_TOKEN` | Token do Railway |
| `VERCEL_TOKEN` | `vercel tokens create gymflow` |
| `VERCEL_ORG_ID` | `vercel whoami --token SEU_TOKEN` |
| `VERCEL_PROJECT_ID` | Dentro do projeto Vercel → Settings |

A partir daí, cada `git push main` faz deploy automático! 🚀

---

## Checklist Final

- [ ] Supabase criado e credenciais copiadas
- [ ] Railway com PostgreSQL + Redis + API
- [ ] Migrations rodadas (`prisma migrate deploy`)
- [ ] Vercel com Web App
- [ ] Variáveis de ambiente em todos os serviços
- [ ] Webhook PIX configurado na Efí Bank
- [ ] WhatsApp conectado via Evolution API
- [ ] GitHub Actions funcionando
- [ ] Domínio customizado configurado (opcional)

---

## URLs finais esperadas

| Serviço | URL |
|---------|-----|
| Landing Page | `https://gymflow.vercel.app` |
| Dashboard | `https://gymflow.vercel.app/dashboard` |
| API | `https://gymflow-api.railway.app` |
| Docs API | `https://gymflow-api.railway.app/docs` |
| Health | `https://gymflow-api.railway.app/health` |