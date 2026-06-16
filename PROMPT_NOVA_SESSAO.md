# 🪄 Prompt pra Nova Sessão Claude (GymFlow)

> Cola o texto abaixo no início de uma nova janela do Claude pra retomar
> exatamente de onde paramos no GymFlow Gestor.

---

```
Sou o cliente do projeto GymFlow Gestor (SaaS de gestão pra academias da FJN
Tecnologia). Trabalhei várias sessões com você nesse projeto e agora preciso
continuar em uma janela nova.

Antes de qualquer coisa, leia OS DOIS DOCUMENTOS DE HANDOFF no repositório:

1. SESSION_HANDOFF.md (em G:\Meu Drive\Controle de Clientes FJN\clientes\
   GYMFLOW\03_DESENVOLVIMENTO\gymflow\SESSION_HANDOFF.md)
   - Status geral, arquitetura, credenciais, implementações concluídas,
     pendências, comandos úteis.

2. MOBILE_MIGRATION_GUIDE.md (mesma pasta)
   - Plano de migração do app mobile (Supabase → JWT próprio).

Após ler, me responda só com:
"✅ Li o handoff. Estado atual: [resumo de 5 linhas]. Pronto. O que quer fazer?"

Algumas regras importantes pra essa sessão:
- Use Bash via Git Bash do Windows. Caminhos /g/Meu Drive/...
- Service Railway ATIVO é `gymflow` (NÃO `gymflow-api`)
- Deploy backend: `cd <root>/gymflow && railway up --service gymflow --detach`
- Deploy frontend: `git push origin main` (auto-deploy Vercel)
- Sempre confirme service Railway com `railway status` antes de deploy
- NÃO regenere JWT_SECRET no Railway (quebra sessões)
- Responda sempre em português brasileiro
- Trabalho é só em `apps/web` (frontend) e `apps/api` (backend Fastify)
- `apps/mobile` é outro time, NÃO toque

Estado da última sessão:
- ✅ Site no ar em www.gymflowgestor.com.br
- ✅ Stripe Checkout + Auth próprio (Postgres+JWT) + Resend emails
- ✅ CompreFace funcional com API Key real cadastrada
- ✅ Builds entregues:
    Build 1: Admin SaaS Financeiro (MRR, ARR, churn, top 10, em risco)
    Build 2: Tutorial onboarding (6 passos, flag persistente)
    Build 3: Financeiro gestor com aba Visão Geral (DRE, fluxo, MRR, inadimplentes)
- ✅ Google Analytics G-SRZ7HE1DVD instalado

Próximas coisas que posso querer fazer (apenas ideias, vai depender do que
eu trouxer agora):
- Persistir custos operacionais no DRE (tabela CustoOperacional)
- Exportar relatórios CSV/PDF do financeiro
- Régua de cobrança automática (1, 3, 7, 15 dias)
- Integração PIX automática (Efí Bank)
- Sistema de tickets de suporte no admin SaaS
- Sistema de notificações WhatsApp robusto
- Outras features ainda a definir

Aguarde minha próxima mensagem com o que quero atacar nessa sessão.
```

---

## 📋 Checklist antes de colar o prompt

- [ ] Confirma que `SESSION_HANDOFF.md` está atualizado (data 2026-06-04 ou +)
- [ ] Confirma que `MOBILE_MIGRATION_GUIDE.md` existe no repo
- [ ] Tem acesso ao Drive em `G:\Meu Drive\Controle de Clientes FJN\clientes\GYMFLOW\03_DESENVOLVIMENTO\gymflow\`
- [ ] Está logado no Railway CLI (`railway whoami` deve mostrar `fjntecnologia2022@gmail.com`)
- [ ] Está logado no GitHub CLI (`gh auth status`)

## 🪪 Onde estão os documentos atualizados

- Repo GitHub: https://github.com/fjntecnlogia/gymflow (branch main)
- Google Drive: pasta do projeto

## ⚠️ Coisas que estão pendentes pra resolver na próxima sessão

1. **Desabilitar TCP Proxy do compreface-db** (deixei aberto pra fazer INSERT da API Key — precisa fechar)
2. **Mobile** ainda não migrou do Supabase
3. **DMARC** no DNS Cloudflare ainda em `p=reject` (não crítico, mas recomendado relaxar pra `p=none`)
