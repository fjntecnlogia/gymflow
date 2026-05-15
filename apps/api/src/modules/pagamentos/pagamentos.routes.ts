import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { PagamentosService } from './pagamentos.service'
import { verificarWebhook } from '../../integrations/stripe'
import { z } from 'zod'

const service = new PagamentosService()

const cobrarSchema = z.object({
  alunoId:       z.string(),
  matriculaId:   z.string().optional(),
  valor:         z.number().positive(),
  descricao:     z.string().default('Mensalidade GYMFLOW'),
  dataVencimento: z.string(),
})

export async function pagamentosRoutes(app: FastifyInstance) {
  // ─── Webhook Stripe (sem auth) ──────────────────────────────────────────────
  app.post('/webhook/stripe', {
    config: { rawBody: true },
  }, async (req, reply) => {
    const sig = req.headers['stripe-signature'] as string

    try {
      const event = verificarWebhook(
        (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body)),
        sig,
      )

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any
        if (session.payment_status === 'paid') {
          await service.confirmarPagamentoStripe(session.id)
        }
      }

      return reply.status(200).send({ received: true })
    } catch (err: any) {
      return reply.status(400).send({ error: `Webhook error: ${err.message}` })
    }
  })

  // ─── Confirmar pagamento via sucesso (redirect) ─────────────────────────────
  app.get('/confirmar/:sessionId', async (req, reply) => {
    const { sessionId } = req.params as { sessionId: string }
    try {
      const pag = await service.confirmarPagamentoStripe(sessionId)
      return { success: true, pagamento: pag }
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // ─── Rotas protegidas ────────────────────────────────────────────────────────
  app.addHook('onRequest', authMiddleware)

  app.get('/', async (req) => {
    return service.listar((req as any).academiaId, req.query as any)
  })

  app.post('/cobrar', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const dados = cobrarSchema.parse(req.body)
    const pagamento = await service.criarCobrancaStripe(academiaId, {
      ...dados,
      dataVencimento: new Date(dados.dataVencimento),
    })
    return reply.status(201).send(pagamento)
  })

  // ─── Registrar pagamento manual ─────────────────────────────────────────────
  app.post('/manual', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const schema = z.object({
      alunoId:       z.string(),
      matriculaId:   z.string().optional(),
      valor:         z.number().positive(),
      metodo:        z.enum(['DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO']),
      descricao:     z.string().optional(),
      dataVencimento: z.string().optional(),
      jaFoiPago:     z.boolean().default(false),
    })
    const dados = schema.parse(req.body)
    const pagamento = await service.registrarManual(academiaId, {
      ...dados,
      dataVencimento: dados.dataVencimento ? new Date(dados.dataVencimento) : undefined,
      dataPagamento: dados.jaFoiPago ? new Date() : undefined,
    })
    return reply.status(201).send(pagamento)
  })

  // ─── Marcar como pago ────────────────────────────────────────────────────────
  app.patch('/:id/pagar', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    try {
      const pag = await service.marcarComoPago(academiaId, id)
      return pag
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // ─── Cancelar/estornar ───────────────────────────────────────────────────────
  app.patch('/:id/cancelar', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    try {
      return await service.cancelar(academiaId, id)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get('/resumo', async (req) => {
    return service.resumoFinanceiro((req as any).academiaId)
  })
}
