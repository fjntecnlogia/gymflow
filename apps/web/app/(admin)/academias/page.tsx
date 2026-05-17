'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Building2, Search, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, Ban, ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'

const STATUS_COLOR: Record<string, string> = {
  ATIVO: 'text-green bg-green/10',
  TRIAL: 'text-cyan bg-cyan/10',
  INADIMPLENTE: 'text-red bg-red/10',
  CANCELADO: 'text-muted bg-dark-border',
}

const PLANO_VALOR: Record<string, number> = { STARTER: 197, PRO: 397, ENTERPRISE: 797 }

export default function AdminAcademiasPage() {
  const [academias, setAcademias] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [acaoId, setAcaoId] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data } = await api.get('/admin/academias?limit=100')
    setAcademias(data)
    setLoading(false)
  }

  async function alterarStatus(id: string, status: string) {
    setAcaoId(id)
    try {
      await api.patch(`/admin/academias/${id}/status`, { status })
      carregar()
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Erro')
    } finally { setAcaoId(null) }
  }

  useEffect(() => { carregar() }, [])

  const filtradas = academias.filter(a => {
    const matchBusca = !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !filtroStatus || a.status === filtroStatus
    return matchBusca && matchStatus
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Academias</h1>
          <p className="text-muted text-sm">{academias.length} academias cadastradas</p>
        </div>
        <button onClick={carregar} className="p-2 rounded-lg border border-dark-border hover:border-cyan/40">
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan' : 'text-muted'} />
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9 w-full" placeholder="Buscar por nome ou email..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        {['', 'TRIAL', 'ATIVO', 'INADIMPLENTE', 'CANCELADO'].map(s => (
          <button key={s} onClick={() => setFiltroStatus(s)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${filtroStatus === s ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-dark-card border border-dark-border text-muted hover:text-white'}`}>
            {s || 'Todos'}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              {['Academia', 'Contato', 'Plano', 'Alunos', 'Criado em', 'Trial', 'Status', 'Ações'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map(a => {
              const diasTrial = a.trialExpiraEm ? dayjs(a.trialExpiraEm).diff(dayjs(), 'day') : null
              return (
                <tr key={a.id} className="border-b border-dark-border/40 hover:bg-white/2 group">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{a.nome}</div>
                    <div className="text-xs text-muted font-mono">/{a.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <div>{a.email}</div>
                    <div>{a.telefone ?? '–'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.planoSaas === 'ENTERPRISE' ? 'bg-orange/10 text-orange' : a.planoSaas === 'PRO' ? 'bg-cyan/10 text-cyan' : 'bg-dark-border text-muted'}`}>
                      {a.planoSaas}
                    </span>
                    <div className="text-xs text-muted mt-0.5">R$ {PLANO_VALOR[a.planoSaas] ?? 197}/mês</div>
                  </td>
                  <td className="px-4 py-3 text-muted text-center">{a._count?.alunos ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-muted">{dayjs(a.criadoEm).format('DD/MM/YYYY')}</td>
                  <td className="px-4 py-3 text-xs">
                    {diasTrial !== null ? (
                      <span className={diasTrial <= 0 ? 'text-red font-bold' : diasTrial <= 3 ? 'text-orange font-semibold' : 'text-muted'}>
                        {diasTrial <= 0 ? 'Expirado' : `${diasTrial}d`}
                      </span>
                    ) : '–'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[a.status] ?? ''}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {a.status !== 'ATIVO' && (
                        <button onClick={() => alterarStatus(a.id, 'ATIVO')} disabled={acaoId === a.id}
                          className="text-xs text-green hover:underline flex items-center gap-1">
                          {acaoId === a.id ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle2 size={10} />} Ativar
                        </button>
                      )}
                      {a.status === 'ATIVO' && (
                        <button onClick={() => alterarStatus(a.id, 'INADIMPLENTE')} disabled={acaoId === a.id}
                          className="text-xs text-red hover:underline flex items-center gap-1">
                          <Ban size={10} /> Bloquear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtradas.length === 0 && !loading && (
          <div className="py-10 text-center text-muted text-sm">
            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
            Nenhuma academia encontrada
          </div>
        )}
      </div>
    </div>
  )
}
