import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { authRoutes } from './modules/auth/auth.routes'
import { academiasRoutes } from './modules/academias/academias.routes'
import { alunosRoutes } from './modules/alunos/alunos.routes'
import { planosRoutes } from './modules/planos/planos.routes'
import { acessoRoutes } from './modules/acesso/acesso.routes'
import { pagamentosRoutes } from './modules/pagamentos/pagamentos.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { adminRoutes } from './modules/admin/admin.routes'
import { notificacoesRoutes } from './modules/notificacoes/notificacoes.routes'
import { billingRoutes } from './modules/billing/billing.routes'
import { catracasRoutes } from './modules/catracas/catracas.routes'
import { seedWhatsappSession } from './integrations/whatsapp-baileys'
import { prisma } from './lib/prisma'
import { startJobs } from './jobs'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

async function bootstrap() {
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        process.env.WEB_URL ?? '',
        'https://web-gules-phi-97.vercel.app',
        'http://localhost:3000',
        'http://localhost:19006',
      ].filter(Boolean)

      // Permite qualquer subdomínio da Vercel (previews) e origens nulas (curl/Postman)
      if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
        cb(null, true)
      } else {
        cb(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  await app.register(jwt, { secret: process.env.JWT_SECRET ?? 'dev-secret-32chars-minimum!!' })

  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' })

  await app.register(swagger, {
    openapi: {
      info: { title: 'GYMFLOW API', version: '1.0.0', description: 'SaaS de gestão para academias' },
      servers: [{ url: process.env.API_URL ?? 'http://localhost:3001' }],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  })

  app.register(authRoutes,         { prefix: '/auth' })
  app.register(academiasRoutes,    { prefix: '/academias' })
  app.register(alunosRoutes,       { prefix: '/alunos' })
  app.register(planosRoutes,       { prefix: '/planos' })
  app.register(acessoRoutes,       { prefix: '/acesso' })
  app.register(pagamentosRoutes,   { prefix: '/pagamentos' })
  app.register(dashboardRoutes,    { prefix: '/dashboard' })
  app.register(adminRoutes,        { prefix: '/admin' })
  app.register(notificacoesRoutes, { prefix: '/notificacoes' })
  app.register(billingRoutes,      { prefix: '/billing' })
  app.register(catracasRoutes,     { prefix: '/catracas' })

  // ─── Seed temporário WhatsApp (público, chave secreta) ─────────────────────
  app.post('/seed-whatsapp', async (req, reply) => {
    if (req.headers['x-seed-key'] !== 'gymflow-seed-2026') {
      return reply.status(403).send({ error: 'Forbidden' })
    }
    const { academiaSlug, sessionFiles } = req.body as any
    const academia = await prisma.academia.findUnique({ where: { slug: academiaSlug } })
    if (!academia) return reply.status(404).send({ error: 'Academia não encontrada' })
    if (!sessionFiles || Object.keys(sessionFiles).length === 0) {
      return reply.status(400).send({ error: 'sessionFiles obrigatório' })
    }
    const resultado = await seedWhatsappSession(academia.id, sessionFiles)
    return { ok: true, academiaId: academia.id, ...resultado }
  })

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  app.setErrorHandler((error, req, reply) => {
    app.log.error(error)
    if (error.validation) {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.validation })
    }
    return reply.status(error.statusCode ?? 500).send({
      error: error.message ?? 'Erro interno do servidor',
    })
  })

  startJobs()

  const porta = Number(process.env.PORT) || 3001
  await app.listen({ port: porta, host: '0.0.0.0' })
  console.log(`\n🚀 GYMFLOW API rodando em http://localhost:${porta}`)
  console.log(`📚 Documentação: http://localhost:${porta}/docs\n`)
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar servidor:', err)
  process.exit(1)
})
