import { z } from 'zod'

export const criarAlunoSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email().optional(),
  telefone: z.string().min(10),
  cpf: z.string().optional(),
  dataNascimento: z.string().optional(),
  observacoes: z.string().optional(),
})

export const atualizarAlunoSchema = criarAlunoSchema.partial()

export const filtroAlunoSchema = z.object({
  status: z.enum(['ATIVO', 'INADIMPLENTE', 'SUSPENSO', 'CANCELADO']).optional(),
  busca: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
})

export type CriarAlunoDTO = z.infer<typeof criarAlunoSchema>
export type FiltroAlunoDTO = z.infer<typeof filtroAlunoSchema>
