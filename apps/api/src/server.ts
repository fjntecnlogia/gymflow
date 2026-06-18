import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { authRoutes } from './modules/auth/auth.routes'
import { alunoAuthRoutes } from './modules/auth/aluno-auth.routes'
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
import { biometriaRoutes } from './modules/biometria/biometria.routes'
import { agendamentosRoutes } from './modules/agendamentos/agendamentos.routes'
import { seedWhatsappSession } from './integrations/whatsapp-baileys'
import { prisma } from './lib/prisma'
import { startJobs } from './jobs'
import { compreFaceSetupRoutes } from './routes/compreface-setup'

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
        'http://localhost:3000',
        'http://localhost:19006',
      ].filter(Boolean)

      if (!origin && process.env.NODE_ENV !== 'production') {
        cb(null, true)
      } else if (origin && allowed.includes(origin)) {
        cb(null, true)
      } else {
        cb(null, false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET é obrigatório — defina no Railway antes de subir')
  }
  await app.register(jwt, { secret: process.env.JWT_SECRET })

  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' })

  await app.register(swagger, {
    openapi: {
      info: { title: 'GymFlow Gestor API', version: '1.0.0', description: 'SaaS de gestão para academias' },
      servers: [{ url: process.env.API_URL ?? 'http://localhost:3001' }],
      security: [{ bearerAuth: [] }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })

  if (process.env.NODE_ENV !== 'production') {
    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: false },
    })
  }

  app.register(authRoutes,         { prefix: '/auth' })
  app.register(alunoAuthRoutes,    { prefix: '/auth/aluno' })
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
  app.register(biometriaRoutes,   { prefix: '/biometria' })
  app.register(agendamentosRoutes, { prefix: '/agendamentos' })

  app.post('/seed-whatsapp', async (req, reply) => {
    const seedKey = process.env.SEED_KEY
    if (!seedKey || req.headers['x-seed-key'] !== seedKey) {
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

  app.register(compreFaceSetupRoutes)

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  app.setErrorHandler((error, req, reply) => {
    app.log.error({ msg: error.message, statusCode: error.statusCode, url: req.url })
    if (error.validation) {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.validation })
    }
    const isProd = process.env.NODE_ENV === 'production'
    return reply.status(error.statusCode ?? 500).send({
      error: isProd && !error.statusCode ? 'Erro interno do servidor' : error.message,
    })
  })

  startJobs()

  const porta = Number(process.env.PORT) || 3001
  await app.listen({ port: porta, host: '0.0.0.0' })
  app.log.info(`GymFlow Gestor API rodando na porta ${porta}`)
}

bootstrap().catch((err) => {
  console.error('Falha ao iniciar servidor:', err)
  process.exit(1)
})
