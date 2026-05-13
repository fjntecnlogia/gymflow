import { FastifyInstance } from 'fastify'
import { prisma } from '../../lib/prisma'
import { criarUsuarioAuth } from '../../lib/supabase'
import { z } from 'zod'

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
    const { academia: acadDados, dono } = registroAcademiaSchema.parse(req.body)

    const slugExiste = await prisma.academia.findUnique({ where: { slug: acadDados.slug } })
    if (slugExiste) return reply.status(400).send({ error: 'Este slug já está em uso' })

    const supabaseUser = await criarUsuarioAuth(dono.email, dono.senha)

    const academia = await prisma.academia.create({
      data: {
        ...acadDados,
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

    return reply.status(201).send({
      message: 'Academia criada com sucesso! Verifique seu e-mail para confirmar a conta.',
      academiaId: academia.id,
      slug: academia.slug,
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
