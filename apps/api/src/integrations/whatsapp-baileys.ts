import { prisma } from '../lib/prisma'

/**
 * Adapter de autenticação Baileys usando PostgreSQL como storage
 * Cada academia tem sua própria sessão WhatsApp isolada
 */
export function usePrismaAuthState(academiaId: string) {
  // Chave especial para as credenciais principais
  const CREDS_KEY = 'creds'

  async function readData(key: string): Promise<any | null> {
    try {
      const record = await prisma.whatsappSession.findUnique({
        where: { academiaId_key: { academiaId, key } },
      })
      return record ? record.data : null
    } catch {
      return null
    }
  }

  async function writeData(key: string, data: any): Promise<void> {
    await prisma.whatsappSession.upsert({
      where: { academiaId_key: { academiaId, key } },
      create: { academiaId, key, data },
      update: { data },
    })
  }

  async function removeData(key: string): Promise<void> {
    await prisma.whatsappSession.deleteMany({
      where: { academiaId, key },
    })
  }

  async function clearAll(): Promise<void> {
    await prisma.whatsappSession.deleteMany({ where: { academiaId } })
  }

  return { readData, writeData, removeData, clearAll }
}

/**
 * Seed: importa os arquivos de sessão Baileys locais para o PostgreSQL
 * Chamado uma vez para migrar a sessão local para a nuvem
 */
export async function seedWhatsappSession(
  academiaId: string,
  sessionFiles: Record<string, string>,
): Promise<{ importados: number; erros: number }> {
  const { writeData } = usePrismaAuthState(academiaId)
  let importados = 0
  let erros = 0

  for (const [filename, content] of Object.entries(sessionFiles)) {
    try {
      const key = filename.replace('.json', '')
      const data = JSON.parse(content)
      await writeData(key, data)
      importados++
    } catch (err) {
      console.error(`Erro ao importar ${filename}:`, err)
      erros++
    }
  }

  return { importados, erros }
}
