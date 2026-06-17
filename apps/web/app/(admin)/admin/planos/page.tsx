'use client'
import { Check } from 'lucide-react'

const PLANOS = [
  {
    id: 'STARTER', nome: 'Starter', preco: 197, desc: 'Até 100 alunos', cor: 'border-dark-border',
    items: ['Controle de acesso QR Code', 'App para alunos', 'Gestão financeira', 'Notificações WhatsApp', 'Suporte por e-mail'],
  },
  {
    id: 'PRO', nome: 'Pro', preco: 397, desc: 'Até 500 alunos', cor: 'border-cyan/40', destaque: true,
    items: ['Tudo do Starter', 'Biometria facial', 'Relatórios avançados', 'Agenda de aulas', 'Suporte prioritário'],
  },
  {
    id: 'ENTERPRISE', nome: 'Enterprise', preco: 797, desc: 'Alunos ilimitados', cor: 'border-dark-border',
    items: ['Tudo do Pro', 'Multi-unidades', 'API pública', 'White-label', 'Gerente de conta dedicado'],
  },
]

export default function AdminPlanosPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Planos SaaS</h1>
        <p className="text-muted text-sm">Configuração dos planos oferecidos pelo GymFlow Gestor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANOS.map(p => (
          <div key={p.id} className={`card p-6 border-2 ${p.cor} ${p.destaque ? 'bg-cyan/5' : ''} relative`}>
            {p.destaque && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan text-dark text-xs font-black px-4 py-1 rounded-full">
                ⭐ Mais popular
              </div>
            )}
            <div className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{p.nome}</div>
            <div className="font-display text-4xl font-black mb-1">
              <sup className="text-xl font-bold">R$</sup>{p.preco}
              <small className="text-base font-normal text-muted">/mês</small>
            </div>
            <div className="text-xs text-muted mb-5">{p.desc}</div>
            <ul className="space-y-2 mb-6">
              {p.items.map(item => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted">
                  <Check size={13} className="text-cyan flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <div className="text-xs text-muted border-t border-dark-border pt-4 space-y-1">
              <div className="flex justify-between"><span>Preço anual (20% off):</span><span className="text-green font-semibold">R$ {Math.round(p.preco * 12 * 0.8).toLocaleString('pt-BR')}</span></div>
              <div className="flex justify-between"><span>MRR por academia:</span><span className="font-semibold">R$ {p.preco}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 bg-dark-card">
        <h3 className="font-semibold mb-3 text-muted text-sm uppercase tracking-widest">IDs dos Planos Stripe</h3>
        <div className="space-y-2 text-sm font-mono">
          {['STRIPE_PRICE_STARTER', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE'].map(v => (
            <div key={v} className="flex items-center gap-3 p-2 bg-dark rounded-lg">
              <span className="text-cyan">{v}</span>
              <span className="text-muted">— configurar nas variáveis do Railway</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
