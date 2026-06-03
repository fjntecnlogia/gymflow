import { FastifyInstance } from 'fastify'
import { AgendamentosService } from './agendamentos.service'
import { criarAgendamentoSchema } from './agendamentos.schema'

const service = new AgendamentosService()

/**
 * Rotas PÚBLICAS de agendamento (lead capture).
 * - POST /agendamentos      → rate-limited 1 req/IP/5min
 *
 * Endpoints admin (GET/PATCH) ficam em /admin/agendamentos
 * (registrados em modules/admin/admin.routes.ts).
 */
export async function agendamentosRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      config: {
        rateLimit: {
          max: 1,
          timeWindow: '5 minutes',
          keyGenerator: (req) => req.ip,
          errorResponseBuilder: () => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Já recebemos sua solicitação. Aguarde alguns minutos antes de enviar outra.',
          }),
        },
      },
    },
    async (req, reply) => {
      const dados = criarAgendamentoSchema.parse(req.body)
      const ag = await service.criar(dados, req.ip)
      return reply.status(201).send(ag)
    },
  )
}
