import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../../lib/prisma'

// ─────────────────────────────────────────────────────────────────────────────
// Serviço de auth próprio (Postgres + bcrypt + JWT do backend Fastify).
// Substitui Supabase Auth pra eliminar dependência paga ($25/mês Pro).
//
// Fluxo:
//   1. Signup público (Stripe webhook) → cria Usuario com tokenPrimeiroAcesso
//   2. Cliente recebe email com link /criar-senha?token=...
//   3. POST /auth/primeiro-acesso { token, senha } → seta senhaHash + emite JWT
//   4. Próximos logins: POST /auth/login { email, senha } → JWT
//
// Reset senha:
//   1. POST /auth/esqueci-senha { email } → gera tokenResetSenha + envia email
//   2. POST /auth/redefinir-senha { token, novaSenha } → atualiza senhaHash
// ─────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET não definido') })()
const JWT_EXPIRES_IN = '30d'
const BCRYPT_ROUNDS = 10
const TOKEN_PRIMEIRO_ACESSO_EXPIRA_DIAS = 7
const TOKEN_RESET_SENHA_EXPIRA_HORAS = 2

/**
 * Payload do JWT emitido pelo backend.
 *
 * - `usuarioId` está presente quando o token é de Usuario (dono/staff via /auth/*).
 * - `alunoId` está presente quando o token é de Aluno (app mobile via /auth/aluno/*).
 *
 * Exatamente um dos dois é populado por emissão. `role` reflete o tipo:
 * RoleUsuario pros usuários, `'ALUNO'` pros alunos.
 */
export type JwtPayload = {
  usuarioId?: string
  alunoId?: string
  academiaId: string
  role: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function gerarTokenAleatorio(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function gerarJWT(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verificarJWT(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
  return decoded
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, BCRYPT_ROUNDS)
}

export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

// ─── Fluxo de signup pós-compra (chamado pelo webhook Stripe) ────────────────

/**
 * Gera token de primeiro acesso pra um usuário recém-criado.
 * Salva no banco + retorna o token cru pra colocar no link do e-mail.
 */
export async function gerarTokenPrimeiroAcesso(usuarioId: string): Promise<string> {
  const token = gerarTokenAleatorio()
  const expira = new Date(Date.now() + TOKEN_PRIMEIRO_ACESSO_EXPIRA_DIAS * 24 * 60 * 60 * 1000)

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      tokenPrimeiroAcesso: token,
      tokenPrimeiroAcessoExpira: expira,
    },
  })

  return token
}

// ─── Login ──────────────────────────────────────────────────────────────────

export class CredenciaisInvalidasError extends Error {
  constructor() { super('Credenciais inválidas'); this.name = 'CredenciaisInvalidasError' }
}

export class UsuarioInativoError extends Error {
  constructor() { super('Usuário inativo'); this.name = 'UsuarioInativoError' }
}

export class SenhaNaoDefinidaError extends Error {
  constructor() {
    super('Senha ainda não definida — use o link de primeiro acesso enviado por e-mail')
    this.name = 'SenhaNaoDefinidaError'
  }
}

export async function loginComSenha(email: string, senha: string) {
  const usuario = await prisma.usuario.findFirst({
    where: { email: email.toLowerCase().trim() },
    include: { academia: { select: { id: true, status: true } } },
  })
  if (!usuario) throw new CredenciaisInvalidasError()
  if (!usuario.ativo) throw new UsuarioInativoError()
  if (!usuario.senhaHash) throw new SenhaNaoDefinidaError()

  const ok = await compararSenha(senha, usuario.senhaHash)
  if (!ok) throw new CredenciaisInvalidasError()

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLoginEm: new Date() },
  })

  const token = gerarJWT({
    usuarioId: usuario.id,
    academiaId: usuario.academiaId,
    role: usuario.role,
  })

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      academiaId: usuario.academiaId,
      academiaStatus: usuario.academia.status,
      onboardingConcluido: usuario.onboardingConcluido,
    },
  }
}

