import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AlunosService } from './alunos.service'
import { criarAlunoSchema, atualizarAlunoSchema, filtroAlunoSchema } from './alunos.schema'
import { gerarTokenPrimeiroAcessoAluno, gerarTokenResetSenhaAluno } from '../auth/aluno-auth.service'
import { enviarEmail, templateConviteAluno, templateResetSenhaAluno } from '../../integrations/email'
import { prisma } from '../../lib/prisma'
import QRCode from 'qrcode'

const service = new AlunosService()
const APP_ALUNO_URL = process.env.APP_ALUNO_URL ?? 'https://app.gymflowgestor.com.br'

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

  // Enviar convite de primeiro acesso (gestor → aluno)
  app.post('/:id/enviar-convite', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }

    const aluno = await service.buscarPorId(academiaId, id)
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })
    if (!aluno.email) return reply.status(400).send({ error: 'Aluno não possui e-mail cadastrado' })

    const academia = await prisma.academia.findUnique({ where: { id: academiaId }, select: { nome: true } })
    const token = await gerarTokenPrimeiroAcessoAluno(id)
    const link = `${APP_ALUNO_URL}/primeiro-acesso?token=${token}`

    await enviarEmail({
      to: aluno.email,
      subject: `Seu acesso ao app — ${academia?.nome ?? 'GymFlow Gestor'}`,
      html: templateConviteAluno({
        nomeAluno: aluno.nome,
        nomeAcademia: academia?.nome ?? 'sua academia',
        link,
      }),
    })

    return reply.status(200).send({ message: 'Convite enviado com sucesso' })
  })

  // Resetar senha do aluno (gestor → aluno).
  // Se o aluno ainda não tem senha (nunca fez primeiro acesso), dispara
  // automaticamente o convite de primeiro acesso. UX de um botão só.
  app.post('/:id/resetar-senha', { onRequest: [authMiddleware] }, async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }

    const aluno = await service.buscarPorId(academiaId, id)
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })
    if (!aluno.email) return reply.status(400).send({ error: 'Aluno não possui e-mail cadastrado' })

    const academia = await prisma.academia.findUnique({ where: { id: academiaId }, select: { nome: true } })
    const nomeAcademia = academia?.nome ?? 'sua academia'

    const result = await gerarTokenResetSenhaAluno(aluno.email)

    if (result.token) {
      const link = `${APP_ALUNO_URL}/aluno/redefinir-senha?token=${result.token}`
      await enviarEmail({
        to: aluno.email,
        subject: `Redefinição de senha — ${academia?.nome ?? 'GymFlow Gestor'}`,
        html: templateResetSenhaAluno({ nomeAluno: aluno.nome, nomeAcademia, link }),
      })
      return reply.status(200).send({
        tipoEnvio: 'reset',
        message: 'E-mail de redefinição enviado com sucesso',
      })
    }

    // Fallback: aluno ainda sem senha → manda convite de primeiro acesso
    const tokenConvite = await gerarTokenPrimeiroAcessoAluno(id)
    const linkConvite = `${APP_ALUNO_URL}/primeiro-acesso?token=${tokenConvite}`
    await enviarEmail({
      to: aluno.email,
      subject: `Seu acesso ao app — ${academia?.nome ?? 'GymFlow Gestor'}`,
      html: templateConviteAluno({ nomeAluno: aluno.nome, nomeAcademia, link: linkConvite }),
    })
    return reply.status(200).send({
      tipoEnvio: 'primeiro_acesso',
      message: 'Aluno ainda não tinha senha. Enviamos um convite de primeiro acesso.',
    })
  })
}
