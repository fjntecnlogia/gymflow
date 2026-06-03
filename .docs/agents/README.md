# 🏋️ GymFlow Gestor — Guias de Agentes Especializados

Cada agente tem sua área de responsabilidade e um guia dedicado.
Ao abrir qualquer serviço no Claude Code, o CLAUDE.md da pasta é carregado automaticamente.

## Agentes do Projeto

| Agente | Área | Pasta | CLAUDE.md | Guia |
|---|---|---|---|---|
| 🔵 **DEX Backend** | API, DB, integrações | `apps/api/` | ✅ existe | [→ backend.md](./backend.md) |
| 🟢 **DEX Frontend** | Next.js, UI, dashboard | `apps/web/` | ✅ existe | [→ frontend.md](./frontend.md) |
| 📱 **DEX Mobile** | React Native, app aluno | `apps/mobile/` | ✅ existe | [→ mobile.md](./mobile.md) |
| ⚙️ **OPS** | Railway, Vercel, CI/CD | raiz | ✅ (usa raiz) | [→ devops.md](./devops.md) |
| 🎨 **UX** | Design system, componentes | `apps/web/` | ✅ (usa web) | [→ ux.md](./ux.md) |
| 📣 **COPY** | Marketing, landing, SaaS | `apps/web/(marketing)/` | ✅ (usa web) | [→ marketing.md](./marketing.md) |
| 🏗️ **ARCH** | Arquitetura, decisões | monorepo | ✅ (usa raiz) | [→ architecture.md](./architecture.md) |

## Como usar

1. Abra a pasta do serviço no Claude Code (ex: `apps/api/`)
2. O CLAUDE.md é carregado automaticamente com contexto do agente
3. No início de cada sessão confirme: *"Leia o CLAUDE.md e confirme sua especialidade"*
4. Para detalhes completos, o CLAUDE.md aponta para o guia em `.docs/agents/`

## Estado dos Módulos Backend (atualizado 2026-06)

| Módulo | Pasta | Status |
|---|---|---|
| `academias` | ✅ | CRUD do tenant raiz |
| `acesso` | ✅ | QR Code + biometria |
| `admin` | ✅ | Super admin SaaS |
| `agendamentos` | ✅ | Leads de demo (público) |
| `alunos` | ✅ | Cadastro + perfil |
| `auth` | ✅ | Supabase JWT |
| `billing` | ✅ | Stripe/SaaS |
| `biometria` | ✅ | CompreFace Core |
| `catracas` | ✅ | Hardware |
| `dashboard` | ✅ | KPIs |
| `notificacoes` | ✅ | WhatsApp |
| `pagamentos` | ✅ | Financeiro |
| `planos` | ✅ | Mensalidades |

> ⚠️ `usuarios` e `matriculas` **não são módulos separados** — estão integrados nos módulos `academias/auth` e `alunos/planos`.

## Regras Globais

- **Idioma**: Todo código em inglês, comentários e commits em português
- **Deploy**: Backend → Railway auto-deploy | Frontend+Mobile → Vercel/EAS
- **Segredos**: Nunca commitar `.env`, senhas ou tokens
- **Multi-tenant**: sempre filtrar por `academiaId`
- **Mobile**: somente app do **aluno** — admin é exclusivo do web
