import axios from 'axios'
import { prisma } from '../../lib/prisma'

// URL interna do CompreFace Core (ML engine Python)
const CF_CORE = process.env.COMPREFACE_CORE_URL ?? 'http://compreface-core.railway.internal:3000'
// URL pública do CompreFace API (Spring Boot — fallback se funcionar)
const CF_API  = process.env.COMPREFACE_API_URL  ?? 'https://compreface-api-production-60a6.up.railway.app'
const CF_KEY  = process.env.COMPREFACE_API_KEY  ?? 'aa35b15c-56a9-4d9c-b582-ecde23ad0757'

/**
 * Serviço de biometria facial para GYMFLOW.
 *
 * Estratégia:
 * 1. Tenta usar a CompreFace API (Spring Boot) primeiro
 * 2. Se retornar 500, cai no Core direto (Python FastAPI)
 *
 * Para o Core direto, fazemos:
 *   - Detecção: POST /api/v1/detection/detect  (retorna bounding boxes)
 *   - Cálculo:  POST /api/v1/calculation/calculate (retorna embedding vector)
 *   - Matching: comparação por similaridade de coseno no banco
 */
export class BiometriaService {

  // ── Verificar status do CompreFace ─────────────────────────────────────
  async verificarStatus() {
    const results: Record<string, any> = {}

    try {
      const r = await axios.get(`${CF_CORE}/status`, { timeout: 5000 })
      results.core = { ok: true, plugins: r.data?.available_plugins }
    } catch (e: any) {
      results.core = { ok: false, error: e.message }
    }

    try {
      await axios.get(`${CF_API}/api/v1/recognition/subjects`, {
        headers: { 'x-api-key': CF_KEY },
        timeout: 5000,
      })
      results.api = { ok: true }
    } catch (e: any) {
      results.api = { ok: false, error: e.message, status: (e as any).response?.status }
    }

    return results
  }

  // ── Detectar faces numa imagem (base64 ou URL) ─────────────────────────
  async detectarFaces(imageBase64: string): Promise<any[]> {
    // Tentar via compreface-api primeiro
    try {
      const res = await axios.post(
        `${CF_API}/api/v1/detection/detect`,
        this._buildMultipart(imageBase64),
        {
          headers: {
            'x-api-key': CF_KEY,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 15000,
        }
      )
      return res.data?.result ?? []
    } catch {
      // Fallback: Core direto
    }

    try {
      const res = await axios.post(
        `${CF_CORE}/api/v1/detection/detect`,
        this._buildMultipart(imageBase64),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000,
        }
      )
      return res.data?.result ?? []
    } catch (e: any) {
      throw new Error(`Falha na detecção facial: ${e.message}`)
    }
  }

