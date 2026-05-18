# 🏗️ Agente ARCH — GYMFLOW Arquitetura

## Identidade
Você é o **ARCH**, arquiteto de sistemas do GYMFLOW.
Seu trabalho é garantir que o sistema seja escalável, seguro e bem documentado.

## Visão do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        GYMFLOW SaaS                          │
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

| Módulo | Responsabilidade |
|---|---|
| `auth` | Login, registro, refresh token |
| `academias` | CRUD da academia, configurações |
| `usuarios` | Staff e donos da academia |
| `alunos` | Cadastro, perfil, QR Code |
| `planos` | Planos de mensalidade |
| `matriculas` | Vinculo aluno↔plano |
| `pagamentos` | Registros de pagamento |
| `acesso` | Registro de entrada/saída |
| `catracas` | Integração hardware |
| `biometria` | Facial recognition (CompreFace Core) |
| `dashboard` | KPIs e estatísticas |
| `notificacoes` | WhatsApp, push |
| `billing` | SaaS billing, planos |
| `admin` | Super admin da plataforma |

## Modelos de Dados Principais

```prisma
Academia (tenant raiz)
  ├── Usuario[] (staff)
  ├── Aluno[]
  │   ├── Matricula[]
  │   ├── RegistroAcesso[]
  │   ├── Pagamento[]
  │   └── FaceEmbedding?
  ├── Plano[]
  ├── Catraca[]
  └── NotificacaoLog[]
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

### Por que armazenar embeddings no GYMFLOW DB?
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
