import axios, { AxiosInstance } from 'axios'

export type ModeloCatraca = 'CONTROLID' | 'HENRY' | 'GENERICO'

interface AcessoResult {
  liberado: boolean
  mensagem: string
}

export class CatracaService {
  private modelo: ModeloCatraca

  constructor(modelo: ModeloCatraca = 'GENERICO') {
    this.modelo = modelo
  }

  // ─── Control iD ─────────────────────────────────────────────────────────────
  private clienteControlId(ip: string, senha: string): AxiosInstance {
    return axios.create({
      baseURL: `http://${ip}`,
      headers: { Authorization: `Basic ${Buffer.from(`admin:${senha}`).toString('base64')}` },
      timeout: 5000,
    })
  }

  // ─── Henry ──────────────────────────────────────────────────────────────────
  private clienteHenry(ip: string, token: string): AxiosInstance {
    return axios.create({
      baseURL: `http://${ip}:8080`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 5000,
    })
  }

  private getCliente(ip: string, credencial: string): AxiosInstance {
    if (this.modelo === 'HENRY') return this.clienteHenry(ip, credencial)
    return this.clienteControlId(ip, credencial)
  }

  // ─── Testar conexão ──────────────────────────────────────────────────────────
  async testarConexao(ip: string, credencial: string): Promise<boolean> {
    try {
      const client = this.getCliente(ip, credencial)
      if (this.modelo === 'HENRY') {
        await client.get('/api/v1/device/status')
      } else {
        await client.get('/status')
      }
      return true
    } catch {
      return false
    }
  }

  // ─── Liberar acesso pontual ──────────────────────────────────────────────────
  async liberarAcesso(ip: string, credencial: string, alunoId: string): Promise<AcessoResult> {
    try {
      const client = this.getCliente(ip, credencial)
      if (this.modelo === 'HENRY') {
        await client.post('/api/v1/access/open', { userId: alunoId, direction: 'entry' })
      } else {
        await client.post('/access/open', { user_id: alunoId, direction: 'in' })
      }
      return { liberado: true, mensagem: 'Catraca liberada' }
    } catch (err: any) {
      console.error(`Catraca [${ip}] erro:`, err.message)
      return { liberado: false, mensagem: 'Falha ao comunicar com a catraca' }
    }
  }

  // ─── Bloquear aluno na catraca ───────────────────────────────────────────────
  async bloquearAluno(ip: string, credencial: string, alunoId: string): Promise<boolean> {
    try {
      const client = this.getCliente(ip, credencial)
      if (this.modelo === 'HENRY') {
        await client.put(`/api/v1/users/${alunoId}`, { active: false })
      } else {
        await client.delete(`/access/users/${alunoId}`)
      }
      return true
    } catch {
      return false
    }
  }

  // ─── Reativar aluno na catraca ───────────────────────────────────────────────
  async reativarAluno(ip: string, credencial: string, aluno: { id: string; nome: string; qrCodeToken: string }): Promise<boolean> {
    try {
      const client = this.getCliente(ip, credencial)
      if (this.modelo === 'HENRY') {
        await client.put(`/api/v1/users/${aluno.id}`, {
          active: true,
          name: aluno.nome,
          cards: [{ type: 'qrcode', value: aluno.qrCodeToken }],
        })
      } else {
        await client.post('/access/users', {
          id: aluno.id,
          name: aluno.nome,
          cards: [{ type: 'qrcode', value: aluno.qrCodeToken }],
        })
      }
      return true
    } catch {
      return false
    }
  }

  // ─── Sincronizar lista completa ──────────────────────────────────────────────
  async sincronizarLista(
    ip: string,
    credencial: string,
    alunos: Array<{ id: string; nome: string; qrCodeToken: string }>,
  ): Promise<{ ok: boolean; sincronizados: number; erros: number }> {
    let sincronizados = 0
    let erros = 0

    const client = this.getCliente(ip, credencial)

    for (const aluno of alunos) {
      try {
        if (this.modelo === 'HENRY') {
          await client.post('/api/v1/users', {
            id: aluno.id,
            name: aluno.nome,
            active: true,
            cards: [{ type: 'qrcode', value: aluno.qrCodeToken }],
          })
        } else {
          await client.post('/access/users', {
            id: aluno.id,
            name: aluno.nome,
            cards: [{ type: 'qrcode', value: aluno.qrCodeToken }],
          })
        }
        sincronizados++
      } catch {
        erros++
      }
    }

    return { ok: erros === 0, sincronizados, erros }
  }

  // ─── Buscar log de eventos da catraca ────────────────────────────────────────
  async buscarLogs(ip: string, credencial: string, desde?: Date): Promise<any[]> {
    try {
      const client = this.getCliente(ip, credencial)
      const params = desde ? { since: desde.toISOString() } : {}

      if (this.modelo === 'HENRY') {
        const { data } = await client.get('/api/v1/access/events', { params })
        return data.events ?? data
      } else {
        const { data } = await client.get('/access/events', { params })
        return data.events ?? data
      }
    } catch {
      return []
    }
  }
}
