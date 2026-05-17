'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Server, Database, Wifi, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

export default function AdminSistemaPage() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function verificar() {
    setLoading(true)
    try {
      const { data } = await api.get('/health')
      setApiStatus(data)
    } catch { setApiStatus(null) }
    setLoading(false)
  }

  useEffect(() => { verificar() }, [])

  const servicos = [
    { nome: 'API Railway', url: 'gymflow-production-abf9.up.railway.app', status: !!apiStatus, desc: 'Backend principal Fastify + Prisma' },
    { nome: 'Web Vercel', url: 'web-gules-phi-97.vercel.app', status: true, desc: 'Dashboard Next.js' },
    { nome: 'PostgreSQL', url: 'gymflow-db.railway.internal', status: !!apiStatus, desc: 'Banco de dados principal' },
    { nome: 'Redis', url: 'gymflow-redis.railway.internal', status: true, desc: 'Cache e filas BullMQ' },
    { nome: 'Evolution API', url: 'evolution-api-production-b92c3.up.railway.app', status: null, desc: 'WhatsApp (Evolution API)' },
    { nome: 'WhatsApp Bridge', url: 'gymflowwa2026.loca.lt', status: null, desc: 'Servidor local via tunnel' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Sistema</h1>
          <p className="text-muted text-sm">Status e configurações da infraestrutura</p>
        </div>
        <button onClick={verificar} className="p-2 rounded-lg border border-dark-border hover:border-cyan/40">
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan' : 'text-muted'} />
        </button>
      </div>

      {/* API Info */}
      {apiStatus && (
        <div className="card p-5 border-green/20 bg-green/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green" />
            <span className="font-semibold text-green">API Online</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted">Versão:</span> <span className="font-mono">{apiStatus.version}</span></div>
            <div><span className="text-muted">Status:</span> <span className="text-green">{apiStatus.status}</span></div>
            <div><span className="text-muted">Timestamp:</span> <span className="text-xs font-mono">{new Date(apiStatus.timestamp).toLocaleString('pt-BR')}</span></div>
          </div>
        </div>
      )}

      {/* Serviços */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-sm">Serviços de Infraestrutura</h3>
        </div>
        <div className="divide-y divide-dark-border/50">
          {servicos.map(s => (
            <div key={s.nome} className="flex items-center gap-4 px-5 py-4">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === true ? 'bg-green' : s.status === false ? 'bg-red' : 'bg-muted'}`} />
              <div className="flex-1">
                <div className="font-semibold text-sm">{s.nome}</div>
                <div className="text-xs text-muted font-mono">{s.url}</div>
                <div className="text-xs text-muted">{s.desc}</div>
              </div>
              <span className={`text-xs font-semibold ${s.status === true ? 'text-green' : s.status === false ? 'text-red' : 'text-muted'}`}>
                {s.status === true ? 'Online' : s.status === false ? 'Offline' : 'Não verificado'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Variáveis necessárias */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3">Variáveis de Ambiente — Railway API</h3>
        <div className="space-y-2 font-mono text-xs">
          {[
            ['DATABASE_URL', 'PostgreSQL interno'],
            ['REDIS_URL', 'Redis interno'],
            ['SUPABASE_URL', 'Auth Supabase'],
            ['SUPABASE_SERVICE_KEY', 'Chave de serviço Supabase'],
            ['JWT_SECRET', 'Segredo JWT'],
            ['EVOLUTION_API_URL', 'Evolution API URL'],
            ['EVOLUTION_API_KEY', 'Chave Evolution API'],
            ['STRIPE_SECRET_KEY', 'Stripe secret key'],
            ['WA_LOCAL_SERVER', 'Servidor WhatsApp local (tunnel)'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-3 p-2 bg-dark-card rounded-lg">
              <span className="text-cyan w-52 flex-shrink-0">{key}</span>
              <span className="text-muted">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
