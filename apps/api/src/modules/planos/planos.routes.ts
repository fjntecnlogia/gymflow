import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { prisma } from '../../lib/prisma'
import { z } from 'zod'

const criarPlanoSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  valor: z.number().positive(),
  duracaoDias: z.number().int().positive(),
  tipo: z.enum(['DIARIO','SEMANAL','MENSAL','TRIMESTRAL','SEMESTRAL','ANUAL']).default('MENSAL'),
  permiteCongelar: z.boolean().default(false),
  limiteTreinos: z.number().optional(),
})

export async function planosRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/', async (req) => {
    const academiaId = (req as any).academiaId
    return prisma.plano.findMany({ where: { academiaId, ativo: true }, orderBy: { valor: 'asc' } })
  })

  app.post('/', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const dados = criarPlanoSchema.parse(req.body)
    const plano = await prisma.plano.create({ data: { ...dados, academiaId } })
    return reply.status(201).send(plano)
  })

  app.put('/:id', async (req) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const dados = criarPlanoSchema.partial().parse(req.body)
    return prisma.plano.update({ where: { id, academiaId }, data: dados })
  })

  app.delete('/:id', async (req) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    return prisma.plano.update({ where: { id, academiaId }, data: { ativo: false } })
  })

  app.post('/:planoId/matricular', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { planoId } = req.params as { planoId: string }
    const { alunoId, dataInicio } = req.body as { alunoId: string; dataInicio?: string }

    const plano = await prisma.plano.findFirst({ where: { id: planoId, academiaId } })
    if (!plano) return reply.status(404).send({ error: 'Plano não encontrado' })

    const inicio = dataInicio ? new Date(dataInicio) : new Date()
    const vencimento = new Date(inicio)
    vencimento.setDate(vencimento.getDate() + plano.duracaoDias)

    const matricula = await prisma.matricula.create({
      data: {
        academiaId,
        alunoId,
        planoId,
        dataInicio: inicio,
        dataVencimento: vencimento,
        valorPago: plano.valor,
        status: 'ATIVA',
      },
    })

    return reply.status(201).send(matricula)
  })
}
