'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap, X, ArrowRight, CalendarClock, Loader2, ShieldCheck, Mail, Building2, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

const PLANOS = [
  {
    id: 'STARTER' as const,
    nome: 'Starter',
    preco: 197,
    desc: 'Até 100 alunos',
    destaque: false,
    items: [
      'Controle de acesso QR Code',
      'App para alunos (iOS/Android)',
      'PIX automático',
      'Notificações WhatsApp',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'PRO' as const,
    nome: 'Pro',
    preco: 397,
    desc: 'Até 500 alunos',
    destaque: true,
    items: [
      'Tudo do Starter',
      'Biometria facial ilimitada',
      'Cartão recorrente',
      'Relatórios avançados',
      'Suporte prioritário WhatsApp',
    ],
  },
  {
    id: 'ENTERPRISE' as const,
    nome: 'Enterprise',
    preco: 797,
    desc: 'Alunos ilimitados',
    destaque: false,
    items: [
      'Tudo do Pro',
      'Multi-unidades',
      'API pública',
      'White-label',
      'Gerente de conta dedicado',
    ],
  },
]

type PlanoId = (typeof PLANOS)[number]['id']

export default function PlanosSaasPage() {
  const [planoAberto, setPlanoAberto] = useState<PlanoId | null>(null)
  const [form, setForm] = useState({ nomeContato: '', email: '', nomeAcademia: '' })
  const [loading, setLoading] = useState(false)

  function abrirCompra(planoId: PlanoId) {
    setForm({ nomeContato: '', email: '', nomeAcademia: '' })
    setPlanoAberto(planoId)
  }

  async function comprar(e: React.FormEvent) {
    e.preventDefault()
    if (!planoAberto) return
    if (form.nomeContato.trim().length < 2) return toast.error('Informe seu nome.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return toast.error('E-mail inválido.')
    if (form.nomeAcademia.trim().length < 2) return toast.error('Informe o nome da academia.')

    setLoading(true)
    try {
      const { data } = await api.post('/billing/checkout-publico', {
        plano: planoAberto,
        ...form,
      })
      if (data?.url) {
        window.location.href = data.url
      } else {
        toast.error('Não foi possível iniciar o pagamento. Tente novamente.')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao iniciar pagamento')
    } finally {
      setLoading(false)
    }
  }

  async function abrirPortal() {
    try {
      const { data } = await api.get('/billing/portal')
      window.location.href = data.url
    } catch {
      toast.error('Erro ao abrir portal de assinatura')
    }
  }

  const planoSelecionado = PLANOS.find((p) => p.id === planoAberto)

  return (
    <div className="min-h-screen bg-dark text-white">
      <nav className="border-b border-dark-border px-6 py-4 flex items-center justify-between sticky top-0 bg-dark/95 backdrop-blur z-40">
        <Link href="/" className="font-display font-extrabold text-xl">
          <span className="text-cyan">Gym</span>Flow <span className="text-muted font-medium">Gestor</span>
        </Link>
        <Link href="/login" className="text-sm text-muted hover:text-white transition-colors">
          Já sou cliente
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-bold text-cyan uppercase tracking-widest mb-6">
            <Zap size={12} /> Planos GymFlow Gestor
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-3">
            Escolha o plano certo para<br />sua academia
          </h1>
          <p className="text-muted">
            Comece agora ou agende uma demonstração antes de decidir.
          </p>
        </div>

        {/* ─── Planos ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANOS.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-8 border-2 relative ${
                p.destaque ? 'border-cyan bg-cyan/5 shadow-glow' : 'border-dark-border bg-dark-card'
              }`}
            >
              {p.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan text-dark text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                  ⭐ Mais popular
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{p.nome}</div>
              <div className="font-display text-4xl font-black mb-1">
                <sup className="text-xl font-bold">R$</sup>
                {p.preco}
                <small className="text-base font-normal text-muted">/mês</small>
              </div>
              <div className="text-xs text-muted mb-6">{p.desc}</div>
              <ul className="space-y-2.5 mb-8">
                {p.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted">
                    <Check size={14} className="text-cyan flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA primário — comprar */}
              <button
                onClick={() => abrirCompra(p.id)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all mb-2 ${
                  p.destaque ? 'gradient-btn text-dark' : 'bg-white text-dark hover:opacity-90'
                }`}
              >
                Assinar agora
              </button>
              {/* CTA secundário — agendar demo */}
              <Link
                href="/agendar"
                className="w-full block text-center py-2.5 rounded-xl font-semibold text-xs text-muted hover:text-white border border-dark-border hover:border-muted transition-colors"
              >
                <CalendarClock size={12} className="inline mr-1 -mt-0.5" />
                Quero ver antes (demo grátis)
              </Link>
            </div>
          ))}
        </div>

        {/* ─── Garantia ─── */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-green/10 border border-green/30 rounded-full px-4 py-2 text-xs font-bold text-green tracking-widest uppercase mb-3">
            <ShieldCheck size={14} /> Garantia de 30 dias
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Se em 30 dias você não tiver visto valor real,
            <span className="text-white"> devolvemos 100% do que você pagou.</span>
            <br />
            Sem fidelidade. Cancele quando quiser pelo portal da sua conta.
          </p>
        </div>

        {/* ─── Já tem conta ─── */}
        <div className="text-center">
          <p className="text-sm text-muted mb-2">Já tem assinatura?</p>
          <button onClick={abrirPortal} className="text-cyan text-sm hover:underline font-semibold">
            Gerenciar minha assinatura →
          </button>
        </div>
      </div>

      {/* ─── Modal de compra ─── */}
      {planoSelecionado && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setPlanoAberto(null)}
        >
          <div
            className="card max-w-md w-full p-6 space-y-5 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => !loading && setPlanoAberto(null)}
              disabled={loading}
              className="absolute top-4 right-4 text-muted hover:text-white"
            >
              <X size={20} />
            </button>

            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-cyan mb-1">
                Plano {planoSelecionado.nome}
              </div>
              <h2 className="font-display text-2xl font-bold">
                R$ {planoSelecionado.preco}
                <span className="text-base text-muted font-normal">/mês</span>
              </h2>
              <p className="text-xs text-muted mt-1">{planoSelecionado.desc}</p>
            </div>

            <form onSubmit={comprar} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <User size={12} /> Seu nome
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: Rafael Almeida"
                  value={form.nomeContato}
                  onChange={(e) => setForm((f) => ({ ...f, nomeContato: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Mail size={12} /> Seu e-mail
                </label>
                <input
                  className="input"
                  type="email"
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  disabled={loading}
                />
                <p className="text-[11px] text-muted">
                  Usaremos esse e-mail pra criar sua conta e enviar o link de acesso.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={12} /> Nome da academia
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Ex: Forge Fit"
                  value={form.nomeAcademia}
                  onChange={(e) => setForm((f) => ({ ...f, nomeAcademia: e.target.value }))}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gradient-btn text-dark font-bold text-base w-full py-3.5 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Indo pro pagamento...</>
                ) : (
                  <>Ir pro pagamento seguro <ArrowRight size={18} /></>
                )}
              </button>

              <p className="text-[11px] text-muted text-center leading-relaxed">
                Pagamento via Stripe. Após confirmação, você recebe um e-mail pra criar
                sua senha e acessar o painel imediatamente.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
