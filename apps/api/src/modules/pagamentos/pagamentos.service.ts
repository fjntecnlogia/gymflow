import { prisma } from '../../lib/prisma'
import { PixService } from '../../integrations/pix'
import dayjs from 'dayjs'

const pixService = new PixService()

export class PagamentosService {
  async listar(academiaId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params
    return prisma.pagamento.findMany({
      where: { academiaId, ...(status && { status: status as any }) },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: { aluno: { select: { id: true, nome: true, telefone: true } } },
    })
  }

  async criarCobrancaPix(academiaId: string, dados: {
    alunoId: string
    matriculaId?: string
    valor: number
    descricao: string
    dataVencimento: Date
  }) {
    const aluno = await prisma.aluno.findFirst({ where: { id: dados.alunoId, academiaId } })
    if (!aluno) throw new Error('Aluno não encontrado')

    const pix = await pixService.criarCobranca({
      valor: dados.valor,
      alunoNome: aluno.nome,
      descricao: dados.descricao,
      expiracao: 86400,
    })

    return prisma.pagamento.create({
      data: {
        academiaId,
        alunoId: dados.alunoId,
        matriculaId: dados.matriculaId,
        valor: dados.valor,
        metodo: 'PIX',
        status: 'PENDENTE',
        pixTxId: pix.txid,
        pixQrCode: pix.qrCode,
        pixLinkPagamento: pix.linkPagamento,
        dataVencimento: dados.dataVencimento,
        descricao: dados.descricao,
      },
    })
  }

  async confirmarPagamentoPix(txid: string) {
    const pagamento = await prisma.pagamento.findFirst({ where: { pixTxId: txid } })
    if (!pagamento) return null

    await prisma.pagamento.update({
      where: { id: pagamento.id },
      data: { status: 'PAGO', dataPagamento: new Date() },
    })

    await prisma.aluno.update({
      where: { id: pagamento.alunoId },
      data: { status: 'ATIVO' },
    })

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
