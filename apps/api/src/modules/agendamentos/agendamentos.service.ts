import { prisma } from '../../lib/prisma'
import { getWhatsAppBridge } from '../../integrations/whatsapp-bridge'
import {
  CriarAgendamentoDTO,
  FiltroAgendamentoDTO,
  StatusApi,
  serializarAgendamento,
  statusParaDb,
} from './agendamentos.schema'

const ADMIN_WHATSAPP = process.env.ADMIN_LEAD_WHATSAPP ?? '5565996952828'

const FAIXA_ALUNOS_LABEL: Record<string, string> = {
  '0-50': 'Até 50',
  '50-200': '50 a 200',
  '200-500': '200 a 500',
  '500+': 'Mais de 500',
}

export class AgendamentosService {
  async criar(dados: CriarAgendamentoDTO, ipOrigem?: string) {
    const ag = await prisma.agendamento.create({
      data: {
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email ?? null,
        academiaNome: dados.academiaNome,
        cidade: dados.cidade,
        numAlunos: dados.numAlunos,
        horarioPreferido: dados.horarioPreferido,
        observacao: dados.observacao ?? null,
        ipOrigem: ipOrigem ?? null,
      },
    })

    // Notificação fire-and-forget — nunca bloqueia o response do lead
    this.notificarAdmin(ag).catch((err) => {
      console.error('[Agendamento] Falha notificando admin:', err?.message)
    })

    return serializarAgendamento(ag)
  }

  async listar(filtros: FiltroAgendamentoDTO) {
    const { status, busca, limit, page } = filtros
    const skip = (page - 1) * limit

    const where = {
      ...(status && { status: statusParaDb(status) as any }),
      ...(busca && {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' as const } },
          { academiaNome: { contains: busca, mode: 'insensitive' as const } },
          { cidade: { contains: busca, mode: 'insensitive' as const } },
          { telefone: { contains: busca } },
        ],
      }),
    }

    const items = await prisma.agendamento.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limit,
    })

    // O frontend espera um array bruto (não um envelope { items, total }),
    // veja /admin/agendamentos/page.tsx -> `Array.isArray(data) ? data : []`.
    return items.map(serializarAgendamento)
  }

  async atualizarStatus(id: string, novoStatus: StatusApi) {
    const statusDb = statusParaDb(novoStatus)

    // Carimba timestamps em transições relevantes
    const patch: any = { status: statusDb }
    if (novoStatus === 'contatado') patch.contatadoEm = new Date()
    if (novoStatus === 'convertido') patch.convertidoEm = new Date()

    const ag = await prisma.agendamento.update({
      where: { id },
      data: patch,
    })

    return serializarAgendamento(ag)
  }

  // ─── Notificação WhatsApp p/ time comercial ──────────────
  private async notificarAdmin(ag: {
    nome: string
    telefone: string
    email: string | null
    academiaNome: string
    cidade: string
    numAlunos: string
    horarioPreferido: string
    observacao: string | null
  }) {
    const bridge = getWhatsAppBridge()
    if (!bridge.disponivel) {
      console.warn('[Agendamento] WA_LOCAL_SERVER não configurado — pulando notificação')
      return
    }

    const linhas = [
      '🚨 *NOVO LEAD GymFlow Gestor*',
      '',
      `👤 *${ag.nome}*`,
      `📱 ${ag.telefone}`,
      ag.email ? `✉️ ${ag.email}` : null,
      '',
      `🏋️ ${ag.academiaNome} — ${ag.cidade}`,
      `👥 ${FAIXA_ALUNOS_LABEL[ag.numAlunos] ?? ag.numAlunos} alunos`,
      `🕐 Melhor horário: ${ag.horarioPreferido}`,
      ag.observacao ? `\n💬 _"${ag.observacao}"_` : null,
      '',
      '⏰ *Resposta prometida: 1h útil*',
      '👉 https://www.gymflowgestor.com.br/admin/agendamentos',
    ]
      .filter(Boolean)
      .join('\n')

    const ok = await bridge.enviarMensagem(ADMIN_WHATSAPP, linhas)
    if (!ok) {
      console.error('[Agendamento] WhatsApp bridge retornou falha ao notificar admin')
    }
  }
}
