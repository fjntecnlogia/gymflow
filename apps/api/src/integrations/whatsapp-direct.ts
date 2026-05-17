import { prisma } from '../lib/prisma'

/**
 * Serviço WhatsApp usando Baileys direto com sessão no PostgreSQL
 * Alternativa à Evolution API quando o IP está bloqueado pelo WhatsApp
 */
export class WhatsAppDirectService {
  private academiaId: string
  private sock: any = null
  private connected = false

  constructor(academiaId: string) {
    this.academiaId = academiaId
  }

  async iniciar(): Promise<void> {
    try {
      const { default: makeWASocket, useMultiFileAuthState } = await import('@whiskeysockets/baileys' as any)
      const pino = (await import('pino')).default

      const state = await this.buildAuthState()

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Gymflow', 'Chrome', '120.0.0'],
        connectTimeoutMs: 30000,
      })

      this.sock.ev.on('connection.update', (update: any) => {
        if (update.connection === 'open') {
          this.connected = true
          console.log('[WhatsApp] Conectado via sessão PostgreSQL')
        }
        if (update.connection === 'close') {
          this.connected = false
          console.log('[WhatsApp] Desconectado')
        }
      })

      this.sock.ev.on('creds.update', () => this.saveCredentials())
    } catch (err: any) {
      console.error('[WhatsApp] Erro ao iniciar:', err.message)
    }
  }

  private async buildAuthState() {
    const records = await prisma.whatsappSession.findMany({
      where: { academiaId: this.academiaId },
    })

    const store: Record<string, any> = {}
    records.forEach(r => { store[r.key] = r.data })

    return {
      creds: store['creds'] ?? {},
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: Record<string, any> = {}
          for (const id of ids) {
            const key = `${type}-${id}`
            if (store[key]) data[id] = store[key]
          }
          return data
        },
        set: async (items: Record<string, any>) => {
          for (const [type, values] of Object.entries(items)) {
            for (const [id, value] of Object.entries(values as any)) {
              const key = `${type}-${id}`
              store[key] = value
              await prisma.whatsappSession.upsert({
                where: { academiaId_key: { academiaId: this.academiaId, key } },
                create: { academiaId: this.academiaId, key, data: value as any },
                update: { data: value as any },
              })
            }
          }
        },
      },
    }
  }

  private async saveCredentials() {
    if (!this.sock?.authState?.creds) return
    await prisma.whatsappSession.upsert({
      where: { academiaId_key: { academiaId: this.academiaId, key: 'creds' } },
      create: { academiaId: this.academiaId, key: 'creds', data: this.sock.authState.creds },
      update: { data: this.sock.authState.creds },
    })
  }

  async enviarMensagem(telefone: string, mensagem: string): Promise<boolean> {
    if (!this.sock || !this.connected) return false

    try {
      let num = telefone.replace(/\D/g, '')
      if (!num.startsWith('55')) num = '55' + num
      const jid = `${num}@s.whatsapp.net`

      await this.sock.sendMessage(jid, { text: mensagem })
      return true
    } catch (err: any) {
      console.error('[WhatsApp] Erro ao enviar:', err.message)
      return false
    }
  }

  isConectado(): boolean {
    return this.connected
  }
}

// Singleton por academia
const instances: Map<string, WhatsAppDirectService> = new Map()

export async function getWhatsAppService(academiaId: string): Promise<WhatsAppDirectService> {
  if (!instances.has(academiaId)) {
    const svc = new WhatsAppDirectService(academiaId)
    instances.set(academiaId, svc)
    await svc.iniciar()
  }
  return instances.get(academiaId)!
}
