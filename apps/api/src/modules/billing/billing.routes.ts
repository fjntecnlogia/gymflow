import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'
import {
  criarCheckoutAssinatura,
  criarPortalCliente,
  verificarWebhook,
  obterMRR,
  PLANO_VALORES,
} from '../../integrations/stripe'
import { z } from 'zod'

const WEB_URL = process.env.WEB_URL ?? 'https://web-gules-phi-97.vercel.app'

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

  // ─── Rotas protegidas ────────────────────────────────────────────────────
  app.addHook('onRequest', authMiddleware)

  // Criar checkout de assinatura
  app.post('/checkout', async (req, reply) => {
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
  app.get('/portal', async (req, reply) => {
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
  app.get('/status', async (req) => {
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
  app.get('/mrr', async (req, reply) => {
    const role = (req as any).role
    if (role !== 'SUPER_ADMIN') return reply.status(403).send({ error: 'Apenas admins' })
    return obterMRR()
  })
}
