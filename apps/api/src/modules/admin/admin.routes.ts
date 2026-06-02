import { FastifyInstance } from 'fastify'
import { adminMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'
import { AgendamentosService } from '../agendamentos/agendamentos.service'
import {
  atualizarStatusAgendamentoSchema,
  filtroAgendamentoSchema,
} from '../agendamentos/agendamentos.schema'

const agendamentosService = new AgendamentosService()

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', adminMiddleware)

  app.get('/overview', async () => {
    const [totalAcademias, ativas, trial, totalAlunos] = await Promise.all([
      prisma.academia.count(),
      prisma.academia.count({ where: { status: 'ATIVO' } }),
      prisma.academia.count({ where: { status: 'TRIAL' } }),
      prisma.aluno.count({ where: { status: 'ATIVO' } }),
    ])

    return { totalAcademias, ativas, trial, totalAlunos }
  })

  app.get('/academias', async (req) => {
    const q = req.query as any
    const page  = Number(q.page  ?? 1)
    const limit = Number(q.limit ?? 20)
    return prisma.academia.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: { _count: { select: { alunos: true } } },
    })
  })

  app.patch('/academias/:id/status', async (req) => {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    return prisma.academia.update({ where: { id }, data: { status: status as any } })
  })

  // ─── AGENDAMENTOS (leads de demonstração) ──────────────
  // Retorna array bruto (sem envelope) — o frontend admin/agendamentos/page.tsx
  // espera Array.isArray(data).

  app.get('/agendamentos', async (req) => {
    const filtros = filtroAgendamentoSchema.parse(req.query)
    return agendamentosService.listar(filtros)
  })

  app.patch('/agendamentos/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status } = atualizarStatusAgendamentoSchema.parse(req.body)
    try {
      return await agendamentosService.atualizarStatus(id, status)
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.status(404).send({ error: 'Agendamento não encontrado' })
      }
      throw err
    }
  })
}
