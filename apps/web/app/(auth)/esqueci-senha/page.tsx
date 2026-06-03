'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/esqueci-senha', { email })
      setEnviado(true)
    } catch (err: any) {
      // Backend sempre retorna 200 — se cair aqui é problema de rede
      toast.error('Falha na conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-blue flex items-center justify-center font-display font-black text-2xl text-dark mx-auto mb-4">
            G
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            <span className="text-cyan">Gym</span>Flow{' '}
            <span className="text-muted font-medium text-xl">Gestor</span>
          </h1>
        </div>

        {enviado ? (
          <div className="card p-8 text-center">
            <CheckCircle2 size={48} className="text-green mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Verifique seu e-mail</h2>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Se houver uma conta com <strong className="text-white">{email}</strong>,
              enviamos um link pra redefinir a senha. Confere também o spam.
            </p>
            <p className="text-xs text-muted mb-6">
              O link expira em 2 horas.
            </p>
            <Link
              href="/login"
              className="text-cyan text-sm font-semibold hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Voltar pro login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div className="mb-2">
              <h2 className="font-display text-lg font-bold mb-1">Esqueci minha senha</h2>
              <p className="text-xs text-muted">
                Digite o e-mail da sua conta e enviaremos um link pra criar uma nova senha.
              </p>
            </div>
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={14} />}
              required
            />
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Enviar link de redefinição
            </Button>
            <Link
              href="/login"
              className="block text-center text-xs text-muted hover:text-cyan transition-colors"
            >
              ← Voltar pro login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
