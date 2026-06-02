# GymFlow Gestor Web — Frontend Agent Context

Você está trabalhando no **frontend Next.js do GymFlow Gestor**.
Leia o guia completo em: `../../.docs/agents/frontend.md`

## Contexto Rápido
- **Stack**: Next.js 14 App Router + Tailwind CSS
- **URL Produção (canônico)**: `https://gymflowgestor.com.br`
- **API (canônico)**: `https://api.gymflowgestor.com.br`
- **URL Vercel native**: `https://web-gules-phi-97.vercel.app` — fallback
- **Deploy**: Vercel auto-deploy no push para `main`

## Regras desta pasta
1. Tema dark: usar classes `card`, `input`, `gradient-btn` do globals.css
2. Cores: `text-cyan`, `text-green`, `text-orange`, `text-red`, `text-muted`
3. Auth via `@/lib/api` (já tem interceptor de token)
4. `'use client'` apenas quando necessário (preferir Server Components)
5. Ícones sempre do `lucide-react`

## Estrutura de Rotas
```
(auth)/          → login, registro
(dashboard)/     → área logada (requer JWT)
(admin)/admin/   → super admin SaaS (requer role ADMIN)
(marketing)/     → landing page pública
acesso/[slug]/   → terminais públicos (catraca biométrica)
```

## Componentes Prontos
- `FacialCamera` — câmera com overlay oval, captura e preview
- `CadastrarFaceModal` — modal completo de cadastro facial
- `AlunoModal` — criar/editar aluno
- `MatricularModal` — matricular aluno em plano

## Não tocar sem consultar ARCH
- `app/layout.tsx` — layout raiz
- `lib/api.ts` — configuração do Axios
- `app/globals.css` — design system global
