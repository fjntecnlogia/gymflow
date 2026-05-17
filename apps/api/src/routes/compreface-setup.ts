import { FastifyInstance } from 'fastify'
import { Pool } from 'pg'

/**
 * Rota temporária para ativar usuário no CompreFace via banco interno Railway
 * Remover após configuração inicial
 */
export async function compreFaceSetupRoutes(app: FastifyInstance) {
  // Endpoint temporário — protegido por chave secreta
  app.post('/compreface-setup/activate-user', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const pool = new Pool({
      host: 'compreface-db.railway.internal',
      port: 5432,
      database: 'compreface',
      user: 'compreface',
      password: 'CF@2026!',
      connectionTimeoutMillis: 10000,
    })

    try {
      const client = await pool.connect()

      // Ativar todos os usuários pendentes
      const activateResult = await client.query(
        `UPDATE "user" SET enabled = true, name = COALESCE(name, email) WHERE enabled = false RETURNING email, enabled`
      )

      // Verificar usuários existentes
      const usersResult = await client.query(
        `SELECT email, enabled, global_role FROM "user" LIMIT 10`
      )

      // Criar token de API key se não existir (para uso direto)
      client.release()
      await pool.end()

      return {
        ok: true,
        activated: activateResult.rows,
        users: usersResult.rows,
      }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // Verificar usuários no CompreFace DB
  app.get('/compreface-setup/users', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const pool = new Pool({
      host: 'compreface-db.railway.internal',
      port: 5432,
      database: 'compreface',
      user: 'compreface',
      password: 'CF@2026!',
      connectionTimeoutMillis: 10000,
    })

    try {
      const client = await pool.connect()
      const r = await client.query(`SELECT email, enabled, global_role FROM "user" LIMIT 20`)
      client.release()
      await pool.end()
      return { users: r.rows }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
