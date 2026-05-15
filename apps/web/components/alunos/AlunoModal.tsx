'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { X } from 'lucide-react'
import { api, getApiError } from '@/lib/api'
import { mascaraCPF, mascaraTelefone, apenasNumeros } from '@/lib/masks'
import toast from 'react-hot-toast'

interface AlunoModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  aluno?: any
}

export function AlunoModal({ open, onClose, onSaved, aluno }: AlunoModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cpf: '', dataNascimento: '', observacoes: ''
  })

  useEffect(() => {
    if (aluno) {
      setForm({
        nome: aluno.nome ?? '',
        email: aluno.email ?? '',
        // Exibe com máscara se vier sem
        telefone: aluno.telefone ? mascaraTelefone(aluno.telefone) : '',
        cpf: aluno.cpf ? mascaraCPF(aluno.cpf) : '',
        dataNascimento: aluno.dataNascimento ? aluno.dataNascimento.slice(0, 10) : '',
        observacoes: aluno.observacoes ?? '',
      })
    } else {
      setForm({ nome: '', email: '', telefone: '', cpf: '', dataNascimento: '', observacoes: '' })
    }
  }, [aluno, open])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.telefone) return toast.error('Nome e telefone são obrigatórios')

    const telefoneLimpo = apenasNumeros(form.telefone)
    if (telefoneLimpo.length < 10) return toast.error('Telefone incompleto — mínimo 10 dígitos')

    setLoading(true)
    try {
      const payload = {
        nome: form.nome,
        email: form.email || undefined,
        telefone: telefoneLimpo,           // envia só dígitos para a API
        cpf: apenasNumeros(form.cpf) || undefined,
        observacoes: form.observacoes || undefined,
        dataNascimento: form.dataNascimento
          ? new Date(form.dataNascimento + 'T12:00:00.000Z').toISOString()
          : undefined,
      }
      if (aluno) {
        await api.put(`/alunos/${aluno.id}`, payload)
        toast.success('Aluno atualizado!')
      } else {
        await api.post('/alunos', payload)
        toast.success('Aluno cadastrado!')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">{aluno ? 'Editar Aluno' : 'Novo Aluno'}</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome completo *" placeholder="João Silva" value={form.nome} onChange={set('nome')} required />

          <div className="grid grid-cols-2 gap-3">
            <PhoneInput
              label="Telefone (WhatsApp) *"
              value={form.telefone}
              onChange={(mascara) => setForm(f => ({ ...f, telefone: mascara }))}
              required
            />
            <Input label="E-mail" type="email" placeholder="joao@email.com" value={form.email} onChange={set('email')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">CPF</label>
              <input
                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none transition-colors"
                placeholder="000.000.000-00"
                value={form.cpf}
                inputMode="numeric"
                maxLength={14}
                onChange={e => setForm(f => ({ ...f, cpf: mascaraCPF(e.target.value) }))}
              />
            </div>
            <Input label="Data de Nascimento" type="date" value={form.dataNascimento} onChange={set('dataNascimento')} />
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest block mb-1.5">Observações</label>
            <textarea
              className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none resize-none h-20"
              placeholder="Lesões, restrições, observações..."
              value={form.observacoes}
              onChange={set('observacoes')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={loading} fullWidth>{aluno ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
