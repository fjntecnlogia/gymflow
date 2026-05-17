import { FastifyInstance } from 'fastify'
import { Pool } from 'pg'
import { createHash } from 'crypto'

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
      const activateResult = await client.query(
        `UPDATE "user" SET enabled = true, name = COALESCE(name, email) WHERE enabled = false RETURNING email, enabled`
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

  // ── Reset de senha via bcrypt pré-computado ───────────────────────────────
  // A senha padrão do CompreFace no primeiro boot é "password" (hash fixo da imagem)
  // Usamos o hash bcrypt gerado pelo próprio Spring ao inicializar
  app.post('/compreface-setup/reset-password', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const { email, newPasswordHash } = req.body as any

    if (!email || !newPasswordHash) {
      return reply.status(400).send({ error: 'email e newPasswordHash são obrigatórios' })
    }

    const pool = makePool()
    try {
      const client = await pool.connect()

      // Atualizar senha e garantir que está ativo
      const result = await client.query(
        `UPDATE "user"
         SET password = $2, enabled = true, name = COALESCE(name, email)
         WHERE email = $1
         RETURNING id, email, enabled, global_role`,
        [email, newPasswordHash]
      )

      client.release()
      await pool.end()

      if (result.rows.length === 0) {
        return reply.status(404).send({ error: `Usuário ${email} não encontrado` })
      }

      return { ok: true, user: result.rows[0] }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Gerar API Key diretamente no CompreFace DB ────────────────────────────
  // Cria uma API Key para o subject RECOGNITION no banco interno
  app.post('/compreface-setup/create-api-key', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const { applicationName } = req.body as any || {}
    const appName = applicationName ?? 'GYMFLOW'

    const pool = makePool()
    try {
      const client = await pool.connect()

      // Verificar se já existe uma aplicação com esse nome
      const existingApp = await client.query(
        `SELECT a.id, a.name, ak.api_key, ak.role_type
         FROM app a
         LEFT JOIN app_api_key ak ON ak.app_id = a.id
         WHERE a.name = $1
         LIMIT 5`,
        [appName]
      )

      if (existingApp.rows.length > 0) {
        client.release()
        await pool.end()
        return { ok: true, existing: true, keys: existingApp.rows }
      }

      // Listar todas as aplicações existentes
      const allApps = await client.query(
        `SELECT a.id, a.name, ak.api_key, ak.role_type
         FROM app a
         LEFT JOIN app_api_key ak ON ak.app_id = a.id
         LIMIT 20`
      )

      client.release()
      await pool.end()
      return { ok: true, existing: false, allApps: allApps.rows }
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
      // Contar registros em cada tabela relevante
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
