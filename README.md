# 🏋️ GymFlow Gestor — Sistema de Gestão para Academias

> SaaS completo para gestão de academias brasileiras: controle de acesso, financeiro, app do aluno e painel administrativo.

---

## 📁 Estrutura do Projeto

```
gymflow/                        ← Monorepo Turborepo
├── apps/
│   ├── api/                    ← Fastify API (Node.js)
│   ├── web/                    ← Next.js 14 (Dashboard + Landing)
│   └── mobile/                 ← React Native + Expo (App Aluno)
└── packages/
    ├── ui/                     ← Design system compartilhado
    ├── shared/                 ← Types e utilitários
    └── config/                 ← TSConfig base
```

---

## ⚡ Instalação Rápida

### Pré-requisitos
- Node.js 20+
- npm 10+
- PostgreSQL 16+ (ou conta Railway)
- Redis (ou conta Railway)

### Setup

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Linux / Mac:**
```bash
chmod +x setup.sh && ./setup.sh
```

### Depois do setup, preencha o `.env`:

```bash
# Mínimo obrigatório para rodar em dev
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_SERVICE_KEY="..."
JWT_SECRET="minimo-32-caracteres!!"
```

### Rodar em desenvolvimento

```bash
# Subir banco de dados (primeira vez)
npm run db:push

# Rodar todos os apps
npm run dev

# Apps disponíveis:
# Web:    http://localhost:3000
# API:    http://localhost:3001
# Docs:   http://localhost:3001/docs
# Mobile: expo start (QR Code para o dispositivo)
```

---

## 🔗 Serviços Externos

| Serviço | Uso | Link |
|---------|-----|------|
| **Supabase** | Auth (JWT) | supabase.com |
| **Railway** | Deploy API + DB + Redis | railway.app |
| **Vercel** | Deploy Web | vercel.com |
| **Efí Bank** | PIX automático | efipay.com.br |
| **Evolution API** | WhatsApp | evolution-api.com |
| **AWS Rekognition** | Biometria facial | aws.amazon.com |
| **Stripe** | Cartão recorrente | stripe.com |
| **Resend** | E-mail transacional | resend.com |

---

## 🗄️ Banco de Dados

```bash
# Aplicar schema (development)
npm run db:push

# Criar migration (production)
cd apps/api && npx prisma migrate dev --name init

# Abrir Prisma Studio (GUI)
npm run db:studio
```

### Entidades principais
- `Academia` — tenant raiz
- `Usuario` — dono/staff
- `Aluno` — perfil + QR token
- `Plano` — planos da academia
- `Matricula` — vínculo aluno+plano
- `RegistroAcesso` — log de entradas
- `Pagamento` — transações PIX/cartão
- `Catraca` — equipamentos físicos

---

## 🔌 APIs

### Autenticação
```
POST /auth/registrar-academia   → Criar academia + dono
POST /auth/registrar-aluno      → Criar aluno (app mobile)
GET  /auth/verificar-slug/:slug → Checar disponibilidade
```

### Alunos (protegido)
```
GET    /alunos              → Listar com filtros
GET    /alunos/:id          → Perfil completo
GET    /alunos/meu-perfil   → App mobile
GET    /alunos/:id/qrcode   → QR Code base64
POST   /alunos              → Criar
PUT    /alunos/:id          → Atualizar
PATCH  /alunos/:id/status   → Mudar status
```

### Acesso
```
POST /acesso/verificar              → Catraca física (sem auth)
GET  /acesso                        → Log de acessos
GET  /acesso/hoje                   → Stats do dia
POST /acesso/sincronizar-catraca/:id → Sync lista
```

### Pagamentos
```
GET  /pagamentos            → Listar
POST /pagamentos/cobrar     → Gerar PIX
GET  /pagamentos/resumo     → Financeiro do mês
POST /pagamentos/webhook/pix → Webhook Efí Bank
```

### Dashboard
```
GET /dashboard/kpis             → KPIs principais
GET /dashboard/acessos-por-dia  → Gráfico
GET /dashboard/ultimos-acessos  → Tempo real
```

### Admin SaaS
```
GET   /admin/overview           → Visão geral
GET   /admin/academias          → Todas academias
PATCH /admin/academias/:id/status → Ativar/bloquear
```

---

## 📱 App Mobile

```bash
cd apps/mobile
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios
```

**Telas:**
- Login / Cadastro
- Home (status do plano + check-ins)
- QR Code (acesso com timer 30s)
- Plano (histórico de pagamentos)
- Agenda (aulas do dia)
- Perfil

---

## 🚀 Deploy

### API (Railway)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e deploy
railway login
cd apps/api
railway up
```

### Web (Vercel)
```bash
npx vercel --cwd apps/web
```

### Variáveis de produção
Configure no painel do Railway/Vercel todas as variáveis do `.env.example`.

---

## 📊 Roadmap

| Fase | Status | Descrição |
|------|--------|-----------|
| MVP | ✅ Completo | Auth, CRUD, QR, Dashboard, PIX |
| Acesso & Cobrança | 🔄 Próximo | Catraca física, jobs automáticos, WhatsApp |
| Financeiro & Relatórios | 📋 Planejado | Gráficos, Stripe, Biometria |
| Escala & Admin | 📋 Planejado | Multi-unidades, API pública, White-label |

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Web | Next.js 14 + Tailwind CSS |
| Mobile | React Native + Expo SDK 51 |
| API | Fastify 4 + Zod |
| ORM | Prisma + PostgreSQL 16 |
| Auth | Supabase Auth |
| Filas | Bull MQ + Redis |
| Monorepo | Turborepo |

---

*GymFlow Gestor v1.0.0 — FJN Tecnologia · 2026*
