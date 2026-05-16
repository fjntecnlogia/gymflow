import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { WhatsAppService } from '../../integrations/whatsapp'
import { seedWhatsappSession } from '../../integrations/whatsapp-baileys'
import { prisma } from '../../lib/prisma'

const wa = new WhatsAppService()

export async function notificacoesRoutes(app: FastifyInstance) {
  // ─── Seed temporário (PÚBLICO — chave secreta, antes do authMiddleware) ──────
  app.post('/whatsapp/seed-session', async (req, reply) => {
    const seedKey = req.headers['x-seed-key']
    if (seedKey !== 'gymflow-seed-2026') {
      return reply.status(403).send({ error: 'Chave inválida' })
    }
    const { academiaSlug, sessionFiles } = req.body as {
      academiaSlug: string
      sessionFiles: Record<string, string>
    }
    const academia = await prisma.academia.findUnique({ where: { slug: academiaSlug } })
    if (!academia) return reply.status(404).send({ error: 'Academia não encontrada' })
    if (!sessionFiles || Object.keys(sessionFiles).length === 0) {
      return reply.status(400).send({ error: 'sessionFiles é obrigatório' })
    }
    const resultado = await seedWhatsappSession(academia.id, sessionFiles)
    return { ok: true, academiaId: academia.id, ...resultado }
  })

  app.addHook('onRequest', authMiddleware)

  // ─── Status da conexão WhatsApp ─────────────────────────────────────────────
  app.get('/whatsapp/status', async (req) => {
    const conectado = await wa.verificarConexao()
    return { conectado }
  })

  // ─── Conectar WhatsApp (gera QR Code) ───────────────────────────────────────
  app.post('/whatsapp/conectar', async (req, reply) => {
    try {
      // Primeiro tenta criar a instância
      await wa.criarInstancia()
    } catch {
      // Instância pode já existir — tudo bem
    }

    try {
      const qrData = await wa.obterQrCode()
      const conectado = await wa.verificarConexao()
      return {
        conectado,
        qrCode: qrData?.qrcode?.base64 ?? qrData?.base64 ?? null,
        message: conectado ? 'WhatsApp já conectado!' : 'Escaneie o QR Code com o WhatsApp',
      }
    } catch (err: any) {
      return reply.status(400).send({ error: `Erro ao conectar: ${err.message}` })
    }
  })

  // ─── Desconectar WhatsApp ───────────────────────────────────────────────────
  app.post('/whatsapp/desconectar', async () => {
    try {
      const wa2 = new WhatsAppService()
      await wa2.api.delete(`/instance/logout/${process.env.EVOLUTION_INSTANCE}`)
      return { ok: true }
    } catch { return { ok: false } }
  })

  // ─── Enviar mensagem de teste ───────────────────────────────────────────────
  app.post('/whatsapp/teste', async (req, reply) => {
    const { telefone, mensagem } = req.body as { telefone: string; mensagem: string }
    if (!telefone || !mensagem) return reply.status(400).send({ error: 'telefone e mensagem obrigatórios' })

    const ok = await wa.enviarMensagem({ telefone, mensagem })
    return { ok, message: ok ? 'Mensagem enviada!' : 'Falha ao enviar' }
  })

  // ─── Enviar cobrança manual ─────────────────────────────────────────────────
  app.post('/whatsapp/cobrar/:alunoId', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { alunoId } = req.params as { alunoId: string }

    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, academiaId },
      include: { matriculas: { where: { status: 'ATIVA' }, include: { plano: true }, take: 1 } },
    })
    if (!aluno) return reply.status(404).send({ error: 'Aluno não encontrado' })
    if (!aluno.telefone) return reply.status(400).send({ error: 'Aluno sem telefone cadastrado' })

    const mat = aluno.matriculas[0]
    await wa.enviarMensagem({
      telefone: aluno.telefone,
      mensagem: `Olá, *${aluno.nome}*! 👋\n\nLembrando que ${mat ? `seu plano *${mat.plano.nome}* vence em breve` : 'sua mensalidade está pendente'}.\n\nQualquer dúvida, fale conosco! 💪\n\n_GYMFLOW_`,
      academiaId,
      alunoId,
      tipo: 'cobranca_manual',
    })
    return { ok: true }
  })

  // ─── Log de notificações ────────────────────────────────────────────────────
  app.get('/log', async (req) => {
    const academiaId = (req as any).academiaId
    const { limit = 50, canal } = req.query as any
    return prisma.notificacaoLog.findMany({
      where: { academiaId, ...(canal && { canal }) },
      orderBy: { criadoEm: 'desc' },
      take: Number(limit),
    })
  })


  // ─── Stats de notificações ──────────────────────────────────────────────────
  app.get('/stats', async (req) => {
    const academiaId = (req as any).academiaId
    const total = await prisma.notificacaoLog.count({ where: { academiaId } })
    const enviados = await prisma.notificacaoLog.count({ where: { academiaId, status: 'ENVIADO' } })
    const erros = await prisma.notificacaoLog.count({ where: { academiaId, status: 'ERRO' } })
    return { total, enviados, erros, taxaSucesso: total > 0 ? Math.round((enviados / total) * 100) : 0 }
  })
}
