import { prisma } from '../../lib/prisma'
import { CriarAlunoDTO, FiltroAlunoDTO } from './alunos.schema'

export class AlunosService {
  async listar(academiaId: string, filtros: FiltroAlunoDTO) {
    const { status, busca, page, limit } = filtros
    const skip = (page - 1) * limit

    const where = {
      academiaId,
      ...(status && { status }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' as const } },
          { email: { contains: busca, mode: 'insensitive' as const } },
          { telefone: { contains: busca } },
        ],
      }),
    }

    const [alunos, total] = await Promise.all([
      prisma.aluno.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        include: {
          matriculas: {
            where: { status: 'ATIVA' },
            include: { plano: true },
            take: 1,
          },
        },
      }),
      prisma.aluno.count({ where }),
    ])

    return { alunos, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async buscarPorId(academiaId: string, alunoId: string) {
    return prisma.aluno.findFirst({
      where: { id: alunoId, academiaId },
      include: {
        matriculas: { include: { plano: true }, orderBy: { criadoEm: 'desc' } },
        acessos: { orderBy: { criadoEm: 'desc' }, take: 20 },
        pagamentos: { orderBy: { criadoEm: 'desc' }, take: 10 },
      },
    })
  }

  async criar(academiaId: string, dados: CriarAlunoDTO) {
    return prisma.aluno.create({
      data: { ...dados, academiaId },
    })
  }

  async atualizar(academiaId: string, alunoId: string, dados: Partial<CriarAlunoDTO>) {
    return prisma.aluno.update({
      where: { id: alunoId, academiaId },
      data: dados,
    })
  }

  async atualizarStatus(academiaId: string, alunoId: string, status: string) {
    return prisma.aluno.update({
      where: { id: alunoId, academiaId },
      data: { status: status as any },
    })
  }

  async buscarPorQrToken(qrCodeToken: string) {
    return prisma.aluno.findUnique({
      where: { qrCodeToken },
      include: {
        matriculas: {
          where: { status: 'ATIVA' },
          include: { plano: true },
          orderBy: { dataVencimento: 'desc' },
          take: 1,
        },
      },
    })
  }

  async contarPorStatus(academiaId: string) {
    const resultado = await prisma.aluno.groupBy({
      by: ['status'],
      where: { academiaId },
      _count: true,
    })
    return resultado.reduce((acc, r) => ({ ...acc, [r.status]: r._count }), {})
  }
}
