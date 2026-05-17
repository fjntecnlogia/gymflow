'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { DollarSign, TrendingUp, Target, BarChart2 } from 'lucide-react'

const PLANO_VALOR: Record<string, number> = { STARTER: 197, PRO: 397, ENTERPRISE: 797 }

export default function AdminReceitaPage() {
  const [academias, setAcademias] = useState<any[]>([])

  useEffect(() => {
    api.get('/admin/academias?limit=100').then(r => setAcademias(r.data))
  }, [])

  const ativas = academias.filter(a => a.status === 'ATIVO')
  const mrr = ativas.reduce((s, a) => s + (PLANO_VALOR[a.planoSaas] ?? 197), 0)
  const arr = mrr * 12
  const trials = academias.filter(a => a.status === 'TRIAL').length
  const potencial = trials * 197 // se todos converterem no menor plano

  const porPlano = ['STARTER', 'PRO', 'ENTERPRISE'].map(p => ({
    plano: p,
    qtd: ativas.filter(a => a.planoSaas === p).length,
    receita: ativas.filter(a => a.planoSaas === p).length * PLANO_VALOR[p],
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Receita & MRR</h1>
        <p className="text-muted text-sm">Métricas financeiras da plataforma GYMFLOW</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: `R$ ${mrr.toLocaleString('pt-BR')}`, sub: 'receita mensal recorrente', icon: DollarSign, color: 'text-green' },
          { label: 'ARR', value: `R$ ${arr.toLocaleString('pt-BR')}`, sub: 'receita anual estimada', icon: TrendingUp, color: 'text-cyan' },
          { label: 'Academias Ativas', value: ativas.length, sub: 'pagando mensalidade', icon: BarChart2, color: 'text-cyan' },
          { label: 'Potencial Trials', value: `+R$ ${potencial.toLocaleString('pt-BR')}`, sub: `${trials} trials para converter`, icon: Target, color: 'text-orange' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <k.icon size={18} className={k.color + ' mb-2'} />
            <div className={`text-2xl font-bold font-display ${k.color}`}>{k.value}</div>
            <div className="text-sm font-semibold mt-0.5">{k.label}</div>
            <div className="text-xs text-muted">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><DollarSign size={14} className="text-green" /> Receita por Plano</h3>
          {porPlano.map(p => (
            <div key={p.plano} className="flex items-center justify-between py-3 border-b border-dark-border/50 last:border-0">
              <div>
                <div className="font-semibold">{p.plano}</div>
                <div className="text-xs text-muted">{p.qtd} academia(s) × R$ {PLANO_VALOR[p.plano]}/mês</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green">R$ {p.receita.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-muted">{mrr > 0 ? Math.round((p.receita / mrr) * 100) : 0}% do MRR</div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-1 font-bold">
            <span>Total MRR</span>
            <span className="text-green">R$ {mrr.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4">Projeção de Crescimento</h3>
          {[3, 6, 12].map(meses => {
            const crescimento = mrr * meses
            return (
              <div key={meses} className="flex items-center justify-between py-3 border-b border-dark-border/50 last:border-0">
                <span className="text-muted">{meses} meses (sem crescimento)</span>
                <span className="font-bold text-cyan">R$ {crescimento.toLocaleString('pt-BR')}</span>
              </div>
            )
          })}
          <div className="mt-4 p-3 bg-cyan/5 border border-cyan/20 rounded-lg">
            <div className="text-xs text-muted mb-1">Se converter todos os trials:</div>
            <div className="font-bold text-cyan">MRR potencial: R$ {(mrr + potencial).toLocaleString('pt-BR')}</div>
            <div className="text-xs text-muted">+{trials} academias novas</div>
          </div>
        </div>
      </div>
    </div>
  )
}
