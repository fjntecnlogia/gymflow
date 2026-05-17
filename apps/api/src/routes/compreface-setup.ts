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

  // ── Criar nova aplicação GYMFLOW com API key real no CompreFace DB ─────────
  app.post('/compreface-setup/create-gymflow-app', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()
      const { randomUUID } = await import('crypto')
      const appGuid   = randomUUID()
      const apiKey    = randomUUID()
      const modelGuid = randomUUID()

      // Verificar se já existe
      const existing = await client.query(`SELECT id, name, api_key FROM "app" WHERE name = 'GYMFLOW' LIMIT 1`)
      if (existing.rows.length > 0) {
        client.release(); await pool.end()
        return { ok: true, exists: true, app: existing.rows[0] }
      }

      // Descobrir próximo ID disponível
      const maxId = await client.query(`SELECT MAX(id) as max FROM "app"`)
      const nextAppId = (Number(maxId.rows[0].max ?? 0) + 1)

      // Criar app
      await client.query(
        `INSERT INTO "app" (id, name, guid, api_key) VALUES ($1, 'GYMFLOW', $2, $3)`,
        [nextAppId, appGuid, apiKey]
      )

      // Criar model recognition
      await client.query(
        `INSERT INTO "model" (name, guid, app_id, api_key, type, created_date)
         VALUES ('GYMFLOW_Recognition', $1, $2, $3, 'R', NOW())`,
        [modelGuid, nextAppId, apiKey]
      )

      client.release()
      await pool.end()
      return { ok: true, created: true, appId: nextAppId, apiKey, appGuid }
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })

  // ── Corrigir oauth_client_details (Spring Security 5 exige prefixo {noop}) ──
  app.post('/compreface-setup/fix-oauth', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })
    const pool = makePool()
    try {
      const client = await pool.connect()
      // Atualizar client_secret para plaintext com prefixo {noop}
      const r1 = await client.query(
        `UPDATE oauth_client_details SET client_secret = '{noop}password' RETURNING client_id, client_secret`
      )
      // Verificar estado atual
      const r2 = await client.query(
        `SELECT client_id, client_secret, authorized_grant_types FROM oauth_client_details LIMIT 5`
      )
      client.release()
      await pool.end()
      return { ok: true, updated: r1.rows, current: r2.rows }
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

  // ── Proxy interno: capturar erro real do compreface-api ──────────────────
  app.get('/compreface-setup/proxy-api-error', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const { default: axios } = await import('axios')
    const apiKey = 'aa35b15c-56a9-4d9c-b582-ecde23ad0757'
    const base = 'http://compreface-api.railway.internal:8080'

    const endpoints = [
      `/api/v1/recognition/subjects`,
      `/actuator/health`,
      `/actuator/loggers`,
      `/api/v1/app-info`,
    ]

    const results: any = {}
    for (const ep of endpoints) {
      try {
        const r = await axios.get(`${base}${ep}`, {
          headers: { 'x-api-key': apiKey },
          timeout: 8000,
        })
        results[ep] = { status: r.status, data: JSON.stringify(r.data).slice(0, 200) }
      } catch (e: any) {
        results[ep] = {
          status: e.response?.status,
          data: JSON.stringify(e.response?.data ?? e.message).slice(0, 200),
        }
      }
    }
    return results
  })

  // ── Testar Core com imagem real (baixa foto de teste e processa) ─────────
  app.get('/compreface-setup/test-core', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const { default: axios } = await import('axios')
    const FormData = require('form-data')
    const CORE = 'http://compreface-core.railway.internal:3000'

    // Baixar uma imagem de face de teste (foto pública do Lorem Face)
    let imageBuffer: Buffer
    try {
      const imgRes = await axios.get('https://thispersondoesnotexist.com', {
        responseType: 'arraybuffer',
        timeout: 10000,
      })
      imageBuffer = Buffer.from(imgRes.data)
    } catch (e: any) {
      return { error: `Falha ao baixar imagem de teste: ${e.message}` }
    }

    const results: any = {}

    // Testar cada endpoint do core com a imagem
    // Testar /find_faces com face_plugins=calculator para obter embeddings
    const variants = [
      { name: 'find_faces-default',    ep: '/find_faces',  extra: {} },
      { name: 'find_faces-calculator', ep: '/find_faces',  extra: { face_plugins: 'calculator' } },
      { name: 'find_faces-all',        ep: '/find_faces',  extra: { face_plugins: 'calculator,age' } },
      { name: 'calculate-timeout30',   ep: '/calculate',   extra: {} },
    ]

    for (const v of variants) {
      const form = new FormData()
      form.append('file', imageBuffer, { filename: 'test.jpg', contentType: 'image/jpeg' })
      for (const [k, val] of Object.entries(v.extra)) {
        form.append(k, val as string)
      }
      try {
        const r = await axios.post(`${CORE}${v.ep}`, form, {
          headers: form.getHeaders(),
          timeout: 30000,
        })
        // Mostrar se embedding foi retornado
        const hasEmb = JSON.stringify(r.data).includes('embedding')
        results[v.name] = {
          status: r.status,
          hasEmbedding: hasEmb,
          data: JSON.stringify(r.data).slice(0, 300),
        }
      } catch (e: any) {
        results[v.name] = { status: e.response?.status, error: e.message?.slice(0, 80) }
      }
    }

    return { imageSize: imageBuffer.length, results }
  })

  // ── Testar conectividade interna ao CompreFace Core e API ────────────────
  app.get('/compreface-setup/ping-services', async (req, reply) => {
    const key = req.headers['x-setup-key']
    if (key !== 'cf-setup-2026') return reply.status(403).send({ error: 'Forbidden' })

    const { default: axios } = await import('axios')
    const results: Record<string, any> = {}
    const CORE = 'http://compreface-core.railway.internal:3000'
    const services = [
      { name: 'core-root', url: `${CORE}/` },
      { name: 'core-healthcheck', url: `${CORE}/healthcheck` },
      { name: 'core-status', url: `${CORE}/status` },
      { name: 'core-docs', url: `${CORE}/docs` },
      { name: 'core-check', url: `${CORE}/check` },
      { name: 'core-api-v1', url: `${CORE}/api/v1` },
      { name: 'api-health', url: 'http://compreface-api.railway.internal:8080/actuator/health' },
    ]
    for (const svc of services) {
      try {
        const r = await axios.get(svc.url, { timeout: 5000 })
        results[svc.name] = { status: r.status, data: JSON.stringify(r.data).slice(0, 100) }
      } catch (e: any) {
        results[svc.name] = { error: e.message?.slice(0, 80) ?? 'timeout' }
      }
    }
    return results
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
