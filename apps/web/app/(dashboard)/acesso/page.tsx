'use client'
import { useEffect, useState } from 'react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ShieldCheck, ShieldX, Activity, Camera, QrCode, Cpu } from 'lucide-react'
import { api } from '@/lib/api'
import { FacialCamera } from '@/components/acesso/FacialCamera'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

type Modo = 'log' | 'facial'

interface UltimoAcesso {
  liberado: boolean
  motivo?: string | null
  similaridade?: number | null
  aluno?: { nome: string; fotoUrl?: string; plano?: string }
}

export default function AcessoPage() {
  const [stats, setStats] = useState<any>(null)
  const [acessos, setAcessos] = useState<any[]>([])
  const [modo, setModo] = useState<Modo>('log')
  const [catracas, setCatracas] = useState<any[]>([])
  const [catracaSelecionada, setCatracaSelecionada] = useState<string>('')
  const [showCamera, setShowCamera] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [ultimoAcesso, setUltimoAcesso] = useState<UltimoAcesso | null>(null)
  const [facialOnline, setFacialOnline] = useState<boolean | null>(null)

  async function carregar() {
    const [s, a] = await Promise.all([
      api.get('/acesso/hoje'),
      api.get('/acesso?limit=50'),
    ])
    setStats(s.data)
    setAcessos(a.data)
  }

  async function carregarCatracas() {
    try {
      const { data } = await api.get('/catracas')
      setCatracas(data)
      if (data.length > 0) setCatracaSelecionada(data[0].id)
    } catch {}
  }

  async function verificarFacialStatus() {
    try {
      const { data } = await api.get('/acesso/facial/status')
      setFacialOnline(data.online)
    } catch {
      setFacialOnline(false)
    }
  }

  useEffect(() => {
    carregar()
    carregarCatracas()
    verificarFacialStatus()
    const interval = setInterval(carregar, 10000)
    return () => clearInterval(interval)
  }, [])

  async function handleFaceCapture(fotoBase64: string) {
    setShowCamera(false)
    setProcessando(true)
    setUltimoAcesso(null)

    try {
      const { data } = await api.post('/acesso/facial', {
        foto: fotoBase64,
        academiaId: '', // Será inferido pelo middleware
        catracaId: catracaSelecionada || undefined,
      })

      setUltimoAcesso(data)

      if (data.liberado) {
        toast.success(`✅ Bem-vindo, ${data.aluno?.nome}!`)
      } else {
        toast.error(`🚫 Acesso negado: ${data.motivo}`)
      }
    } catch (err: any) {
      toast.error('Erro ao processar reconhecimento facial')
    } finally {
      setProcessando(false)
    }
  }

  const tipoIcon = (tipo: string) => {
    if (tipo === 'BIOMETRIA') return <Camera size={12} />
    if (tipo === 'QR_CODE') return <QrCode size={12} />
    return <Cpu size={12} />
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Controle de Acesso</h1>
          <p className="text-sm text-muted">Atualiza a cada 10 segundos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
            <span className="text-xs text-green font-semibold">Ao vivo</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Check-ins Hoje" value={stats?.total ?? '–'} color="cyan" icon={<Activity size={16} />} />
        <KpiCard label="Liberados" value={stats?.liberados ?? '–'} color="green" icon={<ShieldCheck size={16} />} />
        <KpiCard label="Bloqueados" value={stats?.bloqueados ?? '–'} color="red" icon={<ShieldX size={16} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setModo('log')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${modo === 'log' ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted hover:text-white'}`}
        >
          Log de Acessos
        </button>
        <button
          onClick={() => setModo('facial')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${modo === 'facial' ? 'bg-cyan/10 text-cyan border border-cyan/30' : 'text-muted hover:text-white'}`}
        >
          <Camera size={14} /> Totem Facial
          {facialOnline === false && <span className="text-xs bg-red/20 text-red px-1.5 py-0.5 rounded-full">offline</span>}
          {facialOnline === true && <span className="text-xs bg-green/20 text-green px-1.5 py-0.5 rounded-full">online</span>}
        </button>
      </div>

      {/* Tab: Totem Facial */}
      {modo === 'facial' && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Totem de Reconhecimento Facial</h2>
              <p className="text-xs text-muted mt-0.5">Use para liberar acesso sem QR Code</p>
            </div>
            {facialOnline === false && (
              <div className="text-xs bg-red/10 border border-red/20 text-red px-3 py-1.5 rounded-full">
                CompreFace offline
              </div>
            )}
          </div>

          {/* Catraca selecionada */}
          {catracas.length > 0 && (
            <div>
              <label className="text-xs text-muted mb-1 block">Liberar na catraca</label>
              <select
                className="input w-full max-w-xs"
                value={catracaSelecionada}
                onChange={e => setCatracaSelecionada(e.target.value)}
              >
                <option value="">Nenhuma (só verificar)</option>
                {catracas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.ip})</option>
                ))}
              </select>
            </div>
          )}

          {/* Resultado do último acesso */}
          {ultimoAcesso && (
            <div className={`rounded-xl p-4 border ${ultimoAcesso.liberado ? 'bg-green/5 border-green/20' : 'bg-red/5 border-red/20'}`}>
              <div className="flex items-center gap-3">
                {ultimoAcesso.aluno?.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ultimoAcesso.aluno.fotoUrl} alt="Face" className="w-14 h-14 rounded-full object-cover border-2 border-dark-border" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-dark-card border-2 border-dark-border flex items-center justify-center">
                    <Camera size={20} className="text-muted" />
                  </div>
                )}
                <div>
                  <div className={`text-lg font-bold ${ultimoAcesso.liberado ? 'text-green' : 'text-red'}`}>
                    {ultimoAcesso.liberado ? '✅ ACESSO LIBERADO' : '🚫 ACESSO NEGADO'}
                  </div>
                  {ultimoAcesso.aluno?.nome && (
                    <div className="font-semibold">{ultimoAcesso.aluno.nome}</div>
                  )}
                  {ultimoAcesso.aluno?.plano && (
                    <div className="text-xs text-muted">{ultimoAcesso.aluno.plano}</div>
                  )}
                  {ultimoAcesso.motivo && (
                    <div className="text-xs text-red mt-0.5">{ultimoAcesso.motivo}</div>
                  )}
                  {ultimoAcesso.similaridade && (
                    <div className="text-xs text-muted mt-0.5">
                      Confiança: {Math.round(ultimoAcesso.similaridade * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botão de iniciar câmera */}
          <button
            onClick={() => setShowCamera(true)}
            disabled={processando || facialOnline === false}
            className="gradient-btn text-dark font-bold px-6 py-3 rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            {processando ? (
              <><span className="animate-spin">⟳</span> Processando...</>
            ) : (
              <><Camera size={16} /> Iniciar Câmera</>
            )}
          </button>

          {facialOnline === false && (
            <p className="text-xs text-muted">
              O serviço CompreFace não está disponível. Verifique se o container está rodando no Railway.
            </p>
          )}
        </div>
      )}

      {/* Tab: Log */}
      {modo === 'log' && (
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
                  <p className="text-xs text-muted flex items-center gap-1">
                    {tipoIcon(a.tipo)} {a.tipo} · {a.motivoBloqueio ?? 'Acesso normal'}
                  </p>
                </div>
                <span className="text-xs text-muted flex-shrink-0">
                  {dayjs(a.criadoEm).format('HH:mm:ss')}
                </span>
              </div>
            ))}
            {acessos.length === 0 && (
              <div className="text-center py-10 text-muted text-sm">
                Nenhum acesso registrado hoje
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal câmera */}
      {showCamera && (
        <FacialCamera
          modo="acesso"
          titulo="Verificação Facial"
          onCapture={handleFaceCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}
