import { Queue, Worker } from 'bullmq'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { PagamentosService } from '../modules/pagamentos/pagamentos.service'
import { WhatsAppService } from '../integrations/whatsapp'
import dayjs from 'dayjs'

const pagamentosService = new PagamentosService()
const wa = new WhatsAppService()

export const cobrancaQueue = new Queue('cobranca', { connection: redis as any })
export const notificacaoQueue = new Queue('notificacao', { connection: redis as any })

export function startJobs() {
  new Worker('cobranca', async (job) => {
    if (job.name === 'processar-vencimentos') {
      await processarVencimentos()
    }
  }, { connection: redis as any })

  new Worker('notificacao', async (job) => {
    if (job.name === 'reengajamento') {
      await processarReengajamento()
    }
  }, { connection: redis as any })

  cobrancaQueue.add('processar-vencimentos', {}, {
    repeat: { pattern: '0 8 * * *' },
  })

  notificacaoQueue.add('reengajamento', {}, {
    repeat: { pattern: '0 9 * * 1' },
  })

  console.log('🔄 Jobs iniciados')
}

async function processarVencimentos() {
  const hoje = new Date()
  const em3Dias = dayjs().add(3, 'day').toDate()

  const vencendoEm3 = await prisma.matricula.findMany({
    where: {
      status: 'ATIVA',
      dataVencimento: { gte: hoje, lte: em3Dias },
    },
    include: { aluno: true, plano: true },
  })

  for (const m of vencendoEm3) {
    if (m.aluno.telefone) {
      await wa.enviarVencimento({
        telefone: m.aluno.telefone,
        nomeAluno: m.aluno.nome,
        plano: m.plano.nome,
        valor: Number(m.valorPago),
        dataVencimento: dayjs(m.dataVencimento).format('DD/MM/YYYY'),
        linkPagamento: '',
        academiaId: m.academiaId,
        alunoId: m.alunoId,
        diasRestantes: dayjs(m.dataVencimento).diff(dayjs(), 'day'),
      })
    }
  }

  const vencidas = await prisma.matricula.findMany({
    where: { status: 'ATIVA', dataVencimento: { lt: hoje } },
    include: { aluno: true },
  })

  for (const m of vencidas) {
    await prisma.matricula.update({ where: { id: m.id }, data: { status: 'VENCIDA' } })
    await prisma.aluno.update({ where: { id: m.alunoId }, data: { status: 'INADIMPLENTE' } })
    if (m.aluno.telefone) {
      await wa.enviarInadimplencia({
        telefone: m.aluno.telefone,
        nomeAluno: m.aluno.nome,
        diasAtraso: dayjs().diff(dayjs(m.dataVencimento), 'day'),
        linkPagamento: '',
        academiaId: m.academiaId,
        alunoId: m.alunoId,
      })
    }
  }
}

async function processarReengajamento() {
  const sete = dayjs().subtract(7, 'day').toDate()

  const semAcesso = await prisma.aluno.findMany({
    where: {
      status: 'ATIVO',
      acessos: { none: { criadoEm: { gte: sete } } },
    },
    take: 100,
  })

  for (const aluno of semAcesso) {
    if (aluno.telefone) {
      await wa.enviarMensagem({
        telefone: aluno.telefone,
        mensagem: `💪 Ei, *${aluno.nome}*! Faz 7 dias que você não treina.\n\nSua academia está te esperando. Bora voltar! 🏋️\n\n_GymFlow Gestor_`,
        academiaId: aluno.academiaId,
        alunoId: aluno.id,
        tipo: 'reengajamento',
      })
    }
  }
}
