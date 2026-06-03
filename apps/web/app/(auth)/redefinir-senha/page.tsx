'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lock, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

function Conteudo() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const olhoIcon = (
    <button
      type="button"
      onClick={() => setMostrarSenha((v) => !v)}
      tabIndex={-1}
      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
      className="hover:text-white transition-colors"
    >
      {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )

  if (!token) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <AlertTriangle size={48} className="text-orange mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold mb-2">Link inválido</h1>
        <p className="text-sm text-muted mb-6">
          Este link de redefinição parece estar incompleto. Solicite um novo.
        </p>
        <Link href="/esqueci-senha" className="text-cyan text-sm hover:underline">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 8) return toast.error('Senha deve ter pelo menos 8 caracteres')
    if (senha !== confirmar) return toast.error('As senhas não coincidem')

    setLoading(true)
    try {
      await api.post('/auth/redefinir-senha', { token, senha })
      setSucesso(true)
      setTimeout(() => router.push('/login'), 1800)
    } catch (err: any) {
      const resp = err?.response?.data
      toast.error(resp?.error ?? 'Erro ao redefinir senha. Solicite outro link.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="card p-10 text-center max-w-md mx-auto">
        <CheckCircle2 size={56} className="text-green mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Senha redefinida!</h1>
        <p className="text-sm text-muted">Redirecionando pro login...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-blue flex items-center justify-center font-display font-black text-2xl text-dark mx-auto mb-4">
          G
        </div>
        <h1 className="font-display text-2xl font-extrabold">
          <span className="text-cyan">Gym</span>Flow{' '}
          <span className="text-muted font-medium text-xl">Gestor</span>
        </h1>
        <p className="text-muted text-sm mt-2">Crie uma nova senha</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <Input
          label="Nova senha"
          type={mostrarSenha ? 'text' : 'password'}
          placeholder="Mínimo 8 caracteres"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          leftIcon={<Lock size={14} />}
          rightIcon={olhoIcon}
          required
          minLength={8}
        />
        <Input
          label="Confirmar nova senha"
          type={mostrarSenha ? 'text' : 'password'}
          placeholder="Repita a senha"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          leftIcon={<Lock size={14} />}
          required
          minLength={8}
        />
        <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
          Salvar nova senha
        </Button>
      </form>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 size={40} className="text-cyan animate-spin" />}>
        <Conteudo />
      </Suspense>
    </div>
  )
}
