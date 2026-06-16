import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { criarUsuarioAuth } from '../../lib/supabase'
import { criarCheckoutAssinatura } from '../../integrations/stripe'
import {
  loginComSenha,
  registrarSenhaPrimeiroAcesso,
  gerarTokenResetSenha,
  redefinirSenha,
  marcarOnboardingConcluido,
  resetarOnboarding,
  CredenciaisInvalidasError,
  UsuarioInativoError,
  SenhaNaoDefinidaError,
  TokenPrimeiroAcessoInvalidoError,
  TokenResetSenhaInvalidoError,
} from './auth.service'
import { authMiddleware } from '../../middleware/auth.middleware'
import {
  enviarEmail,
  templatePrimeiroAcesso,
  templateResetSenha,
} from '../../integrations/email'

const WEB_URL = process.env.WEB_URL ?? 'https://web-gules-phi-97.vercel.app'

// ─── Schemas Zod ────────────────────────────────────────────────────────────

const loginSchema = z.object({
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

// ─── Schemas legacy (Supabase) — mantidos pra retro-compat com mobile ───────

const registroAcademiaSchema = z.object({
  academia: z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    telefone: z.string().optional(),
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Apenas letras, números e hífens'),
  }),
  dono: z.object({
    nome: z.string().min(2),
    email: z.string().email(),
    senha: z.string().min(8),
    telefone: z.string().optional(),
  }),
  plano: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
})

const registroAlunoSchema = z.object({
  academiaSlug: z.string(),
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  telefone: z.string(),
})

