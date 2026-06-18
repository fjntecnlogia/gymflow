import { prisma } from '../../lib/prisma'
import {
  compararSenha,
  gerarJWT,
  gerarTokenAleatorio,
  hashSenha,
} from './auth.service'

// ─────────────────────────────────────────────────────────────────────────────
// Serviço de auth do ALUNO (app mobile).
//
// Espelha o fluxo do owner em auth.service.ts, mas opera no model `Aluno`.
// Fluxos:
//   1. Recepção da academia cadastra aluno → gera tokenPrimeiroAcesso + email.
//   2. Aluno abre link → POST /auth/aluno/primeiro-acesso → seta senha + JWT.
//   3. Próximos logins: POST /auth/aluno/login → JWT (30d).
//
// Reset senha:
//   1. POST /auth/aluno/esqueci-senha → gera tokenResetSenha + email.
//   2. POST /auth/aluno/redefinir-senha → atualiza senhaHash + JWT.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_PRIMEIRO_ACESSO_EXPIRA_DIAS = 7
const TOKEN_RESET_SENHA_EXPIRA_HORAS = 1 // briefing pede 1h

// ─── Erros ──────────────────────────────────────────────────────────────────

export class CredenciaisAlunoInvalidasError extends Error {
  constructor() {
    super('E-mail ou senha inválidos')
    this.name = 'CredenciaisAlunoInvalidasError'
  }
}

export class AlunoBloqueadoError extends Error {
  constructor() {
    super('Acesso bloqueado, fale com a recepção')
    this.name = 'AlunoBloqueadoError'
  }
}

export class AlunoSemSenhaError extends Error {
  constructor() {
    super('Senha ainda não definida — use o link de primeiro acesso enviado por e-mail')
    this.name = 'AlunoSemSenhaError'
  }
}

export class TokenAlunoInvalidoError extends Error {
  constructor(public motivo: 'invalido' | 'expirado' | 'ja_usado' = 'invalido') {
    super('Link inválido ou expirado')
    this.name = 'TokenAlunoInvalidoError'
  }
}

// ─── Shape de resposta (compartilhado entre login / primeiro-acesso / reset) ─

function montarResposta(alunoComAcademia: {
  id: string
  nome: string
  email: string | null
  academiaId: string
  academia: { nome: string }
}) {
  const token = gerarJWT({
    alunoId: alunoComAcademia.id,
    academiaId: alunoComAcademia.academiaId,
    role: 'ALUNO',
  })

  return {
    token,
    aluno: {
      id: alunoComAcademia.id,
      nome: alunoComAcademia.nome,
      email: alunoComAcademia.email ?? '',
      academiaId: alunoComAcademia.academiaId,
      academiaNome: alunoComAcademia.academia.nome,
    },
  }
}

// ─── Login ──────────────────────────────────────────────────────────────────

export async function loginAlunoComSenha(email: string, senha: string) {
  const aluno = await prisma.aluno.findFirst({
    where: { email: email.toLowerCase().trim() },
    include: { academia: { select: { nome: true } } },
  })

  if (!aluno) throw new CredenciaisAlunoInvalidasError()
  if (!aluno.senhaHash) throw new AlunoSemSenhaError()

  const ok = await compararSenha(senha, aluno.senhaHash)
  if (!ok) throw new CredenciaisAlunoInvalidasError()

  // Status check após validar credenciais — evita vazar existência do email
  // pra atacante que mande senha errada.
  if (aluno.status !== 'ATIVO') throw new AlunoBloqueadoError()

  await prisma.aluno.update({
    where: { id: aluno.id },
    data: { ultimoLoginEm: new Date() },
  })

  return montarResposta(aluno)
}

// ─── Primeiro acesso ────────────────────────────────────────────────────────

/**
 * Gera token de primeiro acesso pra um aluno recém-cadastrado.
 * Salva no banco + retorna o token cru pro caller compor o link de email.
 */
export async function gerarTokenPrimeiroAcessoAluno(alunoId: string): Promise<string> {
  const token = gerarTokenAleatorio()
  const expira = new Date(
    Date.now() + TOKEN_PRIMEIRO_ACESSO_EXPIRA_DIAS * 24 * 60 * 60 * 1000,
  )

  await prisma.aluno.update({
    where: { id: alunoId },
    data: {
      tokenPrimeiroAcesso: token,
      tokenPrimeiroAcessoExpira: expira,
    },
  })

  return token
}

export async function registrarSenhaPrimeiroAcessoAluno(token: string, novaSenha: string) {
  const aluno = await prisma.aluno.findUnique({
    where: { tokenPrimeiroAcesso: token },
  })
  if (!aluno) throw new TokenAlunoInvalidoError('invalido')
  if (aluno.senhaHash) throw new TokenAlunoInvalidoError('ja_usado')
  if (!aluno.tokenPrimeiroAcessoExpira || aluno.tokenPrimeiroAcessoExpira < new Date()) {
    throw new TokenAlunoInvalidoError('expirado')
  }

  const senhaHash = await hashSenha(novaSenha)
  const atualizado = await prisma.aluno.update({
    where: { id: aluno.id },
    data: {
      senhaHash,
      tokenPrimeiroAcesso: null,
      tokenPrimeiroAcessoExpira: null,
      ultimoLoginEm: new Date(),
    },
    include: { academia: { select: { nome: true } } },
  })

  return montarResposta(atualizado)
}

// ─── Esqueci senha ──────────────────────────────────────────────────────────

/**
 * Gera token de reset + retorna pra que o caller dispare o e-mail.
 * Pra evitar enumeration, o caller responde 204 sempre (mesmo se o email
 * não existir ou se o aluno ainda não tem senha definida).
 */
export async function gerarTokenResetSenhaAluno(email: string): Promise<{
  aluno: { id: string; nome: string; email: string } | null
  token: string | null
}> {
  const aluno = await prisma.aluno.findFirst({
    where: { email: email.toLowerCase().trim(), status: 'ATIVO' },
  })

  // Só envia reset pra alunos que JÁ fizeram primeiro acesso. Senão o
  // fluxo correto é o link de primeiro acesso (não reset).
  if (!aluno || !aluno.senhaHash || !aluno.email) {
    return { aluno: null, token: null }
  }

  const token = gerarTokenAleatorio()
  const expira = new Date(Date.now() + TOKEN_RESET_SENHA_EXPIRA_HORAS * 60 * 60 * 1000)

  await prisma.aluno.update({
    where: { id: aluno.id },
    data: {
      tokenResetSenha: token,
      tokenResetSenhaExpira: expira,
    },
  })

  return {
    aluno: { id: aluno.id, nome: aluno.nome, email: aluno.email },
    token,
  }
}

export async function redefinirSenhaAluno(token: string, novaSenha: string) {
  const aluno = await prisma.aluno.findUnique({
    where: { tokenResetSenha: token },
  })
  if (!aluno) throw new TokenAlunoInvalidoError('invalido')
  if (!aluno.tokenResetSenhaExpira || aluno.tokenResetSenhaExpira < new Date()) {
    throw new TokenAlunoInvalidoError('expirado')
  }

  const senhaHash = await hashSenha(novaSenha)
  const atualizado = await prisma.aluno.update({
    where: { id: aluno.id },
    data: {
      senhaHash,
      tokenResetSenha: null,
      tokenResetSenhaExpira: null,
      ultimoLoginEm: new Date(),
    },
    include: { academia: { select: { nome: true } } },
  })

  return montarResposta(atualizado)
}
