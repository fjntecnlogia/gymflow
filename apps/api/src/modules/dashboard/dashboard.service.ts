import { prisma } from '../../lib/prisma'
import dayjs from 'dayjs'

export class DashboardService {
  async kpis(academiaId: string) {
    const inicioMes = dayjs().startOf('month').toDate()
    const fimMes = dayjs().endOf('month').toDate()
    const hoje = dayjs().startOf('day').toDate()
    const fimHoje = dayjs().endOf('day').toDate()

    const [ativos, inadimplentes, receitaMes, acessosHoje, vencendoEm7Dias] = await Promise.all([
      prisma.aluno.count({ where: { academiaId, status: 'ATIVO' } }),
      prisma.aluno.count({ where: { academiaId, status: 'INADIMPLENTE' } }),
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
        _sum: { valor: true },
      }),
      prisma.registroAcesso.count({
        where: { academiaId, resultado: 'LIBERADO', criadoEm: { gte: hoje, lte: fimHoje } },
      }),
      prisma.matricula.count({
        where: {
          academiaId,
          status: 'ATIVA',
          dataVencimento: { lte: dayjs().add(7, 'day').toDate(), gte: new Date() },
        },
      }),
    ])

    return {
      alunosAtivos: ativos,
      inadimplentes,
      receitaMes: receitaMes._sum.valor ?? 0,
      acessosHoje,
      vencendoEm7Dias,
    }
  }

  async acessosPorDia(academiaId: string, dias = 7) {
    const inicio = dayjs().subtract(dias - 1, 'day').startOf('day').toDate()

    const acessos = await prisma.registroAcesso.findMany({
      where: { academiaId, resultado: 'LIBERADO', criadoEm: { gte: inicio } },
      select: { criadoEm: true },
    })

    const porDia: Record<string, number> = {}
    for (let i = 0; i < dias; i++) {
      const dia = dayjs().subtract(i, 'day').format('DD/MM')
      porDia[dia] = 0
    }

    acessos.forEach((a) => {
      const dia = dayjs(a.criadoEm).format('DD/MM')
      if (porDia[dia] !== undefined) porDia[dia]++
    })

    return Object.entries(porDia)
      .reverse()
      .map(([dia, total]) => ({ dia, total }))
  }

  async ultimosAcessos(academiaId: string, limite = 10) {
    return prisma.registroAcesso.findMany({
      where: { academiaId },
      orderBy: { criadoEm: 'desc' },
      take: limite,
      include: { aluno: { select: { id: true, nome: true, fotoUrl: true } } },
    })
  }
}
