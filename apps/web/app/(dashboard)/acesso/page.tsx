'use client'
import { useEffect, useState } from 'react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ShieldCheck, ShieldX, Activity } from 'lucide-react'
import { api } from '@/lib/api'
import dayjs from 'dayjs'

export default function AcessoPage() {
  const [stats, setStats] = useState<any>(null)
  const [acessos, setAcessos] = useState<any[]>([])

  useEffect(() => {
    const carregar = () => {
      Promise.all([
        api.get('/acesso/hoje'),
        api.get('/acesso?limit=50'),
      ]).then(([s, a]) => {
        setStats(s.data)
        setAcessos(a.data)
      })
    }
    carregar()
    const interval = setInterval(carregar, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Controle de Acesso</h1>
          <p className="text-sm text-muted">Atualiza a cada 10 segundos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
          <span className="text-xs text-green font-semibold">Ao vivo</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Check-ins Hoje" value={stats?.liberados ?? '–'} color="cyan" icon={<Activity size={16} />} />
        <KpiCard label="Liberados" value={stats?.liberados ?? '–'} color="green" icon={<ShieldCheck size={16} />} />
        <KpiCard label="Bloqueados" value={stats?.bloqueados ?? '–'} color="red" icon={<ShieldX size={16} />} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">Log de Acessos</h3>
          <span className="text-xs text-muted">{acessos.length} registros</span>
        </div>
        <div className="divide-y divide-dark-border/50 max-h-[500px] overflow-auto scrollbar-thin">
          {acessos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-5 py-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                a.resultado === 'LIBERADO' ? 'bg-green/20 text-green' : 'bg-red/20 text-red'
              }`}>
                {a.resultado === 'LIBERADO' ? '✓' : '✕'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.aluno?.nome ?? 'Desconhecido'}</p>
                <p className="text-xs text-muted">{a.tipo} · {a.motivoBloqueio ?? 'Acesso normal'}</p>
              </div>
              <span className="text-xs text-muted flex-shrink-0">
                {dayjs(a.criadoEm).format('HH:mm:ss')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
