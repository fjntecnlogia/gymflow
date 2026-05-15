'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'
import { api, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface MatricularModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  aluno: any
}

export function MatricularModal({ open, onClose, onSaved, aluno }: MatricularModalProps) {
  const [planos, setPlanos] = useState<any[]>([])
  const [planoId, setPlanoId] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      api.get('/planos').then(r => setPlanos(r.data)).catch(() => {})
    }
  }, [open])

  async function handleMatricular(e: React.FormEvent) {
    e.preventDefault()
    if (!planoId) return toast.error('Selecione um plano')
    setLoading(true)
    try {
      await api.post(`/planos/${planoId}/matricular`, { alunoId: aluno.id, dataInicio })
      toast.success(`${aluno.nome} matriculado com sucesso!`)
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open || !aluno) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-bold">Matricular Aluno</h2>
            <p className="text-sm text-muted mt-0.5">{aluno.nome}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleMatricular} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1.5">Plano *</label>
            <select
              className="w-full bg-dark-card2 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan outline-none"
              value={planoId}
              onChange={e => setPlanoId(e.target.value)}
              required
            >
              <option value="">Selecione um plano...</option>
              {planos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} — R$ {Number(p.valor).toFixed(2)} ({p.duracaoDias} dias)
                </option>
              ))}
            </select>
            {planos.length === 0 && (
              <p className="text-xs text-orange mt-1">Nenhum plano cadastrado. Crie planos primeiro em /planos</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1.5">Data de Início</label>
            <input
              type="date"
              className="w-full bg-dark-card2 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan outline-none"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading} fullWidth disabled={planos.length === 0}>Matricular</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
