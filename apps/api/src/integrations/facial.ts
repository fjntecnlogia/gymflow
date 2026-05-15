import axios, { AxiosInstance } from 'axios'

export interface ReconhecimentoResult {
  encontrado: boolean
  alunoId: string | null
  similaridade: number | null
  mensagem: string
}

export class FacialService {
  private api: AxiosInstance

  constructor() {
    const baseURL = process.env.COMPREFACE_URL ?? 'http://compreface:8000'
    const apiKey = process.env.COMPREFACE_API_KEY ?? ''

    this.api = axios.create({
      baseURL,
      headers: { 'x-api-key': apiKey },
      timeout: 15000,
    })
  }

  // ─── Converter base64 para Buffer ────────────────────────────────────────────
  private base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
    const match = base64.match(/^data:(image\/\w+);base64,(.+)$/)
    if (match) {
      return {
        buffer: Buffer.from(match[2], 'base64'),
        mimeType: match[1],
      }
    }
    // Sem prefixo data URI — assume JPEG
    return {
      buffer: Buffer.from(base64, 'base64'),
      mimeType: 'image/jpeg',
    }
  }

  // ─── Cadastrar face de um aluno ──────────────────────────────────────────────
  async cadastrarFace(alunoId: string, fotoBase64: string): Promise<{ ok: boolean; erro?: string }> {
    try {
      const { buffer, mimeType } = this.base64ToBuffer(fotoBase64)
      const ext = mimeType === 'image/png' ? 'png' : 'jpg'

      // Usa FormData nativo do Node 18+
      const form = new (globalThis as any).FormData()
      const blob = new (globalThis as any).Blob([buffer], { type: mimeType })
      form.append('file', blob, `face.${ext}`)

      await this.api.post(`/api/v1/recognition/faces?subject=${alunoId}`, form)

      return { ok: true }
    } catch (err: any) {
      console.error('[CompreFace] Erro ao cadastrar face:', err?.response?.data ?? err.message)
      return { ok: false, erro: err?.response?.data?.message ?? err.message }
    }
  }

  // ─── Remover todas as faces de um aluno ──────────────────────────────────────
  async removerFace(alunoId: string): Promise<boolean> {
    try {
      await this.api.delete(`/api/v1/recognition/faces/${alunoId}`)
      return true
    } catch {
      return false
    }
  }

  // ─── Reconhecer face — retorna alunoId se encontrado ────────────────────────
  async reconhecer(
    fotoBase64: string,
    limiarSimilaridade = 0.80,
  ): Promise<ReconhecimentoResult> {
    try {
      const { buffer, mimeType } = this.base64ToBuffer(fotoBase64)
      const ext = mimeType === 'image/png' ? 'png' : 'jpg'

      const form = new (globalThis as any).FormData()
      const blob = new (globalThis as any).Blob([buffer], { type: mimeType })
      form.append('file', blob, `face.${ext}`)

      const { data } = await this.api.post(
        `/api/v1/recognition/recognize?limit=1&det_prob_threshold=0.8&prediction_count=1`,
        form,
      )

      const resultado = data?.result?.[0]
      if (!resultado) {
        return { encontrado: false, alunoId: null, similaridade: null, mensagem: 'Nenhum rosto detectado na imagem' }
      }

      const melhor = resultado?.subjects?.[0]
      if (!melhor || melhor.similarity < limiarSimilaridade) {
        return {
          encontrado: false,
          alunoId: null,
          similaridade: melhor?.similarity ?? null,
          mensagem: 'Rosto não reconhecido',
        }
      }

      return {
        encontrado: true,
        alunoId: melhor.subject,
        similaridade: melhor.similarity,
        mensagem: 'Rosto reconhecido',
      }
    } catch (err: any) {
      console.error('[CompreFace] Erro ao reconhecer:', err?.response?.data ?? err.message)
      return {
        encontrado: false,
        alunoId: null,
        similaridade: null,
        mensagem: err?.response?.data?.message ?? 'Erro no serviço de reconhecimento facial',
      }
    }
  }

  // ─── Verificar se o serviço está online ──────────────────────────────────────
  async verificarStatus(): Promise<boolean> {
    try {
      await this.api.get('/actuator/health')
      return true
    } catch {
      try {
        // Fallback: tenta listar faces
        await this.api.get('/api/v1/recognition/faces?page=0&size=1')
        return true
      } catch {
        return false
      }
    }
  }

  // ─── Contar faces cadastradas ────────────────────────────────────────────────
  async contarFaces(): Promise<number> {
    try {
      const { data } = await this.api.get('/api/v1/recognition/faces?page=0&size=1')
      return data?.totalItems ?? 0
    } catch {
      return 0
    }
  }
}
