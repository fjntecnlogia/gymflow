'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gfxjehsjwwtlrhcjvkfr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmeGplaHNqd3d0bHJoY2p2a2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTkzNzgsImV4cCI6MjA5NDI5NTM3OH0.6CF-JQYynO84ZUfn2iHmhLc3U-g7xc2jAXuga38FftI'

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState<'login' | 'recovery' | 'recovery_ok'>('login')

  // Detecta token de recovery no hash da URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash.includes('type=recovery') && hash.includes('access_token')) {
      setModo('recovery')
      // Supabase processa o token automaticamente
      const supabase = getSupabase()
      supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setModo('recovery')
        }
      })
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = getSupabase()
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

  async function handleResetSenha(e: React.FormEvent) {
    e.preventDefault()
    if (novaSenha.length < 8) { toast.error('Senha deve ter pelo menos 8 caracteres'); return }
    if (novaSenha !== confirmarSenha) { toast.error('As senhas não coincidem'); return }
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setModo('recovery_ok')
      toast.success('Senha alterada com sucesso!')
      setTimeout(() => {
        setModo('login')
        window.history.replaceState(null, '', '/login')
      }, 2500)
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  async function handleEsqueciSenha() {
    if (!email) { toast.error('Digite seu e-mail primeiro'); return }
    setLoading(true)
    try {
      const supabase = getSupabase()
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      })
      toast.success('E-mail de recuperação enviado!')
    } catch (err: any) {
      toast.error('Erro ao enviar e-mail')
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
          <p className="text-muted text-sm mt-1">
            {modo === 'recovery' ? 'Defina sua nova senha' : modo === 'recovery_ok' ? 'Senha alterada!' : 'Faça login na sua conta'}
          </p>
        </div>

        {/* ── Recovery OK ─────────────────────────────── */}
        {modo === 'recovery_ok' && (
          <div className="card p-8 text-center space-y-3">
            <CheckCircle2 size={48} className="text-green mx-auto" />
            <p className="font-semibold">Senha alterada com sucesso!</p>
            <p className="text-muted text-sm">Redirecionando para o login...</p>
          </div>
        )}

        {/* ── Nova senha (recovery) ────────────────────── */}
        {modo === 'recovery' && (
          <form onSubmit={handleResetSenha} className="card p-6 space-y-4">
            <div className="relative">
              <Input
                label="Nova senha"
                type={showSenha ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                leftIcon={<Lock size={14} />}
                required
              />
              <button
                type="button"
                onClick={() => setShowSenha(s => !s)}
                className="absolute right-3 top-[34px] text-muted hover:text-white"
              >
                {showSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Input
              label="Confirmar nova senha"
              type={showSenha ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              leftIcon={<Lock size={14} />}
              required
            />
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Salvar nova senha
            </Button>
          </form>
        )}

        {/* ── Login normal ─────────────────────────────── */}
        {modo === 'login' && (
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
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                leftIcon={<Lock size={14} />}
                required
              />
              <button
                type="button"
                onClick={handleEsqueciSenha}
                className="text-xs text-muted hover:text-cyan mt-1 float-right transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              Entrar
            </Button>
            <p className="text-center text-xs text-muted">
              Não tem conta?{' '}
              <a href="/cadastro" className="text-cyan font-semibold hover:underline">Criar academia grátis</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
