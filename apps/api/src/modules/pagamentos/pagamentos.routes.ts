import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { PagamentosService } from './pagamentos.service'
import { PixService } from '../../integrations/pix'
import { z } from 'zod'

const service = new PagamentosService()
const pixService = new PixService()

const cobrarSchema = z.object({
  alunoId: z.string(),
  matriculaId: z.string().optional(),
  valor: z.number().positive(),
  descricao: z.string().default('Mensalidade GYMFLOW'),
  dataVencimento: z.string(),
})

export async function pagamentosRoutes(app: FastifyInstance) {
  // Webhook PIX da Efí Bank (sem auth — validado por IP/token)
  app.post('/webhook/pix', async (req, reply) => {
    try {
      const payload = req.body as any
      const pagamentos = payload?.pix ?? []

      for (const pix of pagamentos) {
        if (pix.txid && pix.status === 'CONCLUIDA') {
          await service.confirmarPagamentoPix(pix.txid)
        }
      }

      return reply.status(200).send({ ok: true })
    } catch (err) {
      console.error('Webhook PIX erro:', err)
      return reply.status(200).send({ ok: true }) // Sempre 200 para Efí não retentar
    }
  })

  app.addHook('onRequest', authMiddleware)

  app.get('/', async (req) => {
    return service.listar((req as any).academiaId, req.query as any)
  })

  app.post('/cobrar', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const dados = cobrarSchema.parse(req.body)
    const pagamento = await service.criarCobrancaPix(academiaId, {
      ...dados,
      dataVencimento: new Date(dados.dataVencimento),
    })
    return reply.status(201).send(pagamento)
  })

  app.get('/resumo', async (req) => {
    return service.resumoFinanceiro((req as any).academiaId)
  })

  // Configurar webhook PIX (chamar uma vez no setup)
  app.post('/configurar-webhook', async (req, reply) => {
    const { webhookUrl } = req.body as { webhookUrl: string }
    const result = await pixService.configurarWebhook(
      process.env.PIX_CHAVE!,
      webhookUrl,
    )
    return result
  })

  // Consultar status de cobrança específica
  app.get('/consultar/:txid', async (req) => {
    const { txid } = req.params as { txid: string }
    return pixService.consultarCobranca(txid)
  })
}
