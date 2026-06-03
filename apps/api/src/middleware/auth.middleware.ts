import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { verificarJWT as verificarJWTSupabase } from '../lib/supabase'
import { verificarJWT as verificarJWTProprio, JwtPayload } from '../modules/auth/auth.service'

// ─────────────────────────────────────────────────────────────────────────────
// Estratégia de auth:
//
// 1. Tenta validar como JWT PRÓPRIO (do nosso backend Fastify, payload tem
//    { usuarioId, academiaId, role }). Esse é o caminho padrão pra owners
//    de academia após migrar do Supabase.
//
// 2. Se falhar, tenta validar como JWT do Supabase. Mantido pra retro-compat:
//    - Alunos no app mobile ainda autenticam via Supabase
//    - Owners legacy que ainda têm supabaseId mas não migraram a senha
//
// 3. Se ambos falharem → 401.
// ─────────────────────────────────────────────────────────────────────────────

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Token não fornecido' })
  }
  const token = authHeader.replace('Bearer ', '').trim()

  // ─── Tentativa 1: JWT próprio (auth-service) ──────────────────────────────
  let payloadProprio: JwtPayload | null = null
  try {
    payloadProprio = verificarJWTProprio(token)
  } catch {
    payloadProprio = null
  }

  if (payloadProprio) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payloadProprio.usuarioId },
      include: { academia: true },
    })
    if (!usuario) return reply.status(401).send({ error: 'Usuário não encontrado' })
    if (!usuario.ativo) return reply.status(403).send({ error: 'Usuário inativo' })

    ;(req as any).usuario = usuario
    ;(req as any).academiaId = usuario.academiaId
    ;(req as any).role = usuario.role
    return
  }

  // ─── Tentativa 2: JWT Supabase (legacy mobile + owners não migrados) ─────
  try {
    const supabaseUser = await verificarJWTSupabase(token)

    const usuario = await prisma.usuario.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { academia: true },
    })

    if (usuario) {
      if (!usuario.ativo) return reply.status(403).send({ error: 'Usuário inativo' })
      ;(req as any).usuario = usuario
      ;(req as any).academiaId = usuario.academiaId
      ;(req as any).role = usuario.role
      return
    }

    const aluno = await prisma.aluno.findUnique({
      where: { supabaseId: supabaseUser.id },
    })
    if (aluno) {
      ;(req as any).aluno = aluno
      ;(req as any).academiaId = aluno.academiaId
      ;(req as any).role = 'ALUNO'
      return
    }

    return reply.status(401).send({ error: 'Usuário não encontrado' })
  } catch (err: any) {
    return reply.status(401).send({ error: 'Token inválido', detail: err?.message })
  }
}

export async function adminMiddleware(req: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(req, reply)
  if (reply.sent) return
  const role = (req as any).role
  if (role !== 'SUPER_ADMIN') {
    return reply.status(403).send({ error: 'Acesso negado — apenas administradores' })
  }
}

export async function donoMiddleware(req: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(req, reply)
  if (reply.sent) return
  const role = (req as any).role
  if (!['SUPER_ADMIN', 'DONO', 'OWNER', 'GERENTE'].includes(role)) {
    return reply.status(403).send({ error: 'Acesso negado' })
  }
}
