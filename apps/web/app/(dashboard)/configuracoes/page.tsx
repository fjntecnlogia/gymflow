'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Save, Wifi, WifiOff } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ConfiguracoesPage() {
  const [academia, setAcademia] = useState<any>(null)
  const [catracas, setCatracas] = useState<any[]>([])
  const [wa, setWa] = useState<{ conectado: boolean; qrCode?: string }>({ conectado: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/academias/minha'),
      api.get('/notificacoes/whatsapp/status'),
    ]).then(([a, w]) => {
      setAcademia(a.data)
      setCatracas(a.data.catracas ?? [])
      setWa(w.data)
    }).catch(() => {})
  }, [])

  async function salvar() {
    setLoading(true)
    try {
      await api.put('/academias/minha', academia)
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function conectarWhatsApp() {
    try {
      const { data } = await api.post('/notificacoes/whatsapp/conectar')
      setWa({ conectado: false, qrCode: data.qrCode })
    } catch {
      toast.error('Erro ao conectar WhatsApp')
    }
  }

  async function sincronizarCatraca(catracaId: string) {
    try {
      await api.post(`/acesso/sincronizar-catraca/${catracaId}`)
      toast.success('Catraca sincronizada!')
    } catch {
      toast.error('Erro ao sincronizar catraca')
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted mt-1">Gerencie sua academia, integrações e dispositivos</p>
      </div>

      {/* Academia */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Dados da Academia</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Nome" value={academia?.nome ?? ''} onChange={(e) => setAcademia((a: any) => ({ ...a, nome: e.target.value }))} />
          <Input label="Telefone" value={academia?.telefone ?? ''} onChange={(e) => setAcademia((a: any) => ({ ...a, telefone: e.target.value }))} />
          <Input label="E-mail" value={academia?.email ?? ''} onChange={(e) => setAcademia((a: any) => ({ ...a, email: e.target.value }))} />
          <Input label="CNPJ" value={academia?.cnpj ?? ''} onChange={(e) => setAcademia((a: any) => ({ ...a, cnpj: e.target.value }))} />
        </div>
        <Button leftIcon={<Save size={14} />} loading={loading} onClick={salvar}>Salvar alterações</Button>
      </div>

      {/* WhatsApp */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">WhatsApp</h2>
            <p className="text-xs text-muted mt-0.5">Notificações automáticas via Evolution API</p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${wa.conectado ? 'text-green' : 'text-red'}`}>
            {wa.conectado ? <Wifi size={14} /> : <WifiOff size={14} />}
            {wa.conectado ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
        {wa.qrCode && (
          <div className="bg-white p-4 rounded-xl inline-block">
            <img src={wa.qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
            <p className="text-center text-xs text-dark mt-2">Escaneie com o WhatsApp</p>
          </div>
        )}
        {!wa.conectado && (
          <Button variant="outline" onClick={conectarWhatsApp}>Conectar WhatsApp</Button>
        )}
      </div>

      {/* Catracas */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Catracas Cadastradas</h2>
        {catracas.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma catraca configurada</p>
        ) : (
          <div className="space-y-3">
            {catracas.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-dark-card2 rounded-xl border border-dark-border">
                <div>
                  <p className="font-semibold text-sm">{c.nome}</p>
                  <p className="text-xs text-muted">{c.modelo ?? 'Modelo não informado'} · {c.ipLocal ?? 'IP não configurado'}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => sincronizarCatraca(c.id)}>Sincronizar</Button>
              </div>
            ))}
          </div>
        )}
        <Button variant="ghost" size="sm">+ Adicionar catraca</Button>
      </div>
    </div>
  )
}
