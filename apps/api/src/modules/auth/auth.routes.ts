import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { criarUsuarioAuth } from '../../lib/supabase'
import { criarCheckoutAssinatura } from '../../integrations/stripe'
import { z } from 'zod'

const WEB_URL = process.env.WEB_URL ?? 'https://web-gules-phi-97.vercel.app'

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

export async function authRoutes(app: FastifyInstance) {
  // Registro de nova academia (onboarding SaaS)
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

    // Criar checkout Stripe para assinatura SaaS
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
      // Não bloqueia o cadastro — 14 dias trial sem cartão
    }

    return reply.status(201).send({
      message: 'Academia criada! Você tem 14 dias grátis. Adicione um cartão para continuar após o trial.',
      academiaId: academia.id,
      slug: academia.slug,
      checkoutUrl,   // URL do Stripe Checkout (pode ser null se falhar)
    })
  })

  // Registro de aluno (pelo app mobile)
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

  // Verificar se slug está disponível
  app.get('/verificar-slug/:slug', async (req) => {
    const { slug } = req.params as { slug: string }
    const existe = await prisma.academia.findUnique({ where: { slug } })
    return { disponivel: !existe }
  })
}
