import axios from 'axios'
import { prisma } from '../lib/prisma'

interface MensagemParams {
  telefone: string
  mensagem: string
  academiaId?: string
  alunoId?: string
  tipo?: string
}

export class WhatsAppService {
  private api = axios.create({
    baseURL: process.env.EVOLUTION_API_URL,
    headers: {
      apikey: process.env.EVOLUTION_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  })

  private instancia = process.env.EVOLUTION_INSTANCE ?? 'gymflow'

  private formatarTelefone(telefone: string): string {
    const numeros = telefone.replace(/\D/g, '')
    if (numeros.startsWith('55')) return numeros
    return `55${numeros}`
  }

  async enviarMensagem(params: MensagemParams): Promise<boolean> {
    try {
      await this.api.post(`/message/sendText/${this.instancia}`, {
        number: this.formatarTelefone(params.telefone),
        text: params.mensagem,
        delay: 1000,
      })

      if (params.academiaId) {
        await this.registrarLog({
          academiaId: params.academiaId,
          alunoId: params.alunoId,
          destinatario: params.telefone,
          mensagem: params.mensagem,
          tipo: params.tipo ?? 'manual',
          status: 'ENVIADO',
        })
      }

      return true
    } catch (err: any) {
      console.error(`WhatsApp erro [${params.telefone}]:`, err.message)
      if (params.academiaId) {
        await this.registrarLog({
          academiaId: params.academiaId,
          alunoId: params.alunoId,
          destinatario: params.telefone,
          mensagem: params.mensagem,
          tipo: params.tipo ?? 'manual',
          status: 'ERRO',
          erro: err.message,
        })
      }
      return false
    }
  }

  private async registrarLog(dados: {
    academiaId: string; alunoId?: string; destinatario: string
    mensagem: string; tipo: string; status: string; erro?: string
  }) {
    await prisma.notificacaoLog.create({
      data: {
        academiaId: dados.academiaId,
        alunoId: dados.alunoId,
        canal: 'WHATSAPP',
        tipo: dados.tipo,
        destinatario: dados.destinatario,
        mensagem: dados.mensagem,
        status: dados.status as any,
        erro: dados.erro,
      },
    })
  }

  // ─── Templates ─────────────────────────────────────

  async enviarBoasVindas(params: { telefone: string; nomeAluno: string; academia: string; academiaId: string; alunoId: string }) {
    return this.enviarMensagem({
      telefone: params.telefone,
      mensagem: `🎉 *Bem-vindo(a) à ${params.academia}!*\n\nOlá, *${params.nomeAluno}*! Seu cadastro foi criado com sucesso.\n\nBaixe o app GymFlow Gestor para acessar seu QR Code de entrada e gerenciar seu plano. 💪\n\n_GymFlow Gestor — Sua academia inteligente_`,
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      tipo: 'boas_vindas',
    })
  }

  async enviarVencimento(params: {
    telefone: string; nomeAluno: string; plano: string
    valor: number; dataVencimento: string; linkPagamento: string
    academiaId: string; alunoId: string; diasRestantes: number
  }) {
    const urgencia = params.diasRestantes <= 1 ? '🚨' : params.diasRestantes <= 3 ? '⚠️' : '📅'
    const texto = params.diasRestantes === 0
      ? 'seu plano *vence HOJE*'
      : `seu plano vence em *${params.diasRestantes} dia${params.diasRestantes > 1 ? 's' : ''}*`

    return this.enviarMensagem({
      telefone: params.telefone,
      mensagem: `${urgencia} Olá, *${params.nomeAluno}*!\n\n${texto.charAt(0).toUpperCase() + texto.slice(1)}.\n\n📋 Plano: *${params.plano}*\n💰 Valor: *R$ ${params.valor.toFixed(2)}*\n📅 Vencimento: *${params.dataVencimento}*\n\nPague agora com PIX:\n${params.linkPagamento}\n\n_GymFlow Gestor_`,
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      tipo: 'vencimento',
    })
  }

  async enviarInadimplencia(params: {
    telefone: string; nomeAluno: string; diasAtraso: number
    linkPagamento: string; academiaId: string; alunoId: string
  }) {
    return this.enviarMensagem({
      telefone: params.telefone,
      mensagem: `🔴 Olá, *${params.nomeAluno}*!\n\nSeu acesso foi *bloqueado* por ${params.diasAtraso} dia${params.diasAtraso > 1 ? 's' : ''} de atraso no pagamento.\n\nRegularize agora para voltar a treinar:\n${params.linkPagamento}\n\nDúvidas? Fale com a recepção. 💬\n\n_GymFlow Gestor_`,
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      tipo: 'inadimplencia',
    })
  }

  async enviarPagamentoConfirmado(params: {
    telefone: string; nomeAluno: string; plano: string
    dataVencimento: string; academiaId: string; alunoId: string
  }) {
    return this.enviarMensagem({
      telefone: params.telefone,
      mensagem: `✅ *Pagamento confirmado!*\n\nOlá, *${params.nomeAluno}*!\n\nSeu pagamento foi recebido com sucesso.\n\n📋 Plano: *${params.plano}*\n📅 Válido até: *${params.dataVencimento}*\n\nBons treinos! 💪\n\n_GymFlow Gestor_`,
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      tipo: 'pagamento_confirmado',
    })
  }

  async enviarReengajamento(params: {
    telefone: string; nomeAluno: string; diasSemAcesso: number
    academiaId: string; alunoId: string
  }) {
    return this.enviarMensagem({
      telefone: params.telefone,
      mensagem: `💪 Ei, *${params.nomeAluno}*!\n\nFaz *${params.diasSemAcesso} dias* que você não treina.\n\nSua academia está te esperando. Que tal voltar hoje? 🏋️\n\n_GymFlow Gestor — Sua academia inteligente_`,
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      tipo: 'reengajamento',
    })
  }

  async enviarAniversario(params: {
    telefone: string; nomeAluno: string
    academiaId: string; alunoId: string; academia: string
  }) {
    return this.enviarMensagem({
      telefone: params.telefone,
      mensagem: `🎂 *Feliz aniversário, ${params.nomeAluno}!*\n\nToda a equipe da *${params.academia}* deseja um dia incrível para você!\n\nComo presente, aqui vai muita energia positiva para os seus treinos. 🎁💪\n\n_GymFlow Gestor_`,
      academiaId: params.academiaId,
      alunoId: params.alunoId,
      tipo: 'aniversario',
    })
  }

  // ─── Gestão da instância ────────────────────────────

  async verificarConexao(): Promise<boolean> {
    try {
      const { data } = await this.api.get(`/instance/connectionState/${this.instancia}`)
      return data?.instance?.state === 'open'
    } catch {
      return false
    }
  }

  async criarInstancia() {
    return this.api.post('/instance/create', {
      instanceName: this.instancia,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    })
  }

  async obterQrCode() {
    const { data } = await this.api.get(`/instance/connect/${this.instancia}`)
    return data
  }
}
