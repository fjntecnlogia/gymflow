# 🏋️ GYMFLOW — Guias de Agentes Especializados

Cada agente tem sua área de responsabilidade e um guia dedicado.
Ao abrir qualquer serviço no Claude Code, o CLAUDE.md da pasta é carregado automaticamente.

## Agentes do Projeto

| Agente | Área | Pasta | Guia |
|---|---|---|---|
| 🔵 **DEX Backend** | API, DB, integrações | `apps/api/` | [→ backend.md](./backend.md) |
| 🟢 **DEX Frontend** | Next.js, UI, dashboard | `apps/web/` | [→ frontend.md](./frontend.md) |
| 📱 **DEX Mobile** | React Native, app aluno | `apps/mobile/` | [→ mobile.md](./mobile.md) |
| ⚙️ **OPS** | Railway, Vercel, CI/CD | raiz + infra | [→ devops.md](./devops.md) |
| 🎨 **UX** | Design system, componentes | `apps/web/` | [→ ux.md](./ux.md) |
| 📣 **COPY** | Marketing, landing, SaaS | `apps/web/(marketing)/` | [→ marketing.md](./marketing.md) |
| 🏗️ **ARCH** | Arquitetura, decisões | monorepo | [→ architecture.md](./architecture.md) |

## Como usar

1. Abra a pasta do serviço no Claude Code
2. O CLAUDE.md é carregado automaticamente com contexto do agente
3. Use os comandos específicos de cada guia

## Regras Globais

- **Idioma**: Todo código em inglês, comentários e commits em português
- **Testes**: Sempre testar antes de marcar como feito
- **Deploy**: Backend → Railway auto-deploy | Frontend → Vercel auto-deploy
- **Segredos**: Nunca commitar .env, senhas ou tokens
