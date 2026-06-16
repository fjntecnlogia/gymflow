import { prisma } from '../../lib/prisma'
import { criarCheckoutSession, consultarSession } from '../../integrations/stripe'
import dayjs from 'dayjs'

const WEB_URL = process.env.WEB_URL ?? 'https://web-gules-phi-97.vercel.app'

export class PagamentosService {
  async listar(academiaId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status } = params
    const page  = Number(params.page  ?? 1)
    const limit = Number(params.limit ?? 20)
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

  // ─── Registrar pagamento manual (dinheiro, PIX, débito, etc.) ───────────────
  async registrarManual(academiaId: string, dados: {
    alunoId: string
    matriculaId?: string
    valor: number
    metodo: string
    descricao?: string
    dataVencimento?: Date
    dataPagamento?: Date
  }) {
    const aluno = await prisma.aluno.findFirst({ where: { id: dados.alunoId, academiaId } })
    if (!aluno) throw new Error('Aluno não encontrado')

    const pagamento = await prisma.pagamento.create({
      data: {
        academiaId,
        alunoId: dados.alunoId,
        matriculaId: dados.matriculaId,
        valor: dados.valor,
        metodo: dados.metodo as any,
        status: dados.dataPagamento ? 'PAGO' : 'PENDENTE',
        dataVencimento: dados.dataVencimento ?? new Date(),
        dataPagamento: dados.dataPagamento,
        descricao: dados.descricao ?? 'Mensalidade',
      },
      include: { aluno: { select: { id: true, nome: true } } },
    })

    // Se já está marcado como pago, atualiza status do aluno
    if (dados.dataPagamento) {
      await prisma.aluno.update({ where: { id: dados.alunoId }, data: { status: 'ATIVO' } })
    }

    return pagamento
  }

  // ─── Marcar pagamento como pago ──────────────────────────────────────────────
  async marcarComoPago(academiaId: string, pagamentoId: string) {
    const pagamento = await prisma.pagamento.findFirst({ where: { id: pagamentoId, academiaId } })
    if (!pagamento) throw new Error('Pagamento não encontrado')
    if (pagamento.status === 'PAGO') throw new Error('Pagamento já confirmado')

    const [pag] = await Promise.all([
      prisma.pagamento.update({
        where: { id: pagamentoId },
        data: { status: 'PAGO', dataPagamento: new Date() },
        include: { aluno: { select: { id: true, nome: true } } },
      }),
      prisma.aluno.update({ where: { id: pagamento.alunoId }, data: { status: 'ATIVO' } }),
    ])

    // Renovar matrícula se vinculada
    if (pagamento.matriculaId) {
      const mat = await prisma.matricula.findUnique({
        where: { id: pagamento.matriculaId }, include: { plano: true },
      })
      if (mat) {
        const base = dayjs(mat.dataVencimento).isAfter(dayjs()) ? mat.dataVencimento : new Date()
        await prisma.matricula.update({
          where: { id: mat.id },
          data: { status: 'ATIVA', dataVencimento: dayjs(base).add(mat.plano.duracaoDias, 'day').toDate() },
        })
      }
    }

    return pag
  }

