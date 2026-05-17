import { FastifyInstance } from 'fastify'
import { Pool } from 'pg'

/**
 * Rota temporária para ativar usuário no CompreFace via banco interno Railway
 * Remover após configuração inicial
 */

function makePool() {
  return new Pool({
    host: 'compreface-db.railway.internal',
    port: 5432,
    database: 'compreface',
    user: 'compreface',
    password: 'CF@2026!',
    connectionTimeoutMillis: 10000,
  })
}

export async function compreFaceSetupRoutes(app: FastifyInstance) {

  // ── Ativar usuários pendentes ─────────────────────────────────────────────
  app.post('/compreface-setup/activate-user', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()
      // Ativar sem coluna name (não existe no schema CompreFace)
      const activateResult = await client.query(
        `UPDATE "user" SET enabled = true WHERE enabled = false RETURNING email, enabled`
      )
      const usersResult = await client.query(
        `SELECT email, enabled, global_role FROM "user" LIMIT 10`
      )
      client.release()
      await pool.end()
      return { ok: true, activated: activateResult.rows, users: usersResult.rows }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Verificar usuários (com hash da senha para diagnóstico) ───────────────
  app.get('/compreface-setup/users', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()
      const r = await client.query(
        `SELECT id, email, enabled, global_role, password FROM "user" LIMIT 20`
      )
      client.release()
      await pool.end()
      return { users: r.rows }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Reset de senha via hash bcrypt pré-computado ─────────────────────────
  // Senha padrão "Admin@2026!" → hash: $2b$10$xS4u7dAh859uPIrWd4dMF.L1TOHuOfrQ1aYbZG3G9//bJeoKImNQC
  app.post('/compreface-setup/reset-password', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const body = req.body as any
    const email = body?.email ?? 'admin@gymflow.com'
    const passwordHash = body?.newPasswordHash ??
      '$2b$10$xS4u7dAh859uPIrWd4dMF.L1TOHuOfrQ1aYbZG3G9//bJeoKImNQC'

    const pool = makePool()
    try {
      const client = await pool.connect()

      // Só atualiza password e enabled (sem coluna name)
      const result = await client.query(
        `UPDATE "user"
         SET password = $2, enabled = true
         WHERE email = $1
         RETURNING id, email, enabled, global_role`,
        [email, passwordHash]
      )

      client.release()
      await pool.end()

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: `Usuário ${email} não encontrado` })
      }

      return {
        ok: true,
        user: result.rows[0],
        senhaDefinida: 'Admin@2026!',
        hint: 'Use esta senha no OAuth: grant_type=password&username=admin@gymflow.com&password=Admin@2026!',
      }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Inspecionar colunas + dados de tabelas ────────────────────────────────
  app.get('/compreface-setup/inspect', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()

      // Colunas de user e app
      const userCols = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 'user' ORDER BY ordinal_position`
      )
      const appCols = await client.query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 'app' ORDER BY ordinal_position`
      )
      // Apps existentes com todos os campos
      const apps = await client.query(`SELECT * FROM "app" LIMIT 10`)

      // Tentar listar API keys (pode estar em model ou outro lugar)
      let models: any[] = []
      try {
        const m = await client.query(`SELECT * FROM "model" LIMIT 10`)
        models = m.rows
      } catch {}

      client.release()
      await pool.end()
      return {
        userColumns: userCols.rows,
        appColumns: appCols.rows,
        apps: apps.rows,
        models,
      }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Full user + account activation ───────────────────────────────────────
  app.post('/compreface-setup/full-activate', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()
      // Ativar conta completamente (todos os flags de segurança)
      const result = await client.query(
        `UPDATE "user"
         SET enabled = true,
             account_non_expired = true,
             account_non_locked = true,
             credentials_non_expired = true,
             registration_token = null
         WHERE email = 'admin@gymflow.com'
         RETURNING id, email, enabled, account_non_expired, account_non_locked, credentials_non_expired, global_role`
      )
      // Verificar oauth_client_details
      const oauth = await client.query(`SELECT client_id, client_secret, authorized_grant_types FROM oauth_client_details LIMIT 5`)
      client.release()
      await pool.end()
      return { ok: true, user: result.rows[0], oauthClients: oauth.rows }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Listar TODAS as tabelas do schema CompreFace ──────────────────────────
  app.get('/compreface-setup/schema', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()
      const tables = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      )
      const counts: Record<string, number> = {}
      for (const t of tables.rows.map((r: any) => r.table_name)) {
        try {
          const c = await client.query(`SELECT COUNT(*) FROM "${t}"`)
          counts[t] = parseInt(c.rows[0].count)
        } catch {
          counts[t] = -1
        }
      }
      client.release()
      await pool.end()
      return { tables: tables.rows.map((r: any) => r.table_name), counts }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
}
