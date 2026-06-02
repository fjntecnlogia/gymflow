# 🚚 Migration Runbook — GYMFLOW → GymFlow Gestor

**Início:** 2026-06-01
**Owner:** DevOps (OPS)
**Status atual:** Etapa 1 ✅ · Etapa 2 ⏳ aguardando execução

Este runbook lista cada ação que precisa ser feita **nos painéis externos** (Cloudflare, Vercel, Railway, Resend, Stripe etc). Marque `[x]` conforme executar.

---

## ✅ Etapa 0 — Concluída

- [x] `gymflowgestor.com.br` registrado no Registro.br (titular: Fagner Jose / fagnerjose@gmail.com)
- [x] NS já apontando para Cloudflare (`cass.ns.cloudflare.com`, `nitin.ns.cloudflare.com`)
- [x] Documentação interna rebrandeada (CLAUDE.md, devops.md, backend.md, frontend.md, apps/{api,web}/CLAUDE.md, DEPLOY.md, .env.example)
- [x] **Vercel já configurado** — projeto `web` (renomeado de `gymflow-web`) com Production URL = `https://www.gymflowgestor.com.br` (verificado 2026-06-01 ~24h UTC: HTTP 200 OK, X-Vercel-Id presente)
- [x] Domínio `gymflowgestor.com.br` listado em Vercel domains (Third Party registrar, NS no Cloudflare)
- [x] DNS Cloudflare já tem A/CNAME para Vercel funcionando (apex 307 → www, www 200)

---

## 1. Cloudflare Registrar — domínios complementares

### `.com` (recomendado — defensivo + branding global)
- [ ] Cloudflare Dashboard → Registrar → Register Domain → `gymflowgestor.com`
- [ ] Custo: **US$ 10,46/ano** (at-cost, sem markup)
- [ ] Auto-renewal: ✅ ON
- [ ] WHOIS Privacy: ✅ ON (default Cloudflare)

### ~~`.app`~~ — **DESCARTADO** (decisão 2026-06-01)
- Custo não justifica para o caso de uso (SaaS BR). `.com` defensivo é suficiente.

### ~~`.io`~~ — **DESCARTADO**
- US$ 50/ano, sem benefício prático para SaaS BR.

---

## 2. Cloudflare DNS — `gymflowgestor.com.br`

Acessar: Cloudflare Dashboard → `gymflowgestor.com.br` → DNS → Records

### Limpar registro atual
- [ ] **Remover** registro A apontando para `216.198.79.1` (parking do Vercel — vai ser substituído pelo custom domain real abaixo)

### Adicionar registros do Vercel (após passo 4)
- [ ] `A` · `@` · `76.76.21.21` · Proxy: 🟠 DNS only *(Vercel não funciona com proxy CF laranja)*
- [ ] `CNAME` · `www` · `cname.vercel-dns.com` · Proxy: 🟠 DNS only

