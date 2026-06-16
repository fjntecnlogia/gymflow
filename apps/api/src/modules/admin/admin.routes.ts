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

  // ──────────────────────────────────────────────────────────
  // FINANCEIRO SaaS — visão consolidada pra owner do GymFlow
  // ──────────────────────────────────────────────────────────

  const PLANO_VALOR: Record<string, number> = { STARTER: 197, PRO: 397, ENTERPRISE: 797 }

  app.get('/financeiro/saas', async () => {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59)
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const todasAcademias = await prisma.academia.findMany({
      select: {
        id: true, nome: true, slug: true, planoSaas: true, status: true,
        criadoEm: true, atualizadoEm: true, trialExpiraEm: true,
        _count: { select: { alunos: true } },
      },
      orderBy: { criadoEm: 'desc' },
    })

    const ativas = todasAcademias.filter((a) => a.status === 'ATIVO')
    const inadimplentes = todasAcademias.filter((a) => a.status === 'INADIMPLENTE')
    const trials = todasAcademias.filter((a) => a.status === 'TRIAL')
    const canceladas = todasAcademias.filter((a) => a.status === 'CANCELADO')

    // MRR — soma das ativas pelos valores dos planos
    const mrrAtual = ativas.reduce((s, a) => s + (PLANO_VALOR[a.planoSaas] ?? 0), 0)
    const arr = mrrAtual * 12

    // MRR mês passado — academias que eram ativas no fim do mês passado
    const ativasMesPassado = todasAcademias.filter(
      (a) => a.criadoEm <= fimMesPassado && (a.status === 'ATIVO' || (a.status === 'CANCELADO' && a.atualizadoEm > fimMesPassado)),
    )
    const mrrMesPassado = ativasMesPassado.reduce((s, a) => s + (PLANO_VALOR[a.planoSaas] ?? 0), 0)
    const variacaoMrr = mrrMesPassado > 0 ? ((mrrAtual - mrrMesPassado) / mrrMesPassado) * 100 : 0

    // Churn mensal — canceladas neste mês / ativas início do mês
    const canceladasNoMes = canceladas.filter((a) => a.atualizadoEm >= inicioMes).length
    const baseInicioMes = ativasMesPassado.length || ativas.length || 1
    const churnPercent = (canceladasNoMes / baseInicioMes) * 100

    // Inadimplência total em R$
    const inadimplenciaRS = inadimplentes.reduce((s, a) => s + (PLANO_VALOR[a.planoSaas] ?? 0), 0)

    // Em risco — INADIMPLENTE há mais de 7 dias
    const emRisco = inadimplentes
      .filter((a) => a.atualizadoEm < seteDiasAtras)
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        slug: a.slug,
        planoSaas: a.planoSaas,
        valor: PLANO_VALOR[a.planoSaas] ?? 0,
        diasInadimplente: Math.floor((Date.now() - a.atualizadoEm.getTime()) / (1000 * 60 * 60 * 24)),
        alunos: a._count.alunos,
      }))

    // Top 10 academias por receita (entre ativas)
    const top10 = [...ativas]
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        slug: a.slug,
        planoSaas: a.planoSaas,
        valor: PLANO_VALOR[a.planoSaas] ?? 0,
        alunos: a._count.alunos,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)

    // Distribuição por plano
    const distPlano = {
      STARTER: ativas.filter((a) => a.planoSaas === 'STARTER').length,
      PRO: ativas.filter((a) => a.planoSaas === 'PRO').length,
      ENTERPRISE: ativas.filter((a) => a.planoSaas === 'ENTERPRISE').length,
    }

    // Evolução MRR mensal — 12 meses
    const evolucaoMrr = []
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const fim = new Date(agora.getFullYear(), agora.getMonth() - i + 1, 0, 23, 59, 59)
      const ativasNoMes = todasAcademias.filter(
        (a) => a.criadoEm <= fim && (a.status !== 'CANCELADO' || a.atualizadoEm > fim),
      )
      const mrr = ativasNoMes.reduce((s, a) => s + (PLANO_VALOR[a.planoSaas] ?? 0), 0)
      evolucaoMrr.push({
        mes: dt.toISOString().slice(0, 7), // YYYY-MM
        mrr,
        academias: ativasNoMes.length,
      })
    }

    // Ticket médio
    const ticketMedio = ativas.length > 0 ? mrrAtual / ativas.length : 0

    return {
      kpis: {
        mrr: mrrAtual,
        arr,
        mrrMesPassado,
        variacaoMrr: Number(variacaoMrr.toFixed(2)),
        churnPercent: Number(churnPercent.toFixed(2)),
        canceladasNoMes,
        inadimplenciaRS,
        inadimplentesCount: inadimplentes.length,
        ativasCount: ativas.length,
        trialsCount: trials.length,
        ticketMedio: Number(ticketMedio.toFixed(2)),
      },
      distribuicaoPlano: distPlano,
      evolucaoMrr,
      top10,
      emRisco,
      ultimasAcademias: todasAcademias.slice(0, 5).map((a) => ({
        id: a.id, nome: a.nome, slug: a.slug, planoSaas: a.planoSaas,
        status: a.status, criadoEm: a.criadoEm, alunos: a._count.alunos,
      })),
    }
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
