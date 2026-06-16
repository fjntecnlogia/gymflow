'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  DollarSign, TrendingUp, TrendingDown, Target, BarChart2,
  AlertTriangle, Users, Activity, RefreshCw, Trophy, Crown,
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

interface Metricas {
  kpis: {
    mrr: number
    arr: number
    mrrMesPassado: number
    variacaoMrr: number
    churnPercent: number
    canceladasNoMes: number
    inadimplenciaRS: number
    inadimplentesCount: number
    ativasCount: number
    trialsCount: number
    ticketMedio: number
  }
  distribuicaoPlano: { STARTER: number; PRO: number; ENTERPRISE: number }
  evolucaoMrr: { mes: string; mrr: number; academias: number }[]
  top10: { id: string; nome: string; slug: string; planoSaas: string; valor: number; alunos: number }[]
  emRisco: { id: string; nome: string; slug: string; planoSaas: string; valor: number; diasInadimplente: number; alunos: number }[]
  ultimasAcademias: { id: string; nome: string; slug: string; planoSaas: string; status: string; criadoEm: string; alunos: number }[]
}

const PLANO_COR: Record<string, string> = {
  STARTER: 'text-cyan bg-cyan/10 border-cyan/30',
  PRO: 'text-green bg-green/10 border-green/30',
  ENTERPRISE: 'text-orange bg-orange/10 border-orange/30',
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export default function AdminReceitaPage() {
  const [data, setData] = useState<Metricas | null>(null)
  const [loading, setLoading] = useState(true)

  async function carregar() {
    setLoading(true)
    try {
      const r = await api.get('/admin/financeiro/saas')
      setData(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  if (loading || !data) {
    return (
      <div className="p-6">
        <div className="card p-12 text-center text-sm text-muted">Carregando métricas...</div>
      </div>
    )
  }

  const { kpis, distribuicaoPlano, evolucaoMrr, top10, emRisco } = data
  const maxMrr = Math.max(...evolucaoMrr.map((e) => e.mrr), 1)
  const totalDistribuicao = distribuicaoPlano.STARTER + distribuicaoPlano.PRO + distribuicaoPlano.ENTERPRISE

  const variacaoPositiva = kpis.variacaoMrr >= 0
  const churnAlto = kpis.churnPercent > 5
  const inadimplenciaAlta = kpis.inadimplenciaRS > 0

  return (
    <div className="p-6 space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <DollarSign size={22} className="text-green" />
            Financeiro SaaS
          </h1>
          <p className="text-muted text-sm mt-1">
            Saúde financeira do GymFlow Gestor em tempo real
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

      {/* ─── KPIs principais (4 cards) ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 relative overflow-hidden">
          <DollarSign size={18} className="text-green mb-2" />
          <div className="text-2xl font-bold font-display text-green">{brl(kpis.mrr)}</div>
          <div className="text-sm font-semibold mt-0.5">MRR</div>
          <div className="text-xs text-muted flex items-center gap-1 mt-1">
            {variacaoPositiva ? (
              <><TrendingUp size={11} className="text-green" /> +{kpis.variacaoMrr.toFixed(1)}%</>
            ) : (
              <><TrendingDown size={11} className="text-red" /> {kpis.variacaoMrr.toFixed(1)}%</>
            )}
            <span className="text-muted/60">vs mês anterior</span>
          </div>
        </div>

        <div className="card p-5">
          <TrendingUp size={18} className="text-cyan mb-2" />
          <div className="text-2xl font-bold font-display text-cyan">{brl(kpis.arr)}</div>
          <div className="text-sm font-semibold mt-0.5">ARR</div>
          <div className="text-xs text-muted">receita anual estimada</div>
        </div>

        <div className="card p-5">
          <Users size={18} className="text-white mb-2" />
          <div className="text-2xl font-bold font-display text-white">{kpis.ativasCount}</div>
          <div className="text-sm font-semibold mt-0.5">Academias Ativas</div>
          <div className="text-xs text-muted">
            ticket médio: {brl(kpis.ticketMedio)}
          </div>
        </div>

        <div className="card p-5">
          <Target size={18} className="text-orange mb-2" />
          <div className="text-2xl font-bold font-display text-orange">{kpis.trialsCount}</div>
          <div className="text-sm font-semibold mt-0.5">Trials Ativos</div>
          <div className="text-xs text-muted">potencial conversão</div>
        </div>
      </div>

      {/* ─── KPIs secundários (4 cards) — saúde do negócio ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`card p-5 ${churnAlto ? 'border-red/40' : ''}`}>
          <Activity size={18} className={churnAlto ? 'text-red mb-2' : 'text-muted mb-2'} />
          <div className={`text-2xl font-bold font-display ${churnAlto ? 'text-red' : 'text-white'}`}>
            {kpis.churnPercent.toFixed(1)}%
          </div>
          <div className="text-sm font-semibold mt-0.5">Churn mensal</div>
          <div className="text-xs text-muted">
            {kpis.canceladasNoMes} cancelad{kpis.canceladasNoMes === 1 ? 'a' : 'as'} este mês
          </div>
        </div>

        <div className={`card p-5 ${inadimplenciaAlta ? 'border-orange/40' : ''}`}>
          <AlertTriangle size={18} className={inadimplenciaAlta ? 'text-orange mb-2' : 'text-muted mb-2'} />
          <div className={`text-2xl font-bold font-display ${inadimplenciaAlta ? 'text-orange' : 'text-white'}`}>
            {brl(kpis.inadimplenciaRS)}
          </div>
          <div className="text-sm font-semibold mt-0.5">Inadimplência</div>
          <div className="text-xs text-muted">{kpis.inadimplentesCount} academias</div>
        </div>

        <div className="card p-5">
          <BarChart2 size={18} className="text-cyan mb-2" />
          <div className="text-2xl font-bold font-display text-cyan">
            {brl(kpis.mrr + kpis.trialsCount * 197)}
          </div>
          <div className="text-sm font-semibold mt-0.5">MRR potencial</div>
          <div className="text-xs text-muted">se todos trials converterem</div>
        </div>

        <div className="card p-5">
          <Crown size={18} className="text-orange mb-2" />
          <div className="text-2xl font-bold font-display text-orange">
            {distribuicaoPlano.ENTERPRISE + distribuicaoPlano.PRO}
          </div>
          <div className="text-sm font-semibold mt-0.5">Premium (PRO+ENT)</div>
          <div className="text-xs text-muted">
            {kpis.ativasCount > 0
              ? Math.round(((distribuicaoPlano.ENTERPRISE + distribuicaoPlano.PRO) / kpis.ativasCount) * 100)
              : 0}% do total ativo
          </div>
        </div>
      </div>

      {/* ─── Gráfico Evolução MRR (12 meses) ─── */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-cyan" /> Evolução do MRR (12 meses)
        </h3>
        <div className="flex items-end gap-2 h-40">
          {evolucaoMrr.map((e) => {
            const altura = (e.mrr / maxMrr) * 100
            const isUltimo = e.mes === evolucaoMrr[evolucaoMrr.length - 1].mes
            return (
              <div key={e.mes} className="flex-1 flex flex-col items-center justify-end group">
                <div className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {brl(e.mrr)}
                </div>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    isUltimo
                      ? 'bg-gradient-to-t from-cyan to-blue'
                      : 'bg-cyan/30 hover:bg-cyan/60'
                  }`}
                  style={{ height: `${Math.max(altura, 2)}%` }}
                />
                <div className="text-[10px] text-muted mt-1.5">
                  {dayjs(e.mes + '-01').format('MMM')}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 2 colunas: Distribuição por plano + Top 10 ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribuição por plano */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart2 size={14} className="text-green" /> Distribuição por Plano (ativas)
          </h3>
          {(['STARTER', 'PRO', 'ENTERPRISE'] as const).map((p) => {
            const qtd = distribuicaoPlano[p]
            const valor = qtd * (p === 'STARTER' ? 197 : p === 'PRO' ? 397 : 797)
            const percent = totalDistribuicao > 0 ? (qtd / totalDistribuicao) * 100 : 0
            return (
              <div key={p} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PLANO_COR[p]}`}>{p}</span>
                    <span className="text-sm text-muted">{qtd} academias</span>
                  </div>
                  <span className="font-bold text-sm text-green">{brl(valor)}</span>
                </div>
                <div className="h-2 bg-dark-card2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p === 'STARTER' ? 'bg-cyan' : p === 'PRO' ? 'bg-green' : 'bg-orange'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="border-t border-dark-border pt-3 mt-4 flex justify-between text-sm font-bold">
            <span>Total MRR</span>
            <span className="text-green">{brl(kpis.mrr)}</span>
          </div>
        </div>

        {/* Top 10 academias por receita */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-orange" /> Top 10 Academias por Receita
          </h3>
          {top10.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">Sem academias ativas ainda</p>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {top10.map((a, i) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-card2 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-bold w-6 text-center ${i < 3 ? 'text-orange' : 'text-muted'}`}>
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{a.nome}</div>
                      <div className="text-xs text-muted">{a.alunos} alunos · {a.planoSaas}</div>
                    </div>
                  </div>
                  <div className="font-bold text-sm text-green flex-shrink-0">{brl(a.valor)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Academias em Risco (Inadimplentes >7 dias) ─── */}
      {emRisco.length > 0 && (
        <div className="card p-5 border-orange/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange">
            <AlertTriangle size={16} /> Academias em Risco (Inadimplentes &gt;7 dias)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted border-b border-dark-border">
                  <th className="text-left py-2 font-medium">Academia</th>
                  <th className="text-left py-2 font-medium">Plano</th>
                  <th className="text-right py-2 font-medium">Valor</th>
                  <th className="text-right py-2 font-medium">Dias</th>
                  <th className="text-right py-2 font-medium">Alunos</th>
                </tr>
              </thead>
              <tbody>
                {emRisco.map((a) => (
                  <tr key={a.id} className="border-b border-dark-border/30 hover:bg-dark-card2/50">
                    <td className="py-3 font-semibold">{a.nome}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PLANO_COR[a.planoSaas]}`}>
                        {a.planoSaas}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-orange">{brl(a.valor)}</td>
                    <td className="py-3 text-right">
                      <span className="text-red font-semibold">{a.diasInadimplente}d</span>
                    </td>
                    <td className="py-3 text-right text-muted">{a.alunos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-3">
            Total em risco: <span className="text-orange font-bold">{brl(emRisco.reduce((s, a) => s + a.valor, 0))}/mês</span>
          </p>
        </div>
      )}
    </div>
  )
}
