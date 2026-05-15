import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Mapa de planos SaaS → Price IDs do Stripe
export const STRIPE_PRICES: Record<string, string> = {
  STARTER:    process.env.STRIPE_PRICE_STARTER!,
  PRO:        process.env.STRIPE_PRICE_PRO!,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE!,
}

// Valores dos planos em R$
export const PLANO_VALORES: Record<string, number> = {
  STARTER: 197, PRO: 397, ENTERPRISE: 797,
}

// ─── Criar checkout de assinatura para nova academia ─────────────────────────
export async function criarCheckoutAssinatura(params: {
  academiaId: string
  academiaEmail: string
  academiaNome: string
  plano: 'STARTER' | 'PRO' | 'ENTERPRISE'
  successUrl: string
  cancelUrl: string
}) {
  const priceId = STRIPE_PRICES[params.plano]
  if (!priceId) throw new Error(`Plano ${params.plano} sem price ID configurado`)

  // Criar customer no Stripe
  const customer = await stripe.customers.create({
    email: params.academiaEmail,
    name: params.academiaNome,
    metadata: { academiaId: params.academiaId, plano: params.plano },
  })

  // Criar sessão de checkout para assinatura recorrente
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${params.successUrl}?session={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
    metadata: { academiaId: params.academiaId, plano: params.plano },
    subscription_data: {
      trial_period_days: 14, // 14 dias grátis
      metadata: { academiaId: params.academiaId, plano: params.plano },
    },
    allow_promotion_codes: true,
  })

  return {
    sessionId: session.id,
    url: session.url!,
    customerId: customer.id,
  }
}

// ─── Criar portal de gerenciamento para academia ──────────────────────────────
export async function criarPortalCliente(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

// ─── Cancelar assinatura ──────────────────────────────────────────────────────
export async function cancelarAssinatura(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId)
}

// ─── Buscar assinatura ativa da academia ─────────────────────────────────────
export async function buscarAssinaturaAtiva(customerId: string) {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  })
  return subs.data[0] ?? null
}

// ─── Verificar webhook ───────────────────────────────────────────────────────
export function verificarWebhook(payload: Buffer | string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// ─── MRR e métricas do Stripe ────────────────────────────────────────────────
export async function obterMRR() {
  const subs = await stripe.subscriptions.list({ status: 'active', limit: 100 })
  const mrr = subs.data.reduce((acc, sub) => {
    const item = sub.items.data[0]
    if (item?.price?.unit_amount) {
      return acc + item.price.unit_amount / 100
    }
    return acc
  }, 0)

  return {
    mrr,
    assinaturasAtivas: subs.data.length,
    assinaturas: subs.data.map(s => ({
      id: s.id,
      academiaId: s.metadata?.academiaId,
      plano: s.metadata?.plano,
      status: s.status,
      valor: (s.items.data[0]?.price?.unit_amount ?? 0) / 100,
      proximaCobranca: new Date(s.current_period_end * 1000),
    })),
  }
}
