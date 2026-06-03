# GymFlow Gestor Mobile — Mobile Agent Context

Você está trabalhando no **app mobile do GymFlow Gestor**.
Leia o guia completo em: `../../.docs/agents/mobile.md`

## Contexto Rápido
- **Stack**: Expo 51 + Expo Router 3.5 + React Native 0.74.1
- **API (canônico)**: `https://api.gymflowgestor.com.br`
- **API (Railway native)**: `https://gymflow-production-abf9.up.railway.app` — fallback
- **Deploy**: EAS Build (Expo Application Services)
- **Auth**: Supabase JS direto no app (`@supabase/supabase-js`)

## Estrutura do App
```
apps/mobile/
├── app/
│   ├── _layout.tsx          ← root layout (Supabase auth guard)
│   ├── (auth)/
│   │   ├── login.tsx        ← tela de login do aluno
│   │   └── cadastro.tsx     ← cadastro
│   └── (tabs)/
│       ├── index.tsx        ← home / dashboard do aluno
│       ├── qrcode.tsx       ← QR Code de acesso à catraca
│       ├── plano.tsx        ← plano ativo + pagamentos
│       ├── perfil.tsx       ← perfil do aluno
│       └── agenda.tsx       ← agenda / horários
├── components/
│   ├── shared/              ← componentes compartilhados
│   └── ui/                  ← componentes base de UI
├── lib/
│   └── api.ts               ← instância Axios configurada
├── stores/
│   └── auth.store.ts        ← Zustand store de autenticação
└── hooks/                   ← hooks customizados
```

## Regras desta pasta
1. **Somente app do ALUNO** — não mexer em nada de admin/staff
2. Navegação via Expo Router (file-based routing)
3. Estado global via Zustand (`stores/auth.store.ts`)
4. HTTP via `lib/api.ts` (já configurado com token do aluno)
5. Auth via Supabase JS — não inventar auth próprio
6. Sempre usar `expo-haptics` para feedback tátil em ações
7. Ícones via `lucide-react-native`

## Telas existentes
| Tela | Arquivo | Função |
|---|---|---|
| Home | `(tabs)/index.tsx` | Dashboard do aluno |
| QR Code | `(tabs)/qrcode.tsx` | QR Code para catraca |
| Plano | `(tabs)/plano.tsx` | Plano ativo + pagamentos |
| Perfil | `(tabs)/perfil.tsx` | Dados do aluno |
| Agenda | `(tabs)/agenda.tsx` | Horários das turmas |
| Login | `(auth)/login.tsx` | Login com email/senha |
| Cadastro | `(auth)/cadastro.tsx` | Cadastro novo aluno |

## Não tocar sem consultar ARCH
- `app/_layout.tsx` — root layout e guard de auth
- `lib/api.ts` — configuração do Axios
- `stores/auth.store.ts` — store de autenticação
