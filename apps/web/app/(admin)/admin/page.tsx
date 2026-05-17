'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Building2, Users, DollarSign, Activity, AlertTriangle,
  TrendingUp, CheckCircle2, XCircle, Clock, MoreVertical,
  RefreshCw, Zap, Shield, Ban
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.locale('pt-br')
dayjs.extend(relativeTime)

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ATIVO:        { label: 'Ativo',        color: 'text-green bg-green/10',       icon: CheckCircle2 },
  TRIAL:        { label: 'Trial',        color: 'text-cyan bg-cyan/10',         icon: Clock },
  INADIMPLENTE: { label: 'Inadimplente', color: 'text-red bg-red/10',           icon: AlertTriangle },
  CANCELADO:    { label: 'Cancelado',    color: 'text-muted bg-dark-border',     icon: XCircle },
}

const PLANO_VALOR: Record<string, number> = {
  STARTER: 197, PRO: 397, ENTERPRISE: 797,
}

export default function AdminPage() {
  const [overview, setOverview] = useState<any>(null)
  const [academias, setAcademias] = useState<any[]>([])
  const [mrr, setMrr] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [acaoId, setAcaoId] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const [oRes, aRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/academias?limit=50'),
      ])
      setOverview(oRes.data)
      setAcademias(aRes.data)

      // Calcular MRR estimado das academias ativas
      const mrrCalc = (aRes.data as any[])
        .filter((a: any) => a.status === 'ATIVO')
        .reduce((sum: number, a: any) => sum + (PLANO_VALOR[a.planoSaas] ?? 197), 0)
      setMrr(mrrCalc)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function alterarStatus(academiaId: string, novoStatus: string) {
    setAcaoId(academiaId)
    try {
      await api.patch(`/admin/academias/${academiaId}/status`, { status: novoStatus })
      carregar()
    } catch (err: any) {
      alert(err?.response?.data?.error ?? 'Erro ao alterar status')
    } finally {
      setAcaoId(null)
    }
  }

  useEffect(() => { carregar() }, [])

  const academiasFiltradas = academias.filter(a =>
    !filtroStatus || a.status === filtroStatus
  )

  // Distribuição de planos
  const totalAtivas = academias.filter(a => a.status === 'ATIVO').length
  const distPlanos = ['STARTER', 'PRO', 'ENTERPRISE'].map(p => ({
    plano: p,
    qtd: academias.filter(a => a.planoSaas === p && a.status === 'ATIVO').length,
    pct: totalAtivas > 0
      ? Math.round((academias.filter(a => a.planoSaas === p && a.status === 'ATIVO').length / totalAtivas) * 100)
      : 0,
  }))

  const trialsExpirando = academias.filter(a =>
    a.status === 'TRIAL' && a.trialExpiraEm &&
    dayjs(a.trialExpiraEm).diff(dayjs(), 'day') <= 3
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin SaaS</h1>
            <p className="text-sm text-muted">Gerenciamento da plataforma GYMFLOW</p>
          </div>
          <span className="bg-orange/20 border border-orange/40 text-orange text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Shield size={10} /> SUPER ADMIN
          </span>
        </div>
        <button onClick={carregar} className="p-2 rounded-lg border border-dark-border hover:border-cyan/40 transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan' : 'text-muted'} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Academias Ativas', value: overview?.ativas ?? '–', color: 'text-cyan', icon: Building2, highlight: true },
          { label: 'Em Trial', value: overview?.trial ?? '–', color: 'text-orange', icon: Clock },
          { label: 'Total Alunos', value: overview?.totalAlunos ?? '–', color: 'text-green', icon: Users },
          { label: 'MRR Estimado', value: mrr !== null ? `R$ ${mrr.toLocaleString('pt-BR')}` : '–', color: 'text-green', icon: DollarSign },
        ].map(k => (
          <div key={k.label} className={`card p-5 ${k.highlight ? 'border-cyan/20 bg-cyan/5' : ''}`}>
            <k.icon size={18} className={k.color + ' mb-2'} />
            <div className={`text-2xl font-bold font-display ${k.color}`}>{k.value}</div>
            <div className="text-sm font-semibold mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Alerta trials expirando */}
      {trialsExpirando.length > 0 && (
        <div className="card p-4 border-orange/30 bg-orange/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange" />
            <span className="font-semibold text-orange text-sm">
              {trialsExpirando.length} trial(s) expirando em até 3 dias!
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trialsExpirando.map(a => (
              <span key={a.id} className="text-xs bg-orange/10 border border-orange/20 text-orange px-2 py-1 rounded-full">
                {a.nome} — expira {dayjs(a.trialExpiraEm).fromNow()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabela de academias */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-sm">Academias ({academiasFiltradas.length})</h3>
            <div className="flex gap-2">
              {['', 'TRIAL', 'ATIVO', 'INADIMPLENTE', 'CANCELADO'].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${filtroStatus === s ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'text-muted hover:text-white'}`}
                >
                  {s || 'Todos'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-muted text-sm">Carregando...</div>
          ) : academiasFiltradas.length === 0 ? (
            <div className="py-10 text-center text-muted text-sm">Nenhuma academia encontrada</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    {['Academia', 'Plano', 'Alunos', 'Trial/Criação', 'Status', 'Ações'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {academiasFiltradas.map(a => {
                    const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.CANCELADO
                    const StatusIcon = cfg.icon
                    const diasTrial = a.trialExpiraEm
                      ? dayjs(a.trialExpiraEm).diff(dayjs(), 'day')
                      : null

                    return (
                      <tr key={a.id} className="border-b border-dark-border/40 hover:bg-white/2 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{a.nome}</div>
                          <div className="text-xs text-muted">{a.email}</div>
                          <div className="text-xs text-muted font-mono">/{a.slug}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            a.planoSaas === 'ENTERPRISE' ? 'bg-orange/10 text-orange' :
                            a.planoSaas === 'PRO' ? 'bg-cyan/10 text-cyan' :
                            'bg-dark-border text-muted'
                          }`}>
                            {a.planoSaas}
                          </span>
                          <div className="text-xs text-muted mt-0.5">
                            R$ {PLANO_VALOR[a.planoSaas] ?? 197}/mês
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{a._count?.alunos ?? 0}</td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {a.status === 'TRIAL' && diasTrial !== null ? (
                            <span className={diasTrial <= 3 ? 'text-red font-semibold' : diasTrial <= 7 ? 'text-orange' : 'text-muted'}>
                              {diasTrial > 0 ? `${diasTrial}d restantes` : 'Expirado'}
                            </span>
                          ) : (
                            dayjs(a.criadoEm).format('DD/MM/YYYY')
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-xs font-semibold w-fit px-2 py-1 rounded-full ${cfg.color}`}>
                            <StatusIcon size={11} /> {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {a.status !== 'ATIVO' && (
                              <button
                                onClick={() => alterarStatus(a.id, 'ATIVO')}
                                disabled={acaoId === a.id}
                                className="flex items-center gap-1 text-xs text-green hover:text-green/80 transition-colors disabled:opacity-50"
                                title="Ativar"
                              >
                                {acaoId === a.id ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                Ativar
                              </button>
                            )}
                            {a.status !== 'INADIMPLENTE' && a.status !== 'CANCELADO' && (
                              <button
                                onClick={() => alterarStatus(a.id, 'INADIMPLENTE')}
                                disabled={acaoId === a.id}
                                className="flex items-center gap-1 text-xs text-red hover:text-red/80 transition-colors disabled:opacity-50"
                                title="Bloquear"
                              >
                                <Ban size={11} /> Bloquear
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cards laterais */}
        <div className="space-y-4">
          {/* MRR por plano */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-green" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted">MRR por Plano</p>
            </div>
            {['ENTERPRISE', 'PRO', 'STARTER'].map(p => {
              const qtd = academias.filter(a => a.planoSaas === p && a.status === 'ATIVO').length
              const receita = qtd * (PLANO_VALOR[p] ?? 0)
              return (
                <div key={p} className="flex items-center justify-between py-2 border-b border-dark-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${p === 'ENTERPRISE' ? 'text-orange' : p === 'PRO' ? 'text-cyan' : 'text-muted'}`}>
                      {p}
                    </span>
                    <span className="text-xs text-muted">({qtd})</span>
                  </div>
                  <span className="text-xs font-semibold text-green">
                    R$ {receita.toLocaleString('pt-BR')}
                  </span>
                </div>
              )
            })}
            <div className="flex items-center justify-between pt-3 mt-1">
              <span className="text-xs font-bold">Total MRR</span>
              <span className="font-bold text-green">R$ {(mrr ?? 0).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Distribuição de planos */}
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Distribuição</p>
            {distPlanos.map(p => (
              <div key={p.plano} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{p.plano} ({p.qtd})</span>
                  <span className="font-semibold">{p.pct}%</span>
                </div>
                <div className="h-1.5 bg-dark-card rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.plano === 'ENTERPRISE' ? 'bg-orange' :
                      p.plano === 'PRO' ? 'bg-cyan' : 'bg-blue'
                    }`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Status summary */}
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Status Geral</p>
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const qtd = academias.filter(a => a.status === status).length
              if (qtd === 0) return null
              return (
                <div key={status} className="flex items-center justify-between py-1.5">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color.split(' ')[0]}`}>
                    <cfg.icon size={11} /> {cfg.label}
                  </span>
                  <span className="text-sm font-bold">{qtd}</span>
                </div>
              )
            })}
          </div>

          {/* Trial alert */}
          {(overview?.trial ?? 0) > 0 && (
            <div className="card p-5 border-orange/30 bg-orange/5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-orange" />
                <p className="text-xs font-bold text-orange uppercase tracking-widest">Trials Ativos</p>
              </div>
              <p className="text-2xl font-bold font-display text-orange">{overview?.trial}</p>
              <p className="text-xs text-muted mt-1">academia(s) em período trial</p>
              <p className="text-xs text-muted">Convertidas = +R$ {((overview?.trial ?? 0) * 197).toLocaleString('pt-BR')}/mês</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