// ─── Rotas ──────────────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance) {
  // ──────────────────────────────────────────────────────────────────────────
  // AUTH PRÓPRIO (Postgres + bcrypt + JWT)
  // Substitui Supabase Auth pro fluxo de owners de academia.
  // ──────────────────────────────────────────────────────────────────────────

  // POST /auth/login — autenticação por email + senha
  app.post('/login', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
  }, async (req, reply) => {
    const { email, senha } = loginSchema.parse(req.body)
    try {
      const result = await loginComSenha(email, senha)
      return reply.status(200).send(result)
    } catch (err: any) {
      if (err instanceof CredenciaisInvalidasError) {
        return reply.status(401).send({ error: err.message })
      }
      if (err instanceof UsuarioInativoError) {
        return reply.status(403).send({ error: err.message })
      }
      if (err instanceof SenhaNaoDefinidaError) {
        return reply.status(403).send({
          error: err.message,
          code: 'SENHA_NAO_DEFINIDA',
        })
      }
      throw err
    }
  })

  // POST /auth/primeiro-acesso — seta senha a partir do token enviado por email
  app.post('/primeiro-acesso', async (req, reply) => {
    const { token, senha } = primeiroAcessoSchema.parse(req.body)
    try {
      const result = await registrarSenhaPrimeiroAcesso(token, senha)
      return reply.status(200).send(result)
    } catch (err: any) {
      if (err instanceof TokenPrimeiroAcessoInvalidoError) {
        return reply.status(400).send({ error: err.message, motivo: err.motivo })
      }
      throw err
    }
  })

  // POST /auth/esqueci-senha — gera token + envia email
  app.post('/esqueci-senha', {
    config: {
      rateLimit: { max: 3, timeWindow: '5 minutes' },
    },
  }, async (req, reply) => {
    const { email } = esqueciSenhaSchema.parse(req.body)
    const { usuario, token } = await gerarTokenResetSenha(email)

    if (usuario && token) {
      const link = `${WEB_URL}/redefinir-senha?token=${token}`
      enviarEmail({
        to: usuario.email,
        subject: 'Redefinição de senha — GymFlow Gestor',
        html: templateResetSenha(usuario.nome, link),
      }).catch((e) => console.error('[Auth] Falha email reset:', e?.message))
    }

    // Sempre 200 — não vazamos se o e-mail existe ou não.
    return reply.status(200).send({
      ok: true,
      message: 'Se o e-mail existir, enviaremos um link de redefinição.',
    })
  })

  // POST /auth/me/onboarding-concluido — marca tutorial como visto (autenticado)
  app.post('/me/onboarding-concluido', { preHandler: authMiddleware }, async (req) => {
    const usuario = (req as any).usuario
    await marcarOnboardingConcluido(usuario.id)
    return { ok: true }
  })

  // POST /auth/me/resetar-onboarding — força o tutorial aparecer de novo
  app.post('/me/resetar-onboarding', { preHandler: authMiddleware }, async (req) => {
    const usuario = (req as any).usuario
    await resetarOnboarding(usuario.id)
    return { ok: true }
  })

  // POST /auth/redefinir-senha — recebe token + nova senha
  app.post('/redefinir-senha', async (req, reply) => {
    const { token, senha } = redefinirSenhaSchema.parse(req.body)
    try {
      await redefinirSenha(token, senha)
      return reply.status(200).send({ ok: true, message: 'Senha atualizada.' })
    } catch (err: any) {
      if (err instanceof TokenResetSenhaInvalidoError) {
        return reply.status(400).send({ error: err.message, motivo: err.motivo })
      }
      throw err
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // LEGACY (Supabase) — mantido só pra registrar-aluno do app mobile,
  // que ainda usa Supabase Auth. Owner de academia agora vai por /primeiro-acesso.
  // ──────────────────────────────────────────────────────────────────────────

  // @deprecated — owners agora vêm via Stripe webhook + /primeiro-acesso.
  // Mantido apenas pra retro-compat e signup interno via dashboard admin.
  app.post('/registrar-academia', async (req, reply) => {
    const { academia: acadDados, dono, plano } = registroAcademiaSchema.parse(req.body)

    const slugExiste = await prisma.academia.findUnique({ where: { slug: acadDados.slug } })
    if (slugExiste) return reply.status(400).send({ error: 'Este slug já está em uso' })

    const supabaseUser = await criarUsuarioAuth(dono.email, dono.senha)

    const academia = await prisma.academia.create({
      data: {
        ...acadDados,
        planoSaas: plano as any,
        trialExpiraEm: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        usuarios: {
          create: {
            supabaseId: supabaseUser.id,
            nome: dono.nome,
            email: dono.email,
            telefone: dono.telefone,
            role: 'DONO',
          },
        },
      },
      include: { usuarios: { select: { id: true, nome: true, email: true, role: true } } },
    })

    let checkoutUrl: string | null = null
    try {
      const checkout = await criarCheckoutAssinatura({
        academiaId: academia.id,
        academiaEmail: academia.email,
        academiaNome: academia.nome,
        plano: plano as any,
        successUrl: `${WEB_URL}/assinatura-sucesso`,
        cancelUrl: `${WEB_URL}/planos-saas`,
      })
      checkoutUrl = checkout.url
    } catch (err) {
      console.error('Erro ao criar checkout Stripe:', err)
    }

    return reply.status(201).send({
      message: 'Academia criada!',
      academiaId: academia.id,
      slug: academia.slug,
      checkoutUrl,
    })
  })

  // Registro de aluno (app mobile) — ainda via Supabase Auth
  app.post('/registrar-aluno', async (req, reply) => {
    const dados = registroAlunoSchema.parse(req.body)

    const academia = await prisma.academia.findUnique({ where: { slug: dados.academiaSlug } })
    if (!academia) return reply.status(404).send({ error: 'Academia não encontrada' })

    const supabaseUser = await criarUsuarioAuth(dados.email, dados.senha)

    const aluno = await prisma.aluno.create({
      data: {
        academiaId: academia.id,
        supabaseId: supabaseUser.id,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
      },
    })

    return reply.status(201).send({
      message: 'Cadastro realizado! Verifique seu e-mail.',
      alunoId: aluno.id,
    })
  })

  // Verificar disponibilidade de slug (público)
  app.get('/verificar-slug/:slug', async (req) => {
    const { slug } = req.params as { slug: string }
    const existe = await prisma.academia.findUnique({ where: { slug } })
    return { disponivel: !existe }
  })
}