### Adicionar registro do Railway (após passo 5)
- [ ] `CNAME` · `api` · `<valor exato fornecido pelo Railway>` · Proxy: 🟠 DNS only *(SSL do Railway é Let's Encrypt direto; proxy CF quebra)*

### Registros Resend (após passo 6)
- [ ] `TXT` · `@` · `v=spf1 include:_spf.resend.com ~all`
- [ ] `CNAME` · `resend._domainkey` · `<valor fornecido pelo Resend>`
- [ ] `TXT` · `_dmarc` · `v=DMARC1; p=quarantine; rua=mailto:dmarc@gymflowgestor.com.br; pct=100; adkim=s; aspf=s`

> ⚠️ Se já existe TXT SPF para outro provider (ex: Google Workspace), **NÃO duplicar** — mesclar tudo num único registro SPF.

---

## 3. Cloudflare DNS — `gymflowgestor.com` (após registro)

Quando comprar o `.com`, ele vem com nameservers Cloudflare automáticos. Configurar redirect:

- [ ] Cloudflare Dashboard → `gymflowgestor.com` → Rules → Page Rules → Create
- [ ] URL: `gymflowgestor.com/*`
- [ ] Setting: **Forwarding URL** → 301 Permanent Redirect → `https://gymflowgestor.com.br/$1`
- [ ] Criar segundo Page Rule: `*.gymflowgestor.com/*` → 301 → `https://gymflowgestor.com.br/$2`
- [ ] (Alternativa Bulk Redirects: Cloudflare grátis até 20 redirects, mais escalável que Page Rules)

---

## 4. Vercel — projeto `web`

### Domains — JÁ FEITO ✅
- [x] `gymflowgestor.com.br` adicionado ao projeto (3h atrás)
- [x] `www.gymflowgestor.com.br` adicionado (Production URL canônica)
- [x] SSL Let's Encrypt ✅ (HTTPS 200 OK confirmado)
- [x] Production Domain marcado

### Env vars — PENDENTE ⏳ (executar APÓS Railway custom domain estar ativo)
Atual em produção:
- `NEXT_PUBLIC_API_URL` = `https://gymflow-pr…` (URL Railway antiga) — **não trocar antes do Railway custom domain existir**, senão API quebra

A executar depois (via `vercel env` ou painel):
- [ ] `NEXT_PUBLIC_API_URL` → `https://api.gymflowgestor.com.br`
- [ ] Criar `NEXT_PUBLIC_APP_URL` → `https://gymflowgestor.com.br`
- [ ] `vercel --prod` (redeploy)

---

## 5. Railway — `gymflow` (API)

Acessar: Railway Dashboard → Project → `gymflow` service → Settings → Networking → Custom Domains

- [ ] Add Custom Domain → `api.gymflowgestor.com.br`
- [ ] Railway exibe um `CNAME` (algo como `XXXXX.up.railway.app`) → copiar valor
- [ ] Adicionar esse CNAME no Cloudflare DNS (ver passo 2)
- [ ] Aguardar Railway validar e provisionar Let's Encrypt (~2-5min)
- [ ] **Não renomear** o serviço Railway. URL native (`gymflow-production-abf9.up.railway.app`) continua válida como fallback.

### Env vars (Railway → `gymflow` → Variables)
- [ ] `API_URL` → `https://api.gymflowgestor.com.br`
- [ ] `WEB_URL` → `https://gymflowgestor.com.br`
- [ ] `EMAIL_FROM` → `noreply@gymflowgestor.com.br`
- [ ] `AWS_CLOUDFRONT_URL` → `https://cdn.gymflowgestor.com.br` *(se for criar CDN)*
- [ ] Salvar → Railway reinicia o serviço automaticamente

---

## 6. Resend — domínio de envio de email

Acessar: Resend Dashboard → Domains → Add Domain

- [ ] Domain: `gymflowgestor.com.br`
- [ ] Region: escolher mais próxima (us-east-1 ou eu-west-1)
- [ ] Resend exibe 3 registros DNS (SPF TXT, DKIM CNAME, DMARC TXT) → copiar
- [ ] Adicionar no Cloudflare DNS (ver passo 2)
- [ ] Voltar no Resend → clicar "Verify DNS Records" (pode levar 15-60min para propagar)
- [ ] Status: ✅ Verified
- [ ] **Não remover** `gymflow.com.br` no Resend (se existia) antes de confirmar entregabilidade do novo

---

## 7. Stripe — webhooks

Acessar: Stripe Dashboard → Developers → Webhooks

- [ ] Localizar webhook atual apontando para `gymflow-production-abf9.up.railway.app/webhooks/stripe`
- [ ] **Option A (zero downtime):** criar NOVO endpoint apontando para `api.gymflowgestor.com.br/webhooks/stripe` → manter os 2 ativos por 30 dias → desativar antigo
- [ ] **Option B (cutover direto):** editar endpoint existente, trocar URL → risco de perder eventos durante propagação DNS
- [ ] Recomendado: **Option A**
- [ ] **⚠️ Cada webhook tem `STRIPE_WEBHOOK_SECRET` diferente** — copiar o novo e atualizar no Railway env vars (`STRIPE_WEBHOOK_SECRET_NEW` ou substituir após confirmar)
- [ ] Testar: Stripe Dashboard → webhook → "Send test event" → verificar 200 OK no log Railway

---

## 8. Efí Bank (Pix) — webhooks

Acessar: Efí Dashboard → API → Webhooks (ou via API conforme docs Efí)

- [ ] Verificar endpoint atual de webhook Pix
- [ ] Atualizar para `api.gymflowgestor.com.br/webhooks/efi` (ou nome real da rota)
- [ ] Efí exige **mTLS** com certificado — pode precisar reupload do .p12 ou nova configuração de cert
- [ ] Testar: gerar cobrança Pix sandbox → confirmar callback recebido

---

## 9. UltraMsg / Evolution / Baileys — WhatsApp

> Stack atual ambígua: `.env.example` lista Evolution API, mas `devops.md` descreve Baileys local via Cloudflare Tunnel. **Confirmar com Backend agent antes de mexer.**

Se for UltraMsg/Evolution:
- [ ] Painel da instância `gymflow` → Webhook URL → `https://api.gymflowgestor.com.br/webhooks/whatsapp`
- [ ] Não precisa recriar instância — só trocar callback

Se for Baileys + Cloudflare Tunnel:
- [ ] Tunnel já está rodando local → URL do tunnel não muda
- [ ] Mas se backend Fastify mudar a rota pública, atualizar `WA_LOCAL_SERVER` em Railway

---

## 10. Google OAuth (se houver login social)

Acessar: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

- [ ] **Authorized JavaScript origins** — adicionar (não remover antigos ainda):
  - `https://gymflowgestor.com.br`
- [ ] **Authorized redirect URIs** — adicionar:
  - `https://gymflowgestor.com.br/api/auth/callback/google`
  - `https://gymflowgestor.com.br/auth/callback`
  - (qualquer outro callback que o app usa)
- [ ] Salvar
- [ ] Após cutover + 30d de coexistência: remover URLs antigas

---

## 11. Supabase Auth

Acessar: Supabase Dashboard → Project `gfxjehsjwwtlrhcjvkfr` → Authentication → URL Configuration

- [ ] **Site URL**: `https://gymflowgestor.com.br`
- [ ] **Redirect URLs** (additional allowed) — adicionar:
  - `https://gymflowgestor.com.br/**`
  - `https://gymflowgestor.com.br/auth/callback`
  - Manter `https://web-gules-phi-97.vercel.app/**` por 30d como fallback
- [ ] Salvar

> Supabase **URL do projeto** (`gfxjehsjwwtlrhcjvkfr.supabase.co`) **NÃO muda**. É serviço gerenciado.

---

## 12. Mobile (Expo)

> Fora do escopo direto do OPS, mas para coordenação:

- [ ] Atualizar `apps/mobile/.env.example` e `app.json`/`eas.json` para `EXPO_PUBLIC_API_URL=https://api.gymflowgestor.com.br`
- [ ] Build novo via EAS (OTA update não pega env vars de build)
- [ ] Submeter à App Store / Play Store (revisão pode demorar 2-7 dias)

---

## 13. Smoke tests pós-cutover

Após cada cutover, verificar:

- [ ] `curl https://api.gymflowgestor.com.br/health` → 200 OK
- [ ] `curl -I https://gymflowgestor.com.br` → 200 OK, certificado válido
- [ ] `curl -I https://gymflowgestor.com` → 301 → `.com.br`
- [ ] Login no web (Supabase auth flow)
- [ ] Pagamento sandbox (Stripe + Pix)
- [ ] Webhook Stripe "Send test event" → 200 no Railway logs
- [ ] Email transacional disparado → chega no inbox (não spam)
- [ ] Reconhecimento facial via terminal `/acesso/[slug]/` → funciona
- [ ] WhatsApp notification enviada → recebida

---

## 14. Comunicação com clientes

- [ ] **Email formal** (D-7): "GYMFLOW agora é GymFlow Gestor. A partir de DD/MM, acesse pelo `gymflowgestor.com.br`."
- [ ] **WhatsApp broadcast** (D-1): lembrete curto
- [ ] **Banner no app** (D-7 a D+30): "Estamos com novo nome e endereço. [Saiba mais]"
- [ ] Atualizar perfis sociais (Instagram, LinkedIn etc) — handle, bio, link

---

## 15. Desativação do antigo (D+60)

- [ ] Stripe: deletar webhook antigo `gymflow-production-abf9...`
- [ ] Efí: deletar endpoint antigo
- [ ] Google OAuth: remover URLs antigas
- [ ] Supabase: remover redirect antigos
- [ ] Resend: remover domínio `gymflow.com.br` (se existia)
- [ ] Vercel: domínios `web-gules-phi-97.vercel.app` **não pode** ser removido (é a URL native) — só ignorar
- [ ] Railway: idem para `gymflow-production-abf9.up.railway.app`

---

## ⚠️ Pendências para outros agentes

### Backend agent (`.docs/agents/backend.md`)
URLs **hardcoded em código** que precisam ser revistas — fallbacks devem apontar para nova URL canônica ou serem removidos (env var deve sempre estar definida em prod):

- `apps/api/src/server.ts:36` — CORS allowlist (`web-gules-phi-97.vercel.app` → adicionar `gymflowgestor.com.br`)
- `apps/api/src/modules/auth/auth.routes.ts:7` — fallback `WEB_URL`
- `apps/api/src/modules/billing/billing.routes.ts:13` — fallback `WEB_URL`
- `apps/api/src/modules/pagamentos/pagamentos.service.ts:5` — fallback `WEB_URL`

### Frontend agent (`.docs/agents/frontend.md`)
- `apps/web/lib/api.ts:10` — fallback `NEXT_PUBLIC_API_URL`
- `apps/web/app/layout.tsx:9` — fallback `metadataBase`
- `apps/web/app/(marketing)/pagamento-sucesso/page.tsx:16` — **URL hardcoded em `fetch()`** (bug — usar env var)
- `apps/web/app/(admin)/admin/sistema/page.tsx:22-23` — URLs exibidas no admin (texto puro, atualizar)

---

## 📞 Rollback de emergência

Se algo crítico quebrar pós-cutover:

1. **DNS**: Cloudflare Dashboard → DNS → mudar A/CNAME de volta para URLs Vercel/Railway native. Propagação ~5min com TTL baixo.
2. **Env vars**: Vercel/Railway → reverter `NEXT_PUBLIC_API_URL` / `API_URL` / `WEB_URL` para URLs native → redeploy.
3. **Webhooks**: se webhook antigo ainda existe (Option A do passo 7/8), ele continua funcionando — basta desativar o novo se estiver causando erros.

**Tempo total de rollback estimado: 10-15 min.**