  // ── Calcular embedding de uma imagem ──────────────────────────────────
  async calcularEmbedding(imageBase64: string): Promise<number[]> {
    try {
      const res = await axios.post(
        `${CF_CORE}/api/v1/calculation/calculate`,
        this._buildMultipart(imageBase64),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 20000,
        }
      )
      const result = res.data?.result?.[0]
      if (!result?.embedding) throw new Error('Nenhuma face detectada na imagem')
      return result.embedding
    } catch (e: any) {
      throw new Error(`Falha no cálculo de embedding: ${e.message}`)
    }
  }

  // ── Cadastrar face de um aluno ─────────────────────────────────────────
  async cadastrarFace(academiaId: string, alunoId: string, imageBase64: string) {
    // Verificar se aluno existe
    const aluno = await prisma.aluno.findFirst({
      where: { id: alunoId, academiaId },
    })
    if (!aluno) throw new Error('Aluno não encontrado')

    // Tentar via compreface-api (preferred path)
    try {
      const formData = this._buildMultipart(imageBase64)
      const subjectName = `${academiaId}:${alunoId}`

      await axios.post(
        `${CF_API}/api/v1/recognition/faces?subject=${encodeURIComponent(subjectName)}`,
        formData,
        {
          headers: { 'x-api-key': CF_KEY, 'Content-Type': 'multipart/form-data' },
          timeout: 20000,
        }
      )

      await prisma.aluno.update({
        where: { id: alunoId },
        data: { faceRegistrada: true },
      })

      return { ok: true, metodo: 'compreface-api', subjectName }
    } catch {
      // Fallback: Core direto
    }

    // Calcular embedding via core
    const embedding = await this.calcularEmbedding(imageBase64)

    // Salvar embedding no DB do GYMFLOW
    await prisma.faceEmbedding.upsert({
      where: { alunoId },
      create: {
        alunoId,
        academiaId,
        embedding: JSON.stringify(embedding),
      },
      update: {
        embedding: JSON.stringify(embedding),
        atualizadoEm: new Date(),
      },
    })

    await prisma.aluno.update({
      where: { id: alunoId },
      data: { faceRegistrada: true },
    })

    return { ok: true, metodo: 'gymflow-db', dimensoes: embedding.length }
  }

  // ── Reconhecer face (identificar aluno) ───────────────────────────────
  async reconhecerFace(academiaId: string, imageBase64: string) {
    // Tentar via compreface-api primeiro
    try {
      const res = await axios.post(
        `${CF_API}/api/v1/recognition/recognize`,
        this._buildMultipart(imageBase64),
        {
          headers: { 'x-api-key': CF_KEY, 'Content-Type': 'multipart/form-data' },
          timeout: 20000,
        }
      )
      const result = res.data?.result?.[0]?.subjects?.[0]
      if (result) {
        const [embAcademiaId, alunoId] = (result.subject as string).split(':')
        if (embAcademiaId === academiaId) {
          const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } })
          return { ok: true, reconhecido: true, aluno, similaridade: result.similarity, metodo: 'compreface-api' }
        }
      }
      return { ok: true, reconhecido: false, metodo: 'compreface-api' }
    } catch {
      // Fallback: Core + DB local
    }

    // Calcular embedding da imagem recebida
    const embedding = await this.calcularEmbedding(imageBase64)

    // Buscar embeddings cadastrados desta academia
    const embeddings = await prisma.faceEmbedding.findMany({
      where: { academiaId },
      include: { aluno: { select: { id: true, nome: true, status: true, qrCodeToken: true } } },
    })

    if (embeddings.length === 0) {
      return { ok: true, reconhecido: false, motivo: 'Nenhuma face cadastrada nesta academia' }
    }

    // Calcular similaridade de coseno
    let melhorMatch: any = null
    let maiorSimilaridade = 0

    for (const item of embeddings) {
      const stored: number[] = JSON.parse(item.embedding)
      const sim = this._cosineSimilarity(embedding, stored)
      if (sim > maiorSimilaridade) {
        maiorSimilaridade = sim
        melhorMatch = item
      }
    }

    const THRESHOLD = 0.85 // limiar de reconhecimento
    if (maiorSimilaridade >= THRESHOLD && melhorMatch) {
      return {
        ok: true,
        reconhecido: true,
        aluno: melhorMatch.aluno,
        similaridade: maiorSimilaridade,
        metodo: 'gymflow-db',
      }
    }

    return { ok: true, reconhecido: false, maiorSimilaridade, metodo: 'gymflow-db' }
  }

  // ── Remover face de um aluno ───────────────────────────────────────────
  async removerFace(academiaId: string, alunoId: string) {
    await prisma.faceEmbedding.deleteMany({ where: { alunoId, academiaId } })
    await prisma.aluno.update({
      where: { id: alunoId },
      data: { faceRegistrada: false },
    })
    return { ok: true }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private _buildMultipart(imageBase64: string) {
    // imageBase64 pode vir como data:image/jpeg;base64,... ou só o base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const FormData = require('form-data')
    const form = new FormData()
    form.append('file', buffer, { filename: 'face.jpg', contentType: 'image/jpeg' })
    return form
  }

  private _cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    let dot = 0, normA = 0, normB = 0
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}
