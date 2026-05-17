import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { BiometriaService } from './biometria.service'

const service = new BiometriaService()

export async function biometriaRoutes(app: FastifyInstance) {

  // ── Status do CompreFace ──────────────────────────────────────────────
  app.get('/status', { onRequest: [authMiddleware] }, async (req, reply) => {
    const status = await service.verificarStatus()
    return status
  })

  // ── Cadastrar face de um aluno ────────────────────────────────────────
  // POST /biometria/alunos/:id/face
  // Body: { image: "base64..." }
  app.post('/alunos/:alunoId/face', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { alunoId } = req.params as { alunoId: string }
    const { image } = req.body as { image: string }

    if (!image) return reply.status(400).send({ error: 'Campo "image" é obrigatório (base64)' })

    try {
      const resultado = await service.cadastrarFace(academiaId, alunoId, image)
      return resultado
    } catch (e: any) {
      return reply.status(422).send({ error: e.message })
    }
  })

  // ── Reconhecer face ────────────────────────────────────────────────────
  // POST /biometria/reconhecer
  // Body: { image: "base64..." }
  // Retorna aluno identificado ou { reconhecido: false }
  app.post('/reconhecer', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { image } = req.body as { image: string }

    if (!image) return reply.status(400).send({ error: 'Campo "image" é obrigatório (base64)' })

    try {
      const resultado = await service.reconhecerFace(academiaId, image)
      return resultado
    } catch (e: any) {
      return reply.status(422).send({ error: e.message })
    }
  })

  // ── Remover face de um aluno ───────────────────────────────────────────
  app.delete('/alunos/:alunoId/face', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { alunoId } = req.params as { alunoId: string }

    try {
      const resultado = await service.removerFace(academiaId, alunoId)
      return resultado
    } catch (e: any) {
      return reply.status(422).send({ error: e.message })
    }
  })

  // ── Reconhecimento para acesso via catraca (sem autenticação, com token) ──
  // POST /biometria/acesso
  // Body: { image: "base64...", academiaSlug: "minha-academia" }
  app.post('/acesso', async (req, reply) => {
    const { image, academiaSlug } = req.body as { image: string; academiaSlug: string }

    if (!image || !academiaSlug) {
      return reply.status(400).send({ error: 'image e academiaSlug são obrigatórios' })
    }

    const { prisma } = await import('../../lib/prisma')
    const academia = await prisma.academia.findUnique({ where: { slug: academiaSlug } })
    if (!academia) return reply.status(404).send({ error: 'Academia não encontrada' })

    try {
      const resultado = await service.reconhecerFace(academia.id, image)

      if (resultado.reconhecido && resultado.aluno) {
        // Registrar acesso biométrico
        await prisma.registroAcesso.create({
          data: {
            alunoId:    resultado.aluno.id,
            academiaId: academia.id,
            tipo:       'BIOMETRIA',
            resultado:  'LIBERADO',
          },
        })
      }

      return resultado
    } catch (e: any) {
      return reply.status(422).send({ error: e.message })
    }
  })
}
