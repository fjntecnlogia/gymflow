import { FastifyInstance } from 'fastify'
import { adminMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'

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
    const { page = 1, limit = 20 } = req.query as any
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
}
