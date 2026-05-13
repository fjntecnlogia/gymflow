'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Plus, Search, Filter } from 'lucide-react'
import { api } from '@/lib/api'
import dayjs from 'dayjs'
import Link from 'next/link'

const STATUS_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'ATIVO' },
  { label: 'Inadimplentes', value: 'INADIMPLENTE' },
  { label: 'Vencendo', value: 'vencendo' },
]

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (status) params.set('status', status)
    api.get(`/alunos?${params}`).then((r) => {
      setAlunos(r.data.alunos)
      setTotal(r.data.total)
    })
  }, [busca, status])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Alunos</h1>
          <p className="text-sm text-muted">{total} cadastrados</p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Novo Aluno</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none"
          />
        </div>
        <Button variant="outline" leftIcon={<Filter size={14} />} size="md">Filtros</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === tab.value
                ? 'bg-cyan/15 text-cyan border border-cyan/30'
                : 'bg-dark-card border border-dark-border text-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              {['Nome', 'Plano', 'Vencimento', 'Último Acesso', 'Status', 'Ações'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.map((a) => (
              <tr key={a.id} className="border-b border-dark-border/50 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan to-blue flex items-center justify-center text-dark text-xs font-bold flex-shrink-0">
                      {a.nome.charAt(0)}
                    </div>
                    <span className="font-medium">{a.nome}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{a.matriculas?.[0]?.plano?.nome ?? '–'}</td>
                <td className="px-4 py-3 text-muted">
                  {a.matriculas?.[0] ? dayjs(a.matriculas[0].dataVencimento).format('DD/MM/YYYY') : '–'}
                </td>
                <td className="px-4 py-3 text-muted text-xs">–</td>
                <td className="px-4 py-3">
                  <Badge status={a.status}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/alunos/${a.id}`} className="text-cyan text-xs hover:underline mr-3">Ver</Link>
                  <button className="text-muted text-xs hover:text-white">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {alunos.length === 0 && (
          <div className="py-16 text-center text-muted">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum aluno encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
