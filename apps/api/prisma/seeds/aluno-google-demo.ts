import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

// ─────────────────────────────────────────────────────────────────────────────
// Seed: aluno demo pra revisão do Google Play.
//
// Cria uma academia + plano + aluno + matrícula ativa pra que o revisor
// consiga fazer login no app mobile.
//
// Como rodar (Railway shell ou local):
//   npx tsx prisma/seeds/aluno-google-demo.ts
//
// Credenciais que ficam disponíveis:
//   email: aluno-google@gymflowgestor.com.br
//   senha: DemoGoogle2026!
// ─────────────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient()

const ACADEMIA_SLUG = 'demo-google-play'
const PLANO_ID = 'plano-demo-google'
const MATRICULA_ID = 'matricula-demo-google'
const ALUNO_EMAIL = 'aluno-google@gymflowgestor.com.br'
const ALUNO_SENHA = 'DemoGoogle2026!'

async function main() {
  // 1. Academia demo
  const academia = await prisma.academia.upsert({
    where: { slug: ACADEMIA_SLUG },
    create: {
      nome: 'Academia Demo (Google Play Review)',
      slug: ACADEMIA_SLUG,
      email: 'demo-google@gymflowgestor.com.br',
      planoSaas: 'PRO',
      status: 'ATIVO',
    },
    update: {},
  })

  // 2. Plano demo
  const plano = await prisma.plano.upsert({
    where: { id: PLANO_ID },
    create: {
      id: PLANO_ID,
      academiaId: academia.id,
      nome: 'Plano Premium',
      descricao: 'Acesso ilimitado à academia + todas as aulas',
      valor: 149.9,
      duracaoDias: 30,
      tipo: 'MENSAL',
      ativo: true,
    },
    update: {},
  })

  // 3. Aluno demo (com senhaHash pra bypass do fluxo de primeiro acesso)
  const senhaHash = await bcrypt.hash(ALUNO_SENHA, 10)
  const aluno = await prisma.aluno.upsert({
    where: {
      academiaId_email: {
        academiaId: academia.id,
        email: ALUNO_EMAIL,
      },
    },
    create: {
      academiaId: academia.id,
      nome: 'Aluno Demo Google',
      email: ALUNO_EMAIL,
      telefone: '11999999999',
      status: 'ATIVO',
      senhaHash,
    },
    update: { senhaHash, status: 'ATIVO' },
  })

  // 4. Matrícula ativa (1 ano de validade pra não vencer durante review)
  const dataInicio = new Date()
  const dataVencimento = new Date()
  dataVencimento.setDate(dataVencimento.getDate() + 365)

  await prisma.matricula.upsert({
    where: { id: MATRICULA_ID },
    create: {
      id: MATRICULA_ID,
      academiaId: academia.id,
      alunoId: aluno.id,
      planoId: plano.id,
      dataInicio,
      dataVencimento,
      valorPago: 149.9,
      status: 'ATIVA',
    },
    update: { dataVencimento, status: 'ATIVA' },
  })

  console.log('✓ Aluno demo Google Play pronto')
  console.log('  Email:', aluno.email)
  console.log('  Senha:', ALUNO_SENHA)
  console.log('  Academia:', academia.nome)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
