import { prisma } from '../../lib/prisma'
import { criarCheckoutSession, consultarSession } from '../../integrations/stripe'
import dayjs from 'dayjs'

const WEB_URL = process.env.WEB_URL ?? 'https://web-gules-phi-97.vercel.app'

export class PagamentosService {
  async listar(academiaId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params
    return prisma.pagamento.findMany({
      where: { academiaId, ...(status && { status: status as any }) },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: { aluno: { select: { id: true, nome: true, telefone: true, email: true } } },
    })
  }

  async criarCobrancaStripe(academiaId: string, dados: {
    alunoId: string
    matriculaId?: string
    valor: number
    descricao: string
    dataVencimento: Date
  }) {
    const aluno = await prisma.aluno.findFirst({
      where: { id: dados.alunoId, academiaId },
    })
    if (!aluno) throw new Error('Aluno não encontrado')

    const valorCentavos = Math.round(dados.valor * 100)

    const checkout = await criarCheckoutSession({
      alunoNome: aluno.nome,
      alunoEmail: aluno.email ?? '',
      descricao: dados.descricao,
      valor: valorCentavos,
      academiaId,
      alunoId: dados.alunoId,
      matriculaId: dados.matriculaId,
      successUrl: `${WEB_URL}/pagamento-sucesso?session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${WEB_URL}/financeiro`,
    })

    const pagamento = await prisma.pagamento.create({
      data: {
        academiaId,
        alunoId: dados.alunoId,
        matriculaId: dados.matriculaId,
        valor: dados.valor,
        metodo: 'CARTAO_CREDITO',
        status: 'PENDENTE',
        stripePaymentId: checkout.sessionId,
        pixLinkPagamento: checkout.url,  // reutilizando campo para guardar link
        dataVencimento: dados.dataVencimento,
        descricao: dados.descricao,
      },
    })

    return { ...pagamento, checkoutUrl: checkout.url }
  }

  async confirmarPagamentoStripe(sessionId: string) {
    const session = await consultarSession(sessionId)

    if (session.payment_status !== 'paid') {
      throw new Error('Pagamento não confirmado')
    }

    const pagamento = await prisma.pagamento.findFirst({
      where: { stripePaymentId: sessionId },
    })
    if (!pagamento) throw new Error('Pagamento não encontrado')

    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: { status: 'PAGO', dataPagamento: new Date() },
    })

    await prisma.aluno.update({
      where: { id: pagamento.alunoId },
      data: { status: 'ATIVO' },
    })

    // Renovar matrícula se existir
    if (pagamento.matriculaId) {
      const mat = await prisma.matricula.findUnique({ where: { id: pagamento.matriculaId }, include: { plano: true } })
      if (mat) {
        const novoVencimento = dayjs(mat.dataVencimento).add(mat.plano.duracaoDias, 'day').toDate()
        await prisma.matricula.update({
          where: { id: mat.id },
          data: { status: 'ATIVA', dataVencimento: novoVencimento },
        })
      }
    }

    return pagamento
  }

  async resumoFinanceiro(academiaId: string) {
    const inicioMes = dayjs().startOf('month').toDate()
    const fimMes = dayjs().endOf('month').toDate()

    const [receitaMes, inadimplentes, pendentes] = await Promise.all([
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
        _sum: { valor: true },
      }),
      prisma.aluno.count({ where: { academiaId, status: 'INADIMPLENTE' } }),
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'PENDENTE' },
        _sum: { valor: true },
        _count: true,
      }),
    ])

    return {
      receitaMes: receitaMes._sum.valor ?? 0,
      inadimplentes,
      valorPendente: pendentes._sum.valor ?? 0,
      qtdPendente: pendentes._count,
    }
  }
}
