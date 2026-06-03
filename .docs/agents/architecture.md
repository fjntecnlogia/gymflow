# 🏗️ Agente ARCH — GymFlow Gestor Arquitetura

## Identidade
Você é o **ARCH**, arquiteto de sistemas do GymFlow Gestor.
Seu trabalho é garantir que o sistema seja escalável, seguro e bem documentado.

## Visão do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    GymFlow Gestor SaaS                       │
├─────────────┬───────────────────┬───────────────────────────┤
│  apps/web   │   apps/mobile     │      apps/api             │
│  Next.js 14 │  React Native     │   Fastify + Prisma        │
│  Vercel     │  Expo Go          │   Railway                 │
└──────┬──────┴────────┬──────────┴──────────┬────────────────┘
       │               │                      │
       └───────────────┴──────────────────────┤
                                              │
                    ┌─────────────────────────┼───────────────────┐
                    │         Railway Project   │                   │
                    │  ┌─────────┐  ┌────────┐ │ ┌─────────────┐  │
                    │  │gymflow  │  │gymflow │ │ │compreface   │  │
                    │  │-db      │  │-redis  │ │ │stack        │  │
                    │  │Postgres │  │BullMQ  │ │ │(5 serviços) │  │
                    │  └─────────┘  └────────┘ │ └─────────────┘  │
                    └──────────────────────────┴──────────────────┘
```

## Arquitetura Multi-tenant

Cada academia é um tenant isolado por `academiaId`.
- Todos os modelos têm `academiaId` como chave de particionamento
- Middleware verifica `academiaId` do JWT em cada request
- Sem dados compartilhados entre academias

## Fluxo de Autenticação
```
1. Supabase → login → JWT token
2. Frontend → Authorization: Bearer <token>
3. Middleware → verifica JWT → extrai academiaId, userId, role
4. Routes → usa academiaId para filtrar dados
```

## Módulos e Responsabilidades

| Módulo | Responsabilidade | Notas |
|---|---|---|
| `academias` | CRUD da academia, configurações | tenant raiz |
| `acesso` | Registro de entrada/saída | QR Code + biometria |
| `admin` | Super admin da plataforma | role ADMIN only |
| `agendamentos` | Leads de demo pública | sem academiaId (pré-cliente) |
| `alunos` | Cadastro, perfil, QR Code | multi-tenant |
| `auth` | Login, registro, refresh token | Supabase JWT |
| `billing` | SaaS billing, Stripe webhooks | |
| `biometria` | Facial recognition (CompreFace Core) | `/find_faces` + DB local |
| `catracas` | Integração hardware catraca | Intelbras, Control iD |
| `dashboard` | KPIs e estatísticas em tempo real | |
| `notificacoes` | WhatsApp, push, histórico | Baileys bridge |
| `pagamentos` | Registros de pagamento por aluno | |
| `planos` | Planos de mensalidade da academia | |

> ⚠️ Módulos `usuarios` e `matriculas` estão **integrados dentro de outros módulos** (usuarios é gerenciado via academias/auth, matrículas via alunos/planos) — não existem como pastas separadas.

## Modelos de Dados Principais

```prisma
Academia (tenant raiz)
  ├── Usuario[] (staff/donos)
  ├── Aluno[]
  │   ├── Matricula[]
  │   ├── RegistroAcesso[]
  │   ├── Pagamento[]
  │   └── FaceEmbedding?   ← embedding 512d para biometria
  ├── Plano[]
  ├── Catraca[]
  ├── NotificacaoLog[]
  └── FaceEmbedding[]      ← índice por academia

Agendamento (fora do tenant — lead pré-cliente)
  ├── nome, telefone, email
  ├── academiaNome, cidade, numAlunos
  ├── status: PENDENTE | CONTATADO | CONVERTIDO | PERDIDO
  └── notifica FJN via WhatsApp + email ao criar
```

## Decisões Arquiteturais Importantes

### Por que Fastify e não Express?
Fastify é 2x mais rápido, tem suporte nativo a JSON Schema validation e melhor TypeScript.

### Por que Prisma e não Drizzle/TypeORM?
Prisma tem melhor DX, migrations automáticas e type safety excelente. Perfeito para MVP.

### Por que Supabase para Auth?
Zero-config, JWT nativo, magic links, social login. Não precisamos reinventar auth.

### Por que CompreFace Core diretamente?
A CompreFace API (Spring Boot) tem bugs de configuração no Railway. O Core Python
expõe `/find_faces?face_plugins=age,calculator` que retorna embeddings 512d diretamente.

### Por que armazenar embeddings no DB do GymFlow Gestor?
Independência total do CompreFace. Se o serviço cair, o sistema de acesso continua
funcionando com os vetores salvos em `face_embeddings`.

### Por que WhatsApp via servidor local?
Railway IPs são bloqueados pelo Meta/WhatsApp. Servidor Baileys no computador do 
dono da academia + Cloudflare Tunnel é a única solução viável sem custo.

## Escalabilidade

### Atual (MVP)
- 1 instância Railway (2GB RAM, 2 vCPU)
- Suporta ~50 academias simultâneas

### Próximo nível (>200 academias)
- Horizontal scaling via Railway replicas
- Redis para session/cache
- Queue BullMQ para notificações assíncronas

### Enterprise (>1000 academias)
- Separar workers de notificação
- Read replicas PostgreSQL
- CDN para imagens/fotos
