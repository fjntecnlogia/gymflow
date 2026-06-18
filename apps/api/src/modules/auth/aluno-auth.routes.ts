import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  AlunoBloqueadoError,
  AlunoSemSenhaError,
  CredenciaisAlunoInvalidasError,
  TokenAlunoInvalidoError,
  gerarTokenResetSenhaAluno,
  loginAlunoComSenha,
  redefinirSenhaAluno,
  registrarSenhaPrimeiroAcessoAluno,
} from './aluno-auth.service'
import {
  enviarEmail,
  templateResetSenha,
} from '../../integrations/email'

// URL base do app web do aluno (ou deeplink). Configurável via env.
const APP_ALUNO_URL = process.env.APP_ALUNO_URL ?? 'https://app.gymflowgestor.com.br'

// ─── Schemas Zod ────────────────────────────────────────────────────────────

const loginAlunoSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

const primeiroAcessoSchema = z.object({
  token: z.string().min(20, 'Token inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(100),
})

const esqueciSenhaSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
})

const redefinirSenhaSchema = z.object({
  token: z.string().min(20, 'Token inválido'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(100),
})

// ─── Rotas /auth/aluno/* ────────────────────────────────────────────────────

export async function alunoAuthRoutes(app: FastifyInstance) {
  // POST /auth/aluno/login
  app.post(
    '/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const { email, senha } = loginAlunoSchema.parse(req.body)
      try {
        const result = await loginAlunoComSenha(email, senha)
        return reply.status(200).send(result)
      } catch (err: any) {
        if (err instanceof CredenciaisAlunoInvalidasError) {
          return reply.status(401).send({ message: err.message })
        }
        if (err instanceof AlunoBloqueadoError) {
          return reply.status(403).send({ message: err.message })
        }
        if (err instanceof AlunoSemSenhaError) {
          return reply.status(403).send({
            message: err.message,
            code: 'SENHA_NAO_DEFINIDA',
          })
        }
        throw err
      }
    },
  )

  // POST /auth/aluno/primeiro-acesso
  app.post('/primeiro-acesso', async (req, reply) => {
    const { token, senha } = primeiroAcessoSchema.parse(req.body)
    try {
      const result = await registrarSenhaPrimeiroAcessoAluno(token, senha)
      return reply.status(200).send(result)
    } catch (err: any) {
      if (err instanceof TokenAlunoInvalidoError) {
        return reply.status(400).send({ message: err.message, motivo: err.motivo })
      }
      throw err
    }
  })

  // POST /auth/aluno/esqueci-senha
  // Sempre 204, mesmo se email não existir (anti-enumeration).
  app.post(
    '/esqueci-senha',
    {
      config: { rateLimit: { max: 3, timeWindow: '5 minutes' } },
    },
    async (req, reply) => {
      const { email } = esqueciSenhaSchema.parse(req.body)
      const { aluno, token } = await gerarTokenResetSenhaAluno(email)

      if (aluno && token) {
        const link = `${APP_ALUNO_URL}/aluno/redefinir-senha?token=${token}`
        enviarEmail({
          to: aluno.email,
          subject: 'Redefinição de senha — GymFlow Gestor',
          html: templateResetSenha(aluno.nome, link),
        }).catch((e) => console.error('[AlunoAuth] Falha email reset:', e?.message))
      }

      return reply.status(204).send()
    },
  )

  // POST /auth/aluno/redefinir-senha
  app.post('/redefinir-senha', async (req, reply) => {
    const { token, senha } = redefinirSenhaSchema.parse(req.body)
    try {
      const result = await redefinirSenhaAluno(token, senha)
      return reply.status(200).send(result)
    } catch (err: any) {
      if (err instanceof TokenAlunoInvalidoError) {
        return reply.status(400).send({ message: err.message, motivo: err.motivo })
      }
      throw err
    }
  })
}
