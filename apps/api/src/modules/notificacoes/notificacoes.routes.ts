import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { seedWhatsappSession } from '../../integrations/whatsapp-baileys'
import { getWhatsAppService } from '../../integrations/whatsapp-direct'
import { prisma } from '../../lib/prisma'

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
    const academiaId = (req as any).academiaId
    // Verificar se tem sessão no banco
    const temSessao = await prisma.whatsappSession.count({
      where: { academiaId, key: 'creds' },
    })
    if (!temSessao) return { conectado: false }

    try {
      const svc = await getWhatsAppService(academiaId)
      return { conectado: svc.isConectado() }
    } catch {
      return { conectado: false }
    }
  })

  // ─── Conectar WhatsApp via sessão PostgreSQL ─────────────────────────────────
  app.post('/whatsapp/conectar', async (req, reply) => {
    const academiaId = (req as any).academiaId

    // Verificar se tem sessão salva
    const temSessao = await prisma.whatsappSession.count({
      where: { academiaId, key: 'creds' },
    })

    if (!temSessao) {
      return {
        conectado: false,
        qrCode: null,
        message: 'Nenhuma sessão encontrada. Use o app local para conectar e sincronizar a sessão.',
      }
    }

    try {
      const svc = await getWhatsAppService(academiaId)
      const conectado = svc.isConectado()
      return {
        conectado,
        qrCode: null,
        message: conectado
          ? '✅ WhatsApp conectado via sessão salva!'
          : '⏳ Conectando... aguarde alguns segundos e verifique novamente.',
      }
    } catch (err: any) {
      return reply.status(500).send({ error: `Erro ao iniciar serviço: ${err.message}` })
    }
  })

  // ─── Desconectar WhatsApp ───────────────────────────────────────────────────
  app.post('/whatsapp/desconectar', async (req) => {
    const academiaId = (req as any).academiaId
    await prisma.whatsappSession.deleteMany({ where: { academiaId } })
    return { ok: true, message: 'Sessão removida do banco. Reconecte via app local.' }
  })

  // ─── Enviar mensagem de teste ───────────────────────────────────────────────
  app.post('/whatsapp/teste', async (req, reply) => {
    const academiaId = (req as any).academiaId
    const { telefone, mensagem } = req.body as { telefone: string; mensagem: string }
    if (!telefone || !mensagem) return reply.status(400).send({ error: 'telefone e mensagem obrigatórios' })

    try {
      const svc = await getWhatsAppService(academiaId)
      const ok = await svc.enviarMensagem(telefone, mensagem)

      // Log
      await prisma.notificacaoLog.create({
        data: {
          academiaId,
          canal: 'WHATSAPP',
          tipo: 'teste',
          destinatario: telefone,
          mensagem,
          status: ok ? 'ENVIADO' : 'ERRO',
        },
      }).catch(() => {})

      return { ok, message: ok ? 'Mensagem enviada!' : 'Falha ao enviar — WhatsApp desconectado?' }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
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
    const msgText = `Olá, *${aluno.nome}*! 👋\n\nLembrando que ${mat ? `seu plano *${mat.plano.nome}* vence em breve` : 'sua mensalidade está pendente'}.\n\nQualquer dúvida, fale conosco! 💪\n\n_GYMFLOW_`

    try {
      const svc = await getWhatsAppService(academiaId)
      const ok = await svc.enviarMensagem(aluno.telefone, msgText)

      await prisma.notificacaoLog.create({
        data: {
          academiaId,
          alunoId,
          canal: 'WHATSAPP',
          tipo: 'cobranca_manual',
          destinatario: aluno.telefone,
          mensagem: msgText,
          status: ok ? 'ENVIADO' : 'ERRO',
        },
      }).catch(() => {})

      return { ok }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
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
