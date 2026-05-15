'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, RefreshCw, Check, X, User } from 'lucide-react'

interface FacialCameraProps {
  onCapture: (fotoBase64: string) => void
  onCancel: () => void
  modo?: 'cadastro' | 'acesso'
  titulo?: string
}

export function FacialCamera({ onCapture, onCancel, modo = 'cadastro', titulo }: FacialCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [erroCam, setErroCam] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const iniciarCamera = useCallback(async () => {
    setCarregando(true)
    setErroCam(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCarregando(false)
      }
    } catch (err: any) {
      setErroCam('Câmera não disponível. Verifique as permissões do navegador.')
      setCarregando(false)
    }
  }, [])

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    iniciarCamera()
    return () => pararCamera()
  }, [iniciarCamera, pararCamera])

  function capturar() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.9)
    setPreview(base64)
    pararCamera()
  }

  function recapturar() {
    setPreview(null)
    iniciarCamera()
  }

  function confirmar() {
    if (preview) {
      onCapture(preview)
      pararCamera()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0D0D1A] border border-dark-border rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Camera size={16} className="text-cyan" />
            {titulo ?? (modo === 'cadastro' ? 'Cadastrar Face' : 'Reconhecimento Facial')}
          </h3>
          <button onClick={() => { pararCamera(); onCancel() }} className="text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Câmera / Preview */}
        <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
          {erroCam ? (
            <div className="text-center p-6">
              <User size={48} className="mx-auto text-muted mb-3 opacity-40" />
              <p className="text-sm text-muted">{erroCam}</p>
            </div>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${carregando ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              />
              {carregando && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw size={24} className="text-cyan animate-spin" />
                </div>
              )}
            </>
          )}

          {/* Overlay de enquadramento */}
          {!preview && !erroCam && !carregando && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-cyan/60 rounded-full opacity-60" />
              <div className="absolute w-48 h-60 rounded-full"
                style={{
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                  borderRadius: '50%',
                }}
              />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Instrução */}
        <div className="px-5 py-3 text-center text-xs text-muted">
          {preview
            ? 'Confirme se o rosto está bem visível e centralizado'
            : 'Centralize o rosto na moldura oval e tire a foto'}
        </div>

        {/* Botões */}
        <div className="px-5 pb-5 flex gap-3">
          {preview ? (
            <>
              <button
                onClick={recapturar}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dark-border text-sm font-semibold hover:border-muted transition-colors"
              >
                <RefreshCw size={14} /> Tirar novamente
              </button>
              <button
                onClick={confirmar}
                className="flex-1 gradient-btn text-dark flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
              >
                <Check size={14} /> {modo === 'cadastro' ? 'Salvar Face' : 'Verificar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { pararCamera(); onCancel() }}
                className="flex-1 py-2.5 rounded-xl border border-dark-border text-sm font-semibold hover:border-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={capturar}
                disabled={carregando || !!erroCam}
                className="flex-1 gradient-btn text-dark flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
              >
                <Camera size={14} /> Capturar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
