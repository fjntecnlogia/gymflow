'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Smartphone, AlertTriangle, Download, ExternalLink } from 'lucide-react'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.fjntecnologia.gymflowgestor'

type Action = 'criar-senha' | 'redefinir-senha'

interface Props {
  action: Action
  titulo: string
  descricao: string
}

function Conteudo({ action, titulo, descricao }: Props) {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [device, setDevice] = useState<'desktop' | 'android' | 'ios' | 'detecting'>(
    'detecting',
  )
  const [tentouAbrir, setTentouAbrir] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return

    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setDevice('android')
    else if (/iphone|ipad|ipod/.test(ua)) setDevice('ios')
    else setDevice('desktop')
  }, [])

  useEffect(() => {
    if (!token || device === 'detecting' || device === 'desktop') return
    if (tentouAbrir) return

    const deeplink = `gymflow://aluno/${action}?token=${encodeURIComponent(token)}`
    const t = setTimeout(() => {
      window.location.href = deeplink
      setTentouAbrir(true)
    }, 300)

    return () => clearTimeout(t)
  }, [token, device, action, tentouAbrir])

  if (!token) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <AlertTriangle size={48} className="text-orange mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold mb-2">Link inválido</h1>
        <p className="text-sm text-muted">
          Esse link parece estar incompleto. Confere se você copiou ele inteiro do e-mail
          que a academia te enviou.
        </p>
      </div>
    )
  }

  if (device === 'desktop') {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <Smartphone size={48} className="text-cyan mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold mb-2">Abre no seu celular</h1>
        <p className="text-sm text-muted mb-6">
          Esse link só funciona dentro do app <strong>GymFlow Gestor para Alunos</strong>,
          que roda no celular. Abre o e-mail no seu Android pra continuar.
        </p>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-cyan text-sm font-medium hover:underline"
        >
          <Download size={16} />
          Baixar o app na Play Store
        </a>
      </div>
    )
  }

  const deeplink = `gymflow://aluno/${action}?token=${encodeURIComponent(token)}`

  return (
    <div className="card p-8 text-center max-w-md mx-auto">
      {!tentouAbrir ? (
        <>
          <Loader2 size={40} className="text-cyan mx-auto mb-4 animate-spin" />
          <h1 className="font-display text-xl font-bold mb-2">{titulo}</h1>
          <p className="text-sm text-muted">Abrindo o app GymFlow Gestor…</p>
        </>
      ) : (
        <>
          <Smartphone size={48} className="text-cyan mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">{titulo}</h1>
          <p className="text-sm text-muted mb-6">{descricao}</p>

          <a
            href={deeplink}
            className="block w-full bg-cyan text-dark font-bold py-3 px-6 rounded-xl mb-3 hover:opacity-90 transition-opacity"
          >
            Abrir o app agora
          </a>

          {device === 'android' && (
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan text-sm font-medium hover:underline"
            >
              <Download size={16} />
              Ainda não tem o app? Baixar na Play Store
            </a>
          )}

          {device === 'ios' && (
            <p className="text-xs text-muted">
              <ExternalLink size={12} className="inline mr-1" />
              O app pra iPhone ainda não foi publicado. Por enquanto, use um Android.
            </p>
          )}
        </>
      )}
    </div>
  )
}

export function RedirectAlunoApp(props: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-dark">
      <Suspense
        fallback={
          <div className="card p-8 text-center max-w-md mx-auto">
            <Loader2 size={40} className="text-cyan mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted">Carregando…</p>
          </div>
        }
      >
        <Conteudo {...props} />
      </Suspense>
    </main>
  )
}
