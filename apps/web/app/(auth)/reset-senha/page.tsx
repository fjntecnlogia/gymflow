'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from 'lucide-react'

const SUPABASE_URL = 'https://gfxjehsjwwtlrhcjvkfr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeGplaHNqd3d0bHJoY2p2a2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTkzNzgsImV4cCI6MjA5NDI5NTM3OH0.6CF-JQYynO84ZUfn2iHmhLc3U-g7xc2jAXuga38FftI'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

function ResetForm() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [erro, setErro] = useState('')
  const [tokenOk, setTokenOk] = useState(false)

  useEffect(() => {
    // Supabase coloca o token no hash da URL
    const hash = window.location.hash
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      // Supabase JS detecta automaticamente o token do hash
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setTokenOk(true)
        }
      })
    } else {
      setErro('Link de recuperação inválido ou expirado.')
      setStatus('error')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 8) { setErro('Senha deve ter no mínimo 8 caracteres'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem'); return }

    setStatus('loading')
    setErro('')

    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro(error.message)
      setStatus('error')
    } else {
      setStatus('success')
      setTimeout(() => router.push('/login'), 2500)
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 size={52} className="text-green mx-auto" />
        <h2 className="text-xl font-bold">Senha alterada!</h2>
        <p className="text-muted text-sm">Redirecionando para o login...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <Lock size={36} className="text-cyan mx-auto mb-3" />
        <h1 className="font-display text-2xl font-black">Nova senha</h1>
        <p className="text-muted text-sm mt-1">Digite sua nova senha de acesso</p>
      </div>

      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          placeholder="Nova senha (mín. 8 caracteres)"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
          className="input w-full pr-10"
        />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <input
        type={show ? 'text' : 'password'}
        placeholder="Confirmar nova senha"
        value={confirmar}
        onChange={e => setConfirmar(e.target.value)}
        required
        className="input w-full"
      />

      {erro && <p className="text-red text-sm bg-red/10 border border-red/20 rounded-lg px-3 py-2">{erro}</p>}

      <button
        type="submit"
        disabled={status === 'loading' || !tokenOk}
        className="gradient-btn text-dark font-bold w-full py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {status === 'loading' ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar nova senha'}
      </button>

      {!tokenOk && status !== 'error' && (
        <p className="text-xs text-muted text-center">Aguardando validação do link...</p>
      )}
    </form>
  )
}

export default function ResetSenhaPage() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="text-cyan animate-spin" size={32} /></div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
