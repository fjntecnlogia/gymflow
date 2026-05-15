import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { FacialService } from '../../integrations/facial'
import { AcessoService } from './acesso.service'
import { prisma } from '../../lib/prisma'

const service = new AcessoService()
const facialService = new FacialService()

export async function acessoRoutes(app: FastifyInstance) {

  // ─── QR Code (chamado pela catraca ou app — sem JWT) ─────────────────────────
  app.post('/verificar', async (req, reply) => {
    const { qrCodeToken, catracaId, academiaId } = req.body as {
      qrCodeToken: string; catracaId?: string; academiaId: string
    }
    if (!qrCodeToken || !academiaId) {
      return reply.status(400).send({ error: 'qrCodeToken e academiaId são obrigatórios' })
    }
    return service.verificarQrCode(academiaId, qrCodeToken, catracaId)
  })

  // ─── Reconhecimento facial (chamado pelo app/totem — sem JWT) ────────────────
  app.post('/facial', async (req, reply) => {
    const { foto, academiaId, catracaId } = req.body as {
      foto: string       // Base64 (com ou sem prefixo data URI)
      academiaId: string
      catracaId?: string
    }
    if (!foto || !academiaId) {
      return reply.status(400).send({ error: 'foto e academiaId são obrigatórios' })
    }
    return service.verificarFacial(academiaId, foto, catracaId)
  })

  // ─── Status do serviço facial (protegido) ────────────────────────────────────
  app.get('/facial/status', { onRequest: [authMiddleware] }, async () => {
    const online = await facialService.verificarStatus()
    const total = online ? await facialService.contarFaces() : 0
    return { online, totalFacesCadastradas: total }
  })

  // ─── Cadastrar / atualizar face de aluno (protegido) ─────────────────────────
  app.post('/facial/cadastrar/:alunoId', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { alunoId } = req.params as { alunoId: string }
    const { foto } = req.body as { foto: string }

    if (!foto) return reply.status(400).send({ error: 'foto é obrigatória (base64)' })

    const aluno = await prisma.aluno.findFirst({ where: { id: alunoId, academiaId } })
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })

    // Remove face anterior se existir
    if (aluno.faceId) {
      await facialService.removerFace(aluno.id)
    }

    const resultado = await facialService.cadastrarFace(aluno.id, foto)

    if (!resultado.ok) {
      return reply.status(422).send({ error: `Falha no reconhecimento: ${resultado.erro}` })
    }

    // Salvar faceId e fotoUrl no aluno
    const atualizado = await prisma.aluno.update({
      where: { id: alunoId },
      data: {
        faceId: aluno.id,
        fotoUrl: foto.startsWith('data:') ? foto : `data:image/jpeg;base64,${foto}`,
      },
    })

    return { ok: true, alunoId: atualizado.id, faceId: atualizado.faceId }
  })

  // ─── Remover face cadastrada ─────────────────────────────────────────────────
  app.delete('/facial/remover/:alunoId', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { alunoId } = req.params as { alunoId: string }

    const aluno = await prisma.aluno.findFirst({ where: { id: alunoId, academiaId } })
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })

    await facialService.removerFace(aluno.id)
    await prisma.aluno.update({ where: { id: alunoId }, data: { faceId: null } })

    return { ok: true }
  })

  // ─── Rotas protegidas do dashboard ──────────────────────────────────────────
  app.get('/', { onRequest: [authMiddleware] }, async (req) => {
    return service.listarAcessos((req as any).academiaId, req.query as any)
  })

  app.get('/hoje', { onRequest: [authMiddleware] }, async (req) => {
    return service.acessosHoje((req as any).academiaId)
  })

  app.post('/sincronizar-catraca/:catracaId', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { catracaId } = req.params as { catracaId: string }
    try {
      return await service.sincronizarCatraca(academiaId, catracaId)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}
