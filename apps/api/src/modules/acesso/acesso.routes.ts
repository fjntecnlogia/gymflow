import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AcessoService } from './acesso.service'

const service = new AcessoService()

export async function acessoRoutes(app: FastifyInstance) {
  // Endpoint chamado pela catraca física (sem JWT — usa academiaId no body)
  app.post('/verificar', async (req, reply) => {
    const { qrCodeToken, catracaId, academiaId } = req.body as {
      qrCodeToken: string; catracaId?: string; academiaId: string
    }
    if (!qrCodeToken || !academiaId) {
      return reply.status(400).send({ error: 'qrCodeToken e academiaId são obrigatórios' })
    }
    return service.verificarQrCode(academiaId, qrCodeToken, catracaId)
  })

  // Rotas protegidas (dashboard)
  app.get('/', { onRequest: [authMiddleware] }, async (req) => {
    return service.listarAcessos((req as any).academiaId, req.query as any)
  })

  app.get('/hoje', { onRequest: [authMiddleware] }, async (req) => {
    return service.acessosHoje((req as any).academiaId)
  })

  app.post('/sincronizar-catraca/:catracaId', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { catracaId } = req.params as { catracaId: string }
    return service.sincronizarCatraca(academiaId, catracaId)
  })
}
