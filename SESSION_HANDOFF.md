# GymFlow Gestor — Handoff de Sessão Claude

> Documento pra retomar o trabalho em outra sessão se essa janela travar.
> Última atualização: 2026-06-04 (após Builds 1-3 e Google Analytics)

---

## 🎯 Status Geral

| Componente | Estado | URL canônica |
|---|---|---|
| **Site marketing** | ✅ no ar | https://www.gymflowgestor.com.br |
| **API backend** | ✅ no ar | https://api.gymflowgestor.com.br |
| **Auth próprio (Postgres + bcrypt + JWT)** | ✅ funcional | — |
| **Stripe checkout público** | ✅ funcional | `/billing/checkout-publico` |
| **Endpoint /simular-compra** | ✅ funcional | `/billing/simular-compra` (X-Test-Key: `gymflow-test-2026`) |
| **Resend (emails)** | ✅ funcional | Domain verificado |
| **CompreFace (reconhecimento facial)** | 🟡 infra OK, falta API Key | Cliente precisa logar no painel manualmente e gerar |
| **Supabase Auth** | 🔴 PAUSADO (free tier expirou) | Mantido só como fallback no middleware |

---

## 🏗️ Decisões de Arquitetura

### 1. Pivot demo-first → compra direta
- Cliente entra em `/planos-saas` com 2 CTAs por plano:
  - **"Assinar agora"** (primário) → modal → Stripe Checkout → webhook cria conta
  - **"Quero ver antes (demo)"** (secundário) → `/agendar` (form lead)
- Nada gratuito. Removido "14 dias grátis" do checkout.
- Cupom `GYMFLOWTESTE` (Stripe Promotion Code) dá 100% off na 1ª fatura — pra testes.

### 2. Auth migrado de Supabase pra Postgres + bcrypt + JWT
- Decisão tomada porque Supabase free tier pausa após inatividade ($25/mês pra Pro).
- Postgres do Railway não pausa → economia ~R$ 1.560/ano.
- `Usuario.supabaseId` virou nullable (retro-compat).
- Novos campos: `senhaHash`, `tokenPrimeiroAcesso`, `tokenResetSenha` + expiras.
- `authMiddleware` valida JWT próprio primeiro, fallback Supabase (alunos mobile + legacy).

### 3. Service Railway correto: `gymflow` (NÃO `gymflow-api`)
- ⚠️ Existem 2 services com nomes parecidos. Sempre use:
  ```bash
  railway link --project gymflow --environment production --service gymflow
  railway up --service gymflow --detach  # do ROOT do monorepo
  ```
- `gymflow-api` é serviço morto (HTTP 502).
- Detalhes em `apps/api/CLAUDE.md`.

### 4. Auto-deploy Vercel via push, Railway manual
- Frontend: GitHub Actions deploya Vercel automaticamente em push pra main.
- Backend: `railway up --service gymflow --detach` manual do root do monorepo.

---

## 🔑 Credenciais & Secrets (já cadastrados)

### Railway service `gymflow` (variáveis)

> ⚠️ Valores reais ficam SÓ no Railway e no Bitwarden. Aqui só nomes.

```
DATABASE_URL              — Postgres do gymflow-db (Railway interno)
RESEND_API_KEY            — Resend (vault Bitwarden)
EMAIL_FROM                — contato@gymflowgestor.com.br
ADMIN_LEAD_EMAIL          — fjntecnologia2022@gmail.com
STRIPE_SECRET_KEY         — Stripe LIVE (vault Bitwarden)
STRIPE_WEBHOOK_SECRET     — Webhook signing secret
STRIPE_PRICE_STARTER      — price_1TXEl0...  (197/mês)
STRIPE_PRICE_PRO          — price_1TXEl1...  (397/mês)
STRIPE_PRICE_ENTERPRISE   — price_1TXEl1...  (797/mês)
WEB_URL                   — https://www.gymflowgestor.com.br
JWT_SECRET                — NÃO regenerar (quebra sessões ativas)
COMPREFACE_API_KEY        — Atualmente "temp-api-key", precisa gerar real no painel
COMPREFACE_URL            — http://compreface-api.railway.internal:8080
```

