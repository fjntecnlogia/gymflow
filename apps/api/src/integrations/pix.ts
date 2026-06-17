import axios from 'axios'
import https from 'https'
import fs from 'fs'
import path from 'path'

interface CobrancaParams {
  valor: number
  alunoNome: string
  descricao: string
  expiracao: number
}

interface CobrancaResult {
  txid: string
  qrCode: string
  linkPagamento: string
  copiaECola: string
}

export class PixService {
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiraEm: number = 0
  private sandbox: boolean

  constructor() {
    this.sandbox = process.env.EFI_SANDBOX === 'true'
    this.baseUrl = this.sandbox
      ? 'https://pix-h.api.efipay.com.br'
      : 'https://pix.api.efipay.com.br'
  }

  private getAxiosInstance() {
    const config: any = {
      baseURL: this.baseUrl,
      timeout: 15000,
    }

    // Em produção, usar certificado mTLS da Efí Bank
    const certPath = path.resolve(process.cwd(), 'certs', 'efi-cert.p12')
    if (!this.sandbox && fs.existsSync(certPath)) {
      const cert = fs.readFileSync(certPath)
      config.httpsAgent = new https.Agent({ pfx: cert, passphrase: '' })
    }

    return axios.create(config)
  }

  private async getToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiraEm) {
      return this.accessToken
    }

    const client = this.getAxiosInstance()
    const credentials = Buffer.from(
      `${process.env.EFI_CLIENT_ID}:${process.env.EFI_CLIENT_SECRET}`
    ).toString('base64')

    const { data } = await client.post('/oauth/token', 'grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    this.accessToken = data.access_token
    this.tokenExpiraEm = Date.now() + (data.expires_in - 60) * 1000
    return this.accessToken!
  }

  async criarCobranca(params: CobrancaParams): Promise<CobrancaResult> {
    const token = await this.getToken()
    const client = this.getAxiosInstance()
    const txid = `gf${Date.now()}${Math.random().toString(36).slice(2, 7)}`

    // Criar cobrança PIX
    await client.put(`/v2/cob/${txid}`, {
      calendario: { expiracao: params.expiracao },
      devedor: { nome: params.alunoNome },
      valor: { original: params.valor.toFixed(2) },
      chave: process.env.PIX_CHAVE,
      solicitacaoPagador: params.descricao,
      infoAdicionais: [{ nome: 'Sistema', valor: 'GymFlow Gestor' }],
    }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })

    // Gerar QR Code
    const { data: qrData } = await client.get(`/v2/cob/${txid}/qrcode`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return {
      txid,
      qrCode: qrData.imagemQrcode,
      linkPagamento: qrData.linkVisualizacao,
      copiaECola: qrData.qrcode,
    }
  }

  async consultarCobranca(txid: string) {
    const token = await this.getToken()
    const client = this.getAxiosInstance()
    const { data } = await client.get(`/v2/cob/${txid}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  }

  async configurarWebhook(chave: string, webhookUrl: string) {
    const token = await this.getToken()
    const client = this.getAxiosInstance()
    await client.put(`/v2/webhook/${chave}`, { webhookUrl }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    return { ok: true }
  }

  validarWebhook(payload: any, secret: string): boolean {
    // Efí Bank envia os dados diretamente, validação por IP ou HMAC dependendo do plano
    return !!payload?.pix
  }
}
