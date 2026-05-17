import axios from 'axios'
import { prisma } from '../../lib/prisma'

// URL interna do CompreFace Core (ML engine Python)
const CF_CORE = process.env.COMPREFACE_CORE_URL ?? 'http://compreface-core.railway.internal:3000'
// URL pública do CompreFace API (Spring Boot — usada se 200)
const CF_API  = process.env.COMPREFACE_API_URL  ?? 'https://compreface-api-production-60a6.up.railway.app'
const CF_KEY  = process.env.COMPREFACE_API_KEY  ?? 'aa35b15c-56a9-4d9c-b582-ecde23ad0757'

/**
 * Serviço de biometria facial para GYMFLOW.
 *
 * Endpoint confirmado do CompreFace Core:
 *   POST /find_faces
 *   face_plugins: age,calculator  ← OBRIGATÓRIO para obter embeddings
 *
 * Response:
 *   { result: [{ box: {...}, embedding: [512 floats], age: {...} }] }
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

  /**
   * Chama POST /find_faces com face_plugins=age,calculator no Core.
   * Retorna o embedding (512 floats) da primeira face detectada.
   *
   * Endpoint confirmado: /find_faces com face_plugins=age,calculator retorna hasEmbedding=true
   */
  async calcularEmbedding(imageBase64: string): Promise<number[]> {
    const form = this._buildMultipart(imageBase64)
    form.append('face_plugins', 'age,calculator')

    try {
      const res = await axios.post(
        `${CF_CORE}/find_faces`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000, // ML pode demorar até 15s
        }
      )

      const result = res.data?.result?.[0]
      if (!result) throw new Error('Nenhuma face detectada na imagem')
      if (!result.embedding) throw new Error('Embedding não retornado — verifique face_plugins')
      return result.embedding as number[]
    } catch (e: any) {
      if (e.message.includes('Nenhuma face') || e.message.includes('Embedding')) throw e
      throw new Error(`Falha no CompreFace Core: ${e.message}`)
    }
  }

  // ── Cadastrar face de um aluno ─────────────────────────────────────────
  async cadastrarFace(academiaId: string, alunoId: string, imageBase64: string) {
    const aluno = await prisma.aluno.findFirst({ where: { id: alunoId, academiaId } })
    if (!aluno) throw new Error('Aluno não encontrado')

    // Tentar via CompreFace API Spring Boot (quando estiver funcionando)
    try {
      const form = this._buildMultipart(imageBase64)
      const subjectName = `${academiaId}:${alunoId}`
      await axios.post(
        `${CF_API}/api/v1/recognition/faces?subject=${encodeURIComponent(subjectName)}`,
        form,
        { headers: { ...form.getHeaders(), 'x-api-key': CF_KEY }, timeout: 20000 }
      )
      await prisma.aluno.update({ where: { id: alunoId }, data: { faceRegistrada: true } })
      return { ok: true, metodo: 'compreface-api', subjectName }
    } catch {
      // Fallback: Core direto
    }

    // Calcular embedding via Core Python
    const embedding = await this.calcularEmbedding(imageBase64)

    await prisma.faceEmbedding.upsert({
      where:  { alunoId },
      create: { alunoId, academiaId, embedding: JSON.stringify(embedding) },
      update: { embedding: JSON.stringify(embedding), atualizadoEm: new Date() },
    })

    await prisma.aluno.update({ where: { id: alunoId }, data: { faceRegistrada: true } })
    return { ok: true, metodo: 'gymflow-db', dimensoes: embedding.length }
  }

  // ── Reconhecer face (identificar aluno) ───────────────────────────────
  async reconhecerFace(academiaId: string, imageBase64: string) {
    // Tentar via CompreFace API Spring Boot
    try {
      const form = this._buildMultipart(imageBase64)
      const res = await axios.post(
        `${CF_API}/api/v1/recognition/recognize`,
        form,
        { headers: { ...form.getHeaders(), 'x-api-key': CF_KEY }, timeout: 20000 }
      )
      const subject = res.data?.result?.[0]?.subjects?.[0]
      if (subject) {
        const [embAcademiaId, alunoId] = (subject.subject as string).split(':')
        if (embAcademiaId === academiaId) {
          const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } })
          return { ok: true, reconhecido: true, aluno, similaridade: subject.similarity, metodo: 'compreface-api' }
        }
      }
      return { ok: true, reconhecido: false, metodo: 'compreface-api' }
    } catch {
      // Fallback: Core + embeddings no GYMFLOW DB
    }

    // Calcular embedding da imagem recebida
    const embedding = await this.calcularEmbedding(imageBase64)

    const embeddings = await prisma.faceEmbedding.findMany({
      where:   { academiaId },
      include: { aluno: { select: { id: true, nome: true, status: true, qrCodeToken: true } } },
    })

    if (embeddings.length === 0) {
      return { ok: true, reconhecido: false, motivo: 'Nenhuma face cadastrada nesta academia' }
    }

    let melhorMatch: any = null
    let maiorSim = 0

    for (const item of embeddings) {
      const stored: number[] = JSON.parse(item.embedding)
      const sim = this._cosineSimilarity(embedding, stored)
      if (sim > maiorSim) { maiorSim = sim; melhorMatch = item }
    }

    const THRESHOLD = 0.82 // limiar facenet (~82% é robusto)
    if (maiorSim >= THRESHOLD && melhorMatch) {
      return { ok: true, reconhecido: true, aluno: melhorMatch.aluno, similaridade: maiorSim, metodo: 'gymflow-db' }
    }

    return { ok: true, reconhecido: false, maiorSimilaridade: maiorSim, metodo: 'gymflow-db' }
  }

  // ── Remover face de um aluno ───────────────────────────────────────────
  async removerFace(academiaId: string, alunoId: string) {
    await prisma.faceEmbedding.deleteMany({ where: { alunoId, academiaId } })
    await prisma.aluno.update({ where: { id: alunoId }, data: { faceRegistrada: false } })
    return { ok: true }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private _buildMultipart(imageBase64: string) {
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
