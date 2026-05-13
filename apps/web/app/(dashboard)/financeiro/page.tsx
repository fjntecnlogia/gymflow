'use client'
import { useEffect, useState } from 'react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DollarSign, AlertTriangle, Clock, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import dayjs from 'dayjs'

export default function FinanceiroPage() {
  const [resumo, setResumo] = useState<any>(null)
  const [pagamentos, setPagamentos] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      api.get('/pagamentos/resumo'),
      api.get('/pagamentos?limit=30'),
    ]).then(([r, p]) => {
      setResumo(r.data)
      setPagamentos(p.data)
    })
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted">{dayjs().format('MMMM [de] YYYY')}</p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Registrar Pagamento</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Receita do Mês" value={resumo ? `R$ ${Number(resumo.receitaMes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–'} color="green" icon={<DollarSign size={16} />} highlight />
        <KpiCard label="Inadimplentes" value={resumo?.inadimplentes ?? '–'} color="red" icon={<AlertTriangle size={16} />} />
        <KpiCard label="Valor Pendente" value={resumo ? `R$ ${Number(resumo.valorPendente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '–'} color="orange" icon={<Clock size={16} />} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-sm">Histórico de Pagamentos</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border">
              {['Aluno', 'Valor', 'Método', 'Vencimento', 'Pagamento', 'Status', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((p) => (
              <tr key={p.id} className="border-b border-dark-border/50 hover:bg-white/2">
                <td className="px-4 py-3 font-medium">{p.aluno?.nome}</td>
                <td className="px-4 py-3 font-bold text-green">R$ {Number(p.valor).toFixed(2)}</td>
                <td className="px-4 py-3 text-muted text-xs">{p.metodo}</td>
                <td className="px-4 py-3 text-muted text-xs">{dayjs(p.dataVencimento).format('DD/MM/YYYY')}</td>
                <td className="px-4 py-3 text-muted text-xs">{p.dataPagamento ? dayjs(p.dataPagamento).format('DD/MM/YYYY') : '–'}</td>
                <td className="px-4 py-3"><Badge status={p.status}>{p.status}</Badge></td>
                <td className="px-4 py-3">
                  {p.status === 'PENDENTE' && (
                    <button className="text-xs text-cyan hover:underline">Cobrar PIX</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
