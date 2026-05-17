import axios from 'axios'

/**
 * Bridge para o servidor WhatsApp local exposto via tunnel
 * O servidor local roda Baileys com IP residencial (não bloqueado pelo WhatsApp)
 */
export class WhatsAppBridgeService {
  private baseURL: string

  constructor() {
    this.baseURL = process.env.WA_LOCAL_SERVER ?? ''
  }

  get disponivel(): boolean {
    return !!this.baseURL
  }

  async verificarConexao(): Promise<boolean> {
    if (!this.baseURL) return false
    try {
      const { data } = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000,
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
      })
      return data.status === 'connected'
    } catch {
      return false
    }
  }

  async enviarMensagem(telefone: string, mensagem: string): Promise<boolean> {
    if (!this.baseURL) return false
    try {
      const { data } = await axios.post(
        `${this.baseURL}/send`,
        { number: telefone, message: mensagem },
        {
          timeout: 15000,
          headers: { 'Bypass-Tunnel-Reminder': 'true', 'Content-Type': 'application/json' },
        },
      )
      return data.ok === true
    } catch (err: any) {
      console.error('[WA Bridge] Erro ao enviar:', err.message)
      return false
    }
  }
}

// Singleton
let _bridge: WhatsAppBridgeService | null = null

export function getWhatsAppBridge(): WhatsAppBridgeService {
  if (!_bridge) _bridge = new WhatsAppBridgeService()
  return _bridge
}
