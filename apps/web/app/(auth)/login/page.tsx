'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      if (data.session) {
        localStorage.setItem('gymflow_token', data.session.access_token)
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao fazer login')
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
          <h1 className="font-display text-2xl font-extrabold"><span className="text-cyan">GYM</span>FLOW</h1>
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
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            leftIcon={<Lock size={14} />}
            required
          />
          <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
            Entrar
          </Button>
          <p className="text-center text-xs text-muted">
            Não tem conta?{' '}
            <a href="/cadastro" className="text-cyan font-semibold hover:underline">Criar academia grátis</a>
          </p>
        </form>
      </div>
    </div>
  )
}
