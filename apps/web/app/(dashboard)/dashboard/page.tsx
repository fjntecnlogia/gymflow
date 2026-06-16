'use client'
import { useEffect, useState } from 'react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Users, DollarSign, ShieldAlert, Activity, HelpCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '@/lib/api'
import dayjs from 'dayjs'
import { TutorialOnboarding } from '@/components/onboarding/TutorialOnboarding'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [acessos, setAcessos] = useState<any[]>([])
  const [ultimos, setUltimos] = useState<any[]>([])
  const [mostrarTutorial, setMostrarTutorial] = useState(false)

  useEffect(() => {
    // Detecta primeiro acesso pelo localStorage (setado no login)
    try {
      const stored = JSON.parse(localStorage.getItem('gymflow_usuario') || '{}')
      if (stored && stored.onboardingConcluido === false) {
        setMostrarTutorial(true)
      }
    } catch { /* noop */ }

    Promise.all([
      api.get('/dashboard/kpis'),
      api.get('/dashboard/acessos-por-dia'),
      api.get('/dashboard/ultimos-acessos'),
    ]).then(([k, a, u]) => {
      setKpis(k.data)
      setAcessos(a.data)
      setUltimos(u.data)
    })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">{dayjs().format('dddd, DD [de] MMMM [de] YYYY')}</p>
        </div>
        <button
          onClick={() => setMostrarTutorial(true)}
          className="text-xs text-muted hover:text-cyan transition-colors inline-flex items-center gap-1.5"
          title="Ver tutorial novamente"
        >
          <HelpCircle size={14} /> Ver tutorial
        </button>
      </div>

      {mostrarTutorial && (
        <TutorialOnboarding onClose={() => setMostrarTutorial(false)} />
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Alunos Ativos" value={kpis?.alunosAtivos ?? '–'} color="cyan" icon={<Users size={16} />} highlight />
        <KpiCard label="Receita do Mês" value={kpis ? `R$ ${Number(kpis.receitaMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–'} color="green" icon={<DollarSign size={16} />} changeType="up" change="+8% vs mês anterior" />
        <KpiCard label="Inadimplentes" value={kpis?.inadimplentes ?? '–'} color="red" icon={<ShieldAlert size={16} />} />
        <KpiCard label="Check-ins Hoje" value={kpis?.acessosHoje ?? '–'} color="orange" icon={<Activity size={16} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Check-ins por Dia</h3>
            <span className="text-xs text-muted">Últimos 7 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={acessos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
              <XAxis dataKey="dia" tick={{ fill: '#8888AA', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8888AA', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111119', border: '1px solid #2A2A3A', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="total" fill="#00E5FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Últimos Acessos</h3>
            <span className="text-xs text-muted">Tempo real</span>
          </div>
          <div className="space-y-3">
            {ultimos.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-blue flex items-center justify-center text-dark text-xs font-bold flex-shrink-0">
                  {a.aluno?.nome?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.aluno?.nome}</p>
                  <p className="text-xs text-muted">{dayjs(a.criadoEm).format('HH:mm')} · {a.tipo}</p>
                </div>
                <span className={`text-xs font-bold ${a.resultado === 'LIBERADO' ? 'text-green' : 'text-red'}`}>
                  {a.resultado === 'LIBERADO' ? '✓ OK' : '✕ BLOQ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
