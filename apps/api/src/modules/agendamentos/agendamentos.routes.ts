import { FastifyInstance } from 'fastify'
import { AgendamentosService } from './agendamentos.service'
import { criarAgendamentoSchema } from './agendamentos.schema'
import { enviarEmail } from '../../integrations/email'

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

  // ──────────────────────────────────────────────────────────
  // TODO REMOVER após validar: endpoint de teste isolado pra debug do Resend.
  // Bypassa toda lógica de agendamento — apenas chama enviarEmail() direto.
  // Protegido por header X-Debug-Key pra não ser abusado.
  // ──────────────────────────────────────────────────────────
  app.post('/debug-email', async (req, reply) => {
    if (req.headers['x-debug-key'] !== 'gymflow-debug-2026') {
      return reply.status(403).send({ error: 'forbidden' })
    }
    const { to } = (req.body as any) ?? {}
    if (!to) return reply.status(400).send({ error: 'to é obrigatório' })

    console.log('[DEBUG /debug-email] iniciando envio pra ' + to)
    console.log('[DEBUG /debug-email] RESEND_API_KEY=' + (process.env.RESEND_API_KEY ? 'SET' : 'NOT SET'))
    console.log('[DEBUG /debug-email] EMAIL_FROM=' + (process.env.EMAIL_FROM ?? '(default)'))

    try {
      const ok = await enviarEmail({
        to,
        subject: 'Teste GymFlow — Debug Resend',
        html: '<h2>Teste de email</h2><p>Se você está vendo isso, o Resend funcionou.</p><p>Origem: <strong>contato@gymflowgestor.com.br</strong></p>',
      })
      console.log('[DEBUG /debug-email] enviarEmail retornou: ' + ok)
      return reply.status(200).send({ ok, to })
    } catch (err: any) {
      console.error('[DEBUG /debug-email] ERRO:', err?.message, err?.stack?.slice(0, 500))
      return reply.status(500).send({ error: err?.message ?? 'unknown', stack: err?.stack?.slice(0, 500) })
    }
  })
}
