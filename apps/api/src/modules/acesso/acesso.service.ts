import { prisma } from '../../lib/prisma'
import { CatracaService } from '../../integrations/catraca'
import { FacialService } from '../../integrations/facial'
import dayjs from 'dayjs'

const catracaService = new CatracaService()
const facialService = new FacialService()

export class AcessoService {

  // ─── Acesso por QR Code ──────────────────────────────────────────────────────
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
      await this.liberarCatraca(academiaId, catracaId, aluno.id)
    }

    return {
      liberado: avaliacao.liberado,
      motivo: avaliacao.motivo,
      aluno: { id: aluno.id, nome: aluno.nome, fotoUrl: aluno.fotoUrl, plano: aluno.matriculas[0]?.plano?.nome },
    }
  }

  // ─── Acesso por Reconhecimento Facial ────────────────────────────────────────
  async verificarFacial(academiaId: string, fotoBase64: string, catracaId?: string) {
    // 1. Reconhecer o rosto
    const reconhecimento = await facialService.reconhecer(fotoBase64)

    if (!reconhecimento.encontrado || !reconhecimento.alunoId) {
      await this.registrar({
        academiaId,
        alunoId: null,
        catracaId,
        tipo: 'BIOMETRIA',
        resultado: 'BLOQUEADO',
        motivo: reconhecimento.mensagem,
      })
      return { liberado: false, motivo: reconhecimento.mensagem, similaridade: reconhecimento.similaridade }
    }

    // 2. Buscar aluno e validar matrícula
    const aluno = await prisma.aluno.findFirst({
      where: { id: reconhecimento.alunoId, academiaId },
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
      await this.registrar({ academiaId, alunoId: null, catracaId, tipo: 'BIOMETRIA', resultado: 'BLOQUEADO', motivo: 'Aluno não pertence a esta academia' })
      return { liberado: false, motivo: 'Aluno não encontrado nesta academia' }
    }

    // 3. Avaliar status da matrícula
    const avaliacao = this.avaliarAcesso(aluno)
    await this.registrar({
      academiaId,
      alunoId: aluno.id,
      catracaId,
      tipo: 'BIOMETRIA',
      resultado: avaliacao.liberado ? 'LIBERADO' : 'BLOQUEADO',
      motivo: avaliacao.motivo,
    })

    // 4. Liberar catraca se autorizado
    if (avaliacao.liberado && catracaId) {
      await this.liberarCatraca(academiaId, catracaId, aluno.id)
    }

    return {
      liberado: avaliacao.liberado,
      motivo: avaliacao.motivo,
      similaridade: reconhecimento.similaridade,
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        fotoUrl: aluno.fotoUrl,
        plano: aluno.matriculas[0]?.plano?.nome,
      },
    }
  }

  // ─── Lógica de avaliação de acesso ──────────────────────────────────────────
  avaliarAcesso(aluno: any): { liberado: boolean; motivo: string | null } {
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

  // ─── Liberar catraca física ──────────────────────────────────────────────────
  private async liberarCatraca(academiaId: string, catracaId: string, alunoId: string) {
    try {
      const catraca = await prisma.catraca.findFirst({ where: { id: catracaId, academiaId } })
      if (catraca?.ip && catraca.apiKey) {
        await catracaService.liberarAcesso(catraca.ip, catraca.apiKey, alunoId)
      }
    } catch (err) {
      console.error('[AcessoService] Erro ao liberar catraca:', err)
    }
  }

  // ─── Registrar log de acesso ─────────────────────────────────────────────────
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
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
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
    if (!catraca?.ip || !catraca.apiKey) {
      throw new Error('Catraca sem IP ou credencial configurados')
    }

    const alunos = await prisma.aluno.findMany({
      where: { academiaId, status: 'ATIVO' },
      select: { id: true, nome: true, qrCodeToken: true },
    })

    return catracaService.sincronizarLista(catraca.ip, catraca.apiKey, alunos)
  }
}
