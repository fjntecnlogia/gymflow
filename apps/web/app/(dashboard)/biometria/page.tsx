'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, CheckCircle2, XCircle, RefreshCw, Shield, User, Zap } from 'lucide-react'
import { api } from '@/lib/api'

type Estado = 'aguardando' | 'processando' | 'liberado' | 'negado' | 'erro'

interface ResultadoReconhecimento {
  reconhecido: boolean
  aluno?: { id: string; nome: string; status: string }
  similaridade?: number
  motivo?: string
  metodo?: string
}

export default function BiometriaTerminalPage() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [estado, setEstado]         = useState<Estado>('aguardando')
  const [resultado, setResultado]   = useState<ResultadoReconhecimento | null>(null)
  const [erroCam, setErroCam]       = useState<string | null>(null)
  const [autoMode, setAutoMode]     = useState(false)
  const [contagem, setContagem]     = useState(0)

  const iniciarCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setErroCam(null)
    } catch {
      setErroCam('Câmera não disponível. Verifique as permissões.')
    }
  }, [])

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    iniciarCamera()
    return () => { pararCamera(); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [iniciarCamera, pararCamera])

  // Auto reset após resultado
  useEffect(() => {
    if (estado === 'liberado' || estado === 'negado') {
      timerRef.current = setTimeout(() => {
        setEstado('aguardando')
        setResultado(null)
        if (autoMode) iniciarCamera()
      }, 4000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [estado, autoMode, iniciarCamera])

  async function capturarEReconhecer() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || estado === 'processando') return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.9)

    setEstado('processando')
    setContagem(c => c + 1)

    try {
      const res = await api.post('/biometria/reconhecer', { image: base64 })
      const data: ResultadoReconhecimento = res.data
      setResultado(data)
      setEstado(data.reconhecido ? 'liberado' : 'negado')
    } catch (err: any) {
      setResultado({ reconhecido: false, motivo: err?.response?.data?.error ?? 'Erro de conexão' })
      setEstado('erro')
    }
  }

  const corEstado: Record<Estado, string> = {
    aguardando:  'border-cyan/20',
    processando: 'border-orange/40',
    liberado:    'border-green/60',
    negado:      'border-red/60',
    erro:        'border-red/30',
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Shield size={20} className="text-cyan" />
          <h1 className="font-display text-xl font-bold text-white">Terminal Biométrico</h1>
        </div>
        <p className="text-xs text-muted">Posicione o rosto na câmera para liberar o acesso</p>
      </div>

      {/* Câmera */}
      <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 ${corEstado[estado]} w-full max-w-md`}>
        <div className="relative bg-black aspect-[4/3]">
          {erroCam ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <User size={48} className="mx-auto text-muted opacity-30 mb-3" />
                <p className="text-sm text-muted">{erroCam}</p>
                <button onClick={iniciarCamera} className="mt-3 text-xs text-cyan underline">Tentar novamente</button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  estado === 'liberado' || estado === 'negado' ? 'opacity-30' : 'opacity-100'
                }`}
              />

              {/* Overlay de enquadramento */}
              {estado === 'aguardando' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-2 border-cyan/50 rounded-full opacity-70 animate-pulse" />
                </div>
              )}

              {/* Overlay de processando */}
              {estado === 'processando' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center">
                    <RefreshCw size={32} className="text-orange animate-spin mx-auto mb-2" />
                    <p className="text-sm text-orange font-semibold">Identificando...</p>
                  </div>
                </div>
              )}

              {/* Overlay de resultado */}
              {(estado === 'liberado' || estado === 'negado') && resultado && (
                <div className={`absolute inset-0 flex flex-col items-center justify-center ${
                  estado === 'liberado' ? 'bg-green/20' : 'bg-red/20'
                }`}>
                  {estado === 'liberado' ? (
                    <>
                      <CheckCircle2 size={48} className="text-green mb-3" />
                      <p className="text-green font-bold text-lg font-display">ACESSO LIBERADO</p>
                      {resultado.aluno && (
                        <p className="text-white font-semibold mt-1">{resultado.aluno.nome}</p>
                      )}
                      {resultado.similaridade && (
                        <p className="text-xs text-green/60 mt-1">
                          {(resultado.similaridade * 100).toFixed(1)}% de confiança
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle size={48} className="text-red mb-3" />
                      <p className="text-red font-bold text-lg font-display">ACESSO NEGADO</p>
                      <p className="text-xs text-muted mt-1">
                        {resultado.motivo ?? 'Pessoa não reconhecida'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {estado === 'erro' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red/10">
                  <div className="text-center">
                    <XCircle size={40} className="text-red mx-auto mb-2" />
                    <p className="text-sm text-red">{resultado?.motivo ?? 'Erro de conexão'}</p>
                  </div>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Botões */}
      <div className="mt-5 w-full max-w-md space-y-3">
        <button
          onClick={capturarEReconhecer}
          disabled={estado === 'processando' || !!erroCam}
          className="w-full gradient-btn text-dark font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {estado === 'processando' ? (
            <><RefreshCw size={18} className="animate-spin" /> Identificando...</>
          ) : (
            <><Camera size={18} /> Capturar e Identificar</>
          )}
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => setAutoMode(v => !v)}
            className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              autoMode ? 'border-cyan/40 text-cyan bg-cyan/5' : 'border-dark-border text-muted'
            }`}
          >
            <Zap size={12} /> {autoMode ? 'Modo Auto ON' : 'Modo Auto OFF'}
          </button>
          <button
            onClick={() => { pararCamera(); setTimeout(iniciarCamera, 300) }}
            className="flex-1 py-2.5 rounded-xl border border-dark-border text-xs font-semibold text-muted flex items-center justify-center gap-2 hover:border-muted"
          >
            <RefreshCw size={12} /> Reiniciar Câmera
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 flex gap-6 text-center">
        <div>
          <p className="text-xs text-muted">Tentativas</p>
          <p className="font-bold font-display text-cyan">{contagem}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Último</p>
          <p className="font-bold font-display text-sm">
            {resultado
              ? resultado.reconhecido
                ? <span className="text-green">✓ {resultado.aluno?.nome?.split(' ')[0]}</span>
                : <span className="text-red">✗ N/A</span>
              : <span className="text-muted">—</span>
            }
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Modo</p>
          <p className="font-bold font-display text-sm text-orange">{autoMode ? 'Auto' : 'Manual'}</p>
        </div>
      </div>
    </div>
  )
}
