/**
 * Converte erros Prisma em erros HTTP com mensagens amigáveis
 */
export function tratarErroPrisma(err: any): never {
  // P2002 — Unique constraint failed
  if (err?.code === 'P2002') {
    const campos: string[] = err?.meta?.target ?? []
    if (campos.includes('email')) {
      throw Object.assign(new Error('Este e-mail já está cadastrado'), { statusCode: 400 })
    }
    if (campos.includes('cpf')) {
      throw Object.assign(new Error('Este CPF já está cadastrado'), { statusCode: 400 })
    }
    if (campos.includes('telefone')) {
      throw Object.assign(new Error('Este telefone já está cadastrado'), { statusCode: 400 })
    }
    if (campos.includes('slug')) {
      throw Object.assign(new Error('Este slug já está em uso'), { statusCode: 400 })
    }
    const camposStr = campos.filter(c => !['academiaId', 'academiaid'].includes(c)).join(', ')
    throw Object.assign(
      new Error(`Registro duplicado${camposStr ? `: ${camposStr}` : ''}`),
      { statusCode: 400 },
    )
  }

  // P2025 — Record not found
  if (err?.code === 'P2025') {
    throw Object.assign(new Error('Registro não encontrado'), { statusCode: 404 })
  }

  // P2003 — Foreign key constraint
  if (err?.code === 'P2003') {
    throw Object.assign(new Error('Referência inválida — verifique os dados relacionados'), { statusCode: 400 })
  }

  // Outros erros Prisma
  if (err?.code?.startsWith('P')) {
    throw Object.assign(new Error('Erro de banco de dados'), { statusCode: 500 })
  }

  throw err
}

/**
 * Wrapper para operações Prisma com tratamento automático de erros
 */
export async function prismaOp<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err: any) {
    tratarErroPrisma(err)
  }
}