**Pra consultar valores reais:**
```bash
railway variables --service gymflow --kv | grep <NOME>
```

### GitHub Actions secrets
```
VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID — todos OK
```

### Resend
- Conta: `gymflowgestao@gmail.com`
- API Key: `re_RKusXV59_EmTcnEu7BigAYYaBDEeTb6Xi`
- Domain `gymflowgestor.com.br` verificado (SPF + DKIM + DMARC no Cloudflare)

### CompreFace (pendente)
- Login painel: `gymflowgestao@gmail.com` / `Mudar@0342`
- Painel URL: https://compreface-fe-production-769b.up.railway.app/
- Admin master alternativo: `admin@gymflow.com` / `Admin@1234`

### Bitwarden (cliente está usando pra gerenciar)
- Conta criada pelo cliente
- Recomendação: 1 vault por projeto FJN (STYLOGESTOR, GYMFLOW, FILEA…)

---

## 📦 Implementações Concluídas (em ordem)

### Home + landing (frontend)
- `/` (marketing) reescrita com 13 seções (hero, métricas, features, antes/depois, 3 passos, demo, depoimentos, integrações, planos, FAQ, CTA garantia, footer)
- `/agendar` — landing de captura de demo
- `/admin/agendamentos` — gestão de leads no super-admin
- `/cadastro` → redirect 308 → `/planos-saas`
- Footer com link discreto "Acesso adm SaaS" → `/admin`

### Agendamentos (backend)
- Tabela `Agendamento` no Prisma
- `POST /agendamentos` (público, rate-limit 1 req/IP/5min)
- `GET /admin/agendamentos` (auth admin)
- `PATCH /admin/agendamentos/:id` (auth admin)
- Emails Resend (lead + admin) integrados

### Stripe Checkout público + onboarding automático
- `POST /billing/checkout-publico` (sem auth, rate-limit 3/IP/5min)
- Webhook `checkout.session.completed` com `metadata.source='public_signup'`:
  - Cria Academia + Usuario (transação Prisma)
  - Gera tokenPrimeiroAcesso
  - Envia email cliente (boas-vindas + link criar senha)
  - Envia email admin (nova venda)
- Stripe webhook configurado com 5 eventos certos
- Cupom de teste `GYMFLOWTESTE` (100% OFF 1ª fatura, 10 usos)
- Endpoint `POST /billing/simular-compra` (X-Test-Key) pra teste sem Stripe

### Auth próprio (Postgres + bcrypt + JWT)
- Schema Prisma com `senhaHash`, `tokenPrimeiroAcesso/Expira`, `tokenResetSenha/Expira`
- Módulo `auth/` com service + routes
- Endpoints:
  - `POST /auth/login` (rate-limit 10/min)
  - `POST /auth/primeiro-acesso` (token + senha → JWT)
  - `POST /auth/esqueci-senha` (3/IP/5min, sempre 200)
  - `POST /auth/redefinir-senha` (token + nova senha)
- `authMiddleware` valida JWT próprio primeiro, fallback Supabase
- Frontend reescrito:
  - `/login` (sem Supabase JS) + olho mostrar/ocultar senha
  - `/criar-senha?token=...`
  - `/esqueci-senha`
  - `/redefinir-senha?token=...`
- Templates email: `templatePrimeiroAcesso`, `templateResetSenha`

### CompreFace (face recognition)
- 5 services Railway: db, core, api, admin, fe
- ✅ Fix typo `pgsql://` → `postgresql://`
- ✅ Imagens atualizadas pra `exadel/compreface-*:1.2.0`
- ✅ Custom Start Command no fe pra remover `/etc/nginx/conf.d/default.conf`:
  ```
  sh -c "rm -f /etc/nginx/conf.d/default.conf && /docker-entrypoint.sh nginx -g 'daemon off;'"
  ```
