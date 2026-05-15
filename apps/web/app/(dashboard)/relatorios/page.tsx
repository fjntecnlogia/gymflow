'use client'
import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, Users, DollarSign, ShieldCheck, Download, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import dayjs from 'dayjs'

interface KPIs {
  totalAlunos: number
  alunosAtivos: number
  inadimplentes: number
  receitaMes: number
  acessosHoje: number
  taxaRetencao: number
}

export default function RelatoriosPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [acessosDia, setAcessosDia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    async function carregar() {
      try {
        const [kpiRes, acessosRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/acessos-por-dia'),
        ])
        setKpis(kpiRes.data)
        setAcessosDia(acessosRes.data ?? [])
      } catch {
        // silencioso
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const maxAcessos = Math.max(...acessosDia.map((d: any) => d.total ?? 0), 1)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Relatórios</h1>
          <p className="text-muted text-sm mt-1">Visão analítica da sua academia</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${periodo === p ? 'bg-cyan/15 text-cyan border border-cyan/30' : 'bg-dark-card border border-dark-border text-muted hover:text-white'}`}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de Alunos', value: kpis?.totalAlunos ?? '—', icon: Users, color: 'text-cyan', sub: 'cadastrados' },
          { label: 'Alunos Ativos', value: kpis?.alunosAtivos ?? '—', icon: Users, color: 'text-green', sub: 'com matrícula ativa' },
          { label: 'Inadimplentes', value: kpis?.inadimplentes ?? '—', icon: TrendingUp, color: 'text-red', sub: 'pagamento pendente' },
          { label: 'Receita do Mês', value: kpis?.receitaMes ? `R$ ${Number(kpis.receitaMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—', icon: DollarSign, color: 'text-cyan', sub: 'estimativa' },
          { label: 'Acessos Hoje', value: kpis?.acessosHoje ?? '—', icon: ShieldCheck, color: 'text-green', sub: 'check-ins' },
          { label: 'Retenção', value: kpis?.taxaRetencao ? `${kpis.taxaRetencao}%` : '—', icon: BarChart2, color: 'text-cyan', sub: 'taxa de renovação' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <k.icon size={18} className={k.color + ' mb-3'} />
            <div className={`text-2xl font-bold font-display ${k.color}`}>{k.value}</div>
            <div className="text-sm font-semibold mt-0.5">{k.label}</div>
            <div className="text-xs text-muted">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de acessos por dia */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart2 size={16} className="text-cyan" /> Acessos por Dia
          </h2>
          <span className="text-xs text-muted">{acessosDia.length} dias</span>
        </div>

        {acessosDia.length === 0 ? (
          <div className="text-center py-10 text-muted text-sm">
            <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
            Sem dados de acesso ainda
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {acessosDia.slice(-30).map((d: any, i: number) => {
              const pct = ((d.total ?? 0) / maxAcessos) * 100
              const isHoje = dayjs(d.data).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className={`w-full rounded-t-sm transition-all ${isHoje ? 'bg-cyan' : 'bg-cyan/30 group-hover:bg-cyan/60'}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-dark-card border border-dark-border text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {d.total} · {dayjs(d.data).format('DD/MM')}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Relatórios para exportar */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Download size={16} className="text-muted" /> Exportar Relatórios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { titulo: 'Lista de Alunos', desc: 'Nome, telefone, plano e status de todos os alunos', icon: Users },
            { titulo: 'Financeiro Mensal', desc: 'Pagamentos recebidos e inadimplências do mês', icon: DollarSign },
            { titulo: 'Log de Acessos', desc: 'Histórico completo de entradas e saídas', icon: ShieldCheck },
          ].map(r => (
            <div key={r.titulo} className="flex items-start gap-3 p-4 rounded-xl border border-dark-border hover:border-cyan/30 transition-colors cursor-pointer group">
              <r.icon size={18} className="text-muted group-hover:text-cyan transition-colors flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">{r.titulo}</div>
                <div className="text-xs text-muted mt-0.5">{r.desc}</div>
                <span className="text-xs text-cyan mt-2 block opacity-0 group-hover:opacity-100 transition-opacity">
                  Em breve →
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-4">💡 Exportação em CSV/PDF em desenvolvimento.</p>
      </div>
    </div>
  )
}
