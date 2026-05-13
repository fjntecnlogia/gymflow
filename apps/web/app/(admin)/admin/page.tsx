'use client'
import { useEffect, useState } from 'react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { Building2, Users, DollarSign, Activity, AlertTriangle } from 'lucide-react'
import dayjs from 'dayjs'

export default function AdminPage() {
  const [overview, setOverview] = useState<any>(null)
  const [academias, setAcademias] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/admin/overview'),
      api.get('/admin/academias?limit=20'),
    ]).then(([o, a]) => {
      setOverview(o.data)
      setAcademias(a.data)
    })
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Admin SaaS</h1>
          <p className="text-sm text-muted">Visão geral da plataforma GYMFLOW</p>
        </div>
        <span className="ml-2 bg-orange/20 border border-orange/40 text-orange text-xs font-bold px-3 py-1 rounded-full">
          SUPER ADMIN
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Academias Ativas"   value={overview?.ativas ?? '–'}       color="cyan"   icon={<Building2 size={16} />} highlight />
        <KpiCard label="Em Trial"           value={overview?.trial ?? '–'}        color="orange" icon={<Activity  size={16} />} />
        <KpiCard label="Total de Alunos"    value={overview?.totalAlunos ?? '–'}  color="green"  icon={<Users     size={16} />} />
        <KpiCard label="Total Academias"    value={overview?.totalAcademias ?? '–'} color="white" icon={<Building2 size={16} />} />
      </div>

      {/* MRR estimado */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-5 xl:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Academias Cadastradas</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Academia','Cidade','Plano','Alunos','Cadastro','Status',''].map((h) => (
                  <th key={h} className="text-left pb-3 text-xs font-bold uppercase tracking-widest text-muted pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {academias.map((a) => (
                <tr key={a.id} className="border-b border-dark-border/40 hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 font-semibold">{a.nome}</td>
                  <td className="py-3 pr-4 text-muted text-xs">–</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs font-bold text-cyan">{a.planoSaas}</span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{a._count?.alunos ?? 0}</td>
                  <td className="py-3 pr-4 text-muted text-xs">{dayjs(a.criadoEm).format('DD/MM/YYYY')}</td>
                  <td className="py-3 pr-4">
                    <Badge status={a.status}>{a.status}</Badge>
                  </td>
                  <td className="py-3">
                    <button className="text-xs text-cyan hover:underline">Detalhes</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {academias.length === 0 && (
            <p className="text-center text-muted py-8 text-sm">Nenhuma academia cadastrada</p>
          )}
        </div>

        {/* MRR Card */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">MRR Estimado</p>
            <p className="font-display text-3xl font-extrabold text-green">
              R$ {((overview?.ativas ?? 0) * 310).toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted mt-1">Ticket médio R$ 310/academia</p>
          </div>

          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-3">Distribuição de Planos</p>
            {[
              { plano: 'Enterprise', cor: 'bg-orange', pct: 15 },
              { plano: 'Pro',        cor: 'bg-cyan',   pct: 55 },
              { plano: 'Starter',    cor: 'bg-blue',   pct: 30 },
            ].map((p) => (
              <div key={p.plano} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted">{p.plano}</span>
                  <span className="font-semibold">{p.pct}%</span>
                </div>
                <div className="h-1.5 bg-dark-card2 rounded-full">
                  <div className={`h-full ${p.cor} rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5 border-orange/30 bg-orange/5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-orange" />
              <p className="text-xs font-bold text-orange uppercase tracking-widest">Atenção</p>
            </div>
            <p className="text-sm font-semibold">{overview?.trial ?? 0} academias em trial</p>
            <p className="text-xs text-muted mt-1">Precisam converter em até 14 dias</p>
          </div>
        </div>
      </div>
    </div>
  )
}
