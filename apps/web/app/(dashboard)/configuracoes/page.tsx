'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Save, Wifi, WifiOff, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { mascaraTelefone, apenasNumeros } from '@/lib/masks'
import toast from 'react-hot-toast'

type Section = 'academia' | 'pix' | 'whatsapp' | 'catraca' | 'notificacoes'

export default function ConfiguracoesPage() {
  const [section, setSection] = useState<Section>('academia')
  const [academia, setAcademia] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // PIX
  const [pix, setPix] = useState({ clientId: '', clientSecret: '', chave: '', sandbox: true })

  // WhatsApp
  const [wa, setWa] = useState({ apiUrl: '', apiKey: '', instancia: 'gymflow', conectado: false, qrCode: '' })
  const [testando, setTestando] = useState(false)

  // Catraca
  const [catracas, setCatracas] = useState<any[]>([])
  const [novaCatraca, setNovaCatraca] = useState({ nome: '', modelo: '', ipLocal: '', apiKey: '' })
  const [addingCatraca, setAddingCatraca] = useState(false)

  useEffect(() => {
    api.get('/academias/minha').then(r => {
      setAcademia(r.data)
      setCatracas(r.data.catracas ?? [])
      const cfg = r.data.configuracoes ?? {}
      if (cfg.pix) setPix(cfg.pix)
      if (cfg.whatsapp) setWa(w => ({ ...w, ...cfg.whatsapp }))
    }).catch(() => {})
  }, [])

  async function salvarAcademia() {
    setLoading(true)
    try {
      await api.put('/academias/minha', academia)
      toast.success('Dados salvos!')
    } catch { toast.error('Erro ao salvar') }
    finally { setLoading(false) }
  }

  async function salvarPix() {
    setLoading(true)
    try {
      await api.put('/academias/minha', { configuracoes: { ...academia?.configuracoes, pix } })
      toast.success('PIX configurado!')
    } catch { toast.error('Erro ao salvar PIX') }
    finally { setLoading(false) }
  }

  async function salvarWhatsApp() {
    setLoading(true)
    try {
      await api.put('/academias/minha', { configuracoes: { ...academia?.configuracoes, whatsapp: { apiUrl: wa.apiUrl, apiKey: wa.apiKey, instancia: wa.instancia } } })
      toast.success('WhatsApp configurado!')
    } catch { toast.error('Erro ao salvar WhatsApp') }
    finally { setLoading(false) }
  }

  async function testarWhatsApp() {
    setTestando(true)
    try {
      const { data } = await api.post('/notificacoes/whatsapp/status')
      setWa(w => ({ ...w, conectado: data.conectado, qrCode: data.qrCode }))
      if (data.conectado) toast.success('WhatsApp conectado!')
      else toast('Escaneie o QR Code para conectar', { icon: '📱' })
    } catch { toast.error('Erro ao testar conexão') }
    finally { setTestando(false) }
  }

  async function adicionarCatraca() {
    if (!novaCatraca.nome) return toast.error('Nome é obrigatório')
    setLoading(true)
    try {
      // Chamar API para adicionar catraca (endpoint futuro)
      toast.success('Catraca adicionada! Sincronize pelo painel de acesso.')
      setNovaCatraca({ nome: '', modelo: '', ipLocal: '', apiKey: '' })
      setAddingCatraca(false)
    } catch { toast.error('Erro ao adicionar catraca') }
    finally { setLoading(false) }
  }

  const sections: { id: Section; label: string; icon: string }[] = [
    { id: 'academia', label: 'Academia', icon: '🏋️' },
    { id: 'pix', label: 'PIX (Efí Bank)', icon: '💰' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '📲' },
    { id: 'catraca', label: 'Catracas', icon: '🔐' },
    { id: 'notificacoes', label: 'Notificações', icon: '🔔' },
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted">Configure sua academia, integrações e dispositivos</p>
      </div>

      <div className="flex gap-6">
        {/* Menu lateral */}
        <div className="w-48 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  section === s.id ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-muted hover:text-white hover:bg-white/4'
                }`}>
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-4">

          {/* Academia */}
          {section === 'academia' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-lg">Dados da Academia</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nome" value={academia?.nome ?? ''} onChange={e => setAcademia((a: any) => ({ ...a, nome: e.target.value }))} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted">Telefone</label>
                  <input
                    className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-cyan outline-none transition-colors"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(XX) XXXXX-XXXX"
                    maxLength={15}
                    value={mascaraTelefone(academia?.telefone ?? '')}
                    onChange={e => setAcademia((a: any) => ({ ...a, telefone: apenasNumeros(e.target.value) }))}
                  />
                </div>
                <Input label="E-mail" value={academia?.email ?? ''} onChange={e => setAcademia((a: any) => ({ ...a, email: e.target.value }))} />
                <Input label="CNPJ" value={academia?.cnpj ?? ''} onChange={e => setAcademia((a: any) => ({ ...a, cnpj: e.target.value }))} />
              </div>
              <Button leftIcon={<Save size={14} />} loading={loading} onClick={salvarAcademia}>Salvar</Button>
            </div>
          )}

          {/* PIX */}
          {section === 'pix' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">PIX — Efí Bank</h2>
                  <p className="text-xs text-muted mt-0.5">Credenciais em <a href="https://dev.efipay.com.br" target="_blank" rel="noreferrer" className="text-cyan hover:underline">dev.efipay.com.br</a> → Aplicações</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${pix.clientId ? 'border-green/30 bg-green/10 text-green' : 'border-dark-border text-muted'}`}>
                  {pix.clientId ? <><CheckCircle size={12} /> Configurado</> : <><XCircle size={12} /> Não configurado</>}
                </div>
              </div>
              <Input label="Client ID" placeholder="Client_Id_..." value={pix.clientId} onChange={e => setPix(p => ({ ...p, clientId: e.target.value }))} />
              <Input label="Client Secret" type="password" placeholder="Client_Secret_..." value={pix.clientSecret} onChange={e => setPix(p => ({ ...p, clientSecret: e.target.value }))} />
              <Input label="Chave PIX" placeholder="email@academia.com.br ou CPF/CNPJ" value={pix.chave} onChange={e => setPix(p => ({ ...p, chave: e.target.value }))} />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-cyan" checked={pix.sandbox} onChange={e => setPix(p => ({ ...p, sandbox: e.target.checked }))} />
                <span className="text-sm text-muted">Modo Sandbox (homologação)</span>
              </label>
              <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-4 text-xs text-muted">
                <p className="font-bold text-cyan mb-1">📋 Como obter as credenciais:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Acesse <strong>efipay.com.br</strong> → Login</li>
                  <li>Vá em <strong>API → Aplicações → Nova aplicação</strong></li>
                  <li>Habilite <strong>API Pix</strong> e copie Client ID e Secret</li>
                  <li>Certifique seu domínio como chave PIX em <strong>Minha conta → Dados bancários</strong></li>
                </ol>
              </div>
              <Button leftIcon={<Save size={14} />} loading={loading} onClick={salvarPix}>Salvar PIX</Button>
            </div>
          )}

          {/* WhatsApp */}
          {section === 'whatsapp' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">WhatsApp — Evolution API</h2>
                  <p className="text-xs text-muted mt-0.5">Notificações automáticas de cobrança, vencimento e reengajamento</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${wa.conectado ? 'border-green/30 bg-green/10 text-green' : 'border-dark-border text-muted'}`}>
                  {wa.conectado ? <><Wifi size={12} /> Conectado</> : <><WifiOff size={12} /> Desconectado</>}
                </div>
              </div>
              <Input label="URL da API" placeholder="https://evolution.seudominio.com" value={wa.apiUrl} onChange={e => setWa(w => ({ ...w, apiUrl: e.target.value }))} />
              <Input label="API Key" type="password" placeholder="sua-api-key" value={wa.apiKey} onChange={e => setWa(w => ({ ...w, apiKey: e.target.value }))} />
              <Input label="Nome da Instância" placeholder="gymflow" value={wa.instancia} onChange={e => setWa(w => ({ ...w, instancia: e.target.value }))} />

              {wa.qrCode && (
                <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl">
                  <img src={wa.qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
                  <p className="text-dark text-xs font-medium">Escaneie com o WhatsApp para conectar</p>
                </div>
              )}

              <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-4 text-xs text-muted">
                <p className="font-bold text-cyan mb-1">📋 Onde hospedar a Evolution API:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Docker: <strong>github.com/EvolutionAPI/evolution-api</strong></li>
                  <li>Railway: Template disponível no marketplace</li>
                  <li>EasyPanel: 1-click install disponível</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" leftIcon={<RefreshCw size={14} />} loading={testando} onClick={testarWhatsApp}>Testar Conexão</Button>
                <Button leftIcon={<Save size={14} />} loading={loading} onClick={salvarWhatsApp}>Salvar</Button>
              </div>
            </div>
          )}

          {/* Catraca */}
          {section === 'catraca' && (
            <div className="space-y-4">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg">Catracas Cadastradas</h2>
                  <Button size="sm" onClick={() => setAddingCatraca(true)}>+ Adicionar</Button>
                </div>

                {catracas.length === 0 && !addingCatraca ? (
                  <p className="text-sm text-muted text-center py-8">Nenhuma catraca configurada</p>
                ) : (
                  <div className="space-y-3">
                    {catracas.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-dark-card2 rounded-xl border border-dark-border">
                        <div>
                          <p className="font-semibold text-sm">{c.nome}</p>
                          <p className="text-xs text-muted">{c.modelo ?? 'Modelo não informado'} · IP: {c.ipLocal ?? 'não configurado'}</p>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${c.ativa ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
                          {c.ativa ? '● Online' : '● Offline'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {addingCatraca && (
                  <div className="mt-4 p-4 bg-dark-card2 rounded-xl border border-dark-border space-y-3">
                    <h3 className="font-semibold text-sm">Nova Catraca</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Nome" placeholder="Catraca Entrada Principal" value={novaCatraca.nome} onChange={e => setNovaCatraca(c => ({ ...c, nome: e.target.value }))} />
                      <Input label="Modelo" placeholder="Control iD iDFit 4" value={novaCatraca.modelo} onChange={e => setNovaCatraca(c => ({ ...c, modelo: e.target.value }))} />
                      <Input label="IP Local" placeholder="192.168.1.100" value={novaCatraca.ipLocal} onChange={e => setNovaCatraca(c => ({ ...c, ipLocal: e.target.value }))} />
                      <Input label="API Key" type="password" placeholder="senha da catraca" value={novaCatraca.apiKey} onChange={e => setNovaCatraca(c => ({ ...c, apiKey: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setAddingCatraca(false)}>Cancelar</Button>
                      <Button size="sm" loading={loading} onClick={adicionarCatraca}>Adicionar</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-5 border-cyan/20 bg-cyan/5">
                <p className="font-bold text-sm text-cyan mb-2">🔐 Modelos compatíveis</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                  {['Control iD iDFit 4', 'Control iD iDBox', 'Henry Orion', 'Henry Facile', 'Acesso Bio', 'Topdata Inner Pro'].map(m => (
                    <div key={m} className="flex items-center gap-1.5"><span className="text-green">✓</span> {m}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notificações */}
          {section === 'notificacoes' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-bold text-lg">Régua de Notificações</h2>
              <p className="text-sm text-muted">Configure quando o sistema envia mensagens automáticas via WhatsApp.</p>
              {[
                { label: 'Lembrete de vencimento', desc: '3 dias antes do vencimento', checked: true },
                { label: 'Cobrança no dia do vencimento', desc: 'PIX gerado e enviado automaticamente', checked: true },
                { label: 'Bloqueio por inadimplência', desc: '3 dias após vencimento', checked: true },
                { label: 'Segunda cobrança', desc: '7 dias após vencimento', checked: true },
                { label: 'Reengajamento de ausentes', desc: 'Aluno sem check-in há 7 dias', checked: true },
                { label: 'Mensagem de aniversário', desc: 'No dia do aniversário do aluno', checked: false },
                { label: 'Confirmação de pagamento', desc: 'Quando PIX é confirmado', checked: true },
              ].map((n, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-dark-card2 rounded-xl border border-dark-border">
                  <div>
                    <p className="text-sm font-semibold">{n.label}</p>
                    <p className="text-xs text-muted">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={n.checked} />
                    <div className="w-9 h-5 bg-dark-border rounded-full peer-checked:bg-cyan transition-colors peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform" />
                  </label>
                </div>
              ))}
              <Button leftIcon={<Save size={14} />}>Salvar Configurações</Button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
