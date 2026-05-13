import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'

const criarAcademiaSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  telefone: z.string().optional(),
  cnpj: z.string().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
})

const criarUsuarioSchema = z.object({
  supabaseId: z.string(),
  nome: z.string(),
  email: z.string().email(),
  role: z.enum(['DONO', 'GERENTE', 'STAFF']).default('DONO'),
})

export async function academiasRoutes(app: FastifyInstance) {
  app.post('/', async (req, reply) => {
    const { academia: academiaDados, usuario: usuarioDados } = req.body as {
      academia: z.infer<typeof criarAcademiaSchema>
      usuario: z.infer<typeof criarUsuarioSchema>
    }

    const academia = await prisma.academia.create({
      data: {
        ...criarAcademiaSchema.parse(academiaDados),
        trialExpiraEm: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        usuarios: {
          create: criarUsuarioSchema.parse(usuarioDados),
        },
      },
      include: { usuarios: true },
    })

    return reply.status(201).send(academia)
  })

  app.get('/minha', { onRequest: [authMiddleware] }, async (req) => {
    const academiaId = (req as any).academiaId
    return prisma.academia.findUnique({
      where: { id: academiaId },
      include: { catracas: true, planos: { where: { ativo: true } } },
    })
  })

  app.put('/minha', { onRequest: [authMiddleware] }, async (req) => {
    const academiaId = (req as any).academiaId
    const dados = req.body as any
    return prisma.academia.update({ where: { id: academiaId }, data: dados })
  })
}
