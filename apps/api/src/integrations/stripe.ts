import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// ─── Criar sessão de checkout (link de pagamento) ────────────────────────────
export async function criarCheckoutSession(params: {
  alunoNome: string
  alunoEmail: string
  descricao: string
  valor: number          // em centavos
  academiaId: string
  alunoId: string
  matriculaId?: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: params.descricao,
          description: `Academia · Aluno: ${params.alunoNome}`,
        },
        unit_amount: params.valor,
      },
      quantity: 1,
    }],
    mode: 'payment',
    customer_email: params.alunoEmail || undefined,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      matriculaId: params.matriculaId ?? '',
    },
  })

  return {
    sessionId: session.id,
    url: session.url!,
  }
}

// ─── Criar assinatura recorrente ─────────────────────────────────────────────
export async function criarAssinatura(params: {
  alunoEmail: string
  alunoNome: string
  valorMensal: number    // em centavos
  descricao: string
  academiaId: string
  alunoId: string
  successUrl: string
  cancelUrl: string
}) {
  // Criar ou recuperar customer
  const customers = await stripe.customers.list({ email: params.alunoEmail, limit: 1 })
  let customer = customers.data[0]

  if (!customer) {
    customer = await stripe.customers.create({
      email: params.alunoEmail,
      name: params.alunoNome,
      metadata: { academiaId: params.academiaId, alunoId: params.alunoId },
    })
  }

  // Criar price recorrente
  const price = await stripe.prices.create({
    unit_amount: params.valorMensal,
    currency: 'brl',
    recurring: { interval: 'month' },
    product_data: { name: params.descricao },
  })

  // Criar sessão de checkout para assinatura
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [{ price: price.id, quantity: 1 }],
    mode: 'subscription',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { academiaId: params.academiaId, alunoId: params.alunoId },
  })

  return { sessionId: session.id, url: session.url!, customerId: customer.id }
}

// ─── Verificar webhook ───────────────────────────────────────────────────────
export function verificarWebhook(payload: Buffer, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET não configurado')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

// ─── Consultar pagamento ─────────────────────────────────────────────────────
export async function consultarSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent'],
  })
}
