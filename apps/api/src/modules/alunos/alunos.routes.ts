import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AlunosService } from './alunos.service'
import { criarAlunoSchema, atualizarAlunoSchema, filtroAlunoSchema } from './alunos.schema'
import QRCode from 'qrcode'

const service = new AlunosService()

export async function alunosRoutes(app: FastifyInstance) {
  // Rota do app mobile — perfil do aluno logado
  app.get('/meu-perfil', { onRequest: [authMiddleware] }, async (req, reply) => {
    const aluno = (req as any).aluno
    if (!aluno) return reply.status(403).send({ error: 'Apenas alunos podem acessar esta rota' })

    const perfil = await service.buscarPorId(aluno.academiaId, aluno.id)
    return perfil
  })

  // Gerar QR Code como imagem base64
  app.get('/:id/qrcode', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const aluno = await service.buscarPorId(academiaId, id)
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })

    const qrDataUrl = await QRCode.toDataURL(aluno.qrCodeToken, {
      width: 300,
      margin: 2,
      color: { dark: '#08080F', light: '#FFFFFF' },
    })

    return { qrCode: qrDataUrl, token: aluno.qrCodeToken }
  })

  // Listar todos (dashboard dono)
  app.get('/', { onRequest: [authMiddleware] }, async (req) => {
    const academiaId = (req as any).academiaId
    const filtros = filtroAlunoSchema.parse(req.query)
    return service.listar(academiaId, filtros)
  })

  app.get('/:id', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const aluno = await service.buscarPorId(academiaId, id)
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })
    return aluno
  })

  app.post('/', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const dados = criarAlunoSchema.parse(req.body)
    const aluno = await service.criar(academiaId, dados)
    return reply.status(201).send(aluno)
  })

  app.put('/:id', { onRequest: [authMiddleware] }, async (req) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const dados = atualizarAlunoSchema.parse(req.body)
    return service.atualizar(academiaId, id, dados)
  })

  app.patch('/:id/status', { onRequest: [authMiddleware] }, async (req) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: string }
    return service.atualizarStatus(academiaId, id, status)
  })
}
