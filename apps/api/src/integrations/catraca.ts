import axios from 'axios'

interface AcessoResult {
  liberado: boolean
  mensagem: string
}

export class CatracaService {
  // Control iD — integração por API REST local
  private async controlId(ip: string, apiKey: string) {
    return axios.create({
      baseURL: `http://${ip}`,
      headers: { Authorization: `Basic ${Buffer.from(`admin:${apiKey}`).toString('base64')}` },
      timeout: 5000,
    })
  }

  async liberarAcesso(catracaIp: string, apiKey: string, alunoId: string): Promise<AcessoResult> {
    try {
      const client = await this.controlId(catracaIp, apiKey)
      await client.post('/access/open', { user_id: alunoId, direction: 'in' })
      return { liberado: true, mensagem: 'Catraca liberada' }
    } catch (err: any) {
      console.error(`Catraca [${catracaIp}] erro:`, err.message)
      return { liberado: false, mensagem: 'Falha ao comunicar com catraca' }
    }
  }

  async bloquearAluno(catracaIp: string, apiKey: string, alunoId: string): Promise<boolean> {
    try {
      const client = await this.controlId(catracaIp, apiKey)
      await client.delete(`/access/users/${alunoId}`)
      return true
    } catch {
      return false
    }
  }

  async sincronizarLista(catracaIp: string, apiKey: string, alunos: Array<{ id: string; nome: string; qrCodeToken: string }>) {
    try {
      const client = await this.controlId(catracaIp, apiKey)
      for (const aluno of alunos) {
        await client.post('/access/users', {
          id: aluno.id,
          name: aluno.nome,
          cards: [{ type: 'qrcode', value: aluno.qrCodeToken }],
        }).catch(() => {}) // Ignora erros individuais
      }
      return { ok: true, sincronizados: alunos.length }
    } catch (err: any) {
      return { ok: false, erro: err.message }
    }
  }

  async testarConexao(catracaIp: string, apiKey: string): Promise<boolean> {
    try {
      const client = await this.controlId(catracaIp, apiKey)
      await client.get('/status')
      return true
    } catch {
      return false
    }
  }
}
