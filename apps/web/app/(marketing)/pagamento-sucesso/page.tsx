'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PagamentoSucessoPage() {
  const params = useSearchParams()
  const sessionId = params.get('session') ?? params.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!sessionId) { setStatus('error'); setMsg('Sessão inválida'); return }

    fetch(`https://gymflow-production-abf9.up.railway.app/pagamentos/confirmar/${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) { setStatus('success'); setMsg('Pagamento confirmado com sucesso!') }
        else { setStatus('error'); setMsg(data.error ?? 'Erro ao confirmar pagamento') }
      })
      .catch(() => { setStatus('error'); setMsg('Erro de conexão') })
  }, [sessionId])

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="card max-w-md w-full p-10 text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={56} className="text-cyan mx-auto mb-4 animate-spin" />
            <h1 className="font-display text-2xl font-bold mb-2">Confirmando pagamento...</h1>
            <p className="text-muted text-sm">Aguarde um momento</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={56} className="text-green mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
            <p className="text-muted text-sm mb-6">{msg}</p>
            <p className="text-sm text-muted mb-6">Seu acesso foi liberado. Pode treinar! 💪</p>
            <Link href="/dashboard" className="gradient-btn text-dark font-bold px-6 py-3 rounded-xl inline-block">
              Ir para o Dashboard →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={56} className="text-red mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Ops! Algo deu errado</h1>
            <p className="text-muted text-sm mb-6">{msg}</p>
            <Link href="/financeiro" className="border border-dark-border text-white font-bold px-6 py-3 rounded-xl inline-block hover:border-muted transition-colors">
              Voltar ao financeiro
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