// ─── Primeiro acesso (seta senha a partir do tokenPrimeiroAcesso) ───────────

export class TokenPrimeiroAcessoInvalidoError extends Error {
  constructor(public motivo: 'invalido' | 'expirado' | 'ja_usado') {
    super(
      motivo === 'expirado'
        ? 'O link expirou. Solicite um novo.'
        : motivo === 'ja_usado'
        ? 'Esse link já foi usado. Faça login com sua senha.'
        : 'Link inválido.',
    )
    this.name = 'TokenPrimeiroAcessoInvalidoError'
  }
}

export async function registrarSenhaPrimeiroAcesso(token: string, novaSenha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { tokenPrimeiroAcesso: token } })
  if (!usuario) throw new TokenPrimeiroAcessoInvalidoError('invalido')
  if (usuario.senhaHash) throw new TokenPrimeiroAcessoInvalidoError('ja_usado')
  if (!usuario.tokenPrimeiroAcessoExpira || usuario.tokenPrimeiroAcessoExpira < new Date()) {
    throw new TokenPrimeiroAcessoInvalidoError('expirado')
  }

  const senhaHash = await hashSenha(novaSenha)
  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senhaHash,
      tokenPrimeiroAcesso: null,
      tokenPrimeiroAcessoExpira: null,
      ultimoLoginEm: new Date(),
    },
    include: { academia: { select: { id: true, status: true } } },
  })

  const tokenJwt = gerarJWT({
    usuarioId: atualizado.id,
    academiaId: atualizado.academiaId,
    role: atualizado.role,
  })

  return {
    token: tokenJwt,
    usuario: {
      id: atualizado.id,
      nome: atualizado.nome,
      email: atualizado.email,
      role: atualizado.role,
      academiaId: atualizado.academiaId,
      academiaStatus: atualizado.academia.status,
      onboardingConcluido: atualizado.onboardingConcluido,
    },
  }
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function marcarOnboardingConcluido(usuarioId: string) {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      onboardingConcluido: true,
      onboardingConcluidoEm: new Date(),
    },
  })
}

export async function resetarOnboarding(usuarioId: string) {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      onboardingConcluido: false,
      onboardingConcluidoEm: null,
    },
  })
}

// ─── Esqueci senha ──────────────────────────────────────────────────────────

/**
 * Gera token de reset + retorna pra que o caller dispare o e-mail.
 * Por segurança não vazamos se o e-mail existe (caller responde 200 sempre).
 */
export async function gerarTokenResetSenha(email: string): Promise<{
  usuario: { id: string; nome: string; email: string } | null
  token: string | null
}> {
  const usuario = await prisma.usuario.findFirst({
    where: { email: email.toLowerCase().trim(), ativo: true },
  })
  if (!usuario) return { usuario: null, token: null }

  const token = gerarTokenAleatorio()
  const expira = new Date(Date.now() + TOKEN_RESET_SENHA_EXPIRA_HORAS * 60 * 60 * 1000)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      tokenResetSenha: token,
      tokenResetSenhaExpira: expira,
    },
  })

  return {
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    token,
  }
}

export class TokenResetSenhaInvalidoError extends Error {
  constructor(public motivo: 'invalido' | 'expirado') {
    super(
      motivo === 'expirado'
        ? 'O link expirou. Solicite outro em "Esqueci minha senha".'
        : 'Link inválido.',
    )
    this.name = 'TokenResetSenhaInvalidoError'
  }
}

export async function redefinirSenha(token: string, novaSenha: string) {
  const usuario = await prisma.usuario.findUnique({ where: { tokenResetSenha: token } })
  if (!usuario) throw new TokenResetSenhaInvalidoError('invalido')
  if (!usuario.tokenResetSenhaExpira || usuario.tokenResetSenhaExpira < new Date()) {
    throw new TokenResetSenhaInvalidoError('expirado')
  }

  const senhaHash = await hashSenha(novaSenha)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senhaHash,
      tokenResetSenha: null,
      tokenResetSenhaExpira: null,
    },
  })
}
