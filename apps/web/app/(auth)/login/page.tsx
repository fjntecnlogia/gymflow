'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, senha })
      if (data?.token) {
        localStorage.setItem('gymflow_token', data.token)
        if (data.usuario) {
          localStorage.setItem('gymflow_usuario', JSON.stringify(data.usuario))
        }
        router.push('/dashboard')
        return
      }
      toast.error('Resposta inesperada do servidor')
    } catch (err: any) {
      const resp = err?.response?.data
      if (resp?.code === 'SENHA_NAO_DEFINIDA') {
        toast.error('Use o link de primeiro acesso enviado no e-mail da compra.')
      } else {
        toast.error(resp?.error ?? 'E-mail ou senha incorretos')
      }
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
          <p className="text-muted text-sm mt-1">Faça login na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={14} />}
            required
          />
          <div>
            <Input
              label="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              leftIcon={<Lock size={14} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  tabIndex={-1}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="hover:text-white transition-colors"
                >
                  {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              required
            />
            <Link
              href="/esqueci-senha"
              className="text-xs text-muted hover:text-cyan mt-1 float-right transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
            Entrar
          </Button>
          <p className="text-center text-xs text-muted">
            Não tem conta?{' '}
            <a href="/planos-saas" className="text-cyan font-semibold hover:underline">
              Ver planos e assinar
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
