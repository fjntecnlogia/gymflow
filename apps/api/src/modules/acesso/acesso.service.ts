import { prisma } from '../../lib/prisma'
import { CatracaService } from '../../integrations/catraca'
import { WhatsAppService } from '../../integrations/whatsapp'
import dayjs from 'dayjs'

const catracaService = new CatracaService()
const wa = new WhatsAppService()

export class AcessoService {
  async verificarQrCode(academiaId: string, qrCodeToken: string, catracaId?: string) {
    const aluno = await prisma.aluno.findFirst({
      where: { qrCodeToken, academiaId },
      include: {
        matriculas: {
          where: { status: 'ATIVA' },
          orderBy: { dataVencimento: 'desc' },
          take: 1,
          include: { plano: true },
        },
      },
    })

    if (!aluno) {
      await this.registrar({ academiaId, alunoId: null, catracaId, tipo: 'QR_CODE', resultado: 'BLOQUEADO', motivo: 'QR Code inválido' })
      return { liberado: false, motivo: 'QR Code inválido' }
    }

    const avaliacao = this.avaliarAcesso(aluno)
    await this.registrar({ academiaId, alunoId: aluno.id, catracaId, tipo: 'QR_CODE', resultado: avaliacao.liberado ? 'LIBERADO' : 'BLOQUEADO', motivo: avaliacao.motivo })

    if (avaliacao.liberado && catracaId) {
      const catraca = await prisma.catraca.findFirst({ where: { id: catracaId, academiaId } })
      if (catraca?.ipLocal && catraca.apiKey) {
        await catracaService.liberarAcesso(catraca.ipLocal, catraca.apiKey, aluno.id)
      }
    }

    return {
      liberado: avaliacao.liberado,
      motivo: avaliacao.motivo,
      aluno: { id: aluno.id, nome: aluno.nome, fotoUrl: aluno.fotoUrl, plano: aluno.matriculas[0]?.plano?.nome },
    }
  }

  private avaliarAcesso(aluno: any): { liberado: boolean; motivo: string | null } {
    if (aluno.status === 'CANCELADO') return { liberado: false, motivo: 'Matrícula cancelada' }
    if (aluno.status === 'SUSPENSO') return { liberado: false, motivo: 'Aluno suspenso' }

    const matricula = aluno.matriculas?.[0]
    if (!matricula) return { liberado: false, motivo: 'Sem matrícula ativa' }

    if (dayjs().isAfter(dayjs(matricula.dataVencimento))) {
      return { liberado: false, motivo: 'Plano vencido' }
    }

    if (aluno.status === 'INADIMPLENTE') return { liberado: false, motivo: 'Pagamento pendente' }

    return { liberado: true, motivo: null }
  }

  private async registrar(params: {
    academiaId: string; alunoId: string | null; catracaId?: string
    tipo: any; resultado: any; motivo?: string | null
  }) {
    if (!params.alunoId) return
    return prisma.registroAcesso.create({
      data: {
        academiaId: params.academiaId,
        alunoId: params.alunoId,
        catracaId: params.catracaId,
        tipo: params.tipo,
        resultado: params.resultado,
        motivoBloqueio: params.motivo,
      },
    })
  }

  async listarAcessos(academiaId: string, params: { page?: number; limit?: number; alunoId?: string }) {
    const { page = 1, limit = 50, alunoId } = params
    return prisma.registroAcesso.findMany({
      where: { academiaId, ...(alunoId && { alunoId }) },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { criadoEm: 'desc' },
      include: { aluno: { select: { id: true, nome: true, fotoUrl: true } }, catraca: true },
    })
  }

  async acessosHoje(academiaId: string) {
    const inicio = dayjs().startOf('day').toDate()
    const fim = dayjs().endOf('day').toDate()
    const where = { academiaId, criadoEm: { gte: inicio, lte: fim } }

    const [total, liberados, bloqueados] = await Promise.all([
      prisma.registroAcesso.count({ where }),
      prisma.registroAcesso.count({ where: { ...where, resultado: 'LIBERADO' } }),
      prisma.registroAcesso.count({ where: { ...where, resultado: 'BLOQUEADO' } }),
    ])

    return { total, liberados, bloqueados }
  }

  async sincronizarCatraca(academiaId: string, catracaId: string) {
    const catraca = await prisma.catraca.findFirst({ where: { id: catracaId, academiaId } })
    if (!catraca?.ipLocal || !catraca.apiKey) {
      throw new Error('Catraca sem IP ou API Key configurados')
    }

    const alunos = await prisma.aluno.findMany({
      where: { academiaId, status: 'ATIVO' },
      select: { id: true, nome: true, qrCodeToken: true },
    })

    return catracaService.sincronizarLista(catraca.ipLocal, catraca.apiKey, alunos)
  }
}
