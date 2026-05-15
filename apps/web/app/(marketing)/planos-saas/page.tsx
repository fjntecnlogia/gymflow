'use client'
import { useState } from 'react'
import { Check, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const PLANOS = [
  {
    id: 'STARTER',
    nome: 'Starter',
    preco: 197,
    desc: 'Até 100 alunos',
    cor: 'border-dark-border',
    destaque: false,
    items: [
      'Controle de acesso QR Code',
      'App para alunos (iOS/Android)',
      'Gestão financeira com Stripe',
      'Notificações WhatsApp',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'PRO',
    nome: 'Pro',
    preco: 397,
    desc: 'Até 500 alunos',
    cor: 'border-cyan/40',
    destaque: true,
    items: [
      'Tudo do Starter',
      'Biometria facial',
      'Relatórios avançados',
      'Agenda de aulas',
      'Suporte prioritário WhatsApp',
    ],
  },
  {
    id: 'ENTERPRISE',
    nome: 'Enterprise',
    preco: 797,
    desc: 'Alunos ilimitados',
    cor: 'border-dark-border',
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

export default function PlanosSaasPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function assinar(planoId: string) {
    setLoading(planoId)
    try {
      const { data } = await api.post('/billing/checkout', { plano: planoId })
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Erro ao criar sessão de pagamento')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao iniciar assinatura')
    } finally {
      setLoading(null)
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

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-4 py-1.5 text-xs font-bold text-cyan uppercase tracking-widest mb-6">
            <Zap size={12} /> Planos GYMFLOW
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight mb-3">
            Escolha o plano certo para<br />sua academia
          </h1>
          <p className="text-muted">14 dias grátis em todos os planos. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PLANOS.map(p => (
            <div key={p.id} className={`rounded-2xl p-8 border-2 relative ${p.cor} ${p.destaque ? 'bg-cyan/5' : 'bg-dark-card'}`}>
              {p.destaque && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan text-dark text-xs font-black px-4 py-1 rounded-full whitespace-nowrap">
                  ⭐ Mais popular
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{p.nome}</div>
              <div className="font-display text-4xl font-black mb-1">
                <sup className="text-xl font-bold">R$</sup>{p.preco}
                <small className="text-base font-normal text-muted">/mês</small>
              </div>
              <div className="text-xs text-muted mb-6">{p.desc}</div>
              <ul className="space-y-2.5 mb-8">
                {p.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-muted">
                    <Check size={14} className="text-cyan flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => assinar(p.id)}
                disabled={loading === p.id}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  p.destaque
                    ? 'gradient-btn text-dark'
                    : 'border border-dark-border text-white hover:border-muted'
                } disabled:opacity-50`}
              >
                {loading === p.id ? 'Redirecionando...' : 'Começar grátis'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted mb-3">Já tem assinatura?</p>
          <button onClick={abrirPortal} className="text-cyan text-sm hover:underline font-semibold">
            Gerenciar minha assinatura →
          </button>
        </div>
      </div>
    </div>
  )
}
