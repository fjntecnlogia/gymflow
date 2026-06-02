import { z } from 'zod'

// ─── Schemas Zod ──────────────────────────────────────────

export const FAIXAS_ALUNOS = ['0-50', '50-200', '200-500', '500+'] as const

export const criarAgendamentoSchema = z.object({
  nome: z.string().trim().min(2, 'Nome muito curto').max(120),
  telefone: z.string().trim().min(10, 'Telefone inválido').max(20),
  email: z.string().trim().email('E-mail inválido').optional().or(z.literal('').transform(() => undefined)),
  academiaNome: z.string().trim().min(2, 'Nome da academia muito curto').max(120),
  cidade: z.string().trim().min(2, 'Cidade muito curta').max(80),
  numAlunos: z.enum(FAIXAS_ALUNOS),
  horarioPreferido: z.string().trim().min(2).max(60),
  observacao: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
})

export const atualizarStatusAgendamentoSchema = z.object({
  status: z.enum(['pendente', 'contatado', 'convertido', 'perdido']),
})

export const filtroAgendamentoSchema = z.object({
  status: z.enum(['pendente', 'contatado', 'convertido', 'perdido']).optional(),
  busca: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  page: z.coerce.number().int().min(1).default(1),
})

export type CriarAgendamentoDTO = z.infer<typeof criarAgendamentoSchema>
export type FiltroAgendamentoDTO = z.infer<typeof filtroAgendamentoSchema>

// ─── Serializer DB <→ frontend ────────────────────────────
// Banco usa enum em UPPER_CASE, frontend espera lowercase.

const STATUS_DB_TO_API = {
  PENDENTE: 'pendente',
  CONTATADO: 'contatado',
  CONVERTIDO: 'convertido',
  PERDIDO: 'perdido',
} as const

const STATUS_API_TO_DB = {
  pendente: 'PENDENTE',
  contatado: 'CONTATADO',
  convertido: 'CONVERTIDO',
  perdido: 'PERDIDO',
} as const

export type StatusApi = keyof typeof STATUS_API_TO_DB
export type StatusDb = keyof typeof STATUS_DB_TO_API

export function statusParaApi(s: StatusDb): StatusApi {
  return STATUS_DB_TO_API[s]
}

export function statusParaDb(s: StatusApi): StatusDb {
  return STATUS_API_TO_DB[s]
}

/**
 * Converte registro do Prisma para o shape que o frontend espera.
 * Mantém alinhado com a interface Agendamento em admin/agendamentos/page.tsx.
 */
export function serializarAgendamento(a: {
  id: string
  criadoEm: Date
  nome: string
  telefone: string
  email: string | null
  academiaNome: string
  cidade: string
  numAlunos: string
  horarioPreferido: string
  observacao: string | null
  status: string
  contatadoEm: Date | null
  convertidoEm: Date | null
}) {
  return {
    id: a.id,
    createdAt: a.criadoEm.toISOString(),
    nome: a.nome,
    telefone: a.telefone,
    email: a.email ?? undefined,
    academiaNome: a.academiaNome,
    cidade: a.cidade,
    numAlunos: a.numAlunos as '0-50' | '50-200' | '200-500' | '500+',
    horarioPreferido: a.horarioPreferido,
    observacao: a.observacao ?? undefined,
    status: statusParaApi(a.status as StatusDb),
    contatadoEm: a.contatadoEm?.toISOString(),
    convertidoEm: a.convertidoEm?.toISOString(),
  }
}
