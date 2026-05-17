'use client'
import { useState } from 'react'
import { Camera, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { FacialCamera } from '@/components/acesso/FacialCamera'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface CadastrarFaceModalProps {
  aluno: { id: string; nome: string; faceId?: string | null; faceRegistrada?: boolean; fotoUrl?: string | null }
  onClose: () => void
  onSucesso: () => void
}

export function CadastrarFaceModal({ aluno, onClose, onSucesso }: CadastrarFaceModalProps) {
  const [etapa, setEtapa] = useState<'info' | 'camera' | 'salvando' | 'sucesso' | 'erro'>('info')
  const [erro, setErro] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleCaptura(fotoBase64: string) {
    setEtapa('salvando')
    setPreview(fotoBase64)

    try {
      await api.post(`/biometria/alunos/${aluno.id}/face`, { image: fotoBase64 })
      setEtapa('sucesso')
      toast.success(`Face de ${aluno.nome} cadastrada!`)
      onSucesso()
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Erro ao cadastrar face'
      setErro(msg)
      setEtapa('erro')
    }
  }

  if (etapa === 'camera') {
    return (
      <FacialCamera
        modo="cadastro"
        titulo={`Cadastrar Face — ${aluno.nome}`}
        onCapture={handleCaptura}
        onCancel={() => setEtapa('info')}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Camera size={16} className="text-cyan" /> Biometria Facial
          </h2>
          <button onClick={onClose}><X size={18} className="text-muted hover:text-white" /></button>
        </div>

        {etapa === 'info' && (
          <>
            <div className="text-center py-2">
              {aluno.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={aluno.fotoUrl} alt={aluno.nome} className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-dark-border mb-3" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-dark-card border-2 border-dark-border flex items-center justify-center mx-auto mb-3">
                  <Camera size={28} className="text-muted opacity-50" />
                </div>
              )}
              <p className="font-semibold">{aluno.nome}</p>
              <p className="text-xs text-muted mt-1">
                {(aluno.faceId || aluno.faceRegistrada) ? '✅ Face já cadastrada — será substituída' : 'Sem biometria cadastrada'}
              </p>
            </div>

            <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-3 text-xs text-muted space-y-1">
              <p>• Olhe diretamente para a câmera</p>
              <p>• Mantenha o rosto centralizado e bem iluminado</p>
              <p>• Evite óculos escuros ou chapéu</p>
              <p>• A foto será usada para acesso automático à academia</p>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-dark-border text-sm font-semibold hover:border-muted">
                Cancelar
              </button>
              <button
                onClick={() => setEtapa('camera')}
                className="flex-1 gradient-btn text-dark py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <Camera size={14} /> Abrir Câmera
              </button>
            </div>
          </>
        )}

        {etapa === 'salvando' && (
          <div className="text-center py-6">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-cyan/30" />
            )}
            <div className="flex items-center justify-center gap-2 text-muted text-sm">
              <span className="animate-spin text-lg">⟳</span> Enviando para o serviço facial...
            </div>
          </div>
        )}

        {etapa === 'sucesso' && (
          <div className="text-center py-4 space-y-3">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Face" className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-green/40" />
            )}
            <CheckCircle2 size={40} className="text-green mx-auto" />
            <div>
              <p className="font-semibold">Face cadastrada com sucesso!</p>
              <p className="text-xs text-muted mt-1">{aluno.nome} já pode acessar pela biometria.</p>
            </div>
            <button onClick={onClose} className="gradient-btn text-dark font-bold px-6 py-2 rounded-xl text-sm">
              Fechar
            </button>
          </div>
        )}

        {etapa === 'erro' && (
          <div className="text-center py-4 space-y-3">
            <AlertCircle size={40} className="text-red mx-auto" />
            <div>
              <p className="font-semibold text-red">Falha no cadastro</p>
              <p className="text-xs text-muted mt-1">{erro}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-dark-border text-sm font-semibold">
                Fechar
              </button>
              <button onClick={() => setEtapa('camera')} className="flex-1 gradient-btn text-dark py-2 rounded-xl text-sm font-bold">
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
