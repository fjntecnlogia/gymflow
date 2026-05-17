'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Camera, CheckCircle2, XCircle, RefreshCw, Shield, User } from 'lucide-react'

// Endpoint público direto na API (sem autenticação de usuário)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

type Estado = 'aguardando' | 'processando' | 'liberado' | 'negado' | 'erro'

export default function CatracaBiometriaPage() {
  const { slug } = useParams() as { slug: string }
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [estado, setEstado]       = useState<Estado>('aguardando')
  const [nomeAluno, setNomeAluno] = useState<string | null>(null)
  const [msgErro, setMsgErro]     = useState<string | null>(null)
  const [erroCam, setErroCam]     = useState<string | null>(null)
  const [similaridade, setSim]    = useState<number | null>(null)

  const iniciarCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setErroCam(null)
    } catch {
      setErroCam('Câmera não disponível')
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

  // Auto reset após 5s
  useEffect(() => {
    if (estado === 'liberado' || estado === 'negado' || estado === 'erro') {
      timerRef.current = setTimeout(() => {
        setEstado('aguardando')
        setNomeAluno(null)
        setMsgErro(null)
        setSim(null)
        iniciarCamera()
      }, 5000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [estado, iniciarCamera])

  async function reconhecer() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || estado === 'processando') return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85)

    setEstado('processando')
    pararCamera()

    try {
      const res = await fetch(`${API_URL}/biometria/acesso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, academiaSlug: slug }),
      })
      const data = await res.json()

      if (data.reconhecido && data.aluno) {
        setNomeAluno(data.aluno.nome)
        setSim(data.similaridade ?? null)
        setEstado('liberado')
      } else {
        setMsgErro(data.motivo ?? 'Pessoa não cadastrada')
        setEstado('negado')
      }
    } catch {
      setMsgErro('Falha na conexão com o servidor')
      setEstado('erro')
    }
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4 select-none">
      {/* Header */}
      <div className="mb-8 text-center">
        <Shield size={28} className="text-cyan mx-auto mb-2" />
        <h1 className="font-display text-2xl font-bold text-white">Acesso Biométrico</h1>
        <p className="text-sm text-muted mt-1">Olhe para a câmera e pressione Identificar</p>
      </div>

      {/* Câmera */}
      <div className={`relative rounded-3xl overflow-hidden w-full max-w-sm border-4 transition-all duration-500 ${
        estado === 'liberado' ? 'border-green shadow-[0_0_40px_rgba(0,255,135,0.3)]' :
        estado === 'negado'   ? 'border-red shadow-[0_0_40px_rgba(255,68,102,0.3)]' :
        estado === 'processando' ? 'border-orange/60' :
        'border-cyan/20'
      }`}>
        <div className="relative bg-black aspect-square">
          {erroCam ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <User size={48} className="text-muted opacity-30 mb-3" />
              <p className="text-sm text-muted text-center px-4">{erroCam}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay playsInline muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  estado === 'liberado' || estado === 'negado' ? 'opacity-20' : 'opacity-100'
                }`}
              />

              {/* Guia de enquadramento */}
              {estado === 'aguardando' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-52 h-52 border-2 border-cyan/60 rounded-full animate-pulse" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan/10 border border-cyan/20 rounded-full px-3 py-1">
                    <p className="text-xs text-cyan font-semibold">Centralize o rosto</p>
                  </div>
                </div>
              )}

              {/* Processando */}
              {estado === 'processando' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-orange/20 border-t-orange rounded-full animate-spin" />
                    <Shield size={24} className="absolute inset-0 m-auto text-orange" />
                  </div>
                  <p className="text-orange font-semibold mt-4">Verificando...</p>
                </div>
              )}

              {/* Liberado */}
              {estado === 'liberado' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green/10">
                  <CheckCircle2 size={64} className="text-green mb-3" />
                  <p className="text-green font-bold text-2xl font-display">BEM-VINDO!</p>
                  {nomeAluno && <p className="text-white font-semibold text-lg mt-1">{nomeAluno.split(' ')[0]}</p>}
                  {similaridade && (
                    <p className="text-xs text-green/60 mt-2">{(similaridade * 100).toFixed(0)}% confiança</p>
                  )}
                </div>
              )}

              {/* Negado */}
              {(estado === 'negado' || estado === 'erro') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red/10">
                  <XCircle size={64} className="text-red mb-3" />
                  <p className="text-red font-bold text-2xl font-display">NEGADO</p>
                  <p className="text-xs text-muted mt-2 text-center px-4">{msgErro}</p>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Botão */}
      <div className="mt-8 w-full max-w-sm space-y-3">
        <button
          onClick={reconhecer}
          disabled={estado === 'processando' || !!erroCam}
          className="w-full gradient-btn text-dark font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {estado === 'processando' ? (
            <><RefreshCw size={20} className="animate-spin" /> Identificando...</>
          ) : (
            <><Camera size={20} /> Identificar</>
          )}
        </button>

        {(estado === 'liberado' || estado === 'negado' || estado === 'erro') && (
          <p className="text-center text-xs text-muted animate-pulse">
            Reiniciando em 5 segundos...
          </p>
        )}
      </div>
    </div>
  )
}
