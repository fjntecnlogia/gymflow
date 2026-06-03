import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'
import {
  criarCheckoutAssinatura,
  criarCheckoutPublico,
  criarPortalCliente,
  verificarWebhook,
  obterMRR,
  PLANO_VALORES,
} from '../../integrations/stripe'
import { gerarTokenPrimeiroAcesso } from '../auth/auth.service'
import {
  enviarEmail,
  templatePrimeiroAcesso,
  templateNovaVendaAdmin,
} from '../../integrations/email'
import { z } from 'zod'

const WEB_URL = process.env.WEB_URL ?? 'https://web-gules-phi-97.vercel.app'
const ADMIN_LEAD_EMAIL = process.env.ADMIN_LEAD_EMAIL ?? 'contato@gymflowgestor.com.br'

/**
 * Gera um slug único pra academia a partir do nome.
 * Remove acentos, vira lowercase, sufixa com timestamp curto pra evitar colisões.
 */
function gerarSlug(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'academia'
  const sufixo = Date.now().toString(36).slice(-5)
  return `${base}-${sufixo}`
}

export async function billingRoutes(app: FastifyInstance) {
  // ─── Webhook Stripe (sem auth) ────────────────────────────────────────────
  app.post('/webhook', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string

    let event: any
    try {
      event = verificarWebhook(
        (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body)),
        sig,
      )
    } catch (err: any) {
      return reply.status(400).send({ error: `Webhook error: ${err.message}` })
    }

    const data = event.data.object as any
    const academiaId = data.metadata?.academiaId ?? data.subscription_data?.metadata?.academiaId

    switch (event.type) {
      // Assinatura ativada (após trial ou pagamento confirmado)
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        if (!academiaId) break
        const plano = data.metadata?.plano as any
        const status = data.status === 'active' || data.status === 'trialing' ? 'ATIVO' : 'INADIMPLENTE'

        await prisma.academia.update({
          where: { id: academiaId },
          data: {
            status: status as any,
            planoSaas: plano ?? 'STARTER',
            configuracoes: {
              ...(await prisma.academia.findUnique({ where: { id: academiaId } }))?.configuracoes as any,
              stripeCustomerId: data.customer,
              stripeSubscriptionId: data.id,
            },
          },
        })
        console.log(`Academia ${academiaId} → ${status} (${plano})`)
        break
      }

      // Pagamento falhou
      case 'invoice.payment_failed': {
        if (!academiaId) break
        await prisma.academia.update({
          where: { id: academiaId },
          data: { status: 'INADIMPLENTE' },
        })
        console.log(`Academia ${academiaId} → INADIMPLENTE (pagamento falhou)`)
        break
      }

      // Assinatura cancelada
      case 'customer.subscription.deleted': {
        if (!academiaId) break
        await prisma.academia.update({
          where: { id: academiaId },
          data: { status: 'CANCELADO' },
        })
        console.log(`Academia ${academiaId} → CANCELADO`)
        break
      }

      // Checkout completado (início da assinatura)
      case 'checkout.session.completed': {
        // CASO 1 — Signup PÚBLICO (source: 'public_signup' do /billing/checkout-publico).
        // Não existe academia ainda — criamos agora.
        if (data.metadata?.source === 'public_signup' && data.mode === 'subscription') {
          const plano = (data.metadata.plano ?? 'STARTER') as 'STARTER' | 'PRO' | 'ENTERPRISE'
          const email = data.metadata.email as string
          const nomeAcademia = (data.metadata.nomeAcademia ?? 'Minha Academia') as string
          const nomeContato = (data.metadata.nomeContato ?? email) as string

          try {
            // Transação: se Usuario falhar, Academia é revertida (sem órfãs)
            const { academia, usuario } = await prisma.$transaction(async (tx) => {
              const academia = await tx.academia.create({
                data: {
                  nome: nomeAcademia,
                  email,
                  slug: gerarSlug(nomeAcademia),
                  planoSaas: plano,
                  status: 'ATIVO',
                  configuracoes: {
                    stripeCustomerId: data.customer,
                    stripeSubscriptionId: data.subscription,
                    source: 'public_signup',
                  },
                },
              })
              const usuario = await tx.usuario.create({
                data: {
                  academiaId: academia.id,
                  supabaseId: null,
                  nome: nomeContato,
                  email,
                  role: 'DONO',
                  ativo: true,
                },
              })
              return { academia, usuario }
            })

            // Gera token único pra primeiro acesso (expira em 7 dias)
            const tokenPrimeiroAcesso = await gerarTokenPrimeiroAcesso(usuario.id)

            // Atualiza Stripe customer com academiaId agora que existe
            // (usamos require dinâmico pra evitar import circular)
            const { stripe } = await import('../../integrations/stripe')
            await stripe.customers.update(data.customer, {
              metadata: { academiaId: academia.id, plano, source: 'public_signup' },
            }).catch((err: any) => console.error('[Billing] update customer meta:', err?.message))

            // E-mails fire-and-forget — não bloqueiam a resposta do webhook
            const linkPrimeiroAcesso = `${WEB_URL}/criar-senha?token=${tokenPrimeiroAcesso}`
            enviarEmail({
              to: email,
              subject: '✅ Bem-vindo(a) ao GymFlow Gestor — crie sua senha',
              html: templatePrimeiroAcesso({
                nomeContato,
                nomeAcademia,
                plano,
                link: linkPrimeiroAcesso,
              }),
            }).catch((e) => console.error('[Billing] email cliente:', e?.message))

            enviarEmail({
              to: ADMIN_LEAD_EMAIL,
              subject: `💰 Nova venda: ${nomeAcademia} (${plano})`,
              html: templateNovaVendaAdmin({
                nomeContato,
                nomeAcademia,
                email,
                plano,
                valor: PLANO_VALORES[plano],
                stripeSessionId: data.id,
              }),
              replyTo: email,
            }).catch((e) => console.error('[Billing] email admin:', e?.message))

            console.log(`[Billing] signup público OK: academia=${academia.id} email=${email} plano=${plano}`)
          } catch (err: any) {
            console.error('[Billing] FALHA signup público:', err?.message, err?.stack?.slice(0, 400))
            // Não retornamos 500 — Stripe retentaria. O webhook é idempotente.
          }
          break
        }

        // CASO 2 — Academia EXISTENTE iniciando/trocando assinatura
        const acadId = data.metadata?.academiaId
        if (!acadId) break
        if (data.mode === 'subscription') {
          await prisma.academia.update({
            where: { id: acadId },
            data: {
              status: 'ATIVO',
              planoSaas: data.metadata?.plano ?? 'STARTER',
              trialExpiraEm: null,
            },
          })
        }
        break
      }
    }

    return reply.status(200).send({ received: true })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // ENDPOINT DE TESTE — simula uma compra sem passar pelo Stripe.
  // Executa exatamente a mesma lógica do webhook checkout.session.completed
  // (cria academia + usuário + token primeiro acesso + dispara emails).
  // Protegido por X-Test-Key — REMOVER em produção real depois de validar.
  // ──────────────────────────────────────────────────────────────────────────
  app.post('/simular-compra', async (req, reply) => {
    if (req.headers['x-test-key'] !== 'gymflow-test-2026') {
      return reply.status(403).send({ error: 'forbidden' })
    }
    const body = z.object({
      plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
      email: z.string().trim().toLowerCase().email('E-mail inválido'),
      nomeAcademia: z.string().trim().min(2).max(120),
      nomeContato: z.string().trim().min(2).max(120),
    }).parse(req.body)

    // Se existe academia ÓRFÃ (sem usuário, source=simulated_signup), deleta antes.
    // Útil pra retry depois de teste anterior falhar.
    const existente = await prisma.academia.findUnique({
      where: { email: body.email },
      include: { usuarios: { select: { id: true } } },
    })
    if (existente) {
      const cfg = existente.configuracoes as any
      const orfã = existente.usuarios.length === 0 && cfg?.source?.includes('simulated')
      if (orfã) {
        await prisma.academia.delete({ where: { id: existente.id } })
        console.log(`[SIM] academia órfã deletada (retry): ${existente.id}`)
      } else {
        return reply.status(409).send({
          error: 'Já existe academia ativa com esse e-mail. Use outro pra simular.',
          academiaExistente: { id: existente.id, slug: existente.slug, status: existente.status },
        })
      }
    }

    try {
      // Transação atômica — se Usuario falhar, Academia é revertida.
      const { academia, usuario } = await prisma.$transaction(async (tx) => {
        const academia = await tx.academia.create({
          data: {
            nome: body.nomeAcademia,
            email: body.email,
            slug: gerarSlug(body.nomeAcademia),
            planoSaas: body.plano,
            status: 'ATIVO',
            configuracoes: {
              stripeCustomerId: 'TEST_SIMULATED',
              stripeSubscriptionId: 'TEST_SIMULATED',
              source: 'simulated_signup',
            },
          },
        })
        const usuario = await tx.usuario.create({
          data: {
            academiaId: academia.id,
            supabaseId: null,
            nome: body.nomeContato,
            email: body.email,
            role: 'DONO',
            ativo: true,
          },
        })
        return { academia, usuario }
      })

      // Gera token primeiro acesso
      const tokenPrimeiroAcesso = await gerarTokenPrimeiroAcesso(usuario.id)
      const linkPrimeiroAcesso = `${WEB_URL}/criar-senha?token=${tokenPrimeiroAcesso}`

      // E-mails fire-and-forget (mesma lógica do webhook)
      const planoUpper = body.plano
      enviarEmail({
        to: body.email,
        subject: '✅ Bem-vindo(a) ao GymFlow Gestor — crie sua senha',
        html: templatePrimeiroAcesso({
          nomeContato: body.nomeContato,
          nomeAcademia: body.nomeAcademia,
          plano: planoUpper,
          link: linkPrimeiroAcesso,
        }),
      }).catch((e) => console.error('[SIM] email cliente:', e?.message))

      enviarEmail({
        to: ADMIN_LEAD_EMAIL,
        subject: `💰 [SIMULADA] Nova venda: ${body.nomeAcademia} (${planoUpper})`,
        html: templateNovaVendaAdmin({
          nomeContato: body.nomeContato,
          nomeAcademia: body.nomeAcademia,
          email: body.email,
          plano: planoUpper,
          valor: PLANO_VALORES[planoUpper],
          stripeSessionId: 'simulada',
        }),
        replyTo: body.email,
      }).catch((e) => console.error('[SIM] email admin:', e?.message))

      console.log(`[SIM] compra simulada OK: academia=${academia.id} email=${body.email}`)

      return reply.status(201).send({
        ok: true,
        academiaId: academia.id,
        usuarioId: usuario.id,
        slug: academia.slug,
        linkPrimeiroAcesso,
        message: 'Academia criada. Confere seu e-mail OU usa o link diretamente.',
      })
    } catch (err: any) {
      console.error('[SIM] falha:', err?.message, err?.stack?.slice(0, 300))
      return reply.status(500).send({
        error: err?.message ?? 'erro inesperado',
        stack: err?.stack?.slice(0, 300),
      })
    }
  })

  // ─── Checkout PÚBLICO (sem auth) ─────────────────────────────────────────
  //
  // Usado por cliente novo em /planos-saas que decidiu comprar sem demo.
  // Cria Stripe Checkout Session — academia + usuário são criados no webhook
  // checkout.session.completed quando metadata.source === 'public_signup'.
  app.post('/checkout-publico', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '5 minutes',
        keyGenerator: (req) => req.ip,
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Muitas tentativas. Aguarde alguns minutos.',
        }),
      },
    },
  }, async (req, reply) => {
    const body = z.object({
      plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
      email: z.string().trim().toLowerCase().email('E-mail inválido'),
      nomeAcademia: z.string().trim().min(2, 'Nome da academia muito curto').max(120),
      nomeContato: z.string().trim().min(2, 'Nome do contato muito curto').max(120),
    }).parse(req.body)

    // Bloqueia se já existe academia com esse e-mail (evita conta duplicada)
    const existente = await prisma.academia.findUnique({ where: { email: body.email } })
    if (existente) {
      return reply.status(409).send({
        error: 'Já existe uma conta com este e-mail. Faça login em vez de criar nova.',
      })
    }

    const checkout = await criarCheckoutPublico({
      plano: body.plano,
      email: body.email,
      nomeAcademia: body.nomeAcademia,
      nomeContato: body.nomeContato,
      successUrl: `${WEB_URL}/assinatura-sucesso`,
      cancelUrl: `${WEB_URL}/planos-saas`,
    })

    return { url: checkout.url, sessionId: checkout.sessionId }
  })

  // ─── Rotas protegidas (preHandler por rota — não usar addHook global aqui,
  //     porque ele se aplicaria também a /webhook e /checkout-publico) ────────

  // Criar checkout de assinatura
  app.post('/checkout', { preHandler: authMiddleware }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { plano } = z.object({ plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']) }).parse(req.body)

    const academia = await prisma.academia.findUnique({ where: { id: academiaId } })
    if (!academia) return reply.status(404).send({ error: 'Academia não encontrada' })

    const checkout = await criarCheckoutAssinatura({
      academiaId,
      academiaEmail: academia.email,
      academiaNome: academia.nome,
      plano,
      successUrl: `${WEB_URL}/assinatura-sucesso`,
      cancelUrl: `${WEB_URL}/planos-saas`,
    })

    return { url: checkout.url, sessionId: checkout.sessionId }
  })

  // Portal de gerenciamento da assinatura
  app.get('/portal', { preHandler: authMiddleware }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const academia = await prisma.academia.findUnique({ where: { id: academiaId } })
    const cfg = academia?.configuracoes as any
    const customerId = cfg?.stripeCustomerId

    if (!customerId) {
      return reply.status(400).send({ error: 'Sem assinatura ativa. Assine um plano primeiro.' })
    }

    const url = await criarPortalCliente(customerId, `${WEB_URL}/configuracoes`)
    return { url }
  })

  // Status da assinatura atual
  app.get('/status', { preHandler: authMiddleware }, async (req) => {
    const academiaId = (req as any).academiaId
    const academia = await prisma.academia.findUnique({ where: { id: academiaId } })
    const cfg = academia?.configuracoes as any

    return {
      plano: academia?.planoSaas ?? 'STARTER',
      status: academia?.status,
      stripeCustomerId: cfg?.stripeCustomerId ?? null,
      stripeSubscriptionId: cfg?.stripeSubscriptionId ?? null,
      valor: PLANO_VALORES[academia?.planoSaas ?? 'STARTER'],
    }
  })

  // MRR para admin SaaS
  app.get('/mrr', { preHandler: authMiddleware }, async (req, reply) => {
    const role = (req as any).role
    if (role !== 'SUPER_ADMIN') return reply.status(403).send({ error: 'Apenas admins' })
    return obterMRR()
  })
}
