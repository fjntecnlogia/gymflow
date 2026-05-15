import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { CatracaService, ModeloCatraca } from '../../integrations/catraca'
import { prisma } from '../../lib/prisma'

export async function catracasRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // ─── Listar catracas da academia ─────────────────────────────────────────────
  app.get('/', async (req) => {
    const academiaId = (req as any).academiaId
    return prisma.catraca.findMany({ where: { academiaId }, orderBy: { nome: 'asc' } })
  })

  // ─── Criar catraca ───────────────────────────────────────────────────────────
  app.post('/', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { nome, ip, credencial, modelo } = req.body as {
      nome: string
      ip: string
      credencial: string
      modelo?: ModeloCatraca
    }

    if (!nome || !ip || !credencial) {
      return reply.status(400).send({ error: 'nome, ip e credencial são obrigatórios' })
    }

    const catraca = await prisma.catraca.create({
      data: {
        academiaId,
        nome,
        ip,
        apiKey: credencial,
        modelo: modelo ?? 'GENERICO',
      },
    })
    return reply.status(201).send(catraca)
  })

  // ─── Atualizar catraca ───────────────────────────────────────────────────────
  app.put('/:id', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const { nome, ip, credencial, modelo, ativa } = req.body as any

    const catraca = await prisma.catraca.findFirst({ where: { id, academiaId } })
    if (!catraca) return reply.status(404).send({ error: 'Catraca não encontrada' })

    return prisma.catraca.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(ip && { ip }),
        ...(credencial && { apiKey: credencial }),
        ...(modelo && { modelo }),
        ...(ativa !== undefined && { ativa }),
      },
    })
  })

  // ─── Remover catraca ─────────────────────────────────────────────────────────
  app.delete('/:id', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }

    const catraca = await prisma.catraca.findFirst({ where: { id, academiaId } })
    if (!catraca) return reply.status(404).send({ error: 'Catraca não encontrada' })

    await prisma.catraca.delete({ where: { id } })
    return { ok: true }
  })

  // ─── Testar conexão ──────────────────────────────────────────────────────────
  app.post('/:id/testar', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }

    const catraca = await prisma.catraca.findFirst({ where: { id, academiaId } })
    if (!catraca) return reply.status(404).send({ error: 'Catraca não encontrada' })

    const svc = new CatracaService(catraca.modelo as ModeloCatraca)
    const conectada = await svc.testarConexao(catraca.ip, catraca.apiKey)

    await prisma.catraca.update({
      where: { id },
      data: { ultimoStatus: conectada ? 'ONLINE' : 'OFFLINE' },
    })

    return { conectada, ip: catraca.ip, nome: catraca.nome }
  })

  // ─── Liberar acesso manual (botão no dashboard) ──────────────────────────────
  app.post('/:id/liberar/:alunoId', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id, alunoId } = req.params as { id: string; alunoId: string }

    const [catraca, aluno] = await Promise.all([
      prisma.catraca.findFirst({ where: { id, academiaId } }),
      prisma.aluno.findFirst({ where: { id: alunoId, academiaId } }),
    ])

    if (!catraca) return reply.status(404).send({ error: 'Catraca não encontrada' })
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })

    const svc = new CatracaService(catraca.modelo as ModeloCatraca)
    const result = await svc.liberarAcesso(catraca.ip, catraca.apiKey, alunoId)

    await prisma.registroAcesso.create({
      data: {
        academiaId,
        alunoId,
        catracaId: id,
        tipo: 'MANUAL',
        resultado: result.liberado ? 'LIBERADO' : 'BLOQUEADO',
        motivoBloqueio: result.liberado ? null : result.mensagem,
      },
    })

    return result
  })

  // ─── Sincronizar alunos ativos na catraca ────────────────────────────────────
  app.post('/:id/sincronizar', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }

    const catraca = await prisma.catraca.findFirst({ where: { id, academiaId } })
    if (!catraca) return reply.status(404).send({ error: 'Catraca não encontrada' })

    const alunos = await prisma.aluno.findMany({
      where: {
        academiaId,
        status: 'ATIVO',
        matriculas: { some: { status: 'ATIVA' } },
      },
      select: { id: true, nome: true, qrCodeToken: true },
    })

    const lista = alunos
      .filter((a) => a.qrCodeToken)
      .map((a) => ({ id: a.id, nome: a.nome, qrCodeToken: a.qrCodeToken! }))

    const svc = new CatracaService(catraca.modelo as ModeloCatraca)
    const resultado = await svc.sincronizarLista(catraca.ip, catraca.apiKey, lista)

    return { ...resultado, totalAlunos: lista.length }
  })

  // ─── Log de acessos pela catraca ─────────────────────────────────────────────
  app.get('/:id/logs', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { id } = req.params as { id: string }
    const { limit = 50 } = req.query as any

    const catraca = await prisma.catraca.findFirst({ where: { id, academiaId } })
    if (!catraca) return reply.status(404).send({ error: 'Catraca não encontrada' })

    return prisma.registroAcesso.findMany({
      where: { catracaId: id, academiaId },
      include: { aluno: { select: { id: true, nome: true, fotoUrl: true } } },
      orderBy: { criadoEm: 'desc' },
      take: Number(limit),
    })
  })

  // ─── Webhook de eventos da catraca (catraca empurra eventos) ────────────────
  // Rota pública — não precisa de authMiddleware
  app.post(
    '/webhook/:academiaSlug',
    { onRequest: [] as any },
    async (req, reply) => {
      const { academiaSlug } = req.params as { academiaSlug: string }

      const academia = await prisma.academia.findUnique({ where: { slug: academiaSlug } })
      if (!academia) return reply.status(404).send({ error: 'Academia não encontrada' })

      const body = req.body as any
      const alunoId: string = body.user_id ?? body.userId ?? body.card_user
      const catracaId: string | undefined = body.device_id ?? body.deviceId

      if (!alunoId) return { autorizado: false, motivo: 'user_id ausente' }

      const aluno = await prisma.aluno.findFirst({
        where: { id: alunoId, academiaId: academia.id },
        include: { matriculas: { where: { status: 'ATIVA' }, take: 1 } },
      })

      const autorizado = !!(aluno && aluno.status === 'ATIVO' && aluno.matriculas.length > 0)

      await prisma.registroAcesso.create({
        data: {
          academiaId: academia.id,
          alunoId: aluno?.id ?? alunoId,
          catracaId: catracaId ?? null,
          tipo: 'WEBHOOK',
          resultado: autorizado ? 'LIBERADO' : 'BLOQUEADO',
          motivoBloqueio: autorizado
            ? null
            : aluno
            ? 'Matrícula inativa'
            : 'Aluno não encontrado',
        },
      })

      return reply.status(200).send({ autorizado })
    },
  )
}