  // ─── Cancelar/estornar pagamento ─────────────────────────────────────────────
  async cancelar(academiaId: string, pagamentoId: string) {
    const pagamento = await prisma.pagamento.findFirst({ where: { id: pagamentoId, academiaId } })
    if (!pagamento) throw new Error('Pagamento não encontrado')

    return prisma.pagamento.update({
      where: { id: pagamentoId },
      data: { status: pagamento.status === 'PAGO' ? 'ESTORNADO' : 'CANCELADO' },
    })
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Novos endpoints — financeiro robusto
  // ──────────────────────────────────────────────────────────────────────────

  async dreSimplificado(academiaId: string, mes: Date) {
    const inicioMes = dayjs(mes).startOf('month').toDate()
    const fimMes = dayjs(mes).endOf('month').toDate()
    const inicioMesAnt = dayjs(mes).subtract(1, 'month').startOf('month').toDate()
    const fimMesAnt = dayjs(mes).subtract(1, 'month').endOf('month').toDate()

    const [recebido, recebidoAnt, pendente, vencido] = await Promise.all([
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'PAGO', dataPagamento: { gte: inicioMes, lte: fimMes } },
        _sum: { valor: true }, _count: true,
      }),
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'PAGO', dataPagamento: { gte: inicioMesAnt, lte: fimMesAnt } },
        _sum: { valor: true },
      }),
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'PENDENTE', dataVencimento: { gte: inicioMes, lte: fimMes } },
        _sum: { valor: true }, _count: true,
      }),
      prisma.pagamento.aggregate({
        where: { academiaId, status: 'VENCIDO' },
        _sum: { valor: true }, _count: true,
      }),
    ])

    const receitaBruta = recebido._sum.valor ?? 0
    const receitaAnt = recebidoAnt._sum.valor ?? 0
    const inadimplencia = (vencido._sum.valor ?? 0) + (pendente._sum.valor ?? 0)
    const variacaoMoM =
      receitaAnt > 0 ? ((receitaBruta - receitaAnt) / receitaAnt) * 100 : 0

    return {
      mes: dayjs(mes).format('YYYY-MM'),
      receitaBruta,
      receitaAnt,
      variacaoMoM: Number(variacaoMoM.toFixed(2)),
      qtdRecebidos: recebido._count,
      pendente: pendente._sum.valor ?? 0,
      qtdPendente: pendente._count,
      vencido: vencido._sum.valor ?? 0,
      qtdVencido: vencido._count,
      inadimplenciaTotal: inadimplencia,
      // Resultado líquido = receitaBruta menos custos (custos = livre, default 0)
      // Aqui só expomos receita; custos ficam no front pra o dono preencher
      resultadoLiquido: receitaBruta,
    }
  }

  async fluxoCaixa(academiaId: string, dias: number) {
    const inicio = dayjs().subtract(dias - 1, 'day').startOf('day').toDate()
    const fim = dayjs().endOf('day').toDate()

    const pagos = await prisma.pagamento.findMany({
      where: {
        academiaId,
        status: 'PAGO',
        dataPagamento: { gte: inicio, lte: fim },
      },
      select: { valor: true, dataPagamento: true },
      orderBy: { dataPagamento: 'asc' },
    })

    // Agrupa por dia (YYYY-MM-DD)
    const map = new Map<string, number>()
    for (let i = 0; i < dias; i++) {
      const dia = dayjs(inicio).add(i, 'day').format('YYYY-MM-DD')
      map.set(dia, 0)
    }
    for (const p of pagos) {
      if (!p.dataPagamento) continue
      const dia = dayjs(p.dataPagamento).format('YYYY-MM-DD')
      map.set(dia, (map.get(dia) ?? 0) + p.valor)
    }

    let saldo = 0
    const serie = Array.from(map.entries()).map(([dia, entrada]) => {
      saldo += entrada
      return { dia, entrada, saldo }
    })

    return {
      periodo: { inicio: dayjs(inicio).format('YYYY-MM-DD'), fim: dayjs(fim).format('YYYY-MM-DD') },
      totalEntradas: serie.reduce((s, d) => s + d.entrada, 0),
      mediaEntradaDiaria: Number((serie.reduce((s, d) => s + d.entrada, 0) / dias).toFixed(2)),
      serie,
    }
  }

  async previsaoMrr(academiaId: string) {
    // Soma das matrículas ativas (valorPago é a mensalidade contratada)
    const matriculasAtivas = await prisma.matricula.findMany({
      where: {
        academiaId,
        status: 'ATIVO',
      },
      select: { id: true, valorPago: true, planoId: true, alunoId: true },
    })

    const mrrPrevisto = matriculasAtivas.reduce((s, m) => s + (m.valorPago ?? 0), 0)
    const ticketMedio =
      matriculasAtivas.length > 0 ? mrrPrevisto / matriculasAtivas.length : 0

    // Distribuição por plano
    const porPlano = new Map<string, { qtd: number; total: number }>()
    for (const m of matriculasAtivas) {
      const key = m.planoId
      const cur = porPlano.get(key) ?? { qtd: 0, total: 0 }
      cur.qtd += 1
      cur.total += m.valorPago ?? 0
      porPlano.set(key, cur)
    }

    return {
      mrrPrevisto,
      alunosAtivos: matriculasAtivas.length,
      ticketMedio: Number(ticketMedio.toFixed(2)),
      arrPrevisto: mrrPrevisto * 12,
      porPlano: Array.from(porPlano.entries()).map(([planoId, dados]) => ({
        planoId,
        qtd: dados.qtd,
        total: dados.total,
      })),
    }
  }

  async listarInadimplentes(academiaId: string) {
    const hoje = new Date()

    // Inadimplentes = pagamentos VENCIDO (atrasados) ou PENDENTE com vencimento passado
    const items = await prisma.pagamento.findMany({
      where: {
        academiaId,
        OR: [
          { status: 'VENCIDO' },
          {
            status: 'PENDENTE',
            dataVencimento: { lt: hoje },
          },
        ],
      },
      include: {
        aluno: {
          select: { id: true, nome: true, telefone: true, email: true, status: true },
        },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    return items.map((p) => {
      const diasAtraso = Math.floor(
        (hoje.getTime() - new Date(p.dataVencimento).getTime()) / (1000 * 60 * 60 * 24),
      )
      return {
        pagamentoId: p.id,
        alunoId: p.aluno.id,
        nome: p.aluno.nome,
        telefone: p.aluno.telefone,
        email: p.aluno.email,
        statusAluno: p.aluno.status,
        valor: p.valor,
        dataVencimento: p.dataVencimento,
        diasAtraso: Math.max(0, diasAtraso),
        descricao: p.descricao,
      }
    })
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
