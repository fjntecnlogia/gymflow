import { FastifyInstance } from 'fastify'
import { authMiddleware } from '../../middleware/auth.middleware'
import { DashboardService } from './dashboard.service'

const service = new DashboardService()

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/kpis', async (req) => service.kpis((req as any).academiaId))
  app.get('/acessos-por-dia', async (req) => service.acessosPorDia((req as any).academiaId))
  app.get('/ultimos-acessos', async (req) => service.ultimosAcessos((req as any).academiaId))
}
