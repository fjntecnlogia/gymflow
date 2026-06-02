'use client'

import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import {
  CalendarClock,
  Search,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Building2,
  MapPin,
  Users,
  ExternalLink,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
import toast from 'react-hot-toast'

dayjs.extend(relativeTime)
dayjs.locale('pt-br')

// ───────────────────────────────────────────────────────────
// /admin/agendamentos — gestão de leads que solicitaram demo
//
// FRONTEND: pronto. Mesma identidade visual do resto do admin.
//
// BACKEND (TODO — fora do escopo desta tarefa):
//   ◾ GET   /admin/agendamentos        → lista (com filtros)
//   ◾ PATCH /admin/agendamentos/:id    → muda status
//   ◾ DELETE /admin/agendamentos/:id   → remove (opcional)
//
//   Shape esperado da listagem:
//   Agendamento {
//     id: string;
//     createdAt: string (ISO);
//     nome: string;
//     telefone: string;       // ex: "(65) 99999-9999"
//     email?: string;
//     academiaNome: string;
//     cidade: string;
//     numAlunos: '0-50' | '50-200' | '200-500' | '500+';
//     horarioPreferido: string;
//     observacao?: string;
//     status: 'pendente' | 'contatado' | 'convertido' | 'perdido';
//     contatadoEm?: string;
//     convertidoEm?: string;
//   }
// ───────────────────────────────────────────────────────────

type Status = 'pendente' | 'contatado' | 'convertido' | 'perdido'

interface Agendamento {
  id: string
  createdAt: string
  nome: string
  telefone: string
  email?: string
  academiaNome: string
  cidade: string
  numAlunos: '0-50' | '50-200' | '200-500' | '500+'
  horarioPreferido: string
  observacao?: string
  status: Status
  contatadoEm?: string
  convertidoEm?: string
}

const STATUS_META: Record<Status, { label: string; color: string; Icon: typeof Clock }> = {
  pendente:    { label: 'Pendente',    color: 'text-orange bg-orange/10 border-orange/30', Icon: Clock },
  contatado:   { label: 'Contatado',   color: 'text-cyan bg-cyan/10 border-cyan/30',       Icon: Phone },
  convertido:  { label: 'Convertido',  color: 'text-green bg-green/10 border-green/30',    Icon: CheckCircle2 },
  perdido:     { label: 'Perdido',     color: 'text-red bg-red/10 border-red/30',          Icon: XCircle },
}

const FAIXA_ALUNOS_LABEL: Record<string, string> = {
  '0-50': 'Até 50',
  '50-200': '50–200',
  '200-500': '200–500',
  '500+': '500+',
}

export default function AdminAgendamentosPage() {
  const [items, setItems] = useState<Agendamento[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<Status | ''>('')
  const [loading, setLoading] = useState(true)
  const [acaoId, setAcaoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    setErro(null)
    try {
      const { data } = await api.get('/admin/agendamentos?limit=200')
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      // Backend ainda não existe — mostra estado vazio amigável
      setErro(e?.response?.status === 404
        ? 'O endpoint /admin/agendamentos ainda não existe no backend. Crie-o pra ver os leads aqui.'
        : 'Não foi possível carregar os agendamentos.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  async function atualizarStatus(id: string, novoStatus: Status) {
    setAcaoId(id)
    try {
      await api.patch(`/admin/agendamentos/${id}`, { status: novoStatus })
      setItems((arr) => arr.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)))
      toast.success(`Marcado como ${STATUS_META[novoStatus].label.toLowerCase()}`)
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setAcaoId(null)
    }
  }

  function abrirWhatsApp(a: Agendamento) {
    const numero = a.telefone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá ${a.nome.split(' ')[0]}! Aqui é da FJN Tecnologia / GymFlow Gestor. ` +
      `Recebemos seu pedido de demonstração para a academia ${a.academiaNome}. ` +
      `Posso ligar agora ou prefere outro horário?`
    )
    window.open(`https://wa.me/55${numero}?text=${msg}`, '_blank')
  }

  // ─── Filtros aplicados ─────────────────────────────────
  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return items.filter((a) => {
      if (filtroStatus && a.status !== filtroStatus) return false
      if (!q) return true
      return (
        a.nome.toLowerCase().includes(q) ||
        a.academiaNome.toLowerCase().includes(q) ||
        a.cidade.toLowerCase().includes(q) ||
        a.telefone.includes(q)
      )
    })
  }, [items, busca, filtroStatus])

  // ─── Métricas topo ─────────────────────────────────────
  const metrics = useMemo(() => {
    const total = items.length
    const pendentes = items.filter((a) => a.status === 'pendente').length
    const convertidos = items.filter((a) => a.status === 'convertido').length
    const taxa = total ? Math.round((convertidos / total) * 100) : 0
    return { total, pendentes, convertidos, taxa }
  }, [items])

  return (
    <div className="p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <CalendarClock size={22} className="text-cyan" />
            Agendamentos
          </h1>
          <p className="text-sm text-muted mt-1">
            Solicitações de demonstração recebidas pelo site
          </p>
        </div>
        <button
          onClick={carregar}
          className="text-sm border border-dark-border hover:border-muted text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* ─── Métricas ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs text-muted uppercase tracking-wider mb-1">Total</div>
          <div className="font-display text-3xl font-black">{metrics.total}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Clock size={11} className="text-orange" /> Pendentes
          </div>
          <div className="font-display text-3xl font-black text-orange">{metrics.pendentes}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-green" /> Convertidos
          </div>
          <div className="font-display text-3xl font-black text-green">{metrics.convertidos}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp size={11} className="text-cyan" /> Conversão
          </div>
          <div className="font-display text-3xl font-black text-cyan">{metrics.taxa}%</div>
        </div>
      </div>

      {/* ─── Filtros ─── */}
      <div className="card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, academia, cidade ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select
          className="input md:w-52"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as Status | '')}
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_META) as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      {/* ─── Lista ─── */}
      {loading ? (
        <div className="card p-12 text-center text-sm text-muted">Carregando...</div>
      ) : erro ? (
        <div className="card p-10 text-center">
          <CalendarClock size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted max-w-md mx-auto">{erro}</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarClock size={36} className="text-muted mx-auto mb-4" />
          <h3 className="font-bold mb-1">Nenhum agendamento encontrado</h3>
          <p className="text-sm text-muted">
            {items.length === 0
              ? 'Quando alguém solicitar uma demonstração no /agendar, aparece aqui.'
              : 'Tente outro filtro de busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((a) => {
            const meta = STATUS_META[a.status]
            const StatusIcon = meta.Icon
            return (
              <div key={a.id} className="card p-5 hover:border-cyan/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* esquerda — info do lead */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-base">{a.nome}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color}`}>
                        <StatusIcon size={10} className="inline mr-1 -mt-0.5" />
                        {meta.label}
                      </span>
                      <span className="text-xs text-muted">
                        · {dayjs(a.createdAt).fromNow()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted">
                      <div className="flex items-center gap-2">
                        <Building2 size={12} /> <span className="text-white">{a.academiaNome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} /> {a.cidade}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={12} /> {a.telefone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={12} /> {FAIXA_ALUNOS_LABEL[a.numAlunos] || a.numAlunos} alunos
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Clock size={12} /> {a.horarioPreferido}
                      </div>
                      {a.email && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <ExternalLink size={12} /> {a.email}
                        </div>
                      )}
                    </div>
                    {a.observacao && (
                      <div className="mt-3 p-3 rounded-lg bg-dark-card2 border border-dark-border text-xs text-muted italic">
                        &ldquo;{a.observacao}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* direita — ações */}
                  <div className="flex flex-col gap-2 md:w-44">
                    <button
                      onClick={() => abrirWhatsApp(a)}
                      className="gradient-btn text-dark font-bold text-xs px-3 py-2 rounded-lg inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <select
                      className="input text-xs py-2"
                      value={a.status}
                      disabled={acaoId === a.id}
                      onChange={(e) => atualizarStatus(a.id, e.target.value as Status)}
                    >
                      {(Object.keys(STATUS_META) as Status[]).map((s) => (
                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
