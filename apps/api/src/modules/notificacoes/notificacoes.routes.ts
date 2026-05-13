import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { WhatsAppService } from '../../integrations/whatsapp'
import { prisma } from '../../lib/prisma'

const wa = new WhatsAppService()

export async function notificacoesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.post('/whatsapp/teste', async (req, reply) => {
    const { telefone, mensagem } = req.body as { telefone: string; mensagem: string }
    await wa.enviarMensagem(telefone, mensagem)
    return { ok: true }
  })

  app.get('/log', async (req) => {
    const academiaId = (req as any).academiaId
    return prisma.notificacaoLog.findMany({
      where: { academiaId },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    })
  })
}
