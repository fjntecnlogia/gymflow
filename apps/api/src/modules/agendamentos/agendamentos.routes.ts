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

    const env = {
      RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_length: process.env.RESEND_API_KEY?.length ?? 0,
      RESEND_API_KEY_prefix: process.env.RESEND_API_KEY?.slice(0, 6) ?? null,
      EMAIL_FROM: process.env.EMAIL_FROM ?? '(default)',
      ADMIN_LEAD_EMAIL: process.env.ADMIN_LEAD_EMAIL ?? '(default)',
    }

    // Chama Resend DIRETO (sem passar pelo wrapper enviarEmail) pra capturar
    // a resposta crua e retornar pro client. Assim debugamos sem precisar
    // dos logs do Railway (que estão sumindo).
    try {
      const { Resend } = await import('resend')
      if (!process.env.RESEND_API_KEY) {
        return reply.status(200).send({ ok: false, env, error: 'RESEND_API_KEY ausente' })
      }
      const resend = new Resend(process.env.RESEND_API_KEY)
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@gymflowgestor.com.br',
        to,
        subject: 'Teste GymFlow — Debug Resend',
        html: '<h2>Teste</h2><p>Se chegou, Resend OK.</p>',
      })
      return reply.status(200).send({ ok: !result.error, env, resendResponse: result })
    } catch (err: any) {
      return reply.status(200).send({
        ok: false,
        env,
        error: err?.message ?? 'unknown',
        name: err?.name,
        stack: err?.stack?.slice(0, 800),
      })
    }
  })
}
