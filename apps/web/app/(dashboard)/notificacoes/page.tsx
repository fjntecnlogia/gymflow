'use client'
import { useState, useEffect, useRef } from 'react'
import { Wifi, WifiOff, QrCode, RefreshCw, Send, MessageCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { mascaraTelefone, apenasNumeros } from '@/lib/masks'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface WhatsAppStatus {
  conectado: boolean
}

interface NotifLog {
  id: string
  canal: string
  tipo: string
  destinatario: string
  status: string
  criadoEm: string
}

interface Stats {
  total: number
  enviados: number
  erros: number
  taxaSucesso: number
}

export default function NotificacoesPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [conectando, setConectando] = useState(false)
  const [logs, setLogs] = useState<NotifLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [testeFone, setTesteFone] = useState('')
  const [testeMsg, setTesteMsg] = useState('Olá! Esta é uma mensagem de teste do GYMFLOW 💪')
  const [enviandoTeste, setEnviandoTeste] = useState(false)
  const poolingRef = useRef<NodeJS.Timeout>()

  async function verificarStatus() {
    try {
      const { data } = await api.get('/notificacoes/whatsapp/status')
      setStatus(data)
      if (data.conectado) {
        setQrCode(null)
        clearInterval(poolingRef.current)
      }
    } catch {
      setStatus({ conectado: false })
    } finally {
      setLoadingStatus(false)
    }
  }

  async function conectar() {
    setConectando(true)
    setQrCode(null)
    try {
      const { data } = await api.post('/notificacoes/whatsapp/conectar')
      if (data.conectado) {
        setStatus({ conectado: true })
        toast.success('WhatsApp já conectado!')
      } else if (data.qrCode) {
        setQrCode(data.qrCode)
        toast.success('Escaneie o QR Code com seu WhatsApp')
        // Verificar conexão a cada 5s aguardando scan
        poolingRef.current = setInterval(verificarStatus, 5000)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao conectar WhatsApp')
    } finally {
      setConectando(false)
    }
  }

  async function desconectar() {
    if (!confirm('Desconectar o WhatsApp?')) return
    try {
      await api.post('/notificacoes/whatsapp/desconectar')
      setStatus({ conectado: false })
      setQrCode(null)
      toast.success('WhatsApp desconectado')
    } catch {
      toast.error('Erro ao desconectar')
    }
  }

  async function enviarTeste() {
    if (!testeFone || !testeMsg) {
      toast.error('Preencha telefone e mensagem')
      return
    }
    setEnviandoTeste(true)
    try {
      const { data } = await api.post('/notificacoes/whatsapp/teste', {
        telefone: apenasNumeros(testeFone),
        mensagem: testeMsg,
      })
      if (data.ok) {
        toast.success('Mensagem enviada!')
      } else {
        toast.error('Falha ao enviar mensagem')
      }
      carregarLogs()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao enviar')
    } finally {
      setEnviandoTeste(false)
    }
  }

  async function carregarLogs() {
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/notificacoes/log?limit=20'),
        api.get('/notificacoes/stats'),
      ])
      setLogs(logsRes.data)
      setStats(statsRes.data)
    } catch {}
  }

  useEffect(() => {
    verificarStatus()
    carregarLogs()
    return () => clearInterval(poolingRef.current)
  }, [])

  const statusColor = status?.conectado ? 'text-green' : 'text-red'
  const statusBg = status?.conectado ? 'bg-green/10 border-green/20' : 'bg-red/10 border-red/20'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Notificações</h1>
        <p className="text-muted text-sm mt-1">WhatsApp e alertas automáticos para alunos</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total enviado', value: stats.total, icon: MessageCircle, color: 'text-cyan' },
            { label: 'Entregues', value: stats.enviados, icon: CheckCircle2, color: 'text-green' },
            { label: 'Erros', value: stats.erros, icon: XCircle, color: 'text-red' },
            { label: 'Taxa sucesso', value: `${stats.taxaSucesso}%`, icon: CheckCircle2, color: 'text-cyan' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <s.icon size={18} className={s.color + ' mb-2'} />
              <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* WhatsApp Connection */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle size={18} className="text-green" /> WhatsApp
          </h2>
          {!loadingStatus && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${statusBg} ${statusColor}`}>
              {status?.conectado ? <Wifi size={12} /> : <WifiOff size={12} />}
              {status?.conectado ? 'Conectado' : 'Desconectado'}
            </div>
          )}
        </div>

        {loadingStatus ? (
          <div className="flex items-center gap-2 text-muted text-sm">
            <RefreshCw size={14} className="animate-spin" /> Verificando conexão...
          </div>
        ) : status?.conectado ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">WhatsApp conectado e pronto para enviar notificações automáticas.</p>
            <button onClick={desconectar} className="text-xs text-red hover:underline">
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Conecte o WhatsApp para enviar cobranças, lembretes e boas-vindas automaticamente para seus alunos.
            </p>

            {qrCode ? (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl inline-block">
                  <Image
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    width={220}
                    height={220}
                    unoptimized
                  />
                </div>
                <p className="text-xs text-muted text-center">
                  Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo → Escaneie este QR Code
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <RefreshCw size={11} className="animate-spin" /> Aguardando scan...
                </div>
              </div>
            ) : (
              <button
                onClick={conectar}
                disabled={conectando}
                className="gradient-btn text-dark font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {conectando ? (
                  <><RefreshCw size={14} className="animate-spin" /> Conectando...</>
                ) : (
                  <><QrCode size={14} /> Conectar WhatsApp</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Teste de envio */}
      {status?.conectado && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Send size={16} className="text-cyan" /> Enviar Mensagem de Teste
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1 block">Telefone (com DDD)</label>
              <input
                className="input w-full"
                type="tel"
                inputMode="numeric"
                placeholder="(XX) XXXXX-XXXX"
                maxLength={15}
                value={testeFone}
                onChange={e => setTesteFone(mascaraTelefone(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1 block">Mensagem</label>
              <input
                className="input w-full"
                value={testeMsg}
                onChange={e => setTesteMsg(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={enviarTeste}
            disabled={enviandoTeste}
            className="gradient-btn text-dark font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {enviandoTeste ? <><RefreshCw size={14} className="animate-spin" /> Enviando...</> : <><Send size={14} /> Enviar Teste</>}
          </button>
        </div>
      )}

      {/* Log de notificações */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Clock size={16} className="text-muted" /> Histórico Recente
        </h2>
        {logs.length === 0 ? (
          <p className="text-muted text-sm">Nenhuma notificação enviada ainda.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-dark-border last:border-0">
                <div>
                  <div className="text-sm font-medium">{log.destinatario}</div>
                  <div className="text-xs text-muted">{log.tipo} · {log.canal}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    log.status === 'ENVIADO' ? 'bg-green/10 text-green' :
                    log.status === 'ERRO' ? 'bg-red/10 text-red' :
                    'bg-dark-border text-muted'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(log.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