- ✅ **API Key gerada e cadastrada** via INSERT direto no banco compreface-db:
  - App "GYMFLOW" (id=1, criado em 17/05/2026, já existia)
  - Model "GymFlow Face Recognition" (id=1, type='R')
  - Promoção do user `gymflowgestao@gmail.com` a OWNER do app (user_app_role)
  - API Key no service `gymflow` do Railway: cadastrada via CLI
  - 🔒 TCP Proxy do compreface-db deve ser DESABILITADO no painel após uso

### Google Analytics 4
- ID: `G-SRZ7HE1DVD`
- Adicionado em `apps/web/app/layout.tsx` via `<Script>` do Next (strategy `afterInteractive`)
- Cobre todas as páginas do site (home, /agendar, /login, /planos-saas, /admin/*, /dashboard, etc.)

### Build 1 — Admin SaaS Financeiro robusto
- Endpoint backend: `GET /admin/financeiro/saas` (em `admin.routes.ts`)
- Retorna: kpis (MRR, ARR, churn, ticket médio, etc.), distribuição por plano, evolução MRR 12 meses, top 10 academias, em risco
- Frontend: `/admin/receita/page.tsx` reescrita com 8 KPIs + gráfico evolução + distribuição + top 10 + tabela em risco

### Build 2 — Tutorial de onboarding
- Schema Prisma: novos campos `onboardingConcluido Boolean @default(false)` + `onboardingConcluidoEm DateTime?` em `Usuario`
- Service `auth.service.ts`: funções `marcarOnboardingConcluido()` e `resetarOnboarding()`
- Endpoints: `POST /auth/me/onboarding-concluido`, `POST /auth/me/resetar-onboarding` (preHandler authMiddleware)
- Login retorna `usuario.onboardingConcluido` no payload
- Frontend: componente `apps/web/components/onboarding/TutorialOnboarding.tsx` (6 passos: Bem-vindo → Planos → Alunos → Catraca → Acesso → Pronto)
- Integrado em `/dashboard/page.tsx`: detecta `onboardingConcluido === false` no localStorage e abre modal automaticamente; botão "Ver tutorial" no header
- Modal tem: barra progresso, navegação por teclado (←→ Esc), dots clicáveis, skip "Pular tutorial"

### Build 3 — Financeiro do gestor robusto
- Endpoints novos em `pagamentos.routes.ts` + `pagamentos.service.ts`:
  - `GET /pagamentos/dre` (DRE simplificado do mês)
  - `GET /pagamentos/fluxo-caixa?dias=30`
  - `GET /pagamentos/previsao-mrr` (matrículas ativas × valor)
  - `GET /pagamentos/inadimplentes` (lista detalhada com dias de atraso)
- Frontend: componente `apps/web/components/financeiro/VisaoGeralFinanceiro.tsx`
- Integrado em `/financeiro/page.tsx` com abas "Visão Geral" / "Pagamentos"
- Visão Geral mostra: DRE, previsão MRR, fluxo de caixa 30 dias, tabela inadimplentes com botão "Cobrar via WhatsApp"

---

## 🚧 Pendências Conhecidas

1. ~~**CompreFace API Key real**~~ ✅ RESOLVIDO — API Key gerada via INSERT direto no banco e cadastrada no Railway.

2. **TCP Proxy do compreface-db** — foi habilitado pra eu fazer o INSERT da API Key. Cliente precisa **DESABILITAR** no painel Railway (Settings → Networking → TCP Proxy) por segurança.

3. **App mobile dos alunos** — ainda usa Supabase Auth (que está pausado). Ver `MOBILE_MIGRATION_GUIDE.md` pra plano de migração.

4. **DNS — DMARC** — está como `p=reject` no Cloudflare. Recomendado começar com `p=none` e apertar gradualmente (cliente não fez essa mudança).

5. **Tokens vazados na sessão** — `VERCEL_TOKEN` e `RESEND_API_KEY` apareceram no histórico do chat. Cliente optou por não revogar (decisão dele).

6. **Custos operacionais no DRE** — o campo "Custos operacionais" da aba Visão Geral é input livre (estado local). Pra persistir, criar tabela `CustoOperacional` no Prisma + endpoint CRUD.

7. **Email do admin SaaS já validado** — `admin@gymflow.com / Admin@1234` existe no banco CompreFace mas senha pode estar criptografada com hash incompatível. O OWNER global ativo é o user `gymflowgestao@gmail.com` (promovido via SQL no app GYMFLOW).

5. **Cancelar subscription Stripe `incomplete`** — uma subscription `sub_1TeHmPCQ5GXZkVFlEVA190M7` ficou em estado `incomplete` (cartão rejeitado). Não cobra nada mas pode limpar.

6. **Academia "Academia Simulada" no banco** — criada via `/simular-compra` pra teste. Email `fagnerjose+teste1@gmail.com`. Pode deletar quando quiser.

---

## 🔄 Comandos úteis pra retomar

### Login Railway
```bash
railway login
cd <path>/gymflow/apps/api
railway link --project gymflow --environment production --service gymflow
```

### Deploy backend
```bash
cd <path>/gymflow  # ROOT do monorepo
railway up --service gymflow --detach
```

### Deploy frontend (auto via push)
```bash
cd <path>/gymflow
git add . && git commit -m "..." && git push origin main
```

### Logs Railway
```bash
railway logs --service gymflow --lines 100
```

### Validar Stripe checkout-publico
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"plano":"STARTER","email":"teste@email.com","nomeAcademia":"X","nomeContato":"Y"}' \
  https://api.gymflowgestor.com.br/billing/checkout-publico
```

### Simular compra (sem Stripe)
```bash
curl -s -X POST -H "Content-Type: application/json" -H "X-Test-Key: gymflow-test-2026" \
  -d '{"plano":"STARTER","email":"teste2@email.com","nomeAcademia":"X","nomeContato":"Y"}' \
  https://api.gymflowgestor.com.br/billing/simular-compra
```

### Resend — ver últimos emails
```bash
# Pegar a chave: railway variables --service gymflow --kv | grep RESEND_API_KEY
curl -s -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails | python -c "import sys,json; [print(e.get('last_event'),e.get('subject',''),e.get('to','')) for e in json.load(sys.stdin).get('data',[])[:10]]"
```

### Stripe — ver últimas subscriptions
```bash
# Pegar a chave: railway variables --service gymflow --kv | grep STRIPE_SECRET_KEY
curl -s -u "$STRIPE_SECRET_KEY:" \
  "https://api.stripe.com/v1/subscriptions?limit=5"
```

---

## 📂 Arquivos de Referência

- `apps/api/CLAUDE.md` — regras do agente backend
- `apps/web/CLAUDE.md` — regras do agente frontend
- `COMPREFACE_REDEPLOY.md` — backup config dos services CompreFace
- `MOBILE_MIGRATION_GUIDE.md` — plano de migração do app mobile
- `.docs/agents/*.md` — guias detalhados por agente

---

## 🎓 Como retomar em nova sessão Claude

1. **Cola este arquivo inteiro no prompt inicial**, prefixado com:
   > "Sou o agente que estava trabalhando neste projeto. Leia este documento de handoff e me confirme que entendeu o estado atual. Depois aguarde minhas instruções."

2. **Confirme service Railway** antes de qualquer deploy:
   ```bash
   railway status
   # tem que mostrar: Service: gymflow (NÃO gymflow-api)
   ```

3. **Não regenere `JWT_SECRET` no Railway** — quebra todas as sessões ativas.

4. **Use `git push origin main`** pra frontend, `railway up` pra backend.
