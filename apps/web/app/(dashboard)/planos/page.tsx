'use client'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, X, Edit, Trash2, Package } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const TIPOS = ['DIARIO', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']

const tipoLabel: Record<string, string> = {
  DIARIO: 'Diário', SEMANAL: 'Semanal', MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral', SEMESTRAL: 'Semestral', ANUAL: 'Anual',
}

const tipoDias: Record<string, number> = {
  DIARIO: 1, SEMANAL: 7, MENSAL: 30, TRIMESTRAL: 90, SEMESTRAL: 180, ANUAL: 365,
}

function PlanoModal({ open, onClose, onSaved, plano }: { open: boolean; onClose: () => void; onSaved: () => void; plano?: any }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', valor: '', tipo: 'MENSAL', duracaoDias: '30', permiteCongelar: false })

  useEffect(() => {
    if (plano) {
      setForm({ nome: plano.nome, descricao: plano.descricao ?? '', valor: String(plano.valor), tipo: plano.tipo, duracaoDias: String(plano.duracaoDias), permiteCongelar: plano.permiteCongelar })
    } else {
      setForm({ nome: '', descricao: '', valor: '', tipo: 'MENSAL', duracaoDias: '30', permiteCongelar: false })
    }
  }, [plano, open])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function handleTipo(tipo: string) {
    setForm(f => ({ ...f, tipo, duracaoDias: String(tipoDias[tipo] ?? 30) }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.valor) return toast.error('Nome e valor são obrigatórios')
    setLoading(true)
    try {
      const payload = { ...form, valor: parseFloat(form.valor), duracaoDias: parseInt(form.duracaoDias) }
      if (plano) { await api.put(`/planos/${plano.id}`, payload); toast.success('Plano atualizado!') }
      else { await api.post('/planos', payload); toast.success('Plano criado!') }
      onSaved(); onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao salvar plano')
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">{plano ? 'Editar Plano' : 'Novo Plano'}</h2>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome do plano *" placeholder="Plano Mensal Premium" value={form.nome} onChange={set('nome')} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$) *" type="number" step="0.01" placeholder="89.90" value={form.valor} onChange={set('valor')} required />
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1.5">Tipo</label>
              <select className="w-full bg-dark-card2 border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan outline-none"
                value={form.tipo} onChange={e => handleTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
              </select>
            </div>
          </div>
          <Input label="Duração (dias)" type="number" value={form.duracaoDias} onChange={set('duracaoDias')} helper="Calculado automaticamente pelo tipo" />
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1.5">Descrição (opcional)</label>
            <textarea className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none resize-none h-16"
              placeholder="Acesso completo à academia..." value={form.descricao} onChange={set('descricao')} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 rounded accent-cyan" checked={form.permiteCongelar}
              onChange={e => setForm(f => ({ ...f, permiteCongelar: e.target.checked }))} />
            <span className="text-sm text-muted">Permite congelar matrícula</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading} fullWidth>{plano ? 'Salvar' : 'Criar Plano'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<any>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/planos')
      setPlanos(Array.isArray(data) ? data : [])
    } catch { setPlanos([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function desativar(plano: any) {
    if (!confirm(`Desativar plano "${plano.nome}"?`)) return
    try {
      await api.delete(`/planos/${plano.id}`)
      toast.success('Plano desativado')
      carregar()
    } catch { toast.error('Erro ao desativar') }
  }

  function editar(plano: any) { setPlanoSelecionado(plano); setModalOpen(true) }
  function novo() { setPlanoSelecionado(null); setModalOpen(true) }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Planos</h1>
          <p className="text-sm text-muted">{planos.length} plano{planos.length !== 1 ? 's' : ''} cadastrado{planos.length !== 1 ? 's' : ''}</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={novo}>Novo Plano</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-sm">Carregando...</div>
      ) : planos.length === 0 ? (
        <div className="card py-16 text-center">
          <Package size={40} className="mx-auto mb-3 text-muted opacity-30" />
          <p className="text-muted text-sm mb-4">Nenhum plano cadastrado ainda</p>
          <Button onClick={novo}>Criar primeiro plano</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {planos.map(p => (
            <div key={p.id} className="card p-5 flex flex-col gap-3 hover:border-dark-border/80 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base">{p.nome}</h3>
                  <span className="text-xs text-muted">{tipoLabel[p.tipo]} · {p.duracaoDias} dias</span>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-extrabold text-cyan">
                    R$ {Number(p.valor).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted">/ {tipoLabel[p.tipo].toLowerCase()}</div>
                </div>
              </div>
              {p.descricao && <p className="text-xs text-muted">{p.descricao}</p>}
              {p.permiteCongelar && (
                <span className="text-xs bg-cyan/10 text-cyan border border-cyan/20 px-2 py-0.5 rounded-full w-fit">
                  ❄️ Permite congelar
                </span>
              )}
              <div className="flex gap-2 mt-auto pt-2 border-t border-dark-border">
                <button onClick={() => editar(p)} className="flex items-center gap-1.5 text-xs text-muted hover:text-cyan transition-colors">
                  <Edit size={12} /> Editar
                </button>
                <button onClick={() => desativar(p)} className="flex items-center gap-1.5 text-xs text-muted hover:text-red transition-colors ml-auto">
                  <Trash2 size={12} /> Desativar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanoModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={carregar} plano={planoSelecionado} />
    </div>
  )
}
