'use client'
import { useState, useEffect } from 'react'
import { Plus, Wifi, WifiOff, RefreshCw, Trash2, Settings2, RotateCcw, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

type ModeloCatraca = 'CONTROLID' | 'HENRY' | 'GENERICO'

interface Catraca {
  id: string
  nome: string
  ip: string
  modelo: ModeloCatraca
  ativa: boolean
  ultimoStatus?: string | null
  criadoEm: string
}

const MODELOS: { value: ModeloCatraca; label: string }[] = [
  { value: 'GENERICO', label: 'Genérico / Outro' },
  { value: 'CONTROLID', label: 'Control iD' },
  { value: 'HENRY', label: 'Henry' },
]

export default function CatracasPage() {
  const [catracas, setCatracas] = useState<Catraca[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [testando, setTestando] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', ip: '', credencial: '', modelo: 'GENERICO' as ModeloCatraca })
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    try {
      const { data } = await api.get('/catracas')
      setCatracas(data)
    } catch {
      toast.error('Erro ao carregar catracas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function salvar() {
    if (!form.nome || !form.ip || !form.credencial) {
      toast.error('Preencha todos os campos')
      return
    }
    setSalvando(true)
    try {
      await api.post('/catracas', form)
      toast.success('Catraca cadastrada!')
      setModal(false)
      setForm({ nome: '', ip: '', credencial: '', modelo: 'GENERICO' })
      carregar()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function testar(id: string) {
    setTestando(id)
    try {
      const { data } = await api.post(`/catracas/${id}/testar`)
      if (data.conectada) {
        toast.success(`✅ ${data.nome} — Online!`)
      } else {
        toast.error(`❌ ${data.nome} — Sem resposta`)
      }
      carregar()
    } catch {
      toast.error('Erro ao testar conexão')
    } finally {
      setTestando(null)
    }
  }

  async function sincronizar(id: string) {
    setSincronizando(id)
    try {
      const { data } = await api.post(`/catracas/${id}/sincronizar`)
      toast.success(`Sincronizados: ${data.sincronizados} alunos${data.erros > 0 ? ` (${data.erros} erros)` : ''}`)
    } catch {
      toast.error('Erro ao sincronizar')
    } finally {
      setSincronizando(null)
    }
  }

  async function remover(id: string, nome: string) {
    if (!confirm(`Remover catraca "${nome}"?`)) return
    try {
      await api.delete(`/catracas/${id}`)
      toast.success('Catraca removida')
      carregar()
    } catch {
      toast.error('Erro ao remover')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Catracas</h1>
          <p className="text-muted text-sm mt-1">Gerencie as catracas de acesso da academia</p>
        </div>
        <button onClick={() => setModal(true)} className="gradient-btn text-dark font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm">
          <Plus size={16} /> Nova Catraca
        </button>
      </div>

      {/* Aviso webhook */}
      <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-4 text-sm text-muted">
        <span className="text-cyan font-semibold">URL do Webhook:</span>{' '}
        Configure na sua catraca:{' '}
        <code className="bg-dark-card px-2 py-0.5 rounded text-cyan text-xs">
          {process.env.NEXT_PUBLIC_API_URL ?? 'https://sua-api.railway.app'}/catracas/webhook/<strong>seu-slug</strong>
        </code>
      </div>

      {catracas.length === 0 ? (
        <div className="card p-12 text-center">
          <Settings2 size={48} className="mx-auto text-muted mb-4 opacity-40" />
          <p className="text-muted">Nenhuma catraca cadastrada</p>
          <p className="text-xs text-muted mt-1">Adicione sua primeira catraca para controle de acesso automático</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catracas.map(c => (
            <div key={c.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.nome}</div>
                  <div className="text-xs text-muted mt-0.5">{c.ip}</div>
                  <div className="text-xs text-muted">{MODELOS.find(m => m.value === c.modelo)?.label ?? c.modelo}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  c.ultimoStatus === 'ONLINE'
                    ? 'bg-green/10 text-green'
                    : c.ultimoStatus === 'OFFLINE'
                    ? 'bg-red/10 text-red'
                    : 'bg-dark-border text-muted'
                }`}>
                  {c.ultimoStatus === 'ONLINE' ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {c.ultimoStatus ?? 'Não testada'}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => testar(c.id)}
                  disabled={testando === c.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dark-border text-xs font-semibold hover:border-cyan/40 transition-colors disabled:opacity-50"
                >
                  {testando === c.id
                    ? <><RefreshCw size={12} className="animate-spin" /> Testando...</>
                    : <><Wifi size={12} /> Testar</>}
                </button>
                <button
                  onClick={() => sincronizar(c.id)}
                  disabled={sincronizando === c.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dark-border text-xs font-semibold hover:border-cyan/40 transition-colors disabled:opacity-50"
                >
                  {sincronizando === c.id
                    ? <><RefreshCw size={12} className="animate-spin" /> Sincronizando...</>
                    : <><RotateCcw size={12} /> Sincronizar</>}
                </button>
                <button
                  onClick={() => remover(c.id, c.nome)}
                  className="p-2 rounded-lg border border-dark-border hover:border-red/40 hover:text-red transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nova catraca */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Zap size={18} className="text-cyan" /> Nova Catraca
              </h2>
              <button onClick={() => setModal(false)} className="text-muted hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted mb-1 block">Nome / Localização</label>
                <input
                  className="input w-full"
                  placeholder="Ex: Entrada Principal"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">IP da Catraca (rede local)</label>
                <input
                  className="input w-full"
                  placeholder="Ex: 192.168.1.100"
                  value={form.ip}
                  onChange={e => setForm(f => ({ ...f, ip: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Modelo</label>
                <select
                  className="input w-full"
                  value={form.modelo}
                  onChange={e => setForm(f => ({ ...f, modelo: e.target.value as ModeloCatraca }))}
                >
                  {MODELOS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">
                  {form.modelo === 'HENRY' ? 'Token API' : 'Senha Admin'}
                </label>
                <input
                  className="input w-full"
                  type="password"
                  placeholder={form.modelo === 'HENRY' ? 'Bearer token' : 'Senha do admin'}
                  value={form.credencial}
                  onChange={e => setForm(f => ({ ...f, credencial: e.target.value }))}
                />
              </div>
            </div>

            <div className="text-xs text-muted bg-dark-card rounded-lg p-3">
              <strong className="text-white">Como funciona:</strong> O servidor GYMFLOW se comunica com a catraca via rede local ou VPN.
              Certifique-se que o servidor tem acesso ao IP informado.
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModal(false)} className="flex-1 py-2 rounded-xl border border-dark-border text-sm font-semibold hover:border-muted">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex-1 gradient-btn text-dark py-2 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
