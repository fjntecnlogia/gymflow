import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma'
import { verificarJWT } from '../lib/supabase'

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token não fornecido' })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUser = await verificarJWT(token)

    const usuario = await prisma.usuario.findUnique({
      where: { supabaseId: supabaseUser.id },
      include: { academia: true },
    })

    if (usuario) {
      if (!usuario.ativo) return reply.status(401).send({ error: 'Usuário inativo' })
      ;(req as any).usuario = usuario
      ;(req as any).academiaId = usuario.academiaId
      ;(req as any).role = usuario.role
      return
    }

    // Verificar se é aluno (app mobile)
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
    return reply.status(401).send({ error: 'Token inválido', detail: err.message })
  }
}

export async function adminMiddleware(req: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(req, reply)
  const role = (req as any).role
  if (role !== 'SUPER_ADMIN') {
    return reply.status(403).send({ error: 'Acesso negado — apenas administradores' })
  }
}

export async function donoMiddleware(req: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(req, reply)
  const role = (req as any).role
  if (!['SUPER_ADMIN', 'DONO', 'GERENTE'].includes(role)) {
    return reply.status(403).send({ error: 'Acesso negado' })
  }
}
